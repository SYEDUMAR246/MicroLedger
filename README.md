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

> **MicroLedger** brings your expense records, monthly budget and regular payments into one clear view.

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

A dependency lockfile is committed for repeatable installs. Run `npm test` for automated financial, storage and planning regression tests.

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

The deployment needs a Node.js server for `/api/parse-expense`; static hosting alone does not provide this endpoint. The start command uses `tsx`, included in runtime dependencies.

## Data and current limitations

- Transactions, receipt previews, budget settings, and notifications are stored in browser `localStorage`. Clearing site data can remove them; there is no server database or account sync.
- Smart Note and receipt extraction send the supplied text/image to the Express API. When Gemini is configured, that input may also be sent to Google for processing.
- Currency is fixed to **PKR**; this is not a currency conversion tool.
- The dashboard, ledger and analytics use the selected calendar month. Daily allowance divides the remaining monthly budget by calendar days remaining; planned but unlogged bills are not deducted.
- Category limits are repeating monthly targets shared across months. Their total cannot exceed the monthly budget.
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


### Backups and recovery

Open **Backups & recovery** near the bottom of any view. **Download backup** exports every month, attached receipts, budget, category limits, recurring schedules, notifications, and the last delete recovery data as a versioned JSON file. Keep a copy outside your browser.

Choose **Restore backup** to preview a file, then **Confirm merge & restore**. Restore adds missing expenses and notifications, keeps current records when IDs match, and restores the backed-up budget. Repeating a restore does not duplicate records. Invalid files leave your ledger unchanged.

**Undo delete** recovers the last deletion or clear-all operation, including receipts. It survives a refresh and remains available until another deletion. Backups can include those recoverable deleted records.

Changes are confirmed only after browser storage succeeds. A failed expense or budget save keeps its form open for retrying. If storage is full, download a backup before freeing space. If saved data cannot be read, the app preserves it, offers a raw recovery download, and can restore a valid backup after saving a separate copy of the original data. Recovery downloads are for diagnosis; use a normal MicroLedger backup for automatic restore. Backups contain your private expense and receipt data; store them somewhere you trust.

Run `npm test` for financial parsing, storage failure, migration, restore, and undo regression tests.


### Monthly planning

The Home dashboard shows month-specific spending, remaining budget (or the amount over budget), a daily allowance, and a comparison with the previous full month. Month arrows and the month picker work across all views. Comparisons use whole calendar-month totals, so an incomplete month is not a like-for-like comparison.

Use **Set limits** in the category panel to divide the overall monthly budget. Blank fields remove a category limit. Lower category allocations before reducing the overall budget below their total.

Use **Add recurring** for monthly rent, bills or subscriptions. Choose a first due date and planned amount. **Review payment** lets you confirm the actual amount and payment date; saving adds an expense and advances that schedule by one month in the same snapshot. Nothing is logged automatically. A due day of 31 uses the last day in shorter months, then returns to 31 when possible. Overdue occurrences advance one at a time. Pause or resume schedules as needed.

Backups include category limits and recurring schedules. Restore replaces category targets with the backed-up targets, adds missing schedules, and preserves the progress of matching existing schedules. Version 1 backups created before planning features remain supported; they contain no category targets to restore.


## Mobile release

The mobile interface uses **Home**, **Activity**, **Plan**, and **Profile**. Home shows spending after unpaid scheduled bills, a real savings goal, editable quick-entry shortcuts, and the latest three expenses. Category limits, recurring schedules, goals and insights live in Plan. Export/restore and record recovery live in Profile.

Quick-entry amounts are editable suggestions. Every shortcut opens a review form; nothing is saved until you confirm. Smart Note accepts English and Roman Urdu. Voice entry is available only when the browser supports its speech-recognition service and the user grants microphone permission; text entry remains available.

Savings contributions record money already set aside. They do not move money or create an expense. Matching goals keep their current contributions when merging backups. The Home reservation includes outstanding monthly bill occurrences due by the selected month’s end, including overdue bills; paused rules are excluded. Closed months show recorded spending without reconstructing historical unpaid bills.

Entry sheets, button feedback, save confirmation, recent entries and goal progress use short animations. Reduced-motion device settings are respected. Save success appears only after the ledger snapshot has been written successfully.

Production setup: run `npm ci`, `npm test`, `npm run lint`, and `npm run build`. Start the Node server with `NODE_ENV=production npm start` (set the environment variable separately in PowerShell). Configure `PORT` and, for receipt AI, `GEMINI_API_KEY` in the hosting environment. GitHub stores the source; GitHub Pages alone cannot run the Express parsing API.
