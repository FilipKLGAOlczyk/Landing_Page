// --- KONFIGURACJA AZURE ---
const API_URL = "http://localhost:3000/api/chat";

// ... reszta kodu bez zmian ...


// --- POBIERANIE ELEMENTÓW HTML ---
const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatHistory = document.getElementById('chat-history');
const welcomeScreen = document.getElementById('welcome-screen');

// --- PAMIĘĆ BOTA ---
let conversationHistory = [
    { 
        role: "system", 
        content: "Jesteś Joey, przyjazny i energiczny asystent, który pomaga wybierać prezenty. Bądź pomocny i zabawny." 
    }
];

// --- GŁÓWNA FUNKCJA ---
async function sendMessage() {
    const text = userInput.value.trim();
    if (text === "") return;

    // 1. Zmiana wyglądu UI
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (chatHistory) chatHistory.classList.add('active-chat');

    // 2. Dodaj wiadomość Użytkownika
    addMessage(text, 'user-message');
    conversationHistory.push({ role: "user", content: text });
    userInput.value = "";

    // 3. Pokaż animację ładowania
    const loadingId = showLoading();

    // 4. WYSŁANIE DO AZURE
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: conversationHistory
                // W Azure model jest już w URL (w zmiennej deployment), więc tu go nie podajemy
            })
        });

        // Diagnostyka błędów
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Błąd Azure:", response.status, errorData);
            removeLoading(loadingId);
            
            if (response.status === 404) {
                addMessage("Błąd 404: Nie znaleziono zasobu. Sprawdź czy Deployment Name ('gpt-5-chat') jest identyczny w kodzie i w Azure Studio.", 'bot-message');
            } else if (response.status === 401) {
                addMessage("Błąd 401: Zły klucz API.", 'bot-message');
            } else {
                addMessage(`Wystąpił błąd Azure: ${response.status}`, 'bot-message');
            }
            throw new Error("Błąd sieci");
        }

        const data = await response.json();
        removeLoading(loadingId);

        if (data.choices && data.choices.length > 0) {
            const botReply = data.choices[0].message.content;
            addMessage(botReply, 'bot-message');
            conversationHistory.push({ role: "assistant", content: botReply });
        }

    } catch (error) {
        removeLoading(loadingId);
        console.error("Błąd połączenia:", error);
        addMessage("Nie mogę połączyć się z Azure. Sprawdź konsolę (F12).", 'bot-message');
    }
}

// --- FUNKCJE POMOCNICZE ---
function addMessage(text, className) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', className);
    messageDiv.innerText = text;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'typing-indicator';
    const id = 'loading-' + Date.now();
    loadingDiv.id = id;
    loadingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatHistory.appendChild(loadingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return id;
}

function removeLoading(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

// Event Listenery
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});