<p align="center">
  <img src="https://img.shields.io/badge/Bitget_Hackathon_S1-Track_1-E0FF00?style=for-the-badge&labelColor=050505" />
  <img src="https://img.shields.io/badge/Status-Live-4ade80?style=for-the-badge&labelColor=050505" />
  <img src="https://img.shields.io/badge/LLM-Qwen3.6--plus-white?style=for-the-badge&labelColor=050505" />
  <img src="https://img.shields.io/badge/Signals-6_Cross--Environment-E0FF00?style=for-the-badge&labelColor=050505" />
</p>
<h1 align="center">HARUSPEX</h1>
<h3 align="center">Autonomous DeFi-to-CEX Signal Agent</h3>
<p align="center">
  <em>Haruspex (n.): An ancient diviner who read entrails to predict the future.<br>This agent reads DeFi entrails to predict CEX price moves.</em>
</p>
<p align="center">
  <a href="https://haruspex.netlify.app"><strong>Live Demo →</strong></a>
  &nbsp;·&nbsp;
  <a href="./logs"><strong>Paper Trading Log →</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/phllp-tanstic/haruspex"><strong>GitHub →</strong></a>
</p>

Haruspex is an Autonomous Systemic Risk Intelligence Agent that detects emerging contagion risks across DeFi infrastructure and automatically executes defensive hedges before those risks propagate into centralized markets.

## What it does

No human can continuously monitor multiple DeFi risk vectors across ecosystems, interpret their market implications, and execute protective actions within seconds. Haruspex does this autonomously, around the clock.

**Perception → Decision → Execution → Risk Management**

| Signal | Source | Trigger | Action |
|---|---|---|---|
| Curve Finance TVL Drop | DefiLlama API | >1% drop per cycle | SHORT ETH/USDT |
| ETH/BTC Ratio Flip | Bitget Spot API | >0.05% drop | SHORT ETH / LONG BTC |
| Stablecoin Depeg | DefiLlama Stablecoins | >0.04% deviation | SHORT BTC + ETH |
| BTC Funding Rate Divergence | Bitget Futures API | <-0.00001% + TVL stable | LONG BTC (contrarian) |

## Architecture
agent.js          — Signal monitor, runs every 15 minutes
executor.js       — Paper trade executor with dynamic position sizing
reasoner.js       — LLM reasoning via Groq/Qwen3-32B
risk.js           — Stop loss / take profit monitor, runs every 60 seconds
server.js         — Dashboard API server
signals/          — 4 individual signal modules
dashboard/        — Live monitoring dashboard
logs/             — Timestamped trade log (JSON)

## Live Dashboard

Signal cards fetch live data directly from source APIs — Curve TVL and stablecoin prices from DefiLlama, ETH/BTC ratio and BTC funding rate from Bitget's public market API. Trade log shows every autonomous decision with LLM-generated reasoning.

## Bitget AI Modules Used

- **Bitget Agent Hub CLI (bgc)** — spot market data, futures funding rate
- **Bitget Spot API** — ETH/BTC real-time pricing
- **Bitget Futures API** — BTC perpetual funding rate
- **Paper trading execution** — via Bitget market data

## How to Run

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Add your Bitget API keys and Groq API key

# Run all three processes
node server.js    # Dashboard API — localhost:3000
node agent.js     # Signal agent — checks every 15 minutes  
node risk.js      # Risk monitor — checks every 60 seconds
```

## Trade Log Evidence

See `logs/` directory for timestamped paper trade records with LLM reasoning.

## Tech Stack

Node.js · Groq API (Qwen3-32B) · DefiLlama API · Bitget Public API · Bitget Agent Hub

---

*Built for Bitget AI Hackathon S1 — Track 1 (Trading Agent)*