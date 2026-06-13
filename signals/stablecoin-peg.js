const fetch = require('node-fetch');

async function checkStablecoinPeg() {
  try {
    const response = await fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const stablecoins = data.peggedAssets;

    const usdt = stablecoins.find(s => s.symbol === 'USDT');
    const usdc = stablecoins.find(s => s.symbol === 'USDC');

    const usdtPrice = usdt ? (usdt.price || 1.0) : 1.0;
    const usdcPrice = usdc ? (usdc.price || 1.0) : 1.0;
    const usdtDeviation = parseFloat((Math.abs(usdtPrice - 1.0) * 100).toFixed(4));
    const usdcDeviation = parseFloat((Math.abs(usdcPrice - 1.0) * 100).toFixed(4));

    console.log(`[Stablecoin] USDT: $${usdtPrice.toFixed(4)} | Deviation: ${usdtDeviation}%`);
    console.log(`[Stablecoin] USDC: $${usdcPrice.toFixed(4)} | Deviation: ${usdcDeviation}%`);

    return { usdtPrice, usdcPrice, usdtDeviation, usdcDeviation };
  } catch (error) {
    console.error(`[Stablecoin] Error: ${error.message}`);
    return { usdtPrice: 1.0, usdcPrice: 1.0, usdtDeviation: 0, usdcDeviation: 0 };
  }
}

module.exports = { checkStablecoinPeg };
