const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middleware/auth');

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey && apiKey !== 'your_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

router.use(authMiddleware);

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Input Validation
    if (!message || message.length > 500) {
      return res.status(400).json({ error: "Invalid input" });
    }

    if (!genAI) {
      return res.status(500).json({ reply: "AI service is currently unavailable. Please configure the GEMINI_API_KEY in the server." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // using flash for fast response

    const systemPrompt = `You are a helpful health assistant.
Only provide general health, fitness, medicine, and lifestyle advice.
Do NOT provide medical diagnosis, prescriptions, or emergency decisions.
If the query is not related to health, politely refuse.
Keep answers short, clear, and safe.
The user's name is ${req.user.name}. Address them politely.`;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: `Understood. I will act as a helpful health assistant and prioritize safety. How can I help ${req.user.name} today?` }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.json({ reply: text });

  } catch (err) {
    console.error("Gemini API Error:", err);
    return res.status(500).json({
      reply: "Sorry, I couldn’t process your request right now. Please try again."
    });
  }
});

module.exports = router;
