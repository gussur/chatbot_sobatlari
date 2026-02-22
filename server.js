const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        // 1. Ambil pesan teks dan gambar dari Front-end (Ini yang benar, tidak ada kembarannya)
        const { message: userMessage, image: userImage, history } = req.body;

        // 2. Kalender otomatis
        const hariIni = new Date().toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        // 3. Instruksi dan Konfigurasi Model
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `Kamu adalah asisten lari (running coach) virtual yang suportif khusus untuk usia 50+ tahun. Target audiensmu mencakup PEMULA yang baru ingin mulai lari jalan kaki (run-walk), hingga pelari veteran. HARI INI ADALAH TANGGAL: ${hariIni}. Fokusmu adalah saran lari, pace, dan recovery yang aman dan memotivasi. TAPI, kamu punya akal sehat (common sense) dan selera humor. Jika ada pertanyaan jebakan logika (misalnya: cuci mobil), balaslah dengan bercanda. Jika pengguna meminta jadwal untuk tanggal yang sudah lewat dari hari ini, tegur dengan santai bahwa mesin waktu belum ditemukan. 
            
            ATURAN GAYA BAHASA & FORMAT (WAJIB DIIKUTI):
            1. Selalu panggil pengguna dengan sapaan 'Sobat' atau 'SobatLari'.
            2. Jika jawaban panjang, pisahkan menjadi beberapa paragraf.
            3. Jika memberikan urutan/tips menggunakan poin-poin (bullet points), WAJIB buat kalimat atau frasa pertamanya dicetak tebal (**bold**) sebagai *heading* yang merangkum isi poin tersebut.
            4. PENTING: Untuk setiap saran medis, jadwal, teknis lari, atau saat menganalisa data dari gambar, WAJIB sertakan sumber/referensi ilmiah atau jelaskan dengan logis agar terkesan profesional.`,
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40
            },
            tools: [
                { googleSearch: {} }
            ]
        });

    // 4. Membuat AI tidak lupa percakapan
        const contents = [];
        
        // A. Susun ingatan masa lalu (jika ada)
        if (history && history.length > 0) {
            history.forEach(chat => {
                contents.push({
                    role: chat.role,
                    parts: [{ text: chat.text }]
                });
            });
        }

        // B. Susun pesan yang baru saja diketik (ditambah gambar jika ada)
        const currentParts = [{ text: userMessage }];
        if (userImage) {
            currentParts.push({
                inlineData: { data: userImage.data, mimeType: userImage.mimeType }
            });
        }
        contents.push({ role: "user", parts: currentParts });

        // 5. AI berpikir menggunakan seluruh ingatan
        const result = await model.generateContent({ contents: contents });
        const responseText = result.response.text();

        res.json({ reply: responseText });

    } catch (error) {
        console.error("Error dari Gemini:", error);
        res.status(500).json({ reply: "Aduh, SobatLari lagi kehabisan napas nih (Error server). Coba tanya lagi nanti ya!" });
    }
});

// Ambil port dari Render, atau pakai 3000 kalau di laptop
const PORT = process.env.PORT || 3000; 

app.listen(PORT, () => {
    console.log(`SobatLari sudah siap dan berlari di port ${PORT}`);
});