
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, increment, runTransaction } from "firebase/firestore";

// --- Configuration ---
const BOT_TOKEN = process.env.BOT_TOKEN?.trim(); // Trim to remove accidental spaces
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

// Initialize Firebase
// Note: In Vercel serverless, we must ensure we reuse the app instance if it exists
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
        
        // Log API errors
        const data = await response.json();
        if (!data.ok) {
            console.error('Telegram API Error:', data);
        }
    } catch (e) {
        console.error('Fetch Error:', e);
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Health Check (GET)
  if (req.method === 'GET') {
      return res.status(200).json({ 
          status: 'Active', 
          message: 'ClickMaster Bot is Ready', 
          timestamp: new Date().toISOString()
      });
  }

  // 2. Token Check
  if (!BOT_TOKEN) {
      console.error("BOT_TOKEN is missing in Environment Variables");
      return res.status(500).json({ error: 'Configuration Error' });
  }

  try {
    // 3. Safe Body Parsing
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // Log incoming update ID for debugging (visible in Vercel Logs)
    if (body.update_id) console.log(`Processing Update ID: ${body.update_id}`);

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

      // --- Debug Command: /ping ---
      if (text === '/ping') {
          await sendMessage(chatId, '🏓 Pong!\nالبوت يعمل والاتصال جيد.');
          return res.status(200).send('OK');
      }

      // --- Main Command: /start ---
      if (text.startsWith('/start')) {
        try {
            const args = text.split(' ');
            const referralCode = args.length > 1 ? args[1] : null;
            const userRef = doc(db, 'users', userId);
            
            // Try to read user doc
            const userSnap = await getDoc(userRef);

            const keyboard = {
                inline_keyboard: [
                  [{ text: "🚀 تشغيل التطبيق | Play Now", web_app: { url: APP_URL } }],
                  [{ text: "📢 قناة المجتمع", url: "https://t.me/TlikerChannel" }]
                ]
            };

            if (!userSnap.exists()) {
                // New User Logic
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
                    await runTransaction(db, async (transaction) => {
                        const referrerRef = doc(db, 'users', referralCode);
                        const referrerSnap = await transaction.get(referrerRef);

                        if (referrerSnap.exists()) {
                            transaction.set(userRef, { ...newUserData, balance: 2000, referredBy: referralCode });
                            transaction.update(referrerRef, {
                                referrals: increment(1),
                                balance: increment(1000)
                            });
                            const refData = referrerSnap.data();
                            if (refData.notificationsEnabled !== false) {
                                await sendMessage(referralCode, `🎉 *صديق جديد انضم!*\n\n${firstName} دخل عبر رابطك.`, 'Markdown');
                            }
                        } else {
                            transaction.set(userRef, newUserData);
                        }
                    });
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

        } catch (dbError: any) {
            console.error('Firestore Error:', dbError);
            // Send error to user to help debugging (can be removed in production)
            await sendMessage(chatId, `⚠️ عذراً، حدث خطأ في الاتصال بقاعدة البيانات:\n${dbError.message}\n\nيرجى المحاولة لاحقاً.`);
        }
      }
    }
    
    // Always return 200 OK to Telegram to prevent retries
    return res.status(200).send('OK');

  } catch (error) {
    console.error('General Handler Error:', error);
    // Return 200 even on error to stop Telegram loop
    return res.status(200).send('Error Handled');
  }
}
