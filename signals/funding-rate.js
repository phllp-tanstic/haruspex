const { execSync } = require('child_process');
const fetch = require('node-fetch');

function getFundingRate(symbol) {
  try {
    const output = execSync(
      `bgc futures futures_get_funding_rate --symbol ${symbol}USDT --productType USDT-FUTURES`,
      { encoding: 'utf8', timeout: 10000 }
    );
    const data = JSON.parse(output);
    if (data.data && data.data.currentFundRate && data.data.currentFundRate[0]) {
      return parseFloat(data.data.currentFundRate[0].fundingRate);
    }
    throw new Error('Unexpected response structure');
  } catch (error) {
    throw new Error(`Funding rate error: ${error.message}`);
  }
}

async function getCurveTVLStability() {
  try {
    const response = await fetch('https://api.llama.fi/tvl/curve-dex');
    if (!response.ok) return true;
    const tvl = await response.json();
    return tvl > 1_000_000_000;
  } catch { return true; }
}

async function checkFundingRateDivergence() {
  try {
    const fundingRate = getFundingRate('BTC');
    const tvlStable = await getCurveTVLStability();
    const fundingRatePct = parseFloat((fundingRate * 100).toFixed(6));

    console.log(`[Funding Rate] BTC: ${fundingRatePct}% | DeFi TVL stable: ${tvlStable}`);

    return { fundingRate: fundingRatePct, tvlStable };
  } catch (error) {
    console.error(`[Funding Rate] Error: ${error.message}`);
    return { fundingRate: 0, tvlStable: true };
  }
}

module.exports = { checkFundingRateDivergence };
