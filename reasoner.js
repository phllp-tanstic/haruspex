require('dotenv').config();
const https = require('https');

async function generateReasoning(signal) {
  try {
    const prompt = `You are Haruspex, an autonomous DeFi-to-CEX trading agent. Write exactly 2-3 sentences explaining this trade. Be specific about numbers. No markdown.

Signal: ${signal.signal}
Action: ${signal.action} ${signal.primaryAsset}
Value: ${signal.value}
Confidence: ${Math.round(signal.confidence * 100)}%
Context: ${signal.reason}`;

    const body = JSON.stringify({
      model: 'qwen3.6-plus',
      messages: [
        {
          role: 'system',
          content: 'You are a professional trading agent. Respond with 2-3 plain sentences only. No markdown, no bold text.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'hackathon.bitgetops.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            console.error('[Reasoner] Raw response:', data.substring(0, 200));
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    const raw = response.choices[0]?.message?.content || '';
    const text = raw
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .trim();

    return text || signal.reason;
  } catch (err) {
    console.error(`[Reasoner] Qwen API error: ${err.message}`);
    return signal.reason;
  }
}

module.exports = { generateReasoning };