require('dotenv').config();
const https = require('https');

async function makeTradeDecision(marketData) {
  try {
    const prompt = `You are Haruspex, an autonomous DeFi-to-CEX trading agent. Analyze the following live market data and decide whether to place a trade.

LIVE MARKET DATA:
- Curve Finance TVL: $${marketData.curveTVL ? (marketData.curveTVL / 1e9).toFixed(2) + 'B' : 'unavailable'} (change: ${marketData.curveTVLChange ?? 0}%)
- ETH Price: $${marketData.ethPrice ?? 'unavailable'}
- BTC Price: $${marketData.btcPrice ?? 'unavailable'}
- ETH/BTC Ratio: ${marketData.ethBtcRatio ?? 'unavailable'} (change: ${marketData.ethBtcChange ?? 0}%)
- USDT Peg Deviation: ${marketData.usdtDeviation ?? 0}% from $1.00
- USDC Peg Deviation: ${marketData.usdcDeviation ?? 0}% from $1.00
- BTC Perpetual Funding Rate: ${marketData.fundingRate ?? 0}%
- DeFi TVL Stability: ${marketData.tvlStable ? 'Stable above $1B' : 'Unstable'}

YOUR DECISION FRAMEWORK:
- Negative funding rate + stable TVL = shorts overleveraged → consider LONG BTC
- Stablecoin depeg + DeFi stress = systemic risk → consider SHORT BTC/ETH
- ETH/BTC ratio dropping = capital rotating to BTC → consider SHORT ETH, LONG BTC
- Curve TVL dropping sharply = DeFi liquidity stress → consider SHORT ETH
- When signals conflict, weigh them together and decide the dominant thesis
- When no clear edge exists, do NOT trade

Respond ONLY with a valid JSON object, no other text, no markdown:
{
  "shouldTrade": true or false,
  "action": "LONG" or "SHORT" or null,
  "asset": "BTCUSDT" or "ETHUSDT" or null,
  "confidence": 0.0 to 1.0,
  "signal": "funding-rate-divergence" or "stablecoin-depeg" or "eth-btc-ratio" or "curve-tvl" or null,
  "reasoning": "2-3 sentence explanation of your decision referencing specific numbers",
  "stopLoss": 0.01 to 0.03,
  "takeProfit": 0.02 to 0.08
}`;

    const body = JSON.stringify({
      model: 'qwen3.6-plus',
      messages: [
        {
          role: 'system',
          content: 'You are an autonomous trading agent. You must respond with valid JSON only. No markdown, no explanation outside the JSON, no thinking tags in output.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.2
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
          try { resolve(JSON.parse(data)); }
          catch (e) {
            console.error('[Decider] Raw response:', data.substring(0, 300));
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    const raw = response.choices[0]?.message?.content || '';
    const cleaned = raw
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const decision = JSON.parse(cleaned);
    console.log(`[Decider] shouldTrade: ${decision.shouldTrade} | ${decision.reasoning}`);
    return decision;

  } catch (err) {
    console.error(`[Decider] Error: ${err.message}`);
    return { shouldTrade: false, reasoning: `Decider error: ${err.message}` };
  }
}

module.exports = { makeTradeDecision };