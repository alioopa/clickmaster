
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, increment, runTransaction } from "firebase/firestore";

// --- Configuration ---
// هام: يجب التأكد من وضع BOT_TOKEN في إعدادات البيئة في Vercel
const BOT_TOKEN = process.env.BOT_TOKEN; 
const APP_URL = "https://clickmaster-crypto.vercel.app"; // تأكد من تغيير هذا لرابط موقعك الحقيقي بعد الرفع

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

// تهيئة Firebase مرة واحدة فقط لتجنب الأخطاء في بيئة السيرفر
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// دالة إرسال الرسائل
const sendMessage = async (chatId: number | string, text: string, parseMode: string = '', replyMarkup: any = null) => {
    if (!BOT_TOKEN) {
        console.error("BOT_TOKEN is missing in Environment Variables");
        return;
    }
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
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
        if (!data.ok) console.error("Telegram API Error:", data);
    } catch (e) { console.error('Fetch Error:', e); }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. اختبار الاتصال (Health Check)
  // هذا يسمح لك بفتح رابط البوت في المتصفح للتأكد من أنه يعمل
  if (req.method === 'GET') {
      return res.status(200).json({ 
          status: 'Active', 
          message: 'ClickMaster Bot API is running!',
          timestamp: new Date().toISOString()
      });
  }

  // 2. التحقق من التوكن
  if (!BOT_TOKEN) {
      console.error("CRITICAL: BOT_TOKEN not found in env variables");
      return res.status(500).json({ error: 'System Configuration Error: BOT_TOKEN missing' });
  }

  // 3. معالجة طلبات تليجرام (POST)
  try {
    const body = req.body;

    // أ) معالجة المدفوعات (Pre-checkout)
    if (body.pre_checkout_query) {
        const queryId = body.pre_checkout_query.id;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pre_checkout_query_id: queryId, ok: true })
        });
        return res.status(200).send('OK');
    }

    // ب) معالجة الرسائل النصية
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text as string;
      const user = body.message.from;
      const userId = String(user.id);
      const firstName = user.first_name || 'صديقي';

      // الرد فقط على أمر /start لتجنب الإزعاج
      if (text.startsWith('/start')) {
        const args = text.split(' ');
        const referralCode = args.length > 1 ? args[1] : null;

        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        const keyboard = {
            inline_keyboard: [
              [{ text: "🚀 تشغيل التطبيق | Play Now", web_app: { url: APP_URL } }],
              [{ text: "📢 قناة المجتمع", url: "https://t.me/TlikerChannel" }]
            ]
        };

        if (!userSnap.exists()) {
            // --- تسجيل مستخدم جديد ---
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

            let referrerIdToNotify = null;

            if (referralCode && referralCode !== userId) {
                try {
                    // محاولة استخدام Transaction للإحالة
                    await runTransaction(db, async (transaction) => {
                        const referrerRef = doc(db, 'users', referralCode);
                        const referrerSnap = await transaction.get(referrerRef);

                        if (referrerSnap.exists()) {
                            transaction.set(userRef, {
                                ...newUserData,
                                balance: 2000, // مكافأة مضاعفة
                                referredBy: referralCode
                            });

                            transaction.update(referrerRef, {
                                referrals: increment(1),
                                balance: increment(1000)
                            });
                            
                            const refData = referrerSnap.data();
                            if (refData.notificationsEnabled !== false) {
                                referrerIdToNotify = referralCode;
                            }
                        } else {
                            transaction.set(userRef, newUserData);
                        }
                    });
                } catch (e) { 
                    console.error('Transaction Failed (Fallback used):', e);
                    await setDoc(userRef, newUserData); // تسجيل عادي في حال فشل الترانزاكشن
                }
            } else {
                await setDoc(userRef, newUserData);
            }

            // إرسال رسالة الترحيب
            const welcomeMsg = `👋 *أهلاً بك يا ${firstName}!*\n\nلقد بدأت رحلتك في *ClickMaster*. 🚀\nاضغط على الزر بالأسفل لبدء التعدين وجمع المكافآت.`;
            await sendMessage(chatId, welcomeMsg, 'Markdown', keyboard);

            // إشعار صاحب الإحالة
            if (referrerIdToNotify) {
                await sendMessage(referrerIdToNotify, `🎉 *صديق جديد انضم!*\n\n${firstName} دخل عبر رابطك.\n💰 +1000 نقطة لك.`, 'Markdown');
            }

        } else {
            // --- مستخدم موجود مسبقاً ---
            const backMsg = `مرحباً بعودتك ${firstName}! 👋\n\nاضغط على الزر أدناه للدخول إلى حسابك.`;
            await sendMessage(chatId, backMsg, '', keyboard);
        }
      }
    }
    
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Bot Handler Error:', error);
    return res.status(500).send('Internal Server Error');
  }
}
