require('dotenv').config();
const http = require('http');
const { checkCurveTVL } = require('./signals/curve-tvl');
const { checkEthBtcRatio } = require('./signals/eth-btc-ratio');
const { checkStablecoinPeg } = require('./signals/stablecoin-peg');
const { checkFundingRateDivergence } = require('./signals/funding-rate');
const { makeTradeDecision } = require('./decider');
const { executeSignal } = require('./executor');
const { logNoAction } = require('./logger');

const CHECK_INTERVAL = 15 * 60 * 1000;
const TEST_MODE = process.argv.includes('--test');

if (TEST_MODE) {
  console.log('='.repeat(50));
  console.log('  HARUSPEX — TEST MODE (single cycle)');
  console.log('='.repeat(50));
} else {
  console.log('='.repeat(50));
  console.log('  HARUSPEX — DeFi-to-CEX Signal Agent');
  console.log('  Bitget Hackathon S1 — Track 1');
  console.log('  LLM-driven decisions via Qwen3.6-plus');
  console.log('  Checking every 15 minutes');
  console.log('='.repeat(50));
}

function pushToServer(data) {
  const body = JSON.stringify(data);
  const req = http.request({
    hostname: 'localhost', port: 3000,
    path: '/api/state', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

async function runSignalCycle() {
  console.log(`\n[${new Date().toISOString()}] Running signal cycle...`);

  // Collect raw market data from all 4 sources
  const [curveData, ethBtcData, stableData, fundingData] = await Promise.all([
    checkCurveTVL(),
    checkEthBtcRatio(),
    checkStablecoinPeg(),
    checkFundingRateDivergence()
  ]);

  // Push live state to dashboard
  pushToServer({
    ethBtcRatio: ethBtcData.ethBtcChange ?? null,
    ethBtcReason: `ETH $${ethBtcData.ethPrice} | BTC $${ethBtcData.btcPrice} | Ratio ${ethBtcData.ethBtcRatio?.toFixed(6)}`,
    fundingRate: fundingData.fundingRate ?? null,
    fundingReason: `BTC funding ${fundingData.fundingRate}% | TVL stable: ${fundingData.tvlStable}`,
    lastAgentPing: new Date().toISOString()
  });

  // Build unified market data object for LLM
  const marketData = {
    curveTVL: curveData.curveTVL,
    previousCurveTVL: curveData.previousCurveTVL,
    curveTVLChange: curveData.curveTVLChange,
    ethPrice: ethBtcData.ethPrice,
    btcPrice: ethBtcData.btcPrice,
    ethBtcRatio: ethBtcData.ethBtcRatio,
    ethBtcChange: ethBtcData.ethBtcChange,
    usdtDeviation: stableData.usdtDeviation,
    usdcDeviation: stableData.usdcDeviation,
    fundingRate: fundingData.fundingRate,
    tvlStable: fundingData.tvlStable
  };

  // Check max open positions
  const fs = require('fs');
  const allTrades = fs.readdirSync('./logs')
    .filter(f => f.startsWith('haruspex-') && f.endsWith('.json'))
    .flatMap(f => {
      try {
        const raw = fs.readFileSync(`./logs/${f}`, 'utf8').trim();
        return raw.startsWith('[') ? JSON.parse(raw) : [];
      } catch { return []; }
    });

  const openCount = allTrades.filter(t =>
    t.status === 'PAPER_TRADE_EXECUTED' && !t.closedAt
  ).length;

  if (openCount >= 3) {
    console.log(`[HARUSPEX] Max positions reached (${openCount} open) — skipping LLM decision`);
    logNoAction(`Max positions reached (${openCount} open) — agent monitoring`);
    return;
  }

  // LLM makes autonomous trade decision
  console.log(`[HARUSPEX] Consulting Qwen3.6-plus for trade decision...`);
  const decision = await makeTradeDecision(marketData);

  if (!decision.shouldTrade) {
    console.log(`[HARUSPEX] LLM: No trade — ${decision.reasoning}`);
    logNoAction(decision.reasoning || 'LLM decided no trade conditions met');
    return;
  }

  // Execute LLM decision
  console.log(`[HARUSPEX] LLM: TRADE — ${decision.action} ${decision.asset} (confidence: ${Math.round(decision.confidence * 100)}%)`);
  const signal = {
    fired: true,
    signal: decision.signal,
    confidence: decision.confidence,
    action: decision.action,
    assets: [decision.asset],
    primaryAsset: decision.asset,
    value: fundingData.fundingRate,
    reason: decision.reasoning,
    stopLoss: decision.stopLoss || 0.01,
    takeProfit: decision.takeProfit || 0.03
  };

  await executeSignal(signal);
}

async function main() {
  await runSignalCycle();
  if (TEST_MODE) {
    console.log('\n[HARUSPEX] Test cycle complete. Exiting.');
    await new Promise(r => setTimeout(r, 2000));
    process.exit(0);
  }
  setInterval(runSignalCycle, CHECK_INTERVAL);
  console.log(`\n[HARUSPEX] Agent running. Next check in 15 minutes.`);
  console.log('[HARUSPEX] Press Ctrl+C to stop.\n');
}

main().catch(err => {
  console.error('[HARUSPEX] Fatal error:', err);
  process.exit(1);
});
