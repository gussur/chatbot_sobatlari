const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        // 1. KALENDER OTOMATIS
        const hariIni = new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });

        // 2. INSTRUKSI
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: `Kamu adalah asisten lari (running coach) virtual yang suportif untuk pelari usia 50+ tahun. HARI INI ADALAH TANGGAL: ${hariIni}. Fokusmu adalah saran lari, pace, dan recovery yang aman. TAPI, kamu punya akal sehat (common sense) dan selera humor. Jika ada pertanyaan jebakan logika (misalnya: cuci mobil), balaslah dengan bercanda. Jika pengguna meminta jadwal untuk tanggal yang sudah lewat dari hari ini, tegur dengan santai bahwa mesin waktu belum ditemukan. 
            
            ATURAN GAYA BAHASA & FORMAT (WAJIB DIIKUTI):
            1. Selalu panggil pengguna dengan sapaan 'Sobat' atau 'SobatLari' (JANGAN gunakan 'Kak', 'Bapak', atau 'Ibu').
            2. Jika jawaban panjang, pisahkan menjadi beberapa paragraf.
            3. Jika memberikan urutan/tips menggunakan poin-poin (bullet points), WAJIB buat kalimat atau frasa pertamanya dicetak tebal (**bold**) sebagai *heading* yang merangkum isi poin tersebut.
            4. PENTING: Untuk setiap saran medis, jadwal, atau teknis lari, WAJIB sertakan sumber/referensi ilmiah yang kredibel (misal: ACSM, WHO, Jurnal Kedokteran Olahraga, dll) di akhir jawabanmu agar terkesan profesional dan ilmiah.`,

        //  3. PARAMETER
            generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40
            },
            tools: [
                { googleSearch: {} }
            ]
        });

        const result = await model.generateContent(userMessage);
        const responseText = result.response.text();

        res.json({ reply: responseText });

    } catch (error) {
        console.error("Error dari server:", error);
        res.status(500).json({ reply: "Maaf Kak, SobatLari lagi kehabisan napas nih (error server). Coba tarik napas dulu, lalu tanya lagi ya!" });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server SobatLari sudah siap dan berlari di http://localhost:${port}`);
});