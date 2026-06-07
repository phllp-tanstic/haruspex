const fetch = require('node-fetch');

// Signal 1: Curve Finance TVL Drop
// Trigger: TVL drops >5% in a single check cycle
// Action: Short ETH/USDT + CRV/USDT
// Data source: DefiLlama API (free, no auth)
// Correct slug confirmed: curve-dex

let previousTVL = null;

async function checkCurveTVL() {
  try {
    const response = await fetch('https://api.llama.fi/tvl/curve-dex');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const currentTVL = await response.json();

    if (typeof currentTVL !== 'number') {
      throw new Error(`Unexpected TVL format: ${JSON.stringify(currentTVL)}`);
    }

    // First run — set baseline
    if (previousTVL === null) {
      previousTVL = currentTVL;
      console.log(`[Curve TVL] Baseline set: $${(currentTVL / 1e9).toFixed(2)}B`);
      return {
        fired: false,
        signal: 'curve-tvl',
        reason: 'Baseline established'
      };
    }

    const changePercent = ((currentTVL - previousTVL) / previousTVL) * 100;
    const changePct = parseFloat(changePercent.toFixed(2));

    console.log(
      `[Curve TVL] Current: $${(currentTVL / 1e9).toFixed(2)}B | ` +
      `Previous: $${(previousTVL / 1e9).toFixed(2)}B | ` +
      `Change: ${changePct}%`
    );

    // Update stored value
    previousTVL = currentTVL;

    // Trigger if TVL dropped more than 5%
    if (changePct <= -5) {
      return {
        fired: true,
        signal: 'curve-tvl',
        confidence: Math.min(0.95, 0.60 + Math.abs(changePct) * 0.01),
        action: 'SHORT',
        assets: ['ETHUSDT', 'CRVUSDT'],
        primaryAsset: 'ETHUSDT',
        value: changePct,
        reason: `Curve Finance TVL dropped ${Math.abs(changePct)}% — from $${(previousTVL / 1e9).toFixed(2)}B to $${(currentTVL / 1e9).toFixed(2)}B. Stablecoin liquidity flight detected. Risk-off signal. Shorting ETH and CRV.`,
        stopLoss: 0.02,
        takeProfit: 0.01
      };
    }

    return {
      fired: false,
      signal: 'curve-tvl',
      value: changePct,
      reason: `Curve TVL change ${changePct}% — below 5% threshold. TVL: $${(currentTVL / 1e9).toFixed(2)}B`
    };

  } catch (error) {
    console.error(`[Curve TVL] Error: ${error.message}`);
    return {
      fired: false,
      signal: 'curve-tvl',
      reason: `API error: ${error.message}`
    };
  }
}

module.exports = { checkCurveTVL };
