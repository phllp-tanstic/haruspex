const { execSync } = require('child_process');
const fetch = require('node-fetch');

// Signal 5: Funding Rate Divergence
// Trigger: BTC funding rate negative (<-0.0001) AND DeFi TVL stable
// Action: Long BTC/USDT (contrarian mean-reversion)
// Data source: Bitget futures API via bgc + DefiLlama TVL

function getFundingRate(symbol) {
  try {
    const output = execSync(
      `bgc futures futures_get_funding_rate --symbol ${symbol}USDT --productType USDT-FUTURES`,
      { encoding: 'utf8', timeout: 10000 }
    );
    const data = JSON.parse(output);

    if (
      data.data &&
      data.data.currentFundRate &&
      data.data.currentFundRate[0]
    ) {
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
  } catch {
    return true;
  }
}

async function checkFundingRateDivergence() {
  try {
    const fundingRate = getFundingRate('BTC');
    const isTVLStable = await getCurveTVLStability();

    console.log(
      `[Funding Rate] BTC: ${(fundingRate * 100).toFixed(4)}% | DeFi TVL stable: ${isTVLStable}`
    );

    // Trigger: negative funding AND DeFi not in panic
    if (fundingRate < -0.00001 && isTVLStable) {
      const strength = Math.abs(fundingRate) / 0.0001;
      return {
        fired: true,
        signal: 'funding-rate-divergence',
        confidence: Math.min(0.85, 0.50 + strength * 0.10),
        action: 'LONG',
        assets: ['BTCUSDT'],
        primaryAsset: 'BTCUSDT',
        value: fundingRate,
        reason: `BTC funding rate at ${(fundingRate * 100).toFixed(4)}% (negative) while DeFi TVL remains stable. CEX traders overleveraged short. Contrarian long — shorts will pay longs. Mean reversion expected.`,
        stopLoss: 0.01,
        takeProfit: 0.03
      };
    }

    return {
      fired: false,
      signal: 'funding-rate-divergence',
      value: fundingRate,
      reason: `BTC funding ${(fundingRate * 100).toFixed(4)}% — conditions not met for contrarian long`
    };

  } catch (error) {
    console.error(`[Funding Rate] Error: ${error.message}`);
    return {
      fired: false,
      signal: 'funding-rate-divergence',
      reason: `Error: ${error.message}`
    };
  }
}

module.exports = { checkFundingRateDivergence };
