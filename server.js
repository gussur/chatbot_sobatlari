const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

/* =====================================
   🔒 ANTI VIRAL PROTECTION LAYER
===================================== */

// Emergency kill switch (kalau server kepanasan)
let emergencyStop = false;

// Rate limit per IP
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: 15, // max 15 request per menit per IP
    message: {
        reply: "SobatLari lagi ramai banget 🙏 Coba tarik napas dulu 1 menit ya."
    }
});

app.use('/api/chat', limiter);

// Monitoring sederhana
let totalRequests = 0;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {

        if (emergencyStop) {
            return res.json({
                reply: "SobatLari sedang istirahat dulu ya 🙏 Server lagi penuh."
            });
        }

        totalRequests++;
        console.log("Total request sejak server nyala:", totalRequests);

        const { message: userMessage, image: userImage } = req.body;

        const hariIni = new Date().toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        /* =====================================
           MEMORY RINGKAS (HEMAT TOKEN)
        ===================================== */

        const userProfile = `
KONTEKS PENGGUNA:
Target: Pelari usia 50+.
Fokus: Konsistensi, aman dari cedera, progres jangka panjang.
`;

        /* =====================================
           SYSTEM INSTRUCTION FINAL
        ===================================== */

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `
Kamu adalah asisten lari (running coach) virtual khusus usia 50+.

HARI INI: ${hariIni}.

Fokus utama:
- Memberikan saran lari, pace, recovery, dan kebugaran yang aman.
- Gunakan bahasa suportif, hangat, dan memotivasi.
- Selalu panggil pengguna dengan "Sobat" atau "SobatLari".
- Jika menggunakan poin, buat kalimat pertama **bold** sebagai heading.
- Untuk saran medis atau teknis, sertakan referensi atau penjelasan logis agar profesional.

COMMON SENSE MODE:
Jika ada pertanyaan jebakan logika atau konteks tersembunyi,
gunakan akal sehat dan humor ringan.

FORMAT EFISIEN:
Jawaban maksimal sekitar 600 kata.
Gunakan kalimat langsung ke inti.
Hindari pengulangan.
Jika daftar lebih dari 3 item, jelaskan singkat saja.
Utamakan kejelasan dibanding panjang.

INTENT AWARENESS MODE:
Selalu pikirkan tujuan akhir pengguna sebelum menjawab.
Jangan hanya menjawab permukaan pertanyaan.

WISE BUT FIRM COACH MODE:
Jika pengguna berisiko membahayakan diri (overtraining, target tidak realistis, memaksa saat cedera),
bersikap tegas namun tetap hangat.
Utamakan keselamatan dibanding ego.
Gunakan kalimat seperti:
"Sobat, ini saya harus jujur..."
"Lebih baik mundur satu langkah hari ini daripada mundur enam bulan karena cedera."

RESPECTFUL MOTIVATOR MODE:
Hormati pengalaman hidup pengguna.
Jangan meremehkan usia.
Jangan gunakan gaya toxic positivity.
Berikan semangat yang realistis, tenang, dan membumi.
Fokus pada konsistensi jangka panjang, bukan heroik sesaat.

${userProfile}
`,
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 800 // 🔥 hemat biaya
            },
            tools: [
                { googleSearch: {} }
            ]
        });

        const contents = [
            {
                role: "user",
                parts: [{ text: userMessage }]
            }
        ];

        if (userImage) {
            contents[0].parts.push({
                inlineData: {
                    data: userImage.data,
                    mimeType: userImage.mimeType
                }
            });
        }

        const result = await model.generateContent({ contents });
        const responseText = result.response.text();

        res.json({ reply: responseText });

    } catch (error) {
        console.error("Error dari Gemini:", error);
        res.status(500).json({
            reply: "Aduh, SobatLari lagi kehabisan napas (Error server). Coba lagi nanti ya!"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`SobatLari sudah siap berlari di port ${PORT}`);
});