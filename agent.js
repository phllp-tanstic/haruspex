require('dotenv').config();
const http = require('http');
const { checkCurveTVL } = require('./signals/curve-tvl');
const { checkEthBtcRatio } = require('./signals/eth-btc-ratio');
const { checkStablecoinPeg } = require('./signals/stablecoin-peg');
const { checkFundingRateDivergence } = require('./signals/funding-rate');
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
  console.log('  Bitget Hackathon S1 — Track 3');
  console.log('  Checking signals every 15 minutes');
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
  const signals = await Promise.allSettled([
    checkCurveTVL(),
    checkEthBtcRatio(),
    checkStablecoinPeg(),
    checkFundingRateDivergence()
  ]);
  const results = signals.map(s =>
    s.status === 'fulfilled' ? s.value : { fired: false, reason: s.reason?.message }
  );

  const ethBtcResult = results[1];
  const fundingResult = results[3];
  pushToServer({
    ethBtcRatio: ethBtcResult.value ?? null,
    ethBtcReason: ethBtcResult.reason ?? null,
    fundingRate: fundingResult.value ?? null,
    fundingReason: fundingResult.reason ?? null,
    lastAgentPing: new Date().toISOString()
  });

  const firedSignals = results.filter(r => r.fired);
  if (firedSignals.length === 0) {
    logNoAction(`All ${results.length} signals checked — no thresholds crossed`);
    return;
  }
  // Check open position count before executing
  const allTrades = require('fs').readdirSync('./logs')
    .filter(f => f.startsWith('haruspex-') && f.endsWith('.json'))
    .flatMap(f => {
      try {
        const raw = require('fs').readFileSync(`./logs/${f}`, 'utf8').trim();
        return raw.startsWith('[') ? JSON.parse(raw) : [];
      } catch { return []; }
    });
  const openCount = allTrades.filter(t =>
    t.status === 'PAPER_TRADE_EXECUTED' && !t.closedAt
  ).length;

  if (openCount >= 3) {
    console.log(`[HARUSPEX] Max positions reached (${openCount} open) — skipping execution`);
    return;
  }

  

  console.log(`\n[HARUSPEX] ${firedSignals.length} signal(s) fired!`);
  firedSignals.sort((a, b) => b.confidence - a.confidence);
  for (const signal of firedSignals) {
    console.log(`\n[HARUSPEX] Executing: ${signal.signal} (confidence: ${(signal.confidence * 100).toFixed(0)}%)`);
    await executeSignal(signal);
    await new Promise(r => setTimeout(r, 2000));
  }
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
