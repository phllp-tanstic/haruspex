require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

const LOG_DIR = path.join(__dirname, 'logs');
const CHECK_INTERVAL = 60 * 1000;
const MAX_OPEN_POSITIONS = 3;
const STARTING_BALANCE = 10000;

function postRiskState(positions, warning) {
  const body = JSON.stringify({ positions, warning, lastRiskPing: new Date().toISOString() });
  const req = http.request({
    hostname: 'localhost', port: 3000,
    path: '/api/risk', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

function getCurrentPrice(symbol) {
  try {
    const output = execSync(`bgc spot spot_get_ticker --symbol ${symbol}`, {
      encoding: 'utf8', timeout: 10000
    });
    const data = JSON.parse(output);
    if (data.data && data.data[0]) return parseFloat(data.data[0].lastPr);
    throw new Error('No price data');
  } catch (err) {
    throw new Error(`Price fetch failed for ${symbol}: ${err.message}`);
  }
}

function getAllLogFiles() {
  try {
    return fs.readdirSync(LOG_DIR)
      .filter(f => f.startsWith('haruspex-') && f.endsWith('.json'))
      .sort()
      .map(f => path.join(LOG_DIR, f));
  } catch { return []; }
}

function readAllTrades() {
  let allTrades = [];
  for (const file of getAllLogFiles()) {
    try {
      const raw = fs.readFileSync(file, 'utf8').trim();
      if (!raw) continue;
      if (raw.startsWith('[')) allTrades = allTrades.concat(JSON.parse(raw));
    } catch {}
  }
  return allTrades;
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
      let trades = JSON.parse(raw);
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

  console.log(`[Risk] ${reason === 'STOP_LOSS_HIT' ? '🔴' : '🟢'} ${reason} — ${trade.asset} @ $${currentPrice} | PnL: ${pnlPercent}% ($${balanceChange.toFixed(2)}) | Balance: $${balanceAfter}`);
}

async function checkOpenPositions() {
  const allTrades = readAllTrades();
  const openTrades = allTrades.filter(t =>
    t.status === 'PAPER_TRADE_EXECUTED' && !t.closedAt
  );

  console.log(`\n[Risk] ${new Date().toISOString()} — Checking ${openTrades.length} open position(s) | Balance: $${getLatestBalance()}`);

  if (openTrades.length > MAX_OPEN_POSITIONS) {
    console.log(`[Risk] ⚠️  WARNING: ${openTrades.length} open positions exceeds max of ${MAX_OPEN_POSITIONS}`);
  }

  for (const trade of openTrades) {
    try {
      const currentPrice = getCurrentPrice(trade.asset);
      const isLong = trade.side === 'buy';

      console.log(`[Risk] ${trade.asset} | Entry: $${trade.entryPrice} | Current: $${currentPrice} | SL: $${trade.stopLossPrice} | TP: $${trade.takeProfitPrice}`);

      if (isLong && currentPrice <= trade.stopLossPrice) {
        closeTrade(trade, currentPrice, 'STOP_LOSS_HIT');
      } else if (!isLong && currentPrice >= trade.stopLossPrice) {
        closeTrade(trade, currentPrice, 'STOP_LOSS_HIT');
      } else if (isLong && currentPrice >= trade.takeProfitPrice) {
        closeTrade(trade, currentPrice, 'TAKE_PROFIT_HIT');
      } else if (!isLong && currentPrice <= trade.takeProfitPrice) {
        closeTrade(trade, currentPrice, 'TAKE_PROFIT_HIT');
      } else {
        const pnl = isLong
          ? (((currentPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2)
          : (((trade.entryPrice - currentPrice) / trade.entryPrice) * 100).toFixed(2);
        console.log(`[Risk] ✅ Position healthy — PnL: ${pnl}%`);
      }

    } catch (err) {
      console.error(`[Risk] Error checking ${trade.asset}: ${err.message}`);
    }
  }

  const livePositions = openTrades
    .filter(t => !t.closedAt)
    .map(t => {
      const currentPrice = (() => { try { return getCurrentPrice(t.asset); } catch { return null; } })();
      const isLong = t.side === 'buy';
      const pnl = currentPrice
        ? isLong
          ? (((currentPrice - t.entryPrice) / t.entryPrice) * 100).toFixed(2)
          : (((t.entryPrice - currentPrice) / t.entryPrice) * 100).toFixed(2)
        : null;
      return { id: t.id, asset: t.asset, side: t.side, entryPrice: t.entryPrice, stopLossPrice: t.stopLossPrice, takeProfitPrice: t.takeProfitPrice, currentPrice, pnl };
    });

  postRiskState(livePositions, openTrades.length > MAX_OPEN_POSITIONS);
}

console.log('═'.repeat(50));
console.log('  HARUSPEX — Risk Manager');
console.log('  Monitoring stop loss / take profit every 60s');
console.log(`  Starting balance: $${STARTING_BALANCE} USDT`);
console.log('═'.repeat(50));

checkOpenPositions();
setInterval(checkOpenPositions, CHECK_INTERVAL);