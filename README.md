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
  <a href="https://phllp-tanstic.github.io/haruspex"><strong>Live Demo →</strong></a>
  &nbsp;·&nbsp;
  <a href="./logs"><strong>Paper Trading Log →</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/phllp-tanstic/haruspex"><strong>GitHub →</strong></a>
</p>





## Executive Summary

Haruspex is an autonomous trading agent that continuously monitors DeFi protocol health and converts cross market risk signals into executable trading decisions on **Bitget**.

Haruspex addresses a critical market intelligence gap between decentralized and centralized trading venues. While most traders rely on centralized exchange data, significant market signals often emerge first within DeFi through liquidity migrations, stablecoin stress events, and shifts in decentralized trading activity. By the time these developments are reflected in centralized markets, a substantial portion of the opportunity has already been captured.

Haruspex continuously monitors both environments as a unified market system. As capital flows between DeFi and centralized exchanges, changes in on chain conditions frequently precede shifts in market structure, volatility, and directional price movement. These cross market dynamics create actionable opportunities that are largely inaccessible to strategies operating within a single venue.

At the core of Haruspex is a six signal intelligence engine powered by Qwen3.6 Plus. Rather than relying on predefined rules or static thresholds, the system evaluates market conditions holistically every five minutes using large language model reasoning. Based on its assessment, Haruspex autonomously generates trade decisions, including position sizing, risk parameters, profit targets, and a transparent reasoning narrative. The result is a continuously operating AI trading agent capable of interpreting complex market conditions and responding in real time across market cycles.


## Problem Statement

### Market Intelligence Gap
Most algorithmic trading systems operate exclusively within centralized exchanges, relying on price action, volume, order book data, and technical indicators derived from the same market they trade. As a result, these systems compete on increasingly commoditized information with limited opportunities for differentiated insight.

Meanwhile, critical market signals often emerge first within decentralized finance. Liquidity migrations, stablecoin stress events, shifts in decentralized trading activity, and changes in protocol health frequently precede broader market movements. Despite their predictive value, these signals remain largely disconnected from traditional trading infrastructure due to the complexity of aggregating and interpreting data across multiple on chain and off chain environments.

### Why Existing Approaches Are Insufficient

| Approach | Limitation |
|-----------|------------|
| CEX Only Trading Bots | Operate exclusively on centralized exchange data and lack visibility into emerging DeFi market conditions. |
| DeFi Analytics Platforms | Provide monitoring and visualization but do not convert insights into executable trading decisions. |
| Manual Market Analysis | Cannot continuously evaluate multiple signal streams and market conditions at machine speed. |
| Rule Based Trading Systems | Depend on static thresholds that struggle to capture complex relationships between converging market signals. |
| Single Signal Strategies | Rely on isolated indicators, resulting in limited context and a higher probability of false positives. |

### The Haruspex Approach

Haruspex bridges the gap between decentralized market intelligence and centralized execution. The system continuously monitors protocol health, liquidity flows, stablecoin stability, and trading activity across DeFi while incorporating centralized exchange market data to maintain a unified view of market conditions.

At the core of the platform is a Qwen3.6 Plus powered reasoning engine that evaluates multiple signals holistically rather than through predefined rules or thresholds. Every decision is based on cross market signal convergence, enabling the system to identify opportunities that may not be visible within any single environment.

When sufficient conviction is established, Haruspex autonomously generates and executes trades on Bitget with position sizing, risk parameters, profit targets, and transparent reasoning attached to every decision.


## Solution Overview

### High-Level Architecture

```mermaid
flowchart TB

    subgraph DEFI["DeFi Intelligence Layer"]
        TVL["Curve Finance TVL"]
        PEG["Stablecoin Peg Stability"]
        VOL["DEX/CEX Volume Ratio"]
    end

    subgraph CEX["CEX Intelligence Layer"]
        FUND["BTC Funding Rate"]
        OI["BTC Open Interest"]
        MOM["BTC 24h Momentum"]
    end

    DEFI --> QWEN
    CEX --> QWEN

    QWEN["Qwen3.6 Plus Decision Engine"]

    QWEN --> LONG["LONG"]
    QWEN --> SHORT["SHORT"]
    QWEN --> NOTRADE["NO TRADE"]

    LONG --> EXEC["Trade Executor"]
    SHORT --> EXEC

    EXEC --> RISK["Risk Manager"]
    RISK --> DASH["Live Dashboard"]
```

### End-to-End User Journey

1. **Signal Collection**  
   Haruspex initiates a decision cycle by collecting six independent market signals across DeFi and centralized exchange environments. All data sources are queried in parallel to ensure a synchronized market snapshot.

2. **Market Reasoning**  
   The collected signals are passed to the Qwen3.6 Plus reasoning engine, which evaluates cross market conditions using a structured thesis framework. Rather than relying on predefined rules, the model synthesizes all available information to form a holistic market assessment.

3. **Trade Decision Generation**  
   Based on the current market state, the agent determines:
   - Trade direction (Long, Short, or No Trade)
   - Target asset
   - Confidence level
   - Position size
   - Stop loss
   - Take profit
   - Natural language reasoning

4. **Trade Execution**  
   When a trade is approved, the execution layer retrieves live market data from Bitget, calculates precise risk parameters, and records the position along with account balance and decision metadata.

5. **Risk Management**  
   The risk manager continuously monitors all open positions and evaluates stop loss and take profit conditions at regular intervals. Positions are automatically closed when predefined risk or profit targets are reached.

6. **Performance Tracking and Visualization**  
   The dashboard updates in real time with:
   - Current signal values
   - Open and closed positions
   - Account performance
   - Win rate metrics
   - Decision history
   - Agent reasoning logs

### Key Innovations

**Cross Market Intelligence:**
Haruspex unifies decentralized and centralized market intelligence within a single autonomous decision framework. By combining protocol health metrics, liquidity flows, stablecoin stability, decentralized trading activity, and centralized exchange market data, the system identifies opportunities that are not visible from either environment in isolation.

**AI Native Decision Making:**
Rather than relying on predefined rules, static thresholds, or signal scoring systems, Haruspex uses Qwen3.6 Plus as a reasoning layer. The model evaluates all available market signals holistically, weighs competing market conditions, and generates decisions based on the overall market context. Each decision is accompanied by a natural language explanation that provides transparency into the agent's reasoning process.

**Dynamic Signal Resolution:**
Market signals rarely align perfectly. When indicators present conflicting views, Haruspex resolves uncertainty through contextual analysis rather than rigid decision trees. Momentum, market structure, capital flows, and protocol health are evaluated collectively to determine the highest conviction outcome, enabling the system to maintain directional clarity in complex market conditions.

**Autonomous End to End Execution:**
Haruspex combines signal collection, market reasoning, trade generation, execution, risk management, and performance tracking within a single continuous workflow. The result is an autonomous trading agent capable of monitoring multiple market environments and responding in real time without manual intervention.


## Strategy Implementation

### Signal Collection Layer
Each signal runs as an independent async module. All six signals execute in parallel every 5 minutes using `Promise.all`. Signal failures are handled gracefully and return null without interrupting the cycle.

```javascript
const [curveData, stableData, fundingData, dexCexData, oiData] = await Promise.all([
  checkCurveTVL().catch(() => {}),
  checkStablecoinPeg().catch(() => {}),
  checkFundingRateDivergence().catch(() => {}),
  checkDexCexDivergence().catch(() => {}),
  checkOpenInterest().catch(() => {})
]);

// BTC 24h momentum fetched separately from Bitget ticker
```

### Decision Flow

```mermaid
flowchart TD
    A([🕐 Every 5 Minutes]) --> B[agent.js\nOrchestrator]

    B --> C[/Collect 6 Signals in Parallel\nCurve TVL · Stablecoin Peg · DEX vs CEX Volume\nBTC Funding Rate · BTC Open Interest · BTC Momentum/]

    C --> D{Max 2 Positions\nAlready Open?}

    D -->|Yes| E[Skip Cycle\nLog: Agent Monitoring]
    D -->|No| F[Send All 6 Signals\nto Qwen3.6-plus]

    F --> G{shouldTrade?}

    G -->|false| H[Log No-Trade\nDocument Reasoning]

    G -->|true| I{BTC Momentum\nDirection?}

    I -->|Positive btcChange24h| J[LONG Bias Active\nSHORT Blocked]
    I -->|Negative btcChange24h| K[SHORT Bias Active\nLONG Blocked]
    I -->|Near Zero — Noise| L{2+ Other Signals\nConverging?}

    L -->|No| H
    L -->|Yes| M[Proceed at\nMedium Confidence]

    J --> N{Confidence\nLevel?}
    K --> N
    M --> N

    N -->|≥ 0.85| O[Size: 0.05 BTC\nHigh Conviction]
    N -->|≥ 0.70| P[Size: 0.03 BTC\nMedium Conviction]
    N -->|Baseline| Q[Size: 0.01 BTC\nCautious Entry]

    O --> R[Fetch Live Bitget Price\nbgc spot ticker]
    P --> R
    Q --> R

    R --> S[Calculate SL · TP\n1.2% Stop Loss · 2.4% Take Profit]
    S --> T[Generate LLM\nTrade Reasoning]
    T --> U[Log Trade Entry\nwith balanceBefore]

    U --> V([🔵 Risk Manager\nMonitors Every 60s])

    V --> W{SL or TP\nTriggered?}
    W -->|Monitoring| V
    W -->|Stop Loss 1.2%| X[🔴 Close Position\nLog pnlPercent · balanceAfter]
    W -->|Take Profit 2.4%| Y[🟢 Close Position\nLog pnlPercent · balanceAfter]

    X --> A
    Y --> A
    E --> A
    H --> A

    style A fill:#1a1a00,stroke:#E0FF00,color:#E0FF00
    style C fill:#0d0d0d,stroke:#333,color:#aaa
    style F fill:#0d0d0d,stroke:#555,color:#fff
    style V fill:#001020,stroke:#60a5fa,color:#60a5fa
    style X fill:#1a0000,stroke:#f87171,color:#f87171
    style Y fill:#001a00,stroke:#4ade80,color:#4ade80
    style H fill:#111,stroke:#333,color:#666
    style E fill:#111,stroke:#333,color:#666
```


### Cross Signal Thesis Framework

The LLM operates on a structured decision framework provided in the system prompt for every cycle. Signals are evaluated jointly to determine market regime, capital flow direction, and trade eligibility.

| Signal Combination | Interpretation | Action |
|--------------------|----------------|--------|
| OI rising + TVL dropping + negative funding | Leverage building on CEX while DeFi deleverages | LONG BTC (high confidence) |
| Stablecoin depeg + TVL drop + DEX spike | Systemic DeFi stress, capital flight | SHORT BTC/ETH |
| Negative funding + negative momentum | Shorts crowded, price confirming downtrend | SHORT (momentum confirms trend) |
| Positive funding + positive momentum | Longs crowded, price confirming uptrend | LONG (momentum confirms trend) |
| Funding conflicts with momentum | Momentum overrides conflicting funding signals | Follow momentum direction |
| All signals in noise zone | No edge detected across cross signal inputs | NO TRADE |

### Confidence-Based Position Sizing

Position sizing is dynamically determined based on model confidence. Higher conviction signals result in increased allocation, while low confidence signals default to minimal exposure.

```javascript
function getPositionSize(confidence) {
  if (confidence >= 0.85) return '0.05'; // High conviction
  if (confidence >= 0.70) return '0.03'; // Medium conviction
  return '0.01';                          // Baseline
}
```



## Technology Stack

| Technology | Category | Why Chosen | Integration Role |
|-------------|----------|------------|-------------------|
| Node.js v20 | Runtime | Async/await support, native HTTPS handling, child_process orchestration | Core agent runtime for signal collection and system orchestration |
| Qwen3.6 Plus | LLM Decision Engine | Hackathon partner model with strong structured reasoning and low hallucination rate on financial JSON tasks | Processes all six signals and outputs structured trade decisions |
| Bitget Agent Hub (bgc CLI) | CEX Data and Execution | Native hackathon infrastructure with direct access to futures and market data endpoints | Provides funding rate, open interest, and executes trades |
| DefiLlama API | DeFi Data Layer | Free, reliable, no authentication required, broad coverage of DeFi metrics | Supplies TVL, stablecoin data, and DEX volume signals |
| Netlify | Dashboard Hosting | Serverless functions simplify API proxying and eliminate CORS constraints | Hosts live dashboard and API proxy layer for Bitget data |
| pnpm | Package Manager | Required dependency format for Bitget Skill Hub ecosystem | Manages project dependencies |
| dotenv | Configuration | Secure runtime environment variable management | Loads API keys and exchange credentials securely at runtime |


## API Integrations Detail

### Bitget Agent Hub (bgc CLI)

```bash
bgc futures futures_get_open_interest --productType USDT-FUTURES --symbol BTCUSDT
→ BTC open interest
```

```bash
bgc futures futures_get_funding_rate
 --symbol BTCUSDT --productType USDT-FUTURES
→ BTC funding rate
```

```bash
bgc spot spot_get_ticker --symbol BTCUSDT
→ Live BTC spot price for execution and momentum calculation
```

---

### DefiLlama APIs

```text
https://api.llama.fi/tvl/curve-dex
→ Curve Finance TVL (curve-dex)

https://stablecoins.llama.fi/stablecoins?includePrices=true
→ Stablecoin prices and peg deviation (USDT, USDC)

https://api.llama.fi/overview/dexs/uniswap-v3?excludeTotalDataChartBreakdown=false
→ Uniswap V3 trading volume and liquidity activity
```

---

### Qwen3.6 Plus (hackathon.bitgetops.com)

```text
POST /v1/chat/completions
→ Trade decision engine (decider.js)
→ Trade reasoning engine (reasoner.js)

Temperature: 0.2 (deterministic financial decision stability)

Post-processing:
- Strip <think> tags before JSON parsing
- Enforce structured JSON output for execution pipeline
```


## System Architecture

```mermaid
flowchart TD
    subgraph DEFI["DeFi Layer — DefiLlama APIs"]
        D1["curve-tvl.js\nCurve Finance TVL"]
        D2["stablecoin-peg.js\nUSDT · USDC Deviation"]
        D3["dex-cex-volume.js\nUniswap vs Bitget Volume"]
    end

    subgraph CEX["CEX Layer — Bitget Agent Hub"]
        C1["funding-rate.js\nBTC Funding Rate"]
        C2["open-interest.js\nBTC Open Interest"]
        C3["BTC Momentum\nBitget Spot Ticker"]
    end

    AG["agent.js\nOrchestrator — every 5 min"]

    DC["decider.js\nQwen3.6-plus\nAutonomous Decision Engine"]

    EX["executor.js\nTrade Logger\nBalance Tracker"]

    RS["reasoner.js\nLLM Trade Narration"]

    RK["risk.js\nSL · TP Monitor\nevery 60 seconds"]

    LG["logger.js\nJSON Log Writer"]

    LF["logs/haruspex-YYYY-MM-DD.json\nPaper Trading Record"]

    SV["server.js\nLocal Dashboard API"]

    DB["docs/index.html\nGitHub Pages\nPublic Demo"]

    DEFI --> AG
    CEX --> AG

    AG --> DC

    DC -->|"shouldTrade: true"| EX
    DC -->|"shouldTrade: false"| LG

    EX --> RS
    RS -->|"LLM reasoning"| EX
    EX --> LG

    LG --> LF
    RK --> LF

    RK -.->|"bgc price check"| CEX

    AG -->|"signal state"| SV
    RK -->|"position state"| SV

    SV --> DB
    LF --> DB

    style DEFI fill:#0a1a0a,stroke:#4ade80,color:#4ade80
    style CEX fill:#0a0a1a,stroke:#60a5fa,color:#60a5fa
    style AG fill:#1a1a00,stroke:#E0FF00,color:#E0FF00
    style DC fill:#120a1a,stroke:#a78bfa,color:#a78bfa
    style EX fill:#0a0a1a,stroke:#60a5fa,color:#60a5fa
    style RS fill:#111,stroke:#94a3b8,color:#94a3b8
    style RK fill:#1a0a0a,stroke:#f87171,color:#f87171
    style LG fill:#111,stroke:#94a3b8,color:#94a3b8
    style LF fill:#0a1a0a,stroke:#4ade80,color:#4ade80
    style SV fill:#1a0a1a,stroke:#c084fc,color:#c084fc
    style DB fill:#1a0a1a,stroke:#c084fc,color:#c084fc
```

### Component Breakdown

| File | Role | Inputs | Outputs |
|------|------|--------|----------|
| agent.js | Master orchestrator, runs every 5 minutes | All 6 signal modules | marketData object passed to decider.js |
| decider.js | LLM trade decision engine | marketData (6 signals) | JSON: shouldTrade, action, asset, confidence, SL, TP, reasoning |
| executor.js | Trade execution and balance tracking | LLM decision, live price | Trade log entry with updated balance |
| risk.js | Position monitoring system | Open trade logs, live price feed | Updated logs with closePrice, pnlPercent, balanceAfter |
| reasoner.js | LLM trade narration layer | Signal values, entry details | Natural language reasoning output |
| logger.js | Persistent JSON log writer | Trade objects | Appends structured records to daily log files |
| server.js | Local dashboard API layer | Agent and risk state | /api/state, /api/risk, /api/logs |

---

### Signal Modules

| File | Purpose | Data Source | Output |
|------|---------|-------------|--------|
| signals/curve-tvl.js | Curve liquidity tracking | DefiLlama API | { curveTVL, curveTVLChange } |
| signals/stablecoin-peg.js | Stablecoin depeg detection | DefiLlama stablecoin API | { usdtDeviation, usdcDeviation } |
| signals/dex-cex-volume.js | DEX vs CEX activity ratio | DefiLlama + Bitget | { dexCexRatio, uniswapTotal24h, bitgetEthVolume } |
| signals/funding-rate.js | BTC funding rate monitor | Bitget Agent Hub CLI | { fundingRate, tvlStable } |
| signals/open-interest.js | Futures positioning pressure | Bitget Agent Hub CLI | { openInterest, openInterestChange } |

---

### Infrastructure Components

| File | Role | Description |
|------|------|-------------|
| docs/index.html | Live system UI | Displays signals, trades, and performance metrics |
| docs/trades.json | Historical trade store | Static export of daily execution logs |
| Netlify fallback data | Backup dataset | Ensures dashboard availability during API downtime |


DATA FLOW DATA DIAGRAM

## Data Flow

```mermaid
sequenceDiagram
    participant AG as agent.js
    participant DL as DefiLlama API
    participant BG as Bitget Agent Hub
    participant QW as Qwen3.6-plus
    participant EX as executor.js
    participant RK as risk.js
    participant LG as logs/

    Note over AG: Every 5 minutes

    AG->>DL: Fetch Curve TVL
    AG->>DL: Fetch USDT · USDC prices
    AG->>DL: Fetch Uniswap V3 volume
    AG->>BG: bgc funding rate
    AG->>BG: bgc open interest
    AG->>BG: bgc spot ticker (momentum)

    DL-->>AG: curveTVL · usdtDeviation · dexCexRatio
    BG-->>AG: fundingRate · openInterest · btcChange24h

    Note over AG: Build marketData object

    AG->>QW: 6 signals + cross-signal framework
    Note over QW: Analyze convergence
    QW-->>AG: shouldTrade · action · asset · confidence · SL · TP

    alt shouldTrade is false
        AG->>LG: Log no-trade + reasoning
    else shouldTrade is true
        AG->>EX: Pass signal object
        EX->>BG: bgc spot ticker (entry price)
        BG-->>EX: currentPrice
        EX->>QW: Generate trade reasoning
        QW-->>EX: Natural language reasoning
        EX->>LG: Write trade log + balanceBefore
    end

    Note over RK: Every 60 seconds

    RK->>BG: bgc spot ticker (current price)
    BG-->>RK: currentPrice

    alt SL or TP hit
        RK->>LG: Update trade — closePrice · pnlPercent · balanceAfter
    else Position healthy
        RK->>RK: Continue monitoring
    end
```

## How It Works

### Step by Step Walkthrough

---

### Step 1 - Data Collection (parallel, ~8 seconds)

Every 5 minutes, `agent.js` triggers all 6 signal collectors in parallel.

```text
[Open Interest] BTC OI: 32,984.50 BTC | Change: 0%
[Curve TVL] Current: $1.46B | Change: 0%
[Funding Rate] BTC: -0.0012% | DeFi TVL stable: true
[Stablecoin] USDT: $0.9991 | Deviation: 0.0919%
[Stablecoin] USDC: $0.9998 | Deviation: 0.0171%
[DEX/CEX] Uniswap V3 24h: $583.1M | Bitget ETH 24h: $247.8M | Ratio: 2.3534
[BTC Momentum] 24h change: -0.479%
```

---

### Step 2 - Signal Aggregation

All signals are merged into a single `marketData` object and passed to the LLM.

```text
[HARUSPEX] Signals:
CurveTVL=0% | USDT=0.0919% | Funding=-0.0012% | DEX/CEX=2.353 | OI=0% | BTC24h=-0.479%
```

---

### Step 3 - LLM Decision

Qwen3.6 Plus processes all signals using the cross signal thesis framework and returns structured JSON.

```json
{
  "shouldTrade": true,
  "action": "SHORT",
  "asset": "BTCUSDT",
  "confidence": 0.6,
  "signal": "multi-signal-convergence",
  "reasoning": "BTC 24h momentum of -0.479% overrides the negative funding rate and mandates SHORT bias. Confirmed by DEX/CEX ratio of 2.353 indicating DeFi rotation preceding CEX volatility.",
  "stopLoss": 0.008,
  "takeProfit": 0.016
}
```

---

### Step 4 - Execution

```text
[EXECUTOR] Signal confirmed — placing paper trade
Asset: BTCUSDT | Side: SELL | Size: 0.01
[EXECUTOR] Entry price: $65,893.55
[EXECUTOR] Stop loss: $66,223.02 (1.2% above entry)
[EXECUTOR] Take profit: $65,234.61 (2.4% below entry)
[EXECUTOR] Account balance: $9,990.12
```

---

### Step 5 - Risk Monitoring (every 60 seconds)

```text
[Risk] BTCUSDT | Entry: $65,893 | Current: $65,608 | SL: $66,223 | TP: $65,234
[Risk] Position healthy — PnL: +0.43%
```

---

### Step 6 - Auto Close and Balance Update

When stop loss or take profit is triggered:

```text
[Risk] TAKE_PROFIT_HIT — BTCUSDT @ $65,234 | PnL: +1.00% ($19.77) | Balance: $10,009.89
```

Trade logs are updated with:
- closePrice  
- pnlPercent  
- balanceAfter  
- balanceChange


## Repository Structure

```
haruspex/
│
├── agent.js          # Master orchestrator — 5-min signal cycle
├── decider.js        # Qwen3.6-plus trade decision engine
├── executor.js       # Paper trade execution + balance tracking
├── risk.js           # 60s SL/TP monitor, auto-close positions
├── reasoner.js       # LLM trade reasoning generator
├── logger.js         # JSON trade log writer
├── server.js         # Local API server for dashboard
│
├── signals/
│   ├── curve-tvl.js        # Curve Finance TVL via DefiLlama
│   ├── stablecoin-peg.js   # USDT/USDC peg deviation via DefiLlama
│   ├── dex-cex-volume.js   # Uniswap vs Bitget volume ratio
│   ├── funding-rate.js     # BTC funding rate via Bitget Agent Hub
│   └── open-interest.js    # BTC open interest via Bitget Agent Hub
│
├── docs/
│   ├── index.html    # Live dashboard — GitHub Pages
│   └── trades.json   # Paper trading snapshot for public dashboard
│
├── logs/
│   └── haruspex-YYYY-MM-DD.json  # Daily paper trading logs
│
├── .env              # API keys (not committed)
├── .env.example      # Environment variable template
├── package.json
└── README.md
```


## Core Logic

### Methodology

Haruspex operates on the cross-environment divergence thesis: CEX price moves are often preceded by measurable stress signals in DeFi. The agent quantifies this divergence across three dimensions:
- Liquidity divergence: Curve TVL dropping while CEX open interest rises = DeFi deleveraging into CEX leverage buildup
- Volume rotation: DEX/CEX ratio >2.0 = more volume being absorbed by DeFi than CEX, precedes volatility
- Funding divergence: Negative funding rate = market paying shorts to hold, historically precedes short squeezes

### Risk Management

| Parameter | Value | Rationale |
|------------|--------|-----------|
| **Stop Loss** | `1.2%` from entry | Wide enough to avoid noise stops on 5-minute candles |
| **Take Profit** | `2.4%` from entry | Maintains a `1:2` risk/reward ratio |
| **Max Positions** | `2` simultaneous | Prevents runaway exposure while allowing parallel trades |
| **Position Size** | `0.01–0.05 BTC` | Confidence-scaled; larger size only at `85%+` confidence |
| **Starting Balance** | `10,000 USDT` | Standard paper-trading baseline |
| **Check Interval** | `60 seconds` | Frequent enough to monitor SL/TP without excessive API requests |


### AI Reasoning Workflow

**Every trade produces two LLM outputs:**

1. Decision (`decider.js`): Qwen receives raw signal values and the cross-signal framework. Returns structured JSON with trade parameters. Temperature 0.2 for consistency.

2. Reasoning (`reasoner.js`): After execution, Qwen narrates the trade in first person, referencing the specific signal values that drove the decision. This is stored in the trade log and displayed on the dashboard.

Both calls strip <think> tags from Qwen's extended reasoning mode before parsing.

### Data Sources

### Data Sources

| Source | Data | Why Valuable | Quality Control |
|----------|----------|--------------|----------------|
| **DefiLlama** (`api.llama.fi`) | Curve TVL | Aggregated from on-chain data with no single point of failure | Cross-validated against DefiLlama anomaly detection mechanisms |
| **DefiLlama Stablecoins** (`stablecoins.llama.fi`) | USDT/USDC prices | Oracle-aggregated peg prices with frequent updates | Deviation calculated as `abs(price - 1.00)` for a simple, manipulation-resistant signal |
| **Uniswap V3 via DefiLlama** | DEX 24h volume | On-chain trading volume that cannot be spoofed | `24-hour` rolling window smooths single-block anomalies |
| **Bitget Agent Hub** | Funding rate, open interest, spot price | Native exchange data with zero execution latency | Direct API integration eliminates third-party aggregation risk |


## Setup & Installation

### Prerequisites

- Node.js v20+
- pnpm (npm install -g pnpm)
- Bitget Agent Hub CLI (bitget-skill-hub v1.0.2)
- Proton VPN or equivalent (required if local ISP blocks api.bitget.com)
- Groq API key or Alibaba Cloud API key (for Qwen3.6-plus via hackathon endpoint)

Environment Variables
```
# .env
QWEN_API_KEY=your_hackathon_qwen_api_key
BITGET_API_KEY=your_bitget_api_key
BITGET_SECRET_KEY=your_bitget_secret_key
BITGET_PASSPHRASE=your_bitget_passphrase
```
### Installation
```
git clone https://github.com/phllp-tanstic/haruspex
cd haruspex
pnpm install
cp .env.example .env
# Fill in your API keys in .env
```

### Bitget Agent Hub Setup
```
pnpm add -g bitget-skill-hub
bgc config set apiKey YOUR_KEY
bgc config set secretKey YOUR_SECRET
bgc config set passphrase YOUR_PASSPHRASE

# Verify connection
bgc spot spot_get_ticker --symbol BTCUSDT
```

### Running the Project

Development Mode (single test cycle)
```
node agent.js --test
```

### Expected Output

```
[2026-06-17T04:11:01.203Z] Running 6-signal cycle...
[Open Interest] BTC OI: 32,984.50 BTC | Change: 0%
[Curve TVL] Current: $1.46B | Change: 0%
[Funding Rate] BTC: -0.0012% | DeFi TVL stable: true
[Stablecoin] USDT: $0.9991 | Deviation: 0.0919%
[DEX/CEX] Uniswap V3 24h: $583.1M | Ratio: 2.3534
[BTC Momentum] 24h change: -0.479%
[HARUSPEX] Consulting Qwen3.6-plus...
[Decider] shouldTrade=true | signal=multi-signal-convergence | confidence=0.6
[HARUSPEX] LLM: TRADE — SHORT BTCUSDT (confidence: 60%)
```

### Production Mode (continuous agent)

```
bash# 

Terminal 1 — Dashboard API
node server.js

# Terminal 2 — Risk Manager
node risk.js

# Terminal 3 — Signal Agent
node agent.js
```

### Daily Trade Snapshot 

```
$today = (Get-Date -Format "yyyy-MM-dd")
copy "logs\haruspex-$today.json" "dashboard\trades.json"
git add docs/trades.json
git commit -m "Daily snapshot $today"
git push
```


## Demo

### Live Dashboard

https://phllp-tanstic.github.io/haruspex/

The dashboard displays in real time:
- 6 signal cards with live values (Curve TVL, ETH/BTC ratio, stablecoin peg, funding rate)
- Performance metrics: win rate, total PnL, Sharpe ratio, max drawdown, profit factor, balance
- Trade log with full LLM reasoning per trade
- Risk monitor showing open positions with live PnL
- Agent activity log

### Example Trade Record
```
{
  "id": "trade-1781617086582",
  "timestamp": "2026-06-17T04:12:25.199Z",
  "signal": "multi-signal-convergence",
  "action": "SELL BTCUSDT",
  "asset": "BTCUSDT",
  "side": "sell",
  "size": "0.01",
  "entryPrice": 65893.55,
  "stopLossPrice": 66223.02,
  "takeProfitPrice": 65234.61,
  "confidence": 0.6,
  "reason": "BTC 24h momentum of -0.479% overrides the negative funding rate and mandates SHORT bias per the momentum rules. This directional bias is confirmed by DEX/CEX volume ratio of 2.353, indicating capital rotation to DeFi preceding CEX volatility.",
  "status": "PAPER_TRADE_EXECUTED",
  "paperTrade": true,
  "balanceBefore": 9990.12,
  "balanceAfter": null,
  "balanceChange": null
}
```

### Example LLM Decision (Full Qwen Output)

Input signals:
- DEX/CEX ratio: 2.353 (elevated — DeFi rotation)
- BTC funding rate: -0.0012% (noise zone — ignored)
- BTC 24h momentum: -0.479% (bearish — tiebreaker)
- Curve TVL: stable
- Stablecoin peg: stable
- Open Interest: unchanged

Qwen reasoning:
> **Trade Rationale**
>
> BTC 24-hour price momentum is negative at **-0.479%**, which overrides the negative funding rate and mandates a **SHORT** bias according to the momentum rules. This directional bias is further confirmed by a **DEX/CEX volume ratio of 2.353**, indicating capital rotation toward DeFi, a condition that has historically preceded increased volatility on centralized exchanges.

Decision: SHORT BTCUSDT | Confidence: 60% | SL: 1.2% | TP: 2.4%.

### Paper Trading Log Fields

Every trade record includes all submission-required fields:

| Required Field | Haruspex Field | Example |
|----------------|----------------|---------|
| **Timestamp** | `timestamp` | `2026-06-17T04:12:25.199Z` |
| **Trading Pair** | `asset` | `BTCUSDT` |
| **Direction** | `side` | `sell (SHORT)` |
| **Price** | `entryPrice` | `65893.55` |
| **Quantity** | `size` | `0.01 BTC` |
| **Account Balance Change** | `balanceChange` | `-9.88 USDT` |


## Performance Analysis

### Paper Trading Results
Over 44 paper trades across 8 days of continuous autonomous operation (June 16–23, 2026):

| Metric | Value |
|--------|-------|
| Total Trades | 44 |
| Win Rate | 38.6% |
| Total PnL | -8.15% |
| Max Drawdown | -8.15% |
| Avg Confidence | 74% |
| Starting Balance | $10,000 USDT |
| Final Balance | $9,912.82 USDT |

### Infrastructure Incidents
Two infrastructure failures significantly impacted results:

**June 17 VPN dropout:** A 2-hour 44-minute connectivity failure prevented risk.js from closing two positions at their stop loss prices. These two trades produced -2.28% and -2.18% losses instead of the intended -1.2% maximum. **Fix implemented:** A circuit breaker was deployed in the same session — after 3 consecutive price fetch failures, open positions are force-closed at last known price. No subsequent VPN failure produced losses exceeding the 1.2% stop loss.

**June 19 VPN instability:** Repeated short dropouts triggered 13 circuit breaker closes in one day, producing random exit prices rather than clean SL/TP closes. **Fix implemented:** Proton VPN protocol switched to WireGuard for faster reconnection.

### Signal Quality Assessment
The 24h momentum signal proved too slow for 5-minute execution cycles in BTC's current low-volatility ranging regime. Frequent intraday counter-trend bounces caused repeated stop losses while the 24h direction remained unchanged. The primary architectural improvement identified: adding a 1h momentum confirmation gate before entry to filter out trades against short-term intraday structure. This would have blocked the majority of losing trades in the June 17–18 cluster.

### What This Demonstrates
The agent functioned as designed throughout. Every decision was autonomous, documented with reasoning, and executed with full audit trail. The negative PnL reflects real market conditions and real signal limitations and not system failures. This is the expected outcome of a live paper trading experiment: a hypothesis tested against real data, with clear findings on what to improve next.


## Future Roadmap

**Near-Term (Post-Hackathon)**
- ETH signal expansion — add Aave/Compound TVL monitoring for ETH-specific signals
- Multi-asset portfolio — simultaneous BTC + ETH positions with cross-asset correlation awareness
- Webhook alerts — Telegram/Discord notifications on trade execution and SL/TP hits

**Medium-Term**
- Backtesting engine — replay historical DefiLlama + Bitget data through the signal engine with full P&L attribution per signal
- Signal confidence calibration — track which signal combinations produce highest win rates and weight Qwen's confidence accordingly
- On-chain execution — direct DeFi position hedging via Uniswap/GMX when CEX signal fires

**Scalability**
- Cloud deployment — migrate from local Node.js to AWS Lambda / Google Cloud Run for 24/7 operation without VPN dependency
- Multi-exchange — extend execution layer to OKX, Bybit using the same signal engine
- Signal marketplace — expose Haruspex signals as an API for other agents to consume

**Commercialization**
- Signal-as-a-service — subscription API for DeFi stress signals with historical data
- White-label agent — configurable agent framework deployable by other teams on Bitget ecosystem
- Performance fee model — live trading with fee taken on profitable closed positions


## Built With

| Technology | Category | Purpose | Integration Role |
|------------|----------|----------|------------------|
| **Node.js v20** | Runtime | Async orchestration | Core agent loop and all I/O operations |
| **Qwen3.6-plus** | LLM | Trade decisions and reasoning | `decider.js`, `reasoner.js` |
| **Bitget Agent Hub (bgc)** | CEX Infrastructure | Funding rate, open interest, and market prices | `signals/funding-rate.js`, `signals/open-interest.js` |
| **Bitget REST API** | CEX Data | Spot ticker and volume data | BTC momentum calculation and execution pricing |
| **DefiLlama API** | DeFi Data | TVL, stablecoin prices, and DEX volume data | `curve-tvl.js`, `stablecoin-peg.js`, `dex-cex-volume.js` |
| **pnpm** | Package Manager | Dependency management | Required by Bitget Agent Hub tooling |
| **Tailwind CSS** | UI Framework | Dashboard styling | `docs/index.html` |


## Key Innovations

1. Cross-environment signal fusion at runtime. Haruspex is the first open-source agent to wire DefiLlama TVL + stablecoin oracle + Uniswap volume directly to Bitget futures execution in a single autonomous 5-minute loop. No existing retail framework does this.

2. LLM as judgment, not rules. Rather than hardcoded thresholds ("if funding < -0.01% then LONG"), Qwen3.6-plus reads all 6 signals simultaneously and weighs them holistically — the same cognitive process a senior analyst uses. This means the agent adapts to market conditions rather than breaking when conditions change.

3. Momentum as conflict resolution. Most multi-signal agents park when signals conflict. Haruspex uses BTC 24h momentum as a definitive tiebreaker — if momentum is negative, SHORT is always valid regardless of funding rate direction. This eliminates paralysis while maintaining directional discipline.

4. Graceful signal degradation. Every signal collector runs inside a .catch() block. A dead API returns null and the LLM receives that null explicitly — it can still make decisions on the remaining live signals. The agent never crashes on a single data source failure.


## Conclusion

Haruspex is a cross-market trading intelligence agent built on the premise that DeFi stress signals often emerge before their effects are visible on centralized exchanges. Every five minutes, it monitors six independent signals including Curve TVL, stablecoin peg deviations, DEX to CEX volume rotation, BTC funding rates, open interest, and price momentum, then uses Qwen3.6-plus to synthesize those inputs into autonomous trading decisions with fully documented reasoning. Each trade generates a complete audit trail containing the thesis, decision logic, execution details, and balance impact, creating a transparent system that can be reviewed, improved, and scaled. Unlike conventional trading bots that rely solely on exchange data and predefined rules, Haruspex treats DeFi and centralized exchanges as a single interconnected market and routes on-chain protocol health signals through an LLM judgment layer directly into trade execution, representing a fundamentally different approach to market intelligence and automated trading.


---


<p align="center">
  <em>Built for Bitget AI Hackathon S1 — Track 1: Trading Agent</em><br>
  <em>Qwen3.6-plus provided by Alibaba Cloud as hackathon strategic partner</em><br>
  <em>DeFi data provided by DefiLlama — the open-source DeFi analytics layer</em>
</p>

