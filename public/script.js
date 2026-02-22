// Mengambil elemen-elemen dari HTML
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Fungsi untuk membuat gelembung chat baru di layar
function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    // Kita bungkus teksnya dulu
    const textDiv = document.createElement('div');
    if (sender === 'bot') {
        textDiv.innerHTML = marked.parse(text); // Terjemahkan bintang jadi tebal
    } else {
        textDiv.textContent = text;
    }
    messageDiv.appendChild(textDiv);
    
    // 👇 FITUR TOMBOL COPY KHUSUS UNTUK BOT 👇
    if (sender === 'bot') {
        const copyBtn = document.createElement('button');
        copyBtn.textContent = "📋 Copy Jawaban";
        copyBtn.classList.add('copy-btn');
        
        // Apa yang terjadi saat tombol diklik?
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text); // Script ajaib untuk copy!
            copyBtn.textContent = "✅ Berhasil dicopy!";
            copyBtn.style.backgroundColor = "#16a34a"; // Berubah hijau sebentar
            copyBtn.style.color = "white";
            
            // Balik ke tampilan semula setelah 2 detik
            setTimeout(() => { 
                copyBtn.textContent = "📋 Copy Jawaban"; 
                copyBtn.style.backgroundColor = "#d1d5db";
                copyBtn.style.color = "#374151";
            }, 2000); 
        };
        messageDiv.appendChild(copyBtn);
    }
    
    chatBox.appendChild(messageDiv);
    
    // Otomatis scroll ke bawah
    chatBox.scrollTop = chatBox.scrollHeight; 
}

// Apa yang terjadi saat tombol "Kirim" ditekan?
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Mencegah halaman web refresh/reload
    
    const message = userInput.value;
    if (!message) return; // Kalau kosong, jangan lakukan apa-apa

    // 1. Tampilkan pesan Kakak di layar (sebelah kanan)
    addMessage('user', message);
    userInput.value = ''; // Kosongkan kolom ketik

    // 2. Tampilkan teks "Sedang mengetik..." sementara menunggu AI
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot');
    typingDiv.textContent = "SobatLari sedang memikirkan jawaban...";
    typingDiv.id = "typing-indicator";
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // 3. Mengirim pesan ke Backend (server.js) pakai metode POST
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        
        // 4. Hapus tulisan "Sedang mengetik..."
        document.getElementById('typing-indicator').remove();
        
        // 5. Tampilkan balasan cerdas dari AI di layar (sebelah kiri)
        addMessage('bot', data.reply);

    } catch (error) {
        // Kalau terjadi error jaringan
        document.getElementById('typing-indicator').remove();
        addMessage('bot', 'Aduh, koneksi terputus nih Kak. Coba cek internetnya ya.');
    }
});
