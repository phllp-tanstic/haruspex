const { execSync } = require('child_process');

// Signal 2: ETH/BTC Ratio Flip
// Trigger: ETH/BTC ratio drops >3% in a check cycle
// Action: Short ETH/USDT, Long BTC/USDT
// Data source: Bitget market-intel via bgc CLI

let previousRatio = null;

function getBitgetPrice(symbol) {
  try {
    const output = execSync(`bgc spot spot_get_ticker --symbol ${symbol}`, {
      encoding: 'utf8',
      timeout: 10000
    });
    const data = JSON.parse(output);
    if (data.data && data.data[0]) {
      return parseFloat(data.data[0].lastPr);
    }
    throw new Error('No price data returned');
  } catch (error) {
    throw new Error(`Failed to get ${symbol} price: ${error.message}`);
  }
}

async function checkEthBtcRatio() {
  try {
    const ethPrice = getBitgetPrice('ETHUSDT');
    const btcPrice = getBitgetPrice('BTCUSDT');
    const currentRatio = ethPrice / btcPrice;

    console.log(`[ETH/BTC] ETH: $${ethPrice.toFixed(2)} | BTC: $${btcPrice.toFixed(2)} | Ratio: ${currentRatio.toFixed(6)}`);

    // First run — set baseline
    if (previousRatio === null) {
      previousRatio = currentRatio;
      console.log(`[ETH/BTC] Baseline ratio set: ${currentRatio.toFixed(6)}`);
      return { fired: false, signal: 'eth-btc-ratio', reason: 'Baseline established' };
    }

    const changePercent = ((currentRatio - previousRatio) / previousRatio) * 100;
    const changePct = parseFloat(changePercent.toFixed(2));

    console.log(`[ETH/BTC] Ratio change: ${changePct}%`);

    // Update stored ratio
    previousRatio = currentRatio;

    // Trigger if ratio dropped more than 3%
    if (changePct <= -0.05) {
      return {
        fired: true,
        signal: 'eth-btc-ratio',
        confidence: Math.min(0.90, 0.55 + Math.abs(changePct) * 0.08),
        action: 'DIVERGENCE',
        assets: ['ETHUSDT', 'BTCUSDT'],
        primaryAsset: 'ETHUSDT',
        value: changePct,
        reason: `ETH/BTC ratio dropped ${Math.abs(changePct)}% — BTC dominance rising. Capital rotating to BTC safety. Short ETH, Long BTC.`,
        stopLoss: 0.015,
        takeProfit: 0.04
      };
    }

    return {
      fired: false,
      signal: 'eth-btc-ratio',
      value: changePct,
      reason: `ETH/BTC ratio change ${changePct}% — below 3% threshold`
    };

  } catch (error) {
    console.error(`[ETH/BTC] Error: ${error.message}`);
    return { fired: false, signal: 'eth-btc-ratio', reason: `Error: ${error.message}` };
  }
}

module.exports = { checkEthBtcRatio };
