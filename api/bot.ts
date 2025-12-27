import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, increment, runTransaction } from "firebase/firestore";

// Configuration
const BOT_TOKEN = process.env.BOT_TOKEN; 
const APP_URL = "https://clickmaster-beige.vercel.app";

const firebaseConfig = {
  apiKey: "AIzaSyBCkIAW5gtW063WtM7uP1vc5SJ5DygUZ1E",
  authDomain: "bottelegramapp-ca2fc.firebaseapp.com",
  projectId: "bottelegramapp-ca2fc",
  storageBucket: "bottelegramapp-ca2fc.firebasestorage.app",
  messagingSenderId: "198205424598",
  appId: "1:198205424598:web:4474696e6fc8c618d29a77",
  measurementId: "G-LGXJ778NZ3"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const sendMessage = async (chatId: number | string, text: string, parseMode: string = 'Markdown', replyMarkup: any = null) => {
    if (!BOT_TOKEN) return;
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: parseMode,
                reply_markup: replyMarkup
            })
        });
    } catch (e) { console.error('Fetch Error:', e); }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
      return res.status(200).json({ status: 'Active' });
  }

  if (!BOT_TOKEN) {
      return res.status(500).json({ error: 'BOT_TOKEN missing' });
  }

  try {
    const body = req.body;

    if (body.pre_checkout_query) {
        const queryId = body.pre_checkout_query.id;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pre_checkout_query_id: queryId, ok: true })
        });
        return res.status(200).send('OK');
    }

    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text as string;
      const user = body.message.from;
      const userId = String(user.id);
      const firstName = user.first_name || 'صديقي';

      if (text.startsWith('/start')) {
        const args = text.split(' ');
        const referralCode = args.length > 1 ? args[1] : null;

        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        const keyboard = {
            inline_keyboard: [
              [{ text: "🚀 تشغيل التطبيق | Play Now", web_app: { url: APP_URL } }],
              [{ text: "📢 قناة المجتمع", url: "https://t.me/tlekerIq" }]
            ]
        };

        if (!userSnap.exists()) {
            const newUserData: any = {
                id: userId,
                name: firstName,
                balance: 1000, 
                energy: 1000,
                maxEnergy: 1000,
                referrals: 0,
                joinDate: new Date().toLocaleDateString('ar-EG'),
                role: 'user',
                isBanned: false
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
                    } else {
                        transaction.set(userRef, newUserData);
                    }
                });
            } else {
                await setDoc(userRef, newUserData);
            }
            await sendMessage(chatId, `👋 *أهلاً بك يا ${firstName}!*`, 'Markdown', keyboard);
        } else {
            await sendMessage(chatId, `مرحباً بعودتك ${firstName}! 👋`, 'Markdown', keyboard);
        }
      }
    }
    
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error:', error);
    return res.status(200).send('OK'); // نرسل 200 دائماً لتليجرام لتجنب تكرار المحاولة عند الخطأ
  }
}