
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// =================================================================
// 🚨 منطقة الطوارئ: ضع التوكن هنا مباشرة إذا لم يعمل من Vercel 🚨
// مثال: const MANUAL_TOKEN = "7654321098:AAGxExampleToken...";
const MANUAL_TOKEN = "8030726883:AAGrasLU1DCg7bQDUCjYfj7DtqtZToz38xA"; 
// =================================================================

const APP_URL = "https://clickmaster-crypto.vercel.app"; 

// --- 1. إعداد Firebase بشكل آمن ---
const firebaseConfig = {
  apiKey: "AIzaSyBCkIAW5gtW063WtM7uP1vc5SJ5DygUZ1E",
  authDomain: "bottelegramapp-ca2fc.firebaseapp.com",
  projectId: "bottelegramapp-ca2fc",
  storageBucket: "bottelegramapp-ca2fc.firebasestorage.app",
  messagingSenderId: "198205424598",
  appId: "1:198205424598:web:4474696e6fc8c618d29a77",
  measurementId: "G-LGXJ778NZ3"
};

// تهيئة المتغيرات خارج المعالج
let db: any = null;
try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
} catch (e) {
    console.error("🔥 خطأ في تهيئة Firebase:", e);
}

// --- 2. دالة إرسال الرسائل (مستقلة تماماً) ---
const sendMessage = async (token: string, chatId: number | string, text: string, replyMarkup: any = null) => {
    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const body = {
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown',
            reply_markup: replyMarkup
        };
        
        console.log(`📤 إرسال رسالة إلى ${chatId}...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        if (!data.ok) {
            console.error('❌ خطأ من تليجرام:', JSON.stringify(data));
        } else {
            console.log('✅ تم الإرسال بنجاح');
        }
    } catch (e) {
        console.error('❌ خطأ في الشبكة (Fetch):', e);
    }
};

// --- 3. المعالج الرئيسي (Handler) ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // تحديد التوكن: الأولوية لـ Environment Var ثم اليدوي
    const BOT_TOKEN = (process.env.BOT_TOKEN || MANUAL_TOKEN || "").trim();

    // فحص الصحة (GET Request)
    if (req.method === 'GET') {
        return res.status(200).json({ 
            status: 'Online 🟢', 
            token_status: BOT_TOKEN ? 'Configured ✅' : 'Missing ❌',
            token_source: process.env.BOT_TOKEN ? 'Env Var' : (MANUAL_TOKEN && MANUAL_TOKEN !== "8030726883:AAGrasLU1DCg7bQDUCjYfj7DtqtZToz38xA" ? 'Manual Code' : 'None')
        });
    }

    // التحقق من وجود التوكن
    if (!BOT_TOKEN || BOT_TOKEN === "ضع_التوكن_هنا_مباشرة") {
        console.error("🚨 خطأ قاتل: لا يوجد توكن!");
        // نرجع 200 لكي لا يعيد تليجرام المحاولة ويغرق السيرفر
        return res.status(200).send('No Token');
    }

    try {
        // تحليل الطلب
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        
        if (!body || !body.message) {
            return res.status(200).send('No Message');
        }

        const chatId = body.message.chat.id;
        const text = body.message.text || '';
        const user = body.message.from;
        const firstName = user.first_name || 'Friend';
        const userId = String(user.id);

        console.log(`📩 رسالة جديدة: "${text}" من ${firstName} (${userId})`);

        // --- أوامر البوت ---

        // 1. أمر التشخيص /ping
        if (text === '/ping') {
            await sendMessage(BOT_TOKEN, chatId, '🏓 **Pong!**\nالسيرفر يعمل والاتصال ممتاز.');
            return res.status(200).send('OK');
        }

        // 2. أمر البداية /start
        if (text.startsWith('/start')) {
            const keyboard = {
                inline_keyboard: [
                    [{ text: "🚀 تشغيل التطبيق | Play Now", web_app: { url: APP_URL } }],
                    [{ text: "📢 قناة المجتمع", url: "https://t.me/TlikerChannel" }]
                ]
            };

            // محاولة الحفظ في قاعدة البيانات
            let dbStatus = "✅ تم تسجيل دخولك بنجاح.";
            try {
                if (db) {
                    const userRef = doc(db, 'users', userId);
                    const userSnap = await getDoc(userRef);
                    
                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            id: userId,
                            name: firstName,
                            balance: 1000,
                            joinDate: new Date().toISOString(),
                            role: 'user',
                            referrals: 0
                        });
                        console.log(`👤 مستخدم جديد تم إنشاؤه: ${userId}`);
                    }
                } else {
                    dbStatus = "⚠️ البوت يعمل ولكن قاعدة البيانات غير متصلة (وضع Offline).";
                }
            } catch (dbError: any) {
                console.error("🔥 خطأ قاعدة البيانات:", dbError);
                dbStatus = "⚠️ حدث خطأ في قاعدة البيانات، لكن يمكنك اللعب.";
            }

            // إرسال الرد
            await sendMessage(BOT_TOKEN, chatId, `👋 *أهلاً بك يا ${firstName}!*\n\n${dbStatus}\n\nاضغط بالأسفل للدخول:`, keyboard);
        }

        // دائماً نرجع 200 OK
        return res.status(200).send('OK');

    } catch (error) {
        console.error('🔥 خطأ غير متوقع في المعالج:', error);
        return res.status(200).send('Crash Handled');
    }
}
