import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, increment, runTransaction } from "firebase/firestore";

// --- وضعنا التوكن هنا مباشرة لحل مشكلة 401 ---
const BOT_TOKEN = "8030726883:AAGrasLU1DCg7bQDUCjYfj7DtqtZToz38xA"; 
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
    } catch (e) { console.error('Error:', e); }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // للرد على تليجرام فوراً وتجنب تكرار الرسائل المعلقة
  if (req.method === 'POST') {
      const body = req.body;

      if (body.message && body.message.text) {
          const chatId = body.message.chat.id;
          const text = body.message.text;
          const userId = String(body.message.from.id);
          const firstName = body.message.from.first_name || 'صديقي';

          if (text.startsWith('/start')) {
              // منطق Firebase البسيط
              const userRef = doc(db, 'users', userId);
              const userSnap = await getDoc(userRef);

              const keyboard = {
                  inline_keyboard: [[{ text: "🚀 Play Now", web_app: { url: APP_URL } }]]
              };

              if (!userSnap.exists()) {
                  await setDoc(userRef, { id: userId, name: firstName, balance: 1000 });
                  await sendMessage(chatId, `Welcome ${firstName}!`, 'Markdown', keyboard);
              } else {
                  await sendMessage(chatId, `Welcome back!`, 'Markdown', keyboard);
              }
          }
      }
      return res.status(200).send('OK');
  }
  
  return res.status(200).json({ status: "Bot is alive!" });
}