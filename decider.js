require('dotenv').config();
const https = require('https');

async function makeTradeDecision(marketData) {
  try {
    const recentContext = marketData.recentTrades && marketData.recentTrades.length > 0
      ? marketData.recentTrades.map(t =>
          `${t.side === 'buy' ? 'LONG' : 'SHORT'} → ${t.closeReason} (${t.pnlPercent}%)`
        ).join(', ')
      : 'No recent trades';

    const prompt = `You are Haruspex, an autonomous DeFi-to-CEX trading agent. Analyze the following live market data and decide whether to place a trade.

LIVE MARKET DATA — 6 SIGNALS:

[SIGNAL 1 — DeFi Liquidity]
- Curve Finance TVL: $${marketData.curveTVL ? (marketData.curveTVL / 1e9).toFixed(2) + 'B' : 'unavailable'}
- TVL Change: ${marketData.curveTVLChange ?? 0}%
- Interpretation: Sharp drop >2% = DeFi deleveraging, systemic stress

[SIGNAL 2 — Stablecoin Peg Stability]
- USDT Deviation: ${marketData.usdtDeviation ?? 0}%
- USDC Deviation: ${marketData.usdcDeviation ?? 0}%
- Interpretation: Depeg >0.1% = panic. Depeg >0.3% = severe systemic risk.

[SIGNAL 3 — DEX vs CEX Volume Ratio]
- Uniswap V3 24h: $${marketData.uniswapVolume ?? 'unavailable'}M
- Bitget ETH 24h: $${marketData.bitgetEthVolume ?? 'unavailable'}M
- DEX/CEX Ratio: ${marketData.dexCexRatio?.toFixed(3) ?? 'unavailable'}
- Interpretation: Ratio >2.0 = DeFi rotation, precedes CEX volatility. Ratio <1.0 = CEX dominance.

[SIGNAL 4 — BTC Perpetual Funding Rate]
- Funding Rate: ${marketData.fundingRate ?? 0}%
- Interpretation: Negative = shorts overcrowded. Positive = longs overcrowded.

[SIGNAL 5 — BTC Open Interest]
- Open Interest: ${marketData.openInterest ? marketData.openInterest.toFixed(0) + ' BTC' : 'unavailable'}
- OI Change: ${marketData.openInterestChange ?? 0}%
- Interpretation: OI spike >5% while TVL drops = CEX leverage divergence from DeFi.

[SIGNAL 6 — BTC Price Momentum]
- BTC 24h Change: ${marketData.btcChange24h ?? 0}%
- Interpretation: Negative = bearish. Positive = bullish. This is the primary direction gate.

[RECENT TRADE CONTEXT]
- Last 3 closed trades: ${recentContext}
- Use this to detect ranging markets. If all recent trades hit stop loss in the same direction, that direction is ranging not trending.

DECISION RULES — APPLY IN ORDER:

STEP 1 — HARD FUNDING RULES (cannot be overridden):
- fundingRate > +0.002%: LONG is FORBIDDEN. Market is overcrowded long.
- fundingRate < -0.002%: SHORT is FORBIDDEN. Market is overcrowded short.

STEP 2 — MOMENTUM GATE (primary direction filter):
- btcChange24h negative: SHORT only. LONG blocked.
- btcChange24h positive: LONG only. SHORT blocked.
- btcChange24h near zero (-0.1% to +0.1%): no directional edge, do not trade.

STEP 3 — STALENESS CHECK:
- If curveTVLChange is 0% AND openInterestChange is 0% AND fundingRate is between -0.003% and +0.003%: all macro signals are static.
- In a static macro environment, only trade if DEX/CEX ratio is above 2.8 or below 1.2.
- Otherwise do not trade — no fresh signal edge exists.

STEP 4 — REPETITION CHECK:
- If all 3 recent trades hit STOP_LOSS_HIT in the same direction as your intended trade: reduce confidence by 0.20.
- If confidence drops below 0.70 after this reduction: do not trade.
- Consecutive stop losses in one direction = market is ranging, not trending.

STEP 5 — CONFIDENCE SCORING:
- High (0.75-0.85): momentum + funding agree + DEX/CEX >2.5 + no recent SL streak
- Medium (0.70-0.74): momentum clear + one other signal confirms + no recent SL streak
- Below 0.70: do not trade

STEP 6 — CONVERGENCE REQUIREMENT:
- Minimum 2 signals must point the same direction to trade.
- DEX/CEX ratio alone is not sufficient without momentum or funding confirmation.

Respond ONLY with valid JSON, no markdown, no preamble, no thinking tags:
{
  "shouldTrade": true or false,
  "action": "LONG" or "SHORT" or null,
  "asset": "BTCUSDT" or "ETHUSDT" or null,
  "confidence": 0.0 to 1.0,
  "signal": "open-interest-divergence" or "stablecoin-depeg" or "funding-rate-squeeze" or "dex-cex-rotation" or "curve-tvl-stress" or "multi-signal-convergence" or null,
  "reasoning": "2-3 sentences referencing specific signal values and which rules were applied",
  "stopLoss": 0.012,
  "takeProfit": 0.024
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