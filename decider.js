require('dotenv').config();
const https = require('https');

async function makeTradeDecision(marketData) {
  try {
    const prompt = `You are Haruspex, an autonomous DeFi-to-CEX trading agent. Analyze the following live market data across five cross-environment signals and decide whether to place a trade.

LIVE MARKET DATA — 5 SIGNALS:

[SIGNAL 1 — DeFi Liquidity]
- Curve Finance TVL: $${marketData.curveTVL ? (marketData.curveTVL / 1e9).toFixed(2) + 'B' : 'unavailable'}
- TVL Change: ${marketData.curveTVLChange ?? 0}%
- Interpretation: A sharp drop (>2%) signals DeFi deleveraging and systemic liquidity stress

[SIGNAL 2 — Stablecoin Peg Stability]
- USDT Deviation from $1.00: ${marketData.usdtDeviation ?? 0}%
- USDC Deviation from $1.00: ${marketData.usdcDeviation ?? 0}%
- Interpretation: Depeg >0.1% signals panic/systemic stress. Depeg >0.3% is severe.

[SIGNAL 3 — DEX vs CEX Volume Divergence]
- Uniswap V3 24h Volume: $${marketData.uniswapVolume ?? 'unavailable'}M
- Bitget ETH 24h Volume: $${marketData.bitgetEthVolume ?? 'unavailable'}M
- DEX/CEX Ratio: ${marketData.dexCexRatio?.toFixed(3) ?? 'unavailable'}
- Interpretation: Ratio >2.0 = traders rotating to DeFi, precedes CEX volatility. Ratio <1.0 = CEX dominance, trend continuation likely.

[SIGNAL 4 — BTC Perpetual Funding Rate]
- Current Funding Rate: ${marketData.fundingRate ?? 0}%
- Interpretation: Negative rate = overleveraged shorts = squeeze risk → LONG bias. Positive rate >0.05% = overleveraged longs = flush risk → SHORT bias.
- BTC 24h Price Change: ${marketData.btcChange24h ?? 'unavailable'}%
- Interpretation: Negative = bearish momentum, positive = bullish momentum. Use this to confirm directional bias.

[SIGNAL 6 — BTC Price Momentum]
- BTC 24h Price Change: ${marketData.btcChange24h ?? 0}%
- Interpretation: Negative = bearish momentum. Positive = bullish momentum. Use to confirm trade direction.

[SIGNAL 5 — BTC Open Interest]
- Current Open Interest: ${marketData.openInterest ? marketData.openInterest.toFixed(0) + ' BTC' : 'unavailable'}
- OI Change: ${marketData.openInterestChange ?? 0}%
- Interpretation: OI spike (+5%+) while DeFi TVL drops = leverage building on CEX as DeFi deleverages. High-conviction divergence signal.

CROSS-SIGNAL THESIS FRAMEWORK:
- OI rising + TVL dropping + negative funding = extreme short squeeze setup → LONG BTC (high confidence)
- Stablecoin depeg + TVL drop + DEX/CEX ratio spike = systemic DeFi stress → SHORT BTC/ETH
- DEX/CEX ratio spike alone = rotation signal, requires confirmation from funding rate OR momentum
- When funding rate is NEGATIVE (below -0.001%), shorts are dominant → LONG bias correct
- When funding rate is POSITIVE (above +0.001%), longs are crowded → SHORT bias correct
- When funding rate is between -0.001% and +0.001%, it is NOISE — ignore it entirely

MOMENTUM RULES (these override funding bias when in conflict):
- When btcChange24h is NEGATIVE (any value below 0): SHORT is always valid. LONG is blocked.
- When btcChange24h is POSITIVE (any value above 0): LONG is always valid. SHORT is blocked.
- When funding conflicts with momentum: IGNORE funding, follow momentum direction.
- Example: funding negative (LONG bias) + momentum negative = open SHORT, not LONG, not no-trade.
- Example: funding positive (SHORT bias) + momentum positive = open LONG, not SHORT, not no-trade.

CONFIDENCE LEVELS:
- High (0.70-0.85): momentum + funding AGREE on direction + DEX/CEX >2.0
- Medium (0.55-0.65): momentum alone is clear + any one other signal confirms
- Low (below 0.55): do not trade

DO NOT park when signals conflict. Momentum is the tiebreaker. Always resolve to a direction.
Only park when ALL signals are noise (funding in noise zone AND momentum near 0 AND DEX/CEX <1.5).

Respond ONLY with valid JSON, no markdown, no preamble, no thinking tags:
{
  "shouldTrade": true or false,
  "action": "LONG" or "SHORT" or null,
  "asset": "BTCUSDT" or "ETHUSDT" or null,
  "confidence": 0.0 to 1.0,
  "signal": "open-interest-divergence" or "stablecoin-depeg" or "funding-rate-squeeze" or "dex-cex-rotation" or "curve-tvl-stress" or "multi-signal-convergence" or null,
  "reasoning": "2-3 sentences referencing specific signal values that drove this decision",
  "stopLoss": 0.005,
  "takeProfit": 0.01
}`;

    const body = JSON.stringify({
      model: 'qwen3.6-plus',
      messages: [
        {
          role: 'system',
          content: 'You are an autonomous trading agent. Respond with valid JSON only. No markdown, no explanation outside the JSON, no thinking tags.'
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
    console.log(`[Decider] shouldTrade=${decision.shouldTrade} | signal=${decision.signal} | confidence=${decision.confidence}`);
    console.log(`[Decider] Reasoning: ${decision.reasoning}`);
    return decision;

  } catch (err) {
    console.error(`[Decider] Error: ${err.message}`);
    return { shouldTrade: false, reasoning: `Decider error: ${err.message}` };
  }
}

module.exports = { makeTradeDecision };