const fetch = require('node-fetch');
const { execSync } = require('child_process');

// Signal: DEX vs CEX Volume Divergence
// Compares Uniswap V3 24h ETH volume against Bitget ETH spot volume
// When DEX volume spikes relative to CEX — traders moving to DeFi
// This is a pure cross-environment signal unique to Haruspex

async function checkDexCexDivergence() {
  try {
    // DEX side — Uniswap V3 total 24h volume from DefiLlama
    const dexResponse = await fetch(
      'https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume'
    );
    if (!dexResponse.ok) throw new Error(`DefiLlama HTTP ${dexResponse.status}`);
    const dexData = await dexResponse.json();

    // Get Ethereum-only Uniswap V3 volume (most relevant for ETH/DeFi thesis)
    const uniV3 = dexData.protocols.find(p => p.name === 'Uniswap V3');
    if (!uniV3) throw new Error('Uniswap V3 not found in DefiLlama response');

    const uniswapTotal24h = uniV3.total24h || 0;
    const uniswapEth24h = uniV3.breakdown24h?.ethereum?.['Uniswap V3'] || 0;
    const uniswapChange1d = uniV3.change_1d || 0;

    // CEX side — Bitget ETH spot 24h volume via bgc
    let bitgetEthVolume = null;
    try {
      const output = execSync(
        'bgc spot spot_get_ticker --symbol ETHUSDT',
        { encoding: 'utf8', timeout: 10000 }
      );
      const tickerData = JSON.parse(output);
      if (tickerData.data && tickerData.data[0]) {
        // usdtVolume is the 24h volume in USDT terms
        bitgetEthVolume = parseFloat(tickerData.data[0].usdtVolume || tickerData.data[0].quoteVolume || 0);
      }
    } catch (err) {
      console.error(`[DEX/CEX] Bitget volume error: ${err.message}`);
    }

    // Calculate divergence ratio
    const dexCexRatio = bitgetEthVolume && bitgetEthVolume > 0
      ? parseFloat((uniswapTotal24h / bitgetEthVolume).toFixed(4))
      : null;

    console.log(`[DEX/CEX] Uniswap V3 24h: $${(uniswapTotal24h / 1e6).toFixed(1)}M | ETH chain: $${(uniswapEth24h / 1e6).toFixed(1)}M | Change: ${uniswapChange1d}%`);
    console.log(`[DEX/CEX] Bitget ETH 24h: $${bitgetEthVolume ? (bitgetEthVolume / 1e6).toFixed(1) + 'M' : 'unavailable'} | DEX/CEX Ratio: ${dexCexRatio ?? 'N/A'}`);

    return {
      uniswapTotal24h,
      uniswapEth24h,
      uniswapChange1d,
      bitgetEthVolume,
      dexCexRatio
    };
  } catch (error) {
    console.error(`[DEX/CEX] Error: ${error.message}`);
    return {
      uniswapTotal24h: null,
      uniswapEth24h: null,
      uniswapChange1d: null,
      bitgetEthVolume: null,
      dexCexRatio: null
    };
  }
}

module.exports = { checkDexCexDivergence };