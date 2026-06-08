exports.handler = async (event) => {
  const { endpoint } = event.queryStringParameters || {};

  const urls = {
    ethusdt: 'https://api.bitget.com/api/v2/spot/market/tickers?symbol=ETHUSDT',
    btcusdt: 'https://api.bitget.com/api/v2/spot/market/tickers?symbol=BTCUSDT',
    funding: 'https://api.bitget.com/api/v2/mix/market/current-fund-rate?symbol=BTCUSDT&productType=USDT-FUTURES'
  };

  if (!urls[endpoint]) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid endpoint' }) };
  }

  try {
    const res = await fetch(urls[endpoint]);
    const data = await res.json();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};