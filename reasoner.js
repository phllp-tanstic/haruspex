const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateReasoning(signal) {
  try {
    const prompt = `You are Haruspex, an autonomous DeFi-to-CEX signal agent. A trading signal just fired. Write exactly 2-3 sentences explaining this trade decision in clear, professional language. Be specific about the numbers. No fluff.

Signal: ${signal.signal}
Action: ${signal.action} ${signal.primaryAsset}
Trigger value: ${signal.value}
Confidence: ${Math.round(signal.confidence * 100)}%
Raw reason: ${signal.reason}

Write the explanation now:`;

    const response = await groq.chat.completions.create({
      model: 'qwen/qwen3-32b',
      messages: [
  { role: 'system', content: 'You are a professional trading agent. Respond with 2-3 sentences only. No thinking, no preamble, no markdown. Just the explanation.' },
  { role: 'user', content: prompt }
],
      max_tokens: 150,
      temperature: 0.3
    });

    const raw = response.choices[0]?.message?.content || '';
const text = raw
  .replace(/<think>[\s\S]*?<\/think>/g, '')
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .trim();
    return text || signal.reason;
  } catch (err) {
    console.error(`[Reasoner] Groq API error: ${err.message}`);
    return signal.reason; // fallback to original reason
  }
}

module.exports = { generateReasoning };