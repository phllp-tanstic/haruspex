const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function getLogFile() {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOGS_DIR, `haruspex-${date}.json`);
}

function readLogs() {
  const logFile = getLogFile();
  if (!fs.existsSync(logFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(logFile, 'utf8'));
  } catch {
    return [];
  }
}

function writeLog(entry) {
  const logFile = getLogFile();
  const logs = readLogs();
  const logEntry = {
    id: `trade-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry
  };
  logs.push(logEntry);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  console.log(`\n[HARUSPEX LOG] ${logEntry.timestamp}`);
  console.log(`Signal  : ${logEntry.signal}`);
  console.log(`Action  : ${logEntry.action}`);
  console.log(`Asset   : ${logEntry.asset}`);
  console.log(`Reason  : ${logEntry.reason}`);
  console.log(`Confidence: ${(logEntry.confidence * 100).toFixed(0)}%`);
  console.log(`Status  : ${logEntry.status}`);
  console.log('─'.repeat(50));
  return logEntry;
}

function logNoAction(reason) {
  const entry = {
    id: `check-${Date.now()}`,
    timestamp: new Date().toISOString(),
    signal: 'NONE',
    action: 'NO_TRADE',
    asset: null,
    reason,
    confidence: 0,
    status: 'MONITORING'
  };
  console.log(`[${entry.timestamp}] No signal — ${reason}`);
  return entry;
}

module.exports = { writeLog, logNoAction, readLogs };