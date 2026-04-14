# Crypto DCA Backtester

A browser-based tool for simulating and comparing Dollar-Cost Averaging (DCA) investment strategies against historical cryptocurrency prices. No account, no API key, no setup required — loads instantly with bundled data.

## What it does

Dollar-Cost Averaging means investing a fixed amount at regular intervals instead of buying all at once. This app lets you test how that strategy would have performed historically and compare it against alternatives.

Given a coin, an investment amount, a frequency, and a date range, the backtester calculates:

- How much you would have invested in total
- What your portfolio would be worth today
- Your average cost basis across all purchases
- How each strategy compares to simply investing everything on day one (lump sum)

## Strategies

| Strategy            | How it works                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **DCA**             | Fixed amount invested at every interval                                                                          |
| **Lump Sum**        | Entire budget deployed on day one                                                                                |
| **Value Averaging** | Adjusts each investment to keep the portfolio on a target growth curve — buys more when lagging, less when ahead |
| **Smart DCA**       | Uses a 20-period moving average to size investments — buys 1.5× when price is below the SMA, 0.5× when above     |

## Charts

Three chart libraries are used, each for what it does best:

**lightweight-charts (TradingView)**

- Full price history with zoom and pan
- Baseline series: area turns green when price is above your average cost basis, red when below
- Purchase markers on the price line (green = bought below avg cost, red = above)

**Recharts**

- Portfolio value over time for each active strategy
- Strategy comparison bar chart (final value side by side)
- Cumulative invested vs portfolio value (shows the gap between what you put in and what you have)

**D3**

- **Return heatmap** — matrix of every possible start date × holding period, colored by total return. Answers: "when was the best time to start?"
- **Drawdown waterfall** — percentage drop from peak over time, with the worst drawdown marked
- **Purchase scatter** — every buy plotted as a bubble on the price curve; bubble size = investment amount
- **Return distribution** — histogram of daily returns with a KDE density curve overlaid

## Metrics

- Total invested and final portfolio value
- Total return % and annualized return (CAGR)
- Max drawdown (worst peak-to-trough loss)
- Sharpe ratio and Sortino ratio
- Average cost basis
- DCA vs lump sum delta
- Time spent in profit (% of days portfolio was above invested amount)

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The app loads immediately with a preset (BTC weekly $100 since Jan 2020) using bundled historical data — no API key needed.

## Using the app

**Presets** — four pre-configured scenarios appear at the top. Click any to load it instantly.

**Configuration panel** (left sidebar):

- Pick a coin (BTC or ETH with bundled data)
- Set the amount per investment period
- Choose frequency: daily, weekly, or monthly
- Set the date range
- Toggle which strategies to compare
- Adjust the fee rate (default 0.1%, typical for major exchanges)

**Results** update reactively as you change any setting. All metric cards animate to their new values.

**Theme toggle** — top right, switches between dark and light mode.

## Data

Bundled historical data covers:

- **Bitcoin** — Jan 2018 to present (~2,900 daily data points)
- **Ethereum** — Jan 2018 to Dec 2024 (~2,500 daily data points)

Data is committed to the repo so the app works offline and loads without any network requests.

## Tech

- React 19 + Vite
- Tailwind CSS v4
- lightweight-charts v5, Recharts v3, D3 v7
- React Context + useMemo for state (no external state library)
- TypeScript 6, ESLint, Prettier, Husky
