require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Models
const FAQ = require('./models/FAQ');
const Ticket = require('./models/Ticket');
const Interaction = require('./models/Interaction');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ DB Error:", err));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });


app.post('/api/chat', async (req, res) => {
    try {
        const { question } = req.body;
        const faqs = await FAQ.find();

        const context = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n");

        const prompt = `
      You are 'NotifiU' University Assistant.
      Knowledge Base:
      ${context}
      
      Student Question: ${question}
      
      Instructions:
      1. Answer ONLY using the Knowledge Base.
      2. If the answer is not there, say exactly: "I don't have that information. Would you like to raise a ticket?"
      3. Be helpful and friendly.
    `;

        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();

        const isUnanswered = responseText.includes("raise a ticket") || responseText.includes("don't have that information");

        await Interaction.create({
            userQuery: question,
            botResponse: responseText,
            isUnanswered: isUnanswered
        });

        res.json({ answer: responseText });

    } catch (error) {
        console.error(error);
        res.status(500).json({ answer: "Error connecting to AI." });
    }
});

app.get('/api/analytics', async (req, res) => {
    try {
        const totalInteractions = await Interaction.countDocuments();
        const totalTickets = await Ticket.countDocuments();
        const unansweredCount = await Interaction.countDocuments({ isUnanswered: true });

        const topQuestions = await Interaction.aggregate([
            { $group: { _id: "$userQuery", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const unansweredLogs = await Interaction.find({ isUnanswered: true })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            totalInteractions,
            totalTickets,
            unansweredCount,
            topQuestions,
            unansweredLogs
        });
    } catch (error) {
        res.status(500).json({ error: "Analytics Error" });
    }
});

app.get('/api/faqs', async (req, res) => {
    const faqs = await FAQ.find();
    res.json(faqs);
});

app.post('/api/faqs', async (req, res) => {
    const newFAQ = new Interaction(req.body); // Correction: This should be FAQ model, fixing below
    const created = new FAQ(req.body);
    await created.save();
    res.json(created);
});

app.put('/api/faqs/:id', async (req, res) => {
    const updated = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

app.delete('/api/faqs/:id', async (req, res) => {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

app.get('/api/tickets', async (req, res) => {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
});

app.post('/api/tickets', async (req, res) => {
    const newTicket = new Ticket({ studentQuery: req.body.query });
    await newTicket.save();
    res.json(newTicket);
});

app.put('/api/tickets/:id', async (req, res) => {
    const { status, adminReply } = req.body;
    const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, { status, adminReply }, { new: true });
    res.json(updatedTicket);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));