const router  = require("express").Router();
const auth    = require("../middleware/auth");
const OpenAI  = require("openai");
const ChatSession = require("../models/ChatSession");

const SYSTEM = `You are Cognit AI — an expert engineering study assistant.
Help students with: Data Structures & Algorithms, Computer Networks, Operating Systems,
DBMS, Mathematics (Calculus, Linear Algebra, Probability, Discrete Maths),
Physics (Mechanics, Electromagnetism, Thermodynamics), and all CS/Engineering topics.

Rules:
- Be concise, structured, and student-friendly
- Use markdown: **bold**, \`code\`, \`\`\`code blocks\`\`\`, bullet points
- Always give a practical example
- For complex topics, break into steps
- Encourage the student — they are working hard!`;

// ── Send a message (Section 3.5 — persists to MongoDB) ───────────────────────
router.post("/chat", auth, async (req, res, next) => {
  try {
    const { messages, sessionId } = req.body;
    if (!Array.isArray(messages) || !messages.length)
      return res.status(400).json({ error: "messages array required" });

    const key = process.env.OPENAI_API_KEY;
    if (!key || key.includes("YOUR_"))
      return res.status(500).json({
        error: "Cognit AI is taking some rest right now, try again later"
      });

    const openai = new OpenAI({ apiKey: key });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 800,
      messages: [
        { role: "system", content: SYSTEM },
        ...messages.slice(-20).map(m => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
      ],
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: "No response from OpenAI" });

    // Persist to chat session (Section 3.5)
    let session;
    const lastUserMsg = messages[messages.length - 1];
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: req.user.id });
      if (session) {
        session.messages.push(
          { role: "user", content: lastUserMsg.content },
          { role: "assistant", content: reply }
        );
        session.updatedAt = new Date();
        await session.save();
      }
    }
    
    if (!session) {
      // Create new session with auto-generated title from first message
      const title = lastUserMsg.content.slice(0, 60) + (lastUserMsg.content.length > 60 ? "..." : "");
      session = await ChatSession.create({
        userId: req.user.id,
        title,
        messages: messages.map(m => ({ role: m.role, content: m.content })).concat([
          { role: "assistant", content: reply }
        ]),
      });
    }

    res.json({ reply, sessionId: session._id });
  } catch (e) {
    if (e.status === 401) return res.status(500).json({ error: "Invalid OpenAI API key" });
    if (e.status === 429) return res.status(429).json({ error: "OpenAI rate limit hit — try again in a moment" });
    next(e);
  }
});

// ── List recent chat sessions ─────────────────────────────────────────────────
router.get("/sessions", auth, async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(20);
    res.json(sessions);
  } catch (e) { next(e); }
});

// ── Get a specific session ────────────────────────────────────────────────────
router.get("/sessions/:id", auth, async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user.id });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (e) { next(e); }
});

// ── Delete a session ──────────────────────────────────────────────────────────
router.delete("/sessions/:id", auth, async (req, res, next) => {
  try {
    await ChatSession.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
