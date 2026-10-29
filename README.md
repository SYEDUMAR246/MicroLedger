# MicroLedger

**Everyday expense tracking in Pakistani Rupees — with manual entry, smart notes, and receipt-assisted input.**

MicroLedger is a React and TypeScript web app for recording expenses, setting a budget, and understanding spending. Describe a purchase such as `Petrol 3000`, upload a receipt image, or enter the details yourself.

> The current interface also uses the name **SmartSpend**. This repository is named **MicroLedger**.

[Get started](#getting-started) · [How it works](docs/ARCHITECTURE.md) · [Contribute](CONTRIBUTING.md) · [Report a bug](https://github.com/SYEDUMAR246/MicroLedger/issues/new?template=bug_report.md)

## Features

| Feature | What you can do |
| --- | --- |
| Manual expense entry | Record an amount, category, date, time, merchant, and notes. |
| Smart Note | Turn a short expense description into editable fields. |
| Receipt input | Upload a receipt image, extract details, and review before saving. |
| Expense management | View, edit, and delete transactions; filter by date. |
| Budget overview | Adjust a PKR budget target and view spending against it. |
| Analytics | Explore spending through the analytics view. |
| Local persistence | Keep transactions, budget settings, and notifications in the current browser. |

Categories include Food & Dining, Groceries, Transportation, Entertainment, Utilities, Shopping, Healthcare, Travel, and Other.

## Getting started

You need Git, Node.js and npm compatible with the dependencies in [package.json](package.json). A Gemini API key enables the server's AI parsing attempt; manual entry does not require a key.

### 1. Install

```sh
git clone https://github.com/SYEDUMAR246/MicroLedger.git
cd MicroLedger
npm install
```

### 2. Configure your environment

Copy [.env.example](.env.example) to `.env`.

**PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux**
```sh
cp .env.example .env
```

Set `GEMINI_API_KEY` in `.env` if you want to use Gemini. Keep your real key out of commits and issue reports. In AI Studio, the key can be provided through its Secrets panel.

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Enables Gemini parsing when a non-placeholder key is provided. |
| `PORT` | Server port; defaults to `3000`. |
| `NODE_ENV` | Set to `production` to serve the built frontend. |
| `DISABLE_HMR` | Set to `true` to disable Vite hot reload/file watching. |
| `APP_URL` | Included in the example environment; not currently read by the application code reviewed for this guide. |

### 3. Run locally

```sh
npm run dev
```

Open **http://localhost:3000** (or the port you configured). This starts the Express API and Vite together.

## Try your first expense

1. Open **Add New Expense**.
2. Use **Manual Form**, or select **Smart Note** and enter `Dinner at Savour Foods 1450`.
3. For a smart note or receipt, request extraction.
4. Review the amount, merchant, category, date, and time.
5. Save the expense and check the expense list and analytics.

**Always review extracted values.** If Gemini is unavailable, fails, or exceeds the server's three-second timeout, the server falls back to a rule-based parser. Its receipt handling can return hard-coded sample values; it does not perform OCR on the uploaded image. A successful fallback response is not proof that a receipt was read accurately.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express server with Vite development middleware. |
| `npm run lint` | Run TypeScript checking (`tsc --noEmit`). |
| `npm run build` | Build the frontend into `dist/`. |
| `npm start` | Start the Express server; production mode requires `NODE_ENV=production`. |
| `npm run preview` | Preview the Vite frontend only; it does not start the expense parsing API. |

There is currently no automated test script or committed dependency lockfile.

### Serve a production build

Build first with `npm run build`, then start the server:

**PowerShell**
```powershell
$env:NODE_ENV = "production"
npm start
```

**macOS / Linux**
```sh
NODE_ENV=production npm start
```

The deployment needs a Node.js server for `/api/parse-expense`; static hosting alone does not provide this endpoint. The current start command uses `tsx`, which is in `devDependencies`, so it must be available in the runtime installation.

## Data and current limitations

- Transactions, receipt previews, budget settings, and notifications are stored in browser `localStorage`. Clearing site data can remove them; there is no server database or account sync.
- Smart Note and receipt extraction send the supplied text/image to the Express API. When Gemini is configured, that input may also be sent to Google for processing.
- Currency is fixed to **PKR**; this is not a currency conversion tool.
- The home spending total currently includes all stored transactions, even though the budget is described as monthly.
- Some welcome text and fallback date values are fixed to October 2026.
- Gemini availability depends on the configured key and the model used in `server.ts`.
- This repository contains a web app; an Android package and Play Store publishing workflow are not included.

## Project guide

| Path | Responsibility |
| --- | --- |
| [src/App.tsx](src/App.tsx) | App state, local storage, expense actions, and navigation. |
| [src/components/](src/components/) | Entry forms, budget controls, lists, analytics, and modals. |
| [src/types.ts](src/types.ts) | Shared types and formatting helpers. |
| [src/data/](src/data/) | Initial transaction data and sample receipt helpers. |
| [server.ts](server.ts) | Expense parsing API and frontend serving. |
| [vite.config.ts](vite.config.ts) | Vite, React, and Tailwind configuration. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data flow and troubleshooting. |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development checks and focused pull requests. Use the issue templates for reproducible bugs or feature proposals.

## License

No repository-level `LICENSE` file is currently included. Some source files contain Apache-2.0 headers; consult those notices and clarify repository-wide licensing with the owner before reuse.
