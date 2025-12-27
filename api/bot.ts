
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, runTransaction, arrayUnion } from "firebase/firestore";

// --- Configuration ---
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 7927882703; 
const APP_URL = "https://clickmaster-crypto.vercel.app";

// Firebase Config (Updated)
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

const sendMessage = async (chatId: number | string, text: string, parseMode: string = '', replyMarkup: any = null) => {
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
    } catch (e) { console.error(e); }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(200).send('Active');
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Token missing' });

  try {
    const body = req.body;

    // Handle Pre-checkout (Payment)
    if (body.pre_checkout_query) {
        const queryId = body.pre_checkout_query.id;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pre_checkout_query_id: queryId, ok: true })
        });
        return res.status(200).send('OK');
    }

    // Handle Messages
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text as string;
      const user = body.message.from;
      const userId = String(user.id);
      const firstName = user.first_name || 'صديقي';

      // STRICTLY ONLY RESPOND TO COMMANDS (Prevent Spam)
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
            // --- NEW USER ---
            if (referralCode && referralCode !== userId) {
                try {
                    await runTransaction(db, async (transaction) => {
                        const referrerRef = doc(db, 'users', referralCode);
                        const referrerSnap = await transaction.get(referrerRef);

                        if (referrerSnap.exists()) {
                            transaction.set(userRef, {
                                id: userId,
                                name: firstName,
                                balance: 2000, 
                                energy: 1000,
                                maxEnergy: 1000,
                                referrals: 0,
                                joinDate: new Date().toLocaleDateString('ar-EG'),
                                role: 'user',
                                isBanned: false,
                                referredBy: referralCode,
                                walletAddress: '',
                                ownedProducts: [],
                                completedTaskIds: [],
                                notificationsEnabled: true // Default Preference
                            });

                            transaction.update(referrerRef, {
                                referrals: increment(1),
                                balance: increment(1000)
                            });
                            
                            // Notify Referrer (Transactional Message - Allowed)
                            const refData = referrerSnap.data();
                            if (refData.notificationsEnabled !== false) {
                                await sendMessage(referralCode, `🎉 *صديق جديد انضم!*\n\n${firstName} دخل عبر رابطك.\n💰 +1000 نقطة لك.`, 'Markdown');
                            }
                        } else {
                            // Referrer invalid
                            transaction.set(userRef, {
                                id: userId,
                                name: firstName,
                                balance: 1000,
                                energy: 1000,
                                maxEnergy: 1000,
                                referrals: 0,
                                joinDate: new Date().toLocaleDateString('ar-EG'),
                                role: 'user',
                                isBanned: false,
                                ownedProducts: [],
                                completedTaskIds: [],
                                notificationsEnabled: true
                            });
                        }
                    });
                } catch (e) { console.error(e); }
            } else {
                // Direct Join
                await setDoc(userRef, {
                    id: userId,
                    name: firstName,
                    balance: 1000,
                    energy: 1000,
                    maxEnergy: 1000,
                    referrals: 0,
                    joinDate: new Date().toLocaleDateString('ar-EG'),
                    role: 'user',
                    isBanned: false,
                    ownedProducts: [],
                    completedTaskIds: [],
                    notificationsEnabled: true
                });
            }

            const welcomeMsg = `👋 *أهلاً بك يا ${firstName}!*\n\nلقد بدأت رحلتك في *ClickMaster*. 🚀\nاضغط على الزر بالأسفل لبدء التعدين وجمع المكافآت.`;
            await sendMessage(chatId, welcomeMsg, 'Markdown', keyboard);

            // Notify Admin (Optional, keep quiet if high volume)
            // sendMessage(ADMIN_ID, `New User: ${firstName} (${userId})`, 'Markdown');

        } else {
            // --- EXISTING USER ---
            // Just send a short "Welcome Back" navigation message. Do not re-register.
            const backMsg = `مرحباً بعودتك ${firstName}! 👋\n\nاضغط على الزر أدناه للدخول إلى حسابك.`;
            await sendMessage(chatId, backMsg, '', keyboard);
        }
      } 
      // IGNORE ALL OTHER MESSAGES (Prevents Spam Loops)
    }
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).send('Error');
  }
}
