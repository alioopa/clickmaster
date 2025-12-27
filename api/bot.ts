
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, increment, runTransaction } from "firebase/firestore";

// --- Configuration ---

// 👇👇👇 خيار الطوارئ: ضع التوكن هنا بين علامات التنصيص إذا لم يعمل في Vercel 👇👇👇
const HARDCODED_TOKEN = ""; 
// 👆👆👆 مثال: const HARDCODED_TOKEN = "123456:ABC-DEF...";

// الأولوية لمتغير البيئة، ثم التوكن اليدوي
const BOT_TOKEN = (process.env.BOT_TOKEN || HARDCODED_TOKEN || "").trim();
const APP_URL = "https://clickmaster-crypto.vercel.app"; 

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBCkIAW5gtW063WtM7uP1vc5SJ5DygUZ1E",
  authDomain: "bottelegramapp-ca2fc.firebaseapp.com",
  projectId: "bottelegramapp-ca2fc",
  storageBucket: "bottelegramapp-ca2fc.firebasestorage.app",
  messagingSenderId: "198205424598",
  appId: "1:198205424598:web:4474696e6fc8c618d29a77",
  measurementId: "G-LGXJ778NZ3"
};

// Initialize Firebase safely for Serverless environment
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Helper to send messages
const sendMessage = async (chatId: number | string, text: string, parseMode: string = '', replyMarkup: any = null) => {
    if (!BOT_TOKEN) return;
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: parseMode,
                reply_markup: replyMarkup
            })
        });
        const data = await response.json();
        if (!data.ok) console.error('Telegram API Error:', data);
    } catch (e) {
        console.error('Fetch Error:', e);
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Health & Config Check (GET Request)
  // افتح رابط: https://your-site.vercel.app/api/bot في المتصفح لترى النتيجة
  if (req.method === 'GET') {
      return res.status(200).json({ 
          status: 'Running', 
          message: 'Bot Endpoint is active',
          // هذه الأسطر ستخبرك إذا كان التوكن موجوداً وصحيحاً
          config_check: {
              token_exists: !!BOT_TOKEN,
              token_source: process.env.BOT_TOKEN ? 'Environment Variable (Vercel)' : (HARDCODED_TOKEN ? 'Hardcoded File' : 'MISSING'),
              token_prefix: BOT_TOKEN ? `${BOT_TOKEN.substring(0, 5)}...` : 'N/A'
          },
          timestamp: new Date().toISOString()
      });
  }

  // 2. Critical Check
  if (!BOT_TOKEN) {
      console.error("CRITICAL: No BOT_TOKEN found.");
      return res.status(500).json({ error: 'BOT_TOKEN is missing. Please set it in Vercel Env Vars or hardcode it in bot.ts' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // A. Handle Pre-checkout (Payments)
    if (body.pre_checkout_query) {
        const queryId = body.pre_checkout_query.id;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pre_checkout_query_id: queryId, ok: true })
        });
        return res.status(200).send('OK');
    }

    // B. Handle Messages
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text as string;
      const user = body.message.from;
      const userId = String(user.id);
      const firstName = user.first_name || 'صديقي';

      // --- Debug: /ping ---
      if (text === '/ping') {
          await sendMessage(chatId, `🏓 Pong!\n✅ التوكن يعمل بنجاح.\n📡 المصدر: ${process.env.BOT_TOKEN ? 'Vercel Env' : 'Local File'}`);
          return res.status(200).send('OK');
      }

      // --- Command: /start ---
      if (text.startsWith('/start')) {
        try {
            const args = text.split(' ');
            const referralCode = args.length > 1 ? args[1] : null;
            const userRef = doc(db, 'users', userId);
            
            // Check Database Connection
            let userSnap;
            try {
                userSnap = await getDoc(userRef);
            } catch (firestoreErr: any) {
                 await sendMessage(chatId, `⚠️ خطأ في قاعدة البيانات:\n${firestoreErr.message}\n\nتأكد من إعدادات Firestore Rules.`);
                 throw firestoreErr;
            }

            const keyboard = {
                inline_keyboard: [
                  [{ text: "🚀 تشغيل التطبيق | Play Now", web_app: { url: APP_URL } }],
                  [{ text: "📢 قناة المجتمع", url: "https://t.me/TlikerChannel" }]
                ]
            };

            if (!userSnap.exists()) {
                // New User Registration
                const newUserData = {
                    id: userId,
                    name: firstName,
                    balance: 1000, 
                    energy: 1000,
                    maxEnergy: 1000,
                    referrals: 0,
                    joinDate: new Date().toLocaleDateString('ar-EG'),
                    role: 'user',
                    isBanned: false,
                    walletAddress: '',
                    ownedProducts: [],
                    completedTaskIds: [],
                    notificationsEnabled: true
                };

                if (referralCode && referralCode !== userId) {
                    // Simple referral logic without transaction to avoid permission errors for now
                    await setDoc(userRef, { ...newUserData, balance: 2000, referredBy: referralCode });
                    // Notify referrer (optional, skipped to ensure stability)
                } else {
                    await setDoc(userRef, newUserData);
                }

                const welcomeMsg = `👋 *أهلاً بك يا ${firstName}!*\n\nلقد بدأت رحلتك في *ClickMaster*. 🚀\nاضغط على الزر بالأسفل لبدء التعدين.`;
                await sendMessage(chatId, welcomeMsg, 'Markdown', keyboard);

            } else {
                // Existing User
                const backMsg = `مرحباً بعودتك ${firstName}! 👋\n\nحسابك جاهز، انطلق الآن!`;
                await sendMessage(chatId, backMsg, '', keyboard);
            }

        } catch (err) {
            console.error('Logic Error:', err);
        }
      }
    }
    
    return res.status(200).send('OK');

  } catch (error) {
    console.error('Handler Error:', error);
    return res.status(200).send('Error');
  }
}
