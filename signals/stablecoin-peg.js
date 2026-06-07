const fetch = require('node-fetch');

// Signal 3: Stablecoin Depeg Alert
// Trigger: USDT or USDC deviates >0.04% from $1.00
// Action: Short BTC/USDT + ETH/USDT (systemic panic signal)
// Data source: DefiLlama stablecoins API (free, no auth)

async function checkStablecoinPeg() {
  try {
    const response = await fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const stablecoins = data.peggedAssets;

    // Find USDT and USDC
    const targets = ['USDT', 'USDC'];
    const results = [];

    for (const symbol of targets) {
      const coin = stablecoins.find(s => s.symbol === symbol);
      if (!coin) continue;

      const price = coin.price || 1.0;
      const deviation = Math.abs(price - 1.0);
      const deviationPct = (deviation * 100).toFixed(3);

      console.log(`[Stablecoin] ${symbol}: $${price.toFixed(4)} | Deviation: ${deviationPct}%`);

      if (deviation > 0.0004) {
        results.push({
          symbol,
          price,
          deviation,
          deviationPct: parseFloat(deviationPct)
        });
      }
    }

    if (results.length > 0) {
      const worst = results.sort((a, b) => b.deviation - a.deviation)[0];
      return {
        fired: true,
        signal: 'stablecoin-depeg',
        confidence: Math.min(0.98, 0.70 + worst.deviation * 50),
        action: 'SHORT',
        assets: ['BTCUSDT', 'ETHUSDT'],
        primaryAsset: 'BTCUSDT',
        value: worst.deviationPct,
        reason: `${worst.symbol} depegged to $${worst.price.toFixed(4)} — ${worst.deviationPct}% deviation from $1.00. Systemic risk signal. Shorting BTC and ETH aggressively.`,
        stopLoss: 0.03,
        takeProfit: 0.08
      };
    }

    return {
      fired: false,
      signal: 'stablecoin-depeg',
      reason: `USDT and USDC pegs stable — no deviation above 0.04%`
    };

  } catch (error) {
    console.error(`[Stablecoin] Error: ${error.message}`);
    return { fired: false, signal: 'stablecoin-depeg', reason: `API error: ${error.message}` };
  }
}

module.exports = { checkStablecoinPeg };
