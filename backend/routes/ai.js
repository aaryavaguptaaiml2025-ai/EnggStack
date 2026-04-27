const router  = require("express").Router();
const auth    = require("../middleware/auth");
const OpenAI  = require("openai");

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

router.post("/chat", auth, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || !messages.length)
      return res.status(400).json({ error: "messages array required" });

    const key = process.env.OPENAI_API_KEY;
    if (!key || key.includes("YOUR_"))
      return res.status(500).json({
        error: "OpenAI API key not configured. Add OPENAI_API_KEY to backend/.env — get it from platform.openai.com"
      });

    const openai = new OpenAI({ apiKey: key });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",           // fast & cheap — change to "gpt-4o" for better answers
      max_tokens: 1500,
      messages: [
        { role: "system", content: SYSTEM },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: "No response from OpenAI" });
    res.json({ reply });
  } catch (e) {
    if (e.status === 401) return res.status(500).json({ error: "Invalid OpenAI API key" });
    if (e.status === 429) return res.status(429).json({ error: "OpenAI rate limit hit — try again in a moment" });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
