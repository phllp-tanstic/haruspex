require('dotenv').config();
const fs = require('fs');
const http = require('http');
const https = require('https');
const { checkCurveTVL } = require('./signals/curve-tvl');
const { checkStablecoinPeg } = require('./signals/stablecoin-peg');
const { checkFundingRateDivergence } = require('./signals/funding-rate');
const { checkDexCexDivergence } = require('./signals/dex-cex-volume');
const { checkOpenInterest } = require('./signals/open-interest');
const { makeTradeDecision } = require('./decider');
const { executeSignal } = require('./executor');
const { logNoAction } = require('./logger');

const CHECK_INTERVAL = 5 * 60 * 1000;
const TEST_MODE = process.argv.includes('--test');
const LOG_DIR = './logs';
const MIN_CONFIDENCE = 0.70;
const MAX_POSITIONS = 2;

if (TEST_MODE) {
  console.log('='.repeat(50));
  console.log('  HARUSPEX — TEST MODE (single cycle)');
  console.log('='.repeat(50));
} else {
  console.log('='.repeat(50));
  console.log('  HARUSPEX — DeFi-to-CEX Signal Agent v2.1');
  console.log('  Bitget Hackathon S1 — Track 1');
  console.log('  6-Signal LLM Engine via Qwen3.6-plus');
  console.log('  Checking every 5 minutes');
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

function getRecentTrades() {
  try {
    let all = [];
    fs.readdirSync(LOG_DIR)
      .filter(f => f.startsWith('haruspex-') && f.endsWith('.json'))
      .forEach(f => {
        try { all = all.concat(JSON.parse(fs.readFileSync(`${LOG_DIR}/${f}`, 'utf8'))); }
        catch {}
      });
    return all
      .filter(t => t.closedAt && t.closeReason &&
        !['MANUAL_CLOSE', 'manual-reset', 'MANUAL_CLOSE_FOR_LLM_RESET'].some(r => t.closeReason.includes(r)))
      .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))
      .slice(0, 3)
      .map(t => ({
        side: t.side,
        closeReason: t.closeReason,
        pnlPercent: t.pnlPercent
      }));
  } catch { return []; }
}

function getOpenCount() {
  try {
    let all = [];
    fs.readdirSync(LOG_DIR)
      .filter(f => f.startsWith('haruspex-') && f.endsWith('.json'))
      .forEach(f => {
        try {
          const raw = fs.readFileSync(`${LOG_DIR}/${f}`, 'utf8').trim();
          if (raw.startsWith('[')) all = all.concat(JSON.parse(raw));
        } catch {}
      });
    return all.filter(t => t.status === 'PAPER_TRADE_EXECUTED' && !t.closedAt).length;
  } catch { return 0; }
}

async function runSignalCycle() {
  console.log(`\n[${new Date().toISOString()}] Running 6-signal cycle...`);

  // ── Collect all signals in parallel ──────────────────────
  const [curveData, stableData, fundingData, dexCexData, oiData] = await Promise.all([
    checkCurveTVL().catch(e => { console.error('[agent] curve-tvl failed:', e.message); return {}; }),
    checkStablecoinPeg().catch(e => { console.error('[agent] stablecoin-peg failed:', e.message); return {}; }),
    checkFundingRateDivergence().catch(e => { console.error('[agent] funding-rate failed:', e.message); return {}; }),
    checkDexCexDivergence().catch(e => { console.error('[agent] dex-cex-volume failed:', e.message); return {}; }),
    checkOpenInterest().catch(e => { console.error('[agent] open-interest failed:', e.message); return {}; })
  ]);

  // ── BTC 24h momentum ──────────────────────────────────────
  let btcChange24h = 0;
  try {
    const tickerData = await new Promise((resolve, reject) => {
      https.get('https://api.bitget.com/api/v2/spot/market/tickers?symbol=BTCUSDT', (res) => {
        let raw = '';
        res.on('data', d => raw += d);
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });
    btcChange24h = parseFloat(tickerData.data[0]?.change24h ?? 0) * 100;
    console.log(`[BTC Momentum] 24h change: ${btcChange24h.toFixed(3)}%`);
  } catch (e) {
    console.error('[BTC Momentum] Failed:', e.message);
  }

  // ── Recent trade context for Qwen ─────────────────────────
  const recentTrades = getRecentTrades();
  console.log(`[Context] Last 3 closed: ${recentTrades.map(t => `${t.side==='buy'?'LONG':'SHORT'}(${t.closeReason})`).join(', ') || 'none'}`);

  // ── Push state to dashboard ───────────────────────────────
  pushToServer({
    fundingRate: fundingData.fundingRate ?? null,
    fundingReason: `BTC funding ${fundingData.fundingRate}% | TVL stable: ${fundingData.tvlStable}`,
    dexCexRatio: dexCexData.dexCexRatio ?? null,
    dexCexReason: `Uniswap $${dexCexData.uniswapTotal24h ? (dexCexData.uniswapTotal24h/1e6).toFixed(1) : 'N/A'}M vs Bitget ETH $${dexCexData.bitgetEthVolume ? (dexCexData.bitgetEthVolume/1e6).toFixed(1) : 'N/A'}M | Ratio: ${dexCexData.dexCexRatio?.toFixed(3)}`,
    openInterest: oiData.openInterest ?? null,
    openInterestChange: oiData.openInterestChange ?? null,
    lastAgentPing: new Date().toISOString()
  });

  // ── Build marketData for LLM ──────────────────────────────
  const marketData = {
    curveTVL: curveData.curveTVL ?? null,
    previousCurveTVL: curveData.previousCurveTVL ?? null,
    curveTVLChange: curveData.curveTVLChange ?? 0,
    usdtDeviation: stableData.usdtDeviation ?? 0,
    usdcDeviation: stableData.usdcDeviation ?? 0,
    dexCexRatio: dexCexData.dexCexRatio ?? null,
    uniswapVolume: dexCexData.uniswapTotal24h ? (dexCexData.uniswapTotal24h / 1e6).toFixed(1) : null,
    bitgetEthVolume: dexCexData.bitgetEthVolume ? (dexCexData.bitgetEthVolume / 1e6).toFixed(1) : null,
    fundingRate: fundingData.fundingRate ?? 0,
    tvlStable: fundingData.tvlStable ?? true,
    openInterest: oiData.openInterest ?? null,
    openInterestChange: oiData.openInterestChange ?? 0,
    btcChange24h: btcChange24h,
    recentTrades: recentTrades
  };

  console.log(`[HARUSPEX] Signals: CurveTVL=${marketData.curveTVLChange}% | USDT=${marketData.usdtDeviation}% | Funding=${marketData.fundingRate}% | DEX/CEX=${marketData.dexCexRatio?.toFixed(3)} | OI=${marketData.openInterestChange}% | BTC24h=${marketData.btcChange24h?.toFixed(3)}%`);

  // ── Max positions guard ───────────────────────────────────
  const openCount = getOpenCount();
  if (openCount >= MAX_POSITIONS) {
    console.log(`[HARUSPEX] Max positions reached (${openCount} open) — skipping LLM decision`);
    logNoAction(`Max positions reached (${openCount} open) — agent monitoring`);
    return;
  }

  // ── LLM decision ─────────────────────────────────────────
  console.log(`[HARUSPEX] Consulting Qwen3.6-plus...`);
  const decision = await makeTradeDecision(marketData);

  if (!decision.shouldTrade) {
    console.log(`[HARUSPEX] LLM: No trade — ${decision.reasoning}`);
    logNoAction(decision.reasoning || 'LLM decided no trade conditions met');
    return;
  }

  // ── Confidence gate ───────────────────────────────────────
  if (decision.confidence < MIN_CONFIDENCE) {
    console.log(`[HARUSPEX] Confidence too low (${Math.round(decision.confidence*100)}%) — minimum ${MIN_CONFIDENCE*100}% required`);
    logNoAction(`Low confidence: ${Math.round(decision.confidence*100)}% — skipped`);
    return;
  }

  // ── Execute ───────────────────────────────────────────────
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
    stopLoss: decision.stopLoss || 0.012,
    takeProfit: decision.takeProfit || 0.024
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
  console.log(`\n[HARUSPEX] Agent running. Next check in 5 minutes.`);
  console.log('[HARUSPEX] Press Ctrl+C to stop.\n');
}

main().catch(err => {
  console.error('[HARUSPEX] Fatal error:', err);
  process.exit(1);
});