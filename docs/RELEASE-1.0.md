# MicroLedger 1.0 — mobile release

The mobile Home screen now shows the monthly amount left after scheduled bills, a real savings goal, editable quick-entry suggestions, and the three latest expenses. Activity holds the full ledger and day filter; Plan holds budgets, goals, recurring payments and insights; Profile holds backups and recovery.

The release also includes the expense-accuracy and recovery improvements developed before the mobile redesign: failed receipt scans do not invent values, PKR parsing validates amounts, totals use the selected month, snapshot writes report failure, and delete recovery survives a refresh.

## New interactions

- Expense entry uses an animated bottom sheet on phones and a dialog on larger screens.
- Quick-add suggestions populate editable fields and require explicit confirmation.
- Roman Urdu Smart Notes populate reviewable details; optional browser speech recognition fills the note only.
- Successful expense saves show a checkmark and close the sheet after persistence succeeds. Failed saves keep the form open.
- Goal contributions animate actual saved progress, remain separate from expense totals, and survive reloads and backups.
- Button feedback, short screen transitions, entry animations and progress updates respect reduced-motion settings.

No sample transactions or prefilled savings progress are shipped. Existing local snapshots and legacy records remain readable. Backups retain version 1 compatibility, with optional goals and planning fields.

## Verification

- 33 automated tests: amount/date validation, failed AI receipt fallback, monthly totals, legacy-data loading, write failures, stale-tab protection, backup validation/merge, undo, recurring schedules, savings contributions and reserved-bill accounting.
- TypeScript: `npm run lint`.
- Production frontend: `npm run build`.
- Browser smoke checks against the production build: editable quick entry with paise, Roman Urdu extraction/review, goal creation/contribution, reload persistence and access to recovery controls. Phone layout checked for horizontal overflow.
- Speech capture and live Gemini receipt extraction require their respective permissions/configuration and were not exercised with real user data.

## Deployment

Install with `npm ci`, then test, type-check and build. Run the Express server with `NODE_ENV=production npm start` and the appropriate `PORT`. `tsx` is included in runtime dependencies. Configure `GEMINI_API_KEY` in the hosting environment; never commit a real environment file.

GitHub is the source release destination. This repository contains a Node/Express API; publishing source to GitHub does not by itself deploy that API to a public hosting service.

## Rollback and recovery

Before rolling back, download a full backup from Profile. Revert this release commit through a new commit; do not reset away later work. Older pre-snapshot builds use legacy storage keys, so records may appear missing even while the new snapshot remains intact. Keep the backup and snapshot until returning to a compatible release. Recheck saving, restore, and the parsing endpoint before reopening a rolled-back build to users.
