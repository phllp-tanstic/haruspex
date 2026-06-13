const fetch = require('node-fetch');

let previousTVL = null;

async function checkCurveTVL() {
  try {
    const response = await fetch('https://api.llama.fi/tvl/curve-dex');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const currentTVL = await response.json();
    if (typeof currentTVL !== 'number') throw new Error('Unexpected TVL format');

    let changePct = 0;
    if (previousTVL !== null) {
      changePct = parseFloat(((currentTVL - previousTVL) / previousTVL * 100).toFixed(2));
    }
    const previousTVLSnapshot = previousTVL;
    previousTVL = currentTVL;

    console.log(`[Curve TVL] Current: $${(currentTVL / 1e9).toFixed(2)}B | Change: ${changePct}%`);

    return {
      curveTVL: currentTVL,
      previousCurveTVL: previousTVLSnapshot,
      curveTVLChange: changePct
    };
  } catch (error) {
    console.error(`[Curve TVL] Error: ${error.message}`);
    return { curveTVL: null, previousCurveTVL: null, curveTVLChange: 0 };
  }
}

module.exports = { checkCurveTVL };
