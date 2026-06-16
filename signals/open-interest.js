const { execSync } = require('child_process');

let previousOpenInterest = null;

async function checkOpenInterest() {
  try {
    const output = execSync(
      'bgc futures futures_get_open_interest --productType USDT-FUTURES --symbol BTCUSDT',
      { encoding: 'utf8', timeout: 15000, windowsHide: true }
    );

    const data = JSON.parse(output);

    if (!data.data?.openInterestList?.[0]?.size) {
      throw new Error('Unexpected structure: ' + JSON.stringify(data).substring(0, 200));
    }

    const currentOI = parseFloat(data.data.openInterestList[0].size);

    let oiChange = 0;
    if (previousOpenInterest !== null) {
      oiChange = parseFloat(((currentOI - previousOpenInterest) / previousOpenInterest * 100).toFixed(2));
    }
    previousOpenInterest = currentOI;

    console.log('[Open Interest] BTC OI: ' + currentOI.toFixed(2) + ' BTC | Change: ' + oiChange + '%');
    return { openInterest: currentOI, openInterestChange: oiChange };

  } catch (error) {
    console.error('[Open Interest] Error: ' + error.message);
    return { openInterest: null, openInterestChange: 0 };
  }
}

module.exports = { checkOpenInterest };