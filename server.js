const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 3000;
process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${PORT} busy. Kill it with: netstat -ano | findstr :${PORT}`);
    process.exit(1);
  }
});
const LOG_DIR = path.join(__dirname, 'logs');
const DASHBOARD_DIR = path.join(__dirname, 'dashboard');
let agentState = { ethBtcRatio: null, fundingRate: null, lastAgentPing: null };
let riskState = { positions: [], lastRiskPing: null, warning: false };
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  if (req.url === '/api/logs') {
    let allTrades = [];
    try {
      const files = fs.readdirSync(LOG_DIR).filter(f => f.startsWith('haruspex-') && f.endsWith('.json'));
      for (const file of files) {
        const raw = fs.readFileSync(path.join(LOG_DIR, file), 'utf8').trim();
        if (!raw) continue;
        if (raw.startsWith('[')) {
          allTrades = allTrades.concat(JSON.parse(raw));
        } else {
          raw.split('\n').filter(Boolean).forEach(line => {
            try { allTrades.push(JSON.parse(line)); } catch {}
          });
        }
      }
    } catch (err) {
      console.error('Log read error:', err.message);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(allTrades));
    return;
  }
  // State store for live agent values
  if (req.url === '/api/state' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body);
        Object.assign(agentState, incoming);
        res.writeHead(200); res.end('ok');
      } catch { res.writeHead(400); res.end('bad json'); }
    });
    return;
  }

  if (req.url === '/api/risk' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        riskState = { ...riskState, ...JSON.parse(body) };
        res.writeHead(200); res.end('ok');
      } catch { res.writeHead(400); res.end('bad json'); }
    });
    return;
  }

  if (req.url === '/api/risk') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(riskState));
    return;
  }

  if (req.url === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(agentState));
    return;
  }
  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ alive: true, uptime: process.uptime(), timestamp: new Date().toISOString() }));
    return;
  }
  if (req.url === '/' || req.url === '/index.html') {
    const htmlFile = path.join(DASHBOARD_DIR, 'index.html');
    if (fs.existsSync(htmlFile)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(htmlFile));
    } else {
      res.writeHead(404);
      res.end('Dashboard not found.');
    }
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});
server.listen(PORT, () => {
  console.log(`✅ Haruspex Dashboard running at http://localhost:${PORT}`);
  console.log(`📊 Log API: http://localhost:${PORT}/api/logs`);
});
