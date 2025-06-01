# DeFi Lending Market Dashboard

A clean, minimal dashboard for monitoring DeFi lending markets across CurveLend and FraxLend protocols.

## Features

- Real-time market data display
- Sortable columns
- Market information modal with contract links
- Auto-refresh every 5 minutes
- Last update timestamp
- Minimal black and white design with token logos

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Technologies Used

- React
- TypeScript
- Vite
- Chakra UI
- TanStack Table
- date-fns
- Axios

## Data Source

Market data is fetched from the [open-data repository](https://github.com/wavey0x/open-data/blob/master/resupply_market_data.json).
