# Contributing to MicroLedger

Thanks for helping improve MicroLedger. Start with the setup instructions in [README.md](README.md).

## Propose a change

Search existing issues before creating a bug report or feature request. Explain the problem, the expected behavior, and who benefits. Discuss large changes before implementation.

For bugs, include reproduction steps, browser/OS, the commit or branch, and a sanitized example. Do not include API keys, real receipts, personal financial information, or your `.env` file.

## Development workflow

1. Create a branch from the current `main`.
2. Make a focused change with a clear purpose.
3. Keep unrelated formatting, dependency updates, and generated files out of the diff.
4. Run the checks relevant to your change.
5. Open a pull request explaining the behavior change and actual validation results.

Avoid renaming existing browser storage keys without a migration plan. Changes to parsing, saved transaction fields, and budget calculations should describe how existing records are affected.

## Validation

For application changes:

```sh
npm run lint
npm run build
npm run dev
```

The lint command checks TypeScript. There is currently no automated test script, so also exercise the affected behavior manually:

- Add a manual expense and confirm it appears.
- Edit and delete a test transaction.
- Reload and check that remaining records and the budget persist.
- Try a smart note and review the result before saving.
- If changing receipts, test the configured AI path and the fallback path separately.
- Check the affected views at narrow and wide browser widths.

Use disposable test records. Do not clear real financial data to run checks.

For documentation-only changes, verify links, commands against `package.json`, and feature claims against the source. Do not claim runtime checks passed if they were not run.

## Pull request checklist

- Explain the problem and resulting behavior.
- List checks actually performed and any limitations.
- Include screenshots for visible changes, using fictional data.
- Update relevant documentation.
- Confirm no secrets or unrelated generated files are included.

Repository-wide licensing has not yet been established in a root LICENSE file. Preserve existing source notices.
