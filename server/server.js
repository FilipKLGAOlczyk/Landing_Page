require("dotenv").config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const apiKey = process.env.AZURE_API_KEY;
const endpoint = process.env.AZURE_ENDPOINT;
const deployment = process.env.AZURE_DEPLOYMENT;
const apiVersion = process.env.AZURE_API_VERSION;

const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
const API_URL = `${baseUrl}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

app.post('/api/chat', async (req, res) => {
    try {
        console.log("Otrzymano z frontendu: ");
        const userMessages = req.body.messages;

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey
            },
            body: JSON.stringify({ messages: userMessages })
        });
    
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Błąd Azure:", response.status, errorData);
            return res.status(response.status).json({ error: "Błąd z Azure OpenAI" });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error("Błąd serwera:", error);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});