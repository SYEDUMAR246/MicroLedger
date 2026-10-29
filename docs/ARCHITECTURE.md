# Architecture and troubleshooting

## Request and data flow

MicroLedger uses a React frontend and an Express server in one project.

1. `src/main.tsx` mounts `App`.
2. `src/App.tsx` loads transactions, budget settings, and notifications from browser local storage.
3. `SmartAddModal` collects manual input or sends text/image input to `POST /api/parse-expense`.
4. The server attempts Gemini parsing if a key is configured. If unavailable, unsuccessful, or timed out after three seconds, it uses the local rule-based fallback.
5. Parsed fields return to the form for review. Saving updates React state and browser local storage.

Manual entry does not call the parsing endpoint.

## Persistence

| Storage key | Contents |
| --- | --- |
| `smartspend_wallet_pkr_v3` | Transactions, including saved receipt previews when attached. |
| `smartspend_wallet_budget_v3` | Budget amount. |
| `smartspend_notifications_v3` | Notifications. |

Storage is tied to the browser profile and site origin. Changing the hostname or port can make existing records appear absent because a different origin has different storage. No server-side ledger database or cross-device sync is implemented.

## Server behavior

- Development: Express runs Vite in middleware mode.
- Production: Express serves the built `dist/` directory.
- The default port is `3000`; `PORT` overrides it.
- The parsing endpoint accepts text and/or an image object with `mimeType` and base64 `data`, plus optional `currentDate` and `currentTime`.
- A response contains a `status` and either transaction details or an error message. Clients must inspect `status`, because application errors may use HTTP 200.
- The API normalizes parsed currency to PKR.

The fallback text parser uses amount patterns and category keywords. Its image branch uses sample/default values rather than image recognition. Review receipt output carefully even when the response says success.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Smart Note cannot reach the API | Run `npm run dev` or the Express production server. `npm run preview` starts only the frontend preview. |
| Receipt details look like sample data | Gemini may have failed or timed out, triggering fallback. Verify the key and the model configured in `server.ts`; enter correct values manually. |
| Records seem missing | Check the browser profile, hostname, and port. Site data may have been cleared. |
| A receipt or transaction does not persist | Check the browser console for storage errors. Receipt images can consume local storage capacity. |
| Port is already occupied | Set `PORT` to an available port and use that port in the browser. |
| Production cannot serve the frontend | Run `npm run build` and verify `dist/` exists before starting with `NODE_ENV=production`. |
| Production cannot find `tsx` | The start script needs `tsx`, currently listed in development dependencies. Ensure it is installed in the runtime environment. |
| Dependency installation fails | Inspect npm's exact error and the dependency versions in `package.json`. No lockfile is currently committed. |

## Areas for future work

These are proposals, not implemented features or release commitments:

- Reliable receipt failure reporting instead of sample fallback values.
- Export/import and recovery for browser-stored records.
- Calendar-month filtering for monthly budget totals.
- Automated tests for parsing, persistence, and transaction editing.
- A reproducible dependency lockfile and documented runtime version.
- Consistent MicroLedger naming throughout the interface.
- A repository-wide license selected by the owner.
