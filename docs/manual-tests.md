# Manual Test Checklist

Use this checklist before releasing changes to the Mutual NDA creator. Record the browser,
OS, date, tester, and pass/fail result for each scenario.

## Environment

- Install dependencies in `frontend/` with `npm install`.
- If Playwright Chromium is not installed yet, run `npx playwright install chromium`.
- Start the app with `npm run dev`.
- Open `http://localhost:3000`.

## Smoke Test

1. Confirm the page loads without console errors.
2. Confirm the fake login screen shows the Prelegal brand and `Sign in to Prelegal`.
3. Click `Enter platform`.
4. Confirm the left editor shows the Prelegal brand, `Mutual NDA Creator` heading, and
   `Download PDF` button.
5. Confirm the right preview shows `Mutual Non-Disclosure Agreement`, `Cover Page`,
   `Parties`, and `Standard Terms`.
6. Confirm the default parties are `Acme, Inc.` and `Example Partner LLC`.

## Form Editing

1. Change `Purpose` to a long multi-sentence value and confirm it appears in the preview.
2. Change `Effective date` to `2026-07-08` and confirm the preview shows `July 8, 2026`.
3. Change `MNDA term, years` and `Confidentiality term, years`; confirm both preview
   values update.
4. Change every Party 1 and Party 2 field; confirm the party table updates without stale
   values.
5. Change `Governing law`, `Jurisdiction`, and `MNDA modifications`; confirm the legal
   summary updates.

## PDF Download

1. Click `Download PDF`.
2. Confirm the button changes to `Preparing PDF...` while the file is generated.
3. Confirm a PDF downloads with a filename starting with `mutual-nda-`.
4. Open the PDF and confirm it contains the cover page, party table, all standard terms,
   attribution, and the `not legal advice` disclaimer.
5. Confirm multi-page output has no clipped text, overlapping sections, or missing footer.

## Responsive Layout

1. Test desktop width around `1440px`; confirm editor and preview are both usable.
2. Test tablet width around `768px`; confirm fields and document pages do not overlap.
3. Test mobile width around `390px`; confirm all form controls are reachable and text wraps
   inside its container.

## Regression Checks

1. Refresh after editing fields and confirm the form intentionally resets to the default draft.
2. Resize the browser several times and confirm standard terms remain ordered and visible.
3. Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, and `npm run test:e2e`.
