<div align="center">

# MicroLedger
### Small entries. A clearer picture of your spending.

**A personal expense tracker built around everyday life in Pakistan.**

![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Currency](https://img.shields.io/badge/Currency-PKR-F97316?style=flat-square)
![Storage](https://img.shields.io/badge/Storage-Browser_local-334155?style=flat-square)

[Quick start](#getting-started) &nbsp; • &nbsp; [Features](#features) &nbsp; • &nbsp; [Troubleshooting](#troubleshooting) &nbsp; • &nbsp; [Contribute](CONTRIBUTING.md)

</div>

---

## Your money, one entry at a time

MicroLedger helps you record purchases, set a budget, and explore where your money goes. Start with a simple note such as **“Petrol 3000”**, upload a receipt, or fill in the details yourself.

| ✍️ Write it | 🧾 Capture it | 📊 Understand it |
| :--- | :--- | :--- |
| Describe a purchase in a short note. | Upload a receipt and review the extracted fields. | Explore transactions, spending, and your budget. |

> The current interface also uses the name **SmartSpend**. This repository is named **MicroLedger**.

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

You need **Git**, **Node.js 22.12+ (or a newer supported release)**, and **npm**. Check your installation with `node --version` and `npm --version`.

A Gemini API key is optional for getting started with manual entry. Smart parsing attempts Gemini when a key is configured.

### 1. Clone into a folder you own

Run each command separately. If a command fails, resolve it before continuing.

**Windows PowerShell**

```powershell
cd $env:USERPROFILE
git clone https://github.com/SYEDUMAR246/MicroLedger.git
cd MicroLedger
npm ci
```

**macOS / Linux**

```sh
cd ~
git clone https://github.com/SYEDUMAR246/MicroLedger.git
cd MicroLedger
npm ci
```

Use a normal terminal; Administrator access is not required. On Windows, do not clone inside `C:\Windows\System32`.

The committed lockfile pins dependency versions. `npm ci` installs from it and replaces any existing `node_modules` folder. The esbuild dependency has been aligned with Vite's required range.

### 2. Create your local configuration

These commands create `.env` only if it does not already exist, preserving any API key you have configured.

**PowerShell**

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

**macOS / Linux**

```sh
test -f .env || cp .env.example .env
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

When the terminal prints **Server listening on port 3000**, open **http://localhost:3000** (or the port you configured).

Keep the terminal open while using the app. Press **Ctrl+C** to stop it. To start it again later, open a terminal in your MicroLedger folder and run `npm run dev`.

## Troubleshooting

| Message or symptom | What to do |
| --- | --- |
| `Permission denied` or `EPERM` in System32 | Run `cd $env:USERPROFILE`, then clone there. Run npm commands inside the cloned MicroLedger folder. |
| `ERESOLVE` mentioning esbuild 0.25 | You have an older dependency manifest. The updated repository uses esbuild 0.28.2 and a lockfile. For an unmodified clone, run `git pull --ff-only`, then `npm ci`. Preserve local edits before updating. |
| `npm ci` says the lockfile and package.json disagree | Check for local dependency edits. Use matching files from the same repository revision; do not bypass resolution with `--force`. |
| `EBADENGINE` | Check `node --version` and use Node.js 22.12+ or a newer supported release. |
| `node-domexception` deprecation notice | This dependency warning does not by itself mean installation failed. Check the final command result. |
| Older checkout shows a Vite `__dirname` warning | The updated config uses `import.meta.dirname`. The old warning concerns future config loading and did not block startup. |
| `Server listening on port 3000` | Startup succeeded. Open http://localhost:3000. |
| `EADDRINUSE` | Another process is using the port. Stop the earlier app with Ctrl+C, or set another port. |

To use another port in PowerShell:

```powershell
$env:PORT = "3001"
npm run dev
```

Then open http://localhost:3001. Browser storage is separate for each port, so records from port 3000 will not automatically appear on 3001.

See [the architecture guide](docs/ARCHITECTURE.md#troubleshooting) for receipt, storage, and deployment troubleshooting.

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

A dependency lockfile is committed for repeatable installs. There is currently no automated test script.

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
