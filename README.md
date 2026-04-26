# FinTrack

A personal finance dashboard built with React + Vite. Track savings, loans, expenses, and net worth with AI-powered insights.

## Features

- **Dashboard** — Financial health score, net worth, monthly spend overview
- **Savings** — Goals, Emergency Fund, SIP tracker with progress
- **Loans** — EMI tracker, debt-to-income ratio, prepayment intelligence
- **Expenses** — Monthly breakdown table with spend vs paycheck chart
- **AI Insights** — Auto-generated actionable recommendations from your data
- **Simulator** — SIP growth and loan prepayment what-if scenarios
- **Export** — Download any section as Excel (.xlsx)

## Tech Stack

- React 18, React Router v6
- Recharts (charts)
- Lucide React (icons)
- XLSX (Excel export)
- Vite (build tool)

## Getting Started

```bash
cd fintrack
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Usage

- Sign in with any email + password — each email gets its own private data workspace stored in your browser's localStorage
- Use **Continue with Demo Account** to explore with sample data
- All data is stored **locally in your browser** — nothing is sent to any server

## Deployment

```bash
npm run build
```

Deploy the `dist/` folder to any static host (GitHub Pages, Netlify, Vercel).

### GitHub Pages (quick deploy)

```bash
npm install -D gh-pages
```

Add to `package.json` scripts:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

Add to `vite.config.js`:
```js
base: '/fintrack/'
```

Then run:
```bash
npm run deploy
```

## Notes

- Data is per-user and per-browser — clearing browser storage resets data to the sample dataset
- No backend or authentication server — suitable for personal/trusted use among 2–3 users
