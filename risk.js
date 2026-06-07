require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOG_DIR = path.join(__dirname, 'logs');
const CHECK_INTERVAL = 60 * 1000; // every 60 seconds
const MAX_OPEN_POSITIONS = 3;
const MAX_PORTFOLIO_RISK = 0.02; // 2% per trade

const http = require('http');
function postRiskState(positions, warning) {
  const body = JSON.stringify({
    positions,
    warning,
    lastRiskPing: new Date().toISOString()
  });
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
    if (data.data && data.data[0]) {
      return parseFloat(data.data[0].lastPr);
    }
    throw new Error('No price data');
  } catch (err) {
    throw new Error(`Price fetch failed for ${symbol}: ${err.message}`);
  }
}

function getAllLogFiles() {
  try {
    return fs.readdirSync(LOG_DIR)
      .filter(f => f.startsWith('haruspex-') && f.endsWith('.json'))
      .map(f => path.join(LOG_DIR, f));
  } catch { return []; }
}

function readAllTrades() {
  const files = getAllLogFiles();
  let allTrades = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, 'utf8').trim();
      if (!raw) continue;
      if (raw.startsWith('[')) {
        allTrades = allTrades.concat(JSON.parse(raw));
      } else {
        raw.split('\n').filter(Boolean).forEach(line => {
          try { allTrades.push(JSON.parse(line)); } catch {}
        });
      }
    } catch {}
  }
  return allTrades;
}

function writeTradeback(trade) {
  // Find which file contains this trade and update it
  const files = getAllLogFiles();
  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, 'utf8').trim();
      if (!raw.includes(trade.id)) continue;

      let trades = [];
      if (raw.startsWith('[')) {
        trades = JSON.parse(raw);
      } else {
        trades = raw.split('\n').filter(Boolean).map(l => {
          try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);
      }

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

function logRiskEvent(event) {
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(LOG_DIR, `haruspex-${today}.json`);

  let trades = [];
  try {
    const raw = fs.readFileSync(logFile, 'utf8').trim();
    if (raw.startsWith('[')) trades = JSON.parse(raw);
  } catch {}

  trades.push(event);
  fs.writeFileSync(logFile, JSON.stringify(trades, null, 2));
  console.log(`[Risk] Event logged: ${event.type} — ${event.asset}`);
}

async function checkOpenPositions() {
  const allTrades = readAllTrades();

  // Get open positions — executed but not yet closed
  const openTrades = allTrades.filter(t =>
    t.status === 'PAPER_TRADE_EXECUTED' &&
    !t.closedAt
  );

  console.log(`\n[Risk] ${new Date().toISOString()} — Checking ${openTrades.length} open position(s)`);

  // Max positions check
  if (openTrades.length > MAX_OPEN_POSITIONS) {
    console.log(`[Risk] ⚠️  WARNING: ${openTrades.length} open positions exceeds max of ${MAX_OPEN_POSITIONS}`);
  }

  for (const trade of openTrades) {
    try {
      const currentPrice = getCurrentPrice(trade.asset);
      const isLong = trade.side === 'buy';

      console.log(`[Risk] ${trade.asset} | Entry: $${trade.entryPrice} | Current: $${currentPrice} | SL: $${trade.stopLossPrice} | TP: $${trade.takeProfitPrice}`);

      // Stop loss hit
      if (isLong && currentPrice <= trade.stopLossPrice) {
        console.log(`[Risk] 🔴 STOP LOSS HIT — ${trade.asset} @ $${currentPrice}`);
        trade.closedAt = new Date().toISOString();
        trade.closePrice = currentPrice;
        trade.closeReason = 'STOP_LOSS_HIT';
        trade.status = 'CLOSED';
        trade.pnlPercent = (((currentPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2);
        writeTradeback(trade);
        logRiskEvent({
          id: `risk-${Date.now()}`,
          type: 'STOP_LOSS_HIT',
          timestamp: new Date().toISOString(),
          asset: trade.asset,
          entryPrice: trade.entryPrice,
          closePrice: currentPrice,
          stopLossPrice: trade.stopLossPrice,
          pnlPercent: trade.pnlPercent,
          originalTradeId: trade.id,
          paperTrade: true
        });
      }

      // Short stop loss hit
      else if (!isLong && currentPrice >= trade.stopLossPrice) {
        console.log(`[Risk] 🔴 STOP LOSS HIT (SHORT) — ${trade.asset} @ $${currentPrice}`);
        trade.closedAt = new Date().toISOString();
        trade.closePrice = currentPrice;
        trade.closeReason = 'STOP_LOSS_HIT';
        trade.status = 'CLOSED';
        trade.pnlPercent = (((trade.entryPrice - currentPrice) / trade.entryPrice) * 100).toFixed(2);
        writeTradeback(trade);
        logRiskEvent({
          id: `risk-${Date.now()}`,
          type: 'STOP_LOSS_HIT',
          timestamp: new Date().toISOString(),
          asset: trade.asset,
          entryPrice: trade.entryPrice,
          closePrice: currentPrice,
          stopLossPrice: trade.stopLossPrice,
          pnlPercent: trade.pnlPercent,
          originalTradeId: trade.id,
          paperTrade: true
        });
      }

      // Take profit hit
      else if (isLong && currentPrice >= trade.takeProfitPrice) {
        console.log(`[Risk] 🟢 TAKE PROFIT HIT — ${trade.asset} @ $${currentPrice}`);
        trade.closedAt = new Date().toISOString();
        trade.closePrice = currentPrice;
        trade.closeReason = 'TAKE_PROFIT_HIT';
        trade.status = 'CLOSED';
        trade.pnlPercent = (((currentPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2);
        writeTradeback(trade);
        logRiskEvent({
          id: `risk-${Date.now()}`,
          type: 'TAKE_PROFIT_HIT',
          timestamp: new Date().toISOString(),
          asset: trade.asset,
          entryPrice: trade.entryPrice,
          closePrice: currentPrice,
          takeProfitPrice: trade.takeProfitPrice,
          pnlPercent: trade.pnlPercent,
          originalTradeId: trade.id,
          paperTrade: true
        });
      }

      // Short take profit hit
      else if (!isLong && currentPrice <= trade.takeProfitPrice) {
        console.log(`[Risk] 🟢 TAKE PROFIT HIT (SHORT) — ${trade.asset} @ $${currentPrice}`);
        trade.closedAt = new Date().toISOString();
        trade.closePrice = currentPrice;
        trade.closeReason = 'TAKE_PROFIT_HIT';
        trade.status = 'CLOSED';
        trade.pnlPercent = (((trade.entryPrice - currentPrice) / trade.entryPrice) * 100).toFixed(2);
        writeTradeback(trade);
        logRiskEvent({
          id: `risk-${Date.now()}`,
          type: 'TAKE_PROFIT_HIT',
          timestamp: new Date().toISOString(),
          asset: trade.asset,
          entryPrice: trade.entryPrice,
          closePrice: currentPrice,
          takeProfitPrice: trade.takeProfitPrice,
          pnlPercent: trade.pnlPercent,
          originalTradeId: trade.id,
          paperTrade: true
        });
      }

      else {
        const pnl = isLong
          ? (((currentPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2)
          : (((trade.entryPrice - currentPrice) / trade.entryPrice) * 100).toFixed(2);
        console.log(`[Risk] ✅ Position healthy — PnL: ${pnl}%`);
      }

    } catch (err) {
      console.error(`[Risk] Error checking ${trade.asset}: ${err.message}`);
    }
  }

  // Post live position data to dashboard
  const livePositions = openTrades.map(t => {
    const currentPrice = (() => {
      try { return getCurrentPrice(t.asset); } catch { return null; }
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

// Start
console.log('═'.repeat(50));
console.log('  HARUSPEX — Risk Manager');
console.log('  Monitoring stop loss / take profit every 60s');
console.log('  Max positions: 3 | Max risk per trade: 2%');
console.log('═'.repeat(50));

checkOpenPositions();
setInterval(checkOpenPositions, CHECK_INTERVAL);