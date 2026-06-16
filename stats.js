const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');

function calculateStats() {
  const files = fs.readdirSync(LOG_DIR)
    .filter(f => f.startsWith('haruspex-') && f.endsWith('.json'));

  let allTrades = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(LOG_DIR, file), 'utf8').trim();
    if (raw.startsWith('[')) allTrades = allTrades.concat(JSON.parse(raw));
  }

  const executed = allTrades.filter(t => t.status === 'PAPER_TRADE_EXECUTED');
  const closed = allTrades.filter(t => 
  t.status === 'CLOSED' && 
  t.pnlPercent !== undefined &&
  t.closeReason !== 'MANUAL_CLOSE' &&
  t.closeReason !== 'MANUAL_CLOSE_FOR_LLM_RESET'
);
  const open = executed.filter(t => !t.closedAt);

  if (closed.length === 0) {
    console.log('No closed trades yet — insufficient data for metrics');
    console.log(`Open positions: ${open.length}`);
    console.log(`Total executed: ${executed.length}`);
    return;
  }

  const pnls = closed.map(t => parseFloat(t.pnlPercent));
  const wins = pnls.filter(p => p > 0);
  const losses = pnls.filter(p => p <= 0);

  const totalPnL = pnls.reduce((a, b) => a + b, 0);
  const avgPnL = totalPnL / pnls.length;
  const winRate = (wins.length / pnls.length * 100).toFixed(1);

  // Max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;
  for (const p of pnls) {
    cumulative += p;
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Sharpe ratio (simplified — daily returns)
  const mean = avgPnL;
  const variance = pnls.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / pnls.length;
  const stdDev = Math.sqrt(variance);
  const sharpe = stdDev > 0 ? (mean / stdDev).toFixed(2) : 'N/A';

  const avgWin = wins.length > 0 ? (wins.reduce((a, b) => a + b, 0) / wins.length).toFixed(2) : 0;
  const avgLoss = losses.length > 0 ? (losses.reduce((a, b) => a + b, 0) / losses.length).toFixed(2) : 0;
  const profitFactor = losses.length > 0 && Math.abs(avgLoss) > 0
    ? (Math.abs(wins.reduce((a, b) => a + b, 0)) / Math.abs(losses.reduce((a, b) => a + b, 0))).toFixed(2)
    : 'N/A';

  const stats = {
    totalTrades: executed.length,
    closedTrades: closed.length,
    openPositions: open.length,
    winRate: `${winRate}%`,
    totalPnL: `${totalPnL.toFixed(2)}%`,
    avgPnLPerTrade: `${avgPnL.toFixed(2)}%`,
    avgWin: `${avgWin}%`,
    avgLoss: `${avgLoss}%`,
    maxDrawdown: `${maxDrawdown.toFixed(2)}%`,
    sharpeRatio: sharpe,
    profitFactor,
    wins: wins.length,
    losses: losses.length
  };

  console.log('\n═══════════════════════════════════════');
  console.log('  HARUSPEX — Performance Statistics');
  console.log('═══════════════════════════════════════');
  console.log(`  Total Trades Executed : ${stats.totalTrades}`);
  console.log(`  Closed Trades         : ${stats.closedTrades}`);
  console.log(`  Open Positions        : ${stats.openPositions}`);
  console.log(`  Win Rate              : ${stats.winRate}`);
  console.log(`  Total PnL             : ${stats.totalPnL}`);
  console.log(`  Avg PnL per Trade     : ${stats.avgPnLPerTrade}`);
  console.log(`  Avg Win               : ${stats.avgWin}`);
  console.log(`  Avg Loss              : ${stats.avgLoss}`);
  console.log(`  Max Drawdown          : ${stats.maxDrawdown}`);
  console.log(`  Sharpe Ratio          : ${stats.sharpeRatio}`);
  console.log(`  Profit Factor         : ${stats.profitFactor}`);
  console.log('═══════════════════════════════════════\n');

  // Save stats to file
  fs.writeFileSync(
    path.join(__dirname, 'dashboard', 'stats.json'),
    JSON.stringify(stats, null, 2)
  );
  console.log('Stats saved to dashboard/stats.json');

  return stats;
}

calculateStats();
module.exports = { calculateStats };