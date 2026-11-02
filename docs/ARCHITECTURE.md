# Architecture and troubleshooting

MicroLedger is a React application served by Express. It stores the ledger in the current browser; there is no server database or account sync.

## Entry and personalization

1. `App` reads and validates the ledger snapshot. Unreadable originals are preserved for recovery.
2. First-run setup collects a name, companion, monthly budget, optional category limits and an optional goal. Finishing setup saves one complete snapshot. An unfinished setup does not change the saved ledger.
3. Manual entry collects editable fields. Type uses the shared deterministic parser in the browser, including English and Roman Urdu notes with one clear PKR amount.
4. Scan uploads a resized PNG/JPEG/WebP receipt to `POST /api/parse-expense`. The server runs Tesseract OCR with bundled English language data, then validates an explicitly labelled final total. It does not send the receipt to a third-party AI service or use sample values as a fallback.
5. Extracted fields always return to the form for review. Saving persists the complete ledger before reporting success; a failed write keeps the form open.

The parsing API also accepts text for compatibility. Its response has `status` and either `transaction` or `message`; application errors can use HTTP 200. Type works without that API, while Scan requires the Node server. OCR accepts one receipt at a time and has a timeout. Unclear or conflicting totals require another photo or manual entry.

## Persistence

`microledger_snapshot_v1` stores transactions, budget, notifications, goals and contributions, category limits, recurring bills, profile, custom categories, companion, setup completion and pending deletion recovery. Optional fields keep older version-1 backups compatible.

Legacy keys `smartspend_wallet_pkr_v3`, `smartspend_wallet_budget_v3` and `smartspend_notifications_v3` remain readable. Writes use one storage operation and reject a stale snapshot from another tab. Origin and browser profile determine which ledger is visible; changing the host or port uses different storage.

Deletion recovery lasts five seconds. Dismissing the notice consumes its undo. Expenses, bills and goals share one pending recovery operation; a later deletion replaces the previous one. Deleting a bill preserves recorded payments. Goal undo restores its contributions.

Backups export all months and optional settings. Merge adds missing records and preserves matching current records, existing profile and companion choices. Category targets and the monthly budget come from the backup. The ledger is validated before any restore is saved.

## Interface and motion

Today shows the current calendar month's budget and today's expenses. Activity supports search, categories and date filters. Goals manages real contributions; Plan contains category limits, bills and Insights. Profile contains personalization, setup, custom categories, backups and record management. The center plus opens expense entry.

Companion expressions respond to scanning, extraction errors, successful extraction and home activity. Users can preview expressions or tap their companion. Both the device's reduced-motion setting and the saved Reduce animations preference disable mascot animation.

## Running and verification

- Development: `npm run dev` runs Express with Vite middleware.
- Production: run `npm run build`, then start with `NODE_ENV=production npm start`.
- `PORT` defaults to 3000. OCR dependencies and English language data are installed by `npm ci`; no AI key is needed.
- `npm run lint`, `npm test` and `npm run build` check types, regression behavior and the frontend build. The OCR API test reads an actual fixture image.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Scan is unavailable | Run the Express server. Vite preview and GitHub Pages do not run the OCR API. |
| Receipt cannot be read | Use a sharp English printed receipt showing the final TOTAL line. Review extracted amounts and dates before saving. |
| Type rejects a note | Include one clear positive PKR amount, for example `Lunch at KFC Rs. 1,450`. Split multiple expenses into separate notes. |
| Mascot does not move | Check Profile → Reduce animations and the device's motion preference. |
| Records seem missing | Check the browser profile, hostname and port. Restore a valid backup if site data was cleared. |
| Saving fails | Keep the form open, allow site storage, and check available browser storage. Download a backup before freeing space. |
| Ledger changed in another tab | Preserve any unfinished form details, then reload before retrying. |
| Production cannot find tsx | Install runtime dependencies with `npm ci`; tsx is a runtime dependency. |
| Port is occupied | Stop the earlier app or set another PORT; remember that changing ports changes browser storage origin. |
