require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

// ── Constants ──────────────────────────────────────────────
const LOG_DIR = path.join(__dirname, 'logs');
const CHECK_INTERVAL = 60 * 1000;
const MAX_OPEN_POSITIONS = 2;
const STARTING_BALANCE = 10000;
const MAX_PRICE_FAILURES = 3;

// ── Circuit Breaker State (module-level — persists across cycles) ──
let consecutivePriceFailures = 0;
let lastKnownPrices = {};

// ── Dashboard Push ─────────────────────────────────────────
function postRiskState(positions, warning) {
  // Push to local dashboard server
  try {
    const body = JSON.stringify({ positions, warning, lastRiskPing: new Date().toISOString() });
    const req = http.request({
      hostname: 'localhost', port: 3000,
      path: '/api/risk', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    });
    req.on('error', () => {});
    req.write(body);
    req.end();
  } catch {}

  // Push to JSONBin for public dashboard
  try {
    const payload = JSON.stringify({
      positions,
      warning,
      balance: getLatestBalance(),
      lastUpdate: new Date().toISOString()
    });
    const req = https.request({
      hostname: 'api.jsonbin.io',
      path: `/v3/b/${process.env.JSONBIN_ID}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': process.env.JSONBIN_KEY,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error('[Risk] JSONBin push failed:', res.statusCode, d.substring(0, 100));
        } else {
          console.log('[Risk] JSONBin updated — balance: $' + getLatestBalance());
        }
      });
    });
    req.on('error', e => console.error('[Risk] JSONBin error:', e.message));
    req.write(payload);
    req.end();
  } catch (e) {
    console.error('[Risk] JSONBin push error:', e.message);
  }
}

// ── Price Fetcher ──────────────────────────────────────────
function getCurrentPrice(symbol) {
  const output = execSync(`bgc spot spot_get_ticker --symbol ${symbol}`, {
    encoding: 'utf8',
    timeout: 12000,
    windowsHide: true
  });
  const data = JSON.parse(output);
  if (data.data && data.data[0]) return parseFloat(data.data[0].lastPr);
  throw new Error(`No price data returned for ${symbol}`);
}

// ── Log File Helpers ───────────────────────────────────────
function getAllLogFiles() {
  try {
    return fs.readdirSync(LOG_DIR)
      .filter(f => f.startsWith('haruspex-') && f.endsWith('.json'))
      .sort()
      .map(f => path.join(LOG_DIR, f));
  } catch { return []; }
}

function readAllTrades() {
  let all = [];
  for (const file of getAllLogFiles()) {
    try {
      const raw = fs.readFileSync(file, 'utf8').trim();
      if (raw.startsWith('[')) all = all.concat(JSON.parse(raw));
    } catch {}
  }
  return all;
}

function getLatestBalance() {
  const all = readAllTrades();
  let balance = STARTING_BALANCE;
  for (const t of all) {
    if (t.balanceAfter && typeof t.balanceAfter === 'number') {
      balance = t.balanceAfter;
    }
  }
  return parseFloat(balance.toFixed(2));
}

function writeTradeback(trade) {
  for (const file of getAllLogFiles()) {
    try {
      const raw = fs.readFileSync(file, 'utf8').trim();
      if (!raw.includes(trade.id)) continue;
      const trades = JSON.parse(raw);
      const idx = trades.findIndex(t => t.id === trade.id);
      if (idx !== -1) {
        trades[idx] = trade;
        fs.writeFileSync(file, JSON.stringify(trades, null, 2));
        console.log(`[Risk] Updated trade ${trade.id} in ${path.basename(file)}`);
      }
      return;
    } catch {}
  }
}

// ── Close Position ─────────────────────────────────────────
function closeTrade(trade, currentPrice, reason) {
  const isLong = trade.side === 'buy';
  const pnlPercent = isLong
    ? (((currentPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2)
    : (((trade.entryPrice - currentPrice) / trade.entryPrice) * 100).toFixed(2);

  const balanceBefore = trade.balanceBefore || getLatestBalance();
  const tradeValue = parseFloat(trade.size) * trade.entryPrice;
  const pnlDollar = tradeValue * (parseFloat(pnlPercent) / 100);
  const balanceAfter = parseFloat((balanceBefore + pnlDollar).toFixed(2));
  const balanceChange = parseFloat(pnlDollar.toFixed(2));

  trade.closedAt = new Date().toISOString();
  trade.closePrice = currentPrice;
  trade.closeReason = reason;
  trade.status = 'CLOSED';
  trade.pnlPercent = pnlPercent;
  trade.balanceAfter = balanceAfter;
  trade.balanceChange = balanceChange;

  writeTradeback(trade);

  const icon = reason === 'TAKE_PROFIT_HIT' ? '🟢' : reason === 'CIRCUIT_BREAKER_CLOSE' ? '🟡' : '🔴';
  console.log(`[Risk] ${icon} ${reason} — ${trade.asset} @ $${currentPrice} | PnL: ${pnlPercent}% ($${balanceChange.toFixed(2)}) | Balance: $${balanceAfter}`);
}

// ── Main Check Loop ────────────────────────────────────────
async function checkOpenPositions() {
  const allTrades = readAllTrades();
  const openTrades = allTrades.filter(t =>
    t.status === 'PAPER_TRADE_EXECUTED' && !t.closedAt
  );

  const balance = getLatestBalance();
  console.log(`\n[Risk] ${new Date().toISOString()} — Checking ${openTrades.length} open position(s) | Balance: $${balance}`);

  if (openTrades.length > MAX_OPEN_POSITIONS) {
    console.log(`[Risk] ⚠️  WARNING: ${openTrades.length} positions exceeds max of ${MAX_OPEN_POSITIONS}`);
  }

  if (openTrades.length === 0) {
    postRiskState([], false);
    return;
  }

  for (const trade of openTrades) {
    try {
      const currentPrice = getCurrentPrice(trade.asset);

      // Circuit breaker: reset failure count on success
      consecutivePriceFailures = 0;
      lastKnownPrices[trade.asset] = currentPrice;

      const isLong = trade.side === 'buy';
      const livePnl = isLong
        ? (((currentPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2)
        : (((trade.entryPrice - currentPrice) / trade.entryPrice) * 100).toFixed(2);

      console.log(`[Risk] ${trade.asset} | Entry: $${trade.entryPrice} | Current: $${currentPrice} | SL: $${trade.stopLossPrice} | TP: $${trade.takeProfitPrice} | PnL: ${livePnl}%`);

      // SL/TP checks
      if (isLong && currentPrice <= trade.stopLossPrice) {
        closeTrade(trade, currentPrice, 'STOP_LOSS_HIT');
      } else if (!isLong && currentPrice >= trade.stopLossPrice) {
        closeTrade(trade, currentPrice, 'STOP_LOSS_HIT');
      } else if (isLong && currentPrice >= trade.takeProfitPrice) {
        closeTrade(trade, currentPrice, 'TAKE_PROFIT_HIT');
      } else if (!isLong && currentPrice <= trade.takeProfitPrice) {
        closeTrade(trade, currentPrice, 'TAKE_PROFIT_HIT');
      } else {
        console.log(`[Risk] ✅ Position healthy`);
      }

    } catch (err) {
      consecutivePriceFailures++;
      console.error(`[Risk] ⚠️ Price fetch failed (${consecutivePriceFailures}/${MAX_PRICE_FAILURES}): ${err.message}`);

      // Circuit breaker: force-close at last known price after 3 consecutive failures
      if (consecutivePriceFailures >= MAX_PRICE_FAILURES) {
        const lastPrice = lastKnownPrices[trade.asset];
        if (lastPrice) {
          console.error(`[Risk] 🚨 CIRCUIT BREAKER TRIGGERED — closing ${trade.asset} at last known price $${lastPrice} to prevent runaway loss`);
          closeTrade(trade, lastPrice, 'CIRCUIT_BREAKER_CLOSE');
        } else {
          console.error(`[Risk] 🚨 CIRCUIT BREAKER — no last known price for ${trade.asset}. Position left open — check VPN immediately.`);
        }
        consecutivePriceFailures = 0;
      }
    }
  }

  // Push live positions to dashboard
  const stillOpen = openTrades.filter(t => !t.closedAt);
  const livePositions = stillOpen.map(t => {
    const currentPrice = (() => {
      try { return lastKnownPrices[t.asset] || getCurrentPrice(t.asset); }
      catch { return null; }
    })();
    const isLong = t.side === 'buy';
    const pnl = currentPrice
      ? isLong
        ? (((currentPrice - t.entryPrice) / t.entryPrice) * 100).toFixed(2)
        : (((t.entryPrice - currentPrice) / t.entryPrice) * 100).toFixed(2)
      : null;
    return {
      id: t.id,
      asset: t.asset,
      side: t.side,
      entryPrice: t.entryPrice,
      stopLossPrice: t.stopLossPrice,
      takeProfitPrice: t.takeProfitPrice,
      currentPrice,
      pnl
    };
  });

  postRiskState(livePositions, openTrades.length > MAX_OPEN_POSITIONS);
}

// ── Start ──────────────────────────────────────────────────
console.log('═'.repeat(50));
console.log('  HARUSPEX — Risk Manager v2.1');
console.log('  SL/TP monitor every 60s');
console.log('  Circuit breaker: 3 consecutive price failures');
console.log(`  Max positions: ${MAX_OPEN_POSITIONS} | Starting balance: $${STARTING_BALANCE}`);
console.log('═'.repeat(50));

checkOpenPositions();
setInterval(checkOpenPositions, CHECK_INTERVAL);