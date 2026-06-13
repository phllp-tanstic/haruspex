const { execSync } = require('child_process');

let previousRatio = null;

function getBitgetPrice(symbol) {
  try {
    const output = execSync(`bgc spot spot_get_ticker --symbol ${symbol}`, {
      encoding: 'utf8', timeout: 10000
    });
    const data = JSON.parse(output);
    if (data.data && data.data[0]) return parseFloat(data.data[0].lastPr);
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

    let changePct = 0;
    if (previousRatio !== null) {
      changePct = parseFloat(((currentRatio - previousRatio) / previousRatio * 100).toFixed(4));
    }
    previousRatio = currentRatio;

    console.log(`[ETH/BTC] ETH: $${ethPrice.toFixed(2)} | BTC: $${btcPrice.toFixed(2)} | Ratio: ${currentRatio.toFixed(6)} | Change: ${changePct}%`);

    return {
      ethPrice,
      btcPrice,
      ethBtcRatio: currentRatio,
      ethBtcChange: changePct
    };
  } catch (error) {
    console.error(`[ETH/BTC] Error: ${error.message}`);
    return { ethPrice: null, btcPrice: null, ethBtcRatio: null, ethBtcChange: 0 };
  }
}

module.exports = { checkEthBtcRatio };
