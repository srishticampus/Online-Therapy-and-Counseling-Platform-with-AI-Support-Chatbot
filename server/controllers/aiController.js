const ChatMessage = require('../models/ChatMessage');
const Resource = require('../models/Resource');
const MoodLog = require('../models/MoodLog');

const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const calculateMoodScore = (sentimentScore) => {
    if (sentimentScore >= 0.5) return 5; 
    if (sentimentScore >= 0.1) return 4; 
    if (sentimentScore >= -0.1) return 3; 
    if (sentimentScore >= -0.5) return 2; 
    return 1; 
};
const SYSTEM_PROMPT = (lang) => `
You are MindHeal AI Companion, an empathetic mental health assistant.
Instructions:
- Provide supportive, non-judgmental, and short responses in ${lang || 'English'}.
- If the user is in danger, provide emergency resources.
- Response MUST be valid JSON only.
- Ensure the "reply" field is in ${lang || 'English'}.
{
  "reply": "Empathetic text in ${lang || 'English'}",
  "sentiment": { "score": 0.5, "label": "Positive" },
  "detectedEmotion": "Anxiety", 
  "suggestedAction": "Breathing Exercise"
}
`;

exports.chat = async (req, res) => {
    try {
        const { message, language } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!message) return res.status(400).json({ error: 'Message is required' });

        let finalResponse = null;
        let usedSource = "OFFLINE";

        // 1. AI FETCH LOGIC (Groq)
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: SYSTEM_PROMPT(language) },
                    { role: "user", content: message }
                ],
                // Using Llama 3 70B for best emotional intelligence
                model: "llama-3.3-70b-versatile",
                temperature: 0.6,
                max_tokens: 500,
                response_format: { type: "json_object" }
            });

            const rawContent = chatCompletion.choices[0].message.content;

            // Clean Markdown if present (e.g. ```json ... ```)
            const cleanJson = rawContent.replace(/```json|```/g, '').trim();
            finalResponse = JSON.parse(cleanJson);

            usedSource = "Groq (Llama 3)";
        } catch (err) {
            console.error("AI API Failed, using local fallback:", err.message);
            finalResponse = {
                reply: "I'm listening. It seems I'm having a connection issue, but I'm here for you. How can I help?",
                sentiment: { score: 0, label: "Neutral" },
                detectedEmotion: "Neutral",
                suggestedAction: "Talk more"
            };
        }

        // 2. AUTOMATIC MOOD LOGGING (If emotion is strong)
        let moodLogged = false;
        if (userId && finalResponse.detectedEmotion && finalResponse.detectedEmotion !== "Neutral") {
            try {
                const score = calculateMoodScore(finalResponse.sentiment.score);

                // Estimate Energy Level
                let energy = 5;
                const highEnergy = ['Anger', 'Excitement', 'Panic', 'Joy', 'Stress', 'Anxiety'];
                const lowEnergy = ['Sadness', 'Depression', 'Fatigue', 'Boredom', 'Grief'];

                if (highEnergy.some(e => finalResponse.detectedEmotion.includes(e))) energy = 8;
                if (lowEnergy.some(e => finalResponse.detectedEmotion.includes(e))) energy = 3;

                await MoodLog.create({
                    user: userId,
                    mood: finalResponse.detectedEmotion,
                    score: score,
                    energy: energy,
                    note: `Auto-logged via Chat: "${message.substring(0, 40)}..."`,
                    date: new Date()
                });
                moodLogged = true;
            } catch (moodErr) {
                console.error("Auto-mood log failed:", moodErr.message);
            }
        }

        // 3. RESOURCE SUGGESTION LOGIC
        let suggestedItems = [];
        if (finalResponse.detectedEmotion && finalResponse.detectedEmotion !== "Neutral") {
            try {
                suggestedItems = await Resource.find({
                    $or: [
                        { category: { $regex: finalResponse.detectedEmotion, $options: 'i' } },
                        { tags: { $regex: finalResponse.detectedEmotion, $options: 'i' } }
                    ]
                }).limit(3).select('title type contentUrl thumbnail description');
            } catch (err) {
                console.warn("Failed to fetch resources:", err.message);
            }
        }

        // Fallback resources if none found
        if (suggestedItems.length === 0) {
            suggestedItems = await Resource.find({ category: "Meditation" }).limit(3);
        }

        // 4. SAVE CHAT HISTORY TO DB
        if (userId) {
            // Save User Message
            await ChatMessage.create({
                sender: userId,
                message: message,
                isAI: false,
                sentimentScore: finalResponse.sentiment?.score || 0,
                detectedEmotion: finalResponse.detectedEmotion || "Neutral"
            });

            // Save AI Response
            await ChatMessage.create({
                receiver: userId,
                isAI: true,
                message: finalResponse.reply,
                suggestedAction: finalResponse.suggestedAction || ""
            });
        }

        // 5. SEND RESPONSE
        res.json({
            success: true,
            ...finalResponse,
            suggestedItems,
            moodLogged, // Let frontend know we saved the mood
            _source: usedSource
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- HISTORY API ---
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const messages = await ChatMessage.find({
            $or: [{ sender: userId }, { receiver: userId, isAI: true }]
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Reverse to show oldest first in UI
        const formattedData = messages.reverse().map(msg => ({
            sender: msg.isAI ? 'ai' : 'user',
            content: msg.message,
            timestamp: msg.createdAt,
            emotion: msg.detectedEmotion
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- ANALYTICS API ---
exports.getAnalytics = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const messages = await ChatMessage.find({
            sender: userId,
            isAI: false,
            createdAt: { $gte: sevenDaysAgo }
        });

        const trends = {};
        const emotions = {};

        messages.forEach(m => {
            const d = m.createdAt.toISOString().split('T')[0];
            if (!trends[d]) trends[d] = [];
            trends[d].push(m.sentimentScore || 0);

            if (m.detectedEmotion) {
                emotions[m.detectedEmotion] = (emotions[m.detectedEmotion] || 0) + 1;
            }
        });

        const trendArray = Object.keys(trends).map(date => ({
            date,
            averageSentiment: trends[date].reduce((a, b) => a + b, 0) / trends[date].length
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        const topEmotions = Object.entries(emotions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(e => e[0]);

        res.json({ success: true, trend: trendArray, topEmotions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- CLEAR HISTORY ---
exports.clearHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        await ChatMessage.deleteMany({
            $or: [{ sender: userId }, { receiver: userId, isAI: true }]
        });
        res.json({ success: true, message: "Chat history cleared." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};