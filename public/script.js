// Mengambil elemen-elemen dari HTML
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
let chatHistory = [];

// Fungsi untuk membersihkan spasi berlebih dari output AI
function cleanMarkdown(text) {
    return text
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function formatReferences(html) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const elements = Array.from(tempDiv.children);
    let refStartIndex = -1;

    elements.forEach((el, index) => {
        const text = el.textContent.trim().toLowerCase();
        if (text === "referensi:" || text === "referensi") {
            refStartIndex = index;
        }
    });

    if (refStartIndex !== -1) {
        const details = document.createElement("details");
        details.className = "references";

        const summary = document.createElement("summary");
        summary.textContent = "Lihat Referensi";

        const list = document.createElement("ol");

        for (let i = refStartIndex + 1; i < elements.length; i++) {
            const li = document.createElement("li");
            li.textContent = elements[i].textContent;
            list.appendChild(li);
            elements[i].remove();
        }

        elements[refStartIndex].remove();

        details.appendChild(summary);
        details.appendChild(list);
        tempDiv.appendChild(details);
    }

    return tempDiv.innerHTML;
}

// Fungsi untuk membuat gelembung chat baru di layar
function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    const textDiv = document.createElement('div');

    if (sender === 'bot') {
        let formatted = marked.parse(cleanMarkdown(text));
        formatted = formatReferences(formatted); // 👈 tambahan baru
        textDiv.innerHTML = formatted;
    } else {
        textDiv.textContent = text;
    }

    messageDiv.appendChild(textDiv);
    
    // Tombol copy untuk bot
    if (sender === 'bot') {
        const copyBtn = document.createElement('button');
        copyBtn.textContent = "📋 Copy Jawaban";
        copyBtn.classList.add('copy-btn');
        
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.textContent = "✅ Berhasil dicopy!";
            copyBtn.style.backgroundColor = "#16a34a";
            copyBtn.style.color = "white";
            
            setTimeout(() => { 
                copyBtn.textContent = "📋 Copy Jawaban"; 
                copyBtn.style.backgroundColor = "#d1d5db";
                copyBtn.style.color = "#374151";
            }, 2000); 
        };

        messageDiv.appendChild(copyBtn);
    }
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; 
}

// Submit handler
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = userInput.value;
    if (!message) return;

    addMessage('user', message);
    userInput.value = '';

    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot');
    typingDiv.id = "typing-indicator";
        
    typingDiv.innerHTML = `
        <div class="typing-container">
            <span class="runner-icon">🏃‍♂️💨</span> 
            <span class="typing-text">SobatLari sedang sprint cari referensi...</span>
        </div>
    `;
        
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const requestBody = { message: message };
        if (base64Image) {
            requestBody.image = { data: base64Image, mimeType: mimeType };
        }

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        chatHistory.push({ role: "user", text: message });
        chatHistory.push({ role: "model", text: data.reply });

        base64Image = null;
        mimeType = null;
        imagePreview.style.display = 'none';
        imageUpload.value = '';
        
        document.getElementById('typing-indicator').remove();
        addMessage('bot', data.reply);

    } catch (error) {
        document.getElementById('typing-indicator').remove();
        addMessage('bot', 'Aduh, koneksi terputus nih Kak. Coba cek internetnya ya.');
    }
});

// Upload gambar
const imageUpload = document.getElementById('image-upload');
const uploadBtn = document.getElementById('upload-btn');
const imagePreview = document.getElementById('image-preview');

let base64Image = null;
let mimeType = null; 

uploadBtn.addEventListener('click', () => imageUpload.click());

imageUpload.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = function() {
            base64Image = reader.result.split(',')[1];
            mimeType = file.type;
            imagePreview.textContent = `✅ Gambar siap dikirim: ${file.name}`;
            imagePreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
});