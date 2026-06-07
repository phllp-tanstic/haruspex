require('dotenv').config();
const { execSync } = require('child_process');
const { writeLog } = require('./logger');
const { generateReasoning } = require('./reasoner');

function getPositionSize(confidence) {
  if (confidence >= 0.85) return '0.05';
  if (confidence >= 0.70) return '0.03';
  return '0.01';
}

async function placePaperTrade(signal) {
  const { action, primaryAsset, confidence, reason, stopLoss, takeProfit } = signal;
  const size = getPositionSize(confidence);
  const side = action === 'LONG' ? 'buy' : 'sell';

  console.log(`\n[EXECUTOR] Signal confirmed — placing paper trade`);
  console.log(`Asset: ${primaryAsset} | Side: ${side.toUpperCase()} | Size: ${size}`);

  try {
    const symbol = primaryAsset.replace('/', '');
    const tickerOutput = execSync(
      `bgc spot spot_get_ticker --symbol ${symbol}`,
      { encoding: 'utf8', timeout: 10000 }
    );
    const tickerData = JSON.parse(tickerOutput);
    const currentPrice = parseFloat(tickerData.data[0].lastPr);

    const stopLossPrice = action === 'LONG'
      ? (currentPrice * (1 - stopLoss)).toFixed(2)
      : (currentPrice * (1 + stopLoss)).toFixed(2);
    const takeProfitPrice = action === 'LONG'
      ? (currentPrice * (1 + takeProfit)).toFixed(2)
      : (currentPrice * (1 - takeProfit)).toFixed(2);

    console.log(`[EXECUTOR] Entry price: $${currentPrice}`);
    console.log(`[EXECUTOR] Stop loss:   $${stopLossPrice}`);
    console.log(`[EXECUTOR] Take profit: $${takeProfitPrice}`);

    // Generate LLM reasoning
    console.log(`[EXECUTOR] Generating LLM reasoning...`);
    const llmReason = await generateReasoning({
      ...signal,
      entryPrice: currentPrice,
      stopLossPrice,
      takeProfitPrice
    });
    console.log(`[EXECUTOR] Reasoning: ${llmReason}`);
    console.log(`[EXECUTOR] Paper trade logged — no real funds used`);

    const logEntry = writeLog({
      signal: signal.signal,
      action: `${side.toUpperCase()} ${primaryAsset}`,
      asset: primaryAsset,
      side,
      size,
      entryPrice: currentPrice,
      stopLossPrice: parseFloat(stopLossPrice),
      takeProfitPrice: parseFloat(takeProfitPrice),
      confidence,
      reason: llmReason,
      rawReason: reason,
      llmGenerated: true,
      status: 'PAPER_TRADE_EXECUTED',
      paperTrade: true
    });

    return { success: true, logEntry };
  } catch (error) {
    console.error(`[EXECUTOR] Failed: ${error.message}`);
    const logEntry = writeLog({
      signal: signal.signal,
      action: `${side.toUpperCase()} ${primaryAsset} (FAILED)`,
      asset: primaryAsset,
      confidence,
      reason,
      status: 'EXECUTION_FAILED',
      error: error.message,
      paperTrade: true
    });
    return { success: false, logEntry };
  }
}

async function executeDivergenceSignal(signal) {
  console.log(`[EXECUTOR] Divergence signal — executing paired trade`);
  const results = [];
  results.push(await placePaperTrade({ ...signal, action: 'SHORT', primaryAsset: signal.assets[0] }));
  results.push(await placePaperTrade({ ...signal, action: 'LONG', primaryAsset: signal.assets[1] }));
  return results;
}

async function executeSignal(signal) {
  if (!signal.fired) return null;
  if (signal.action === 'DIVERGENCE') {
    return executeDivergenceSignal(signal);
  }
  return placePaperTrade(signal);
}

module.exports = { executeSignal };
