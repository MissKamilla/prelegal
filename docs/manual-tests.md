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
4. Confirm the left editor shows the Prelegal brand, `Mutual NDA Creator` heading, the chat
   greeting, and the first Mutual NDA question.
5. Confirm the right preview shows `Mutual Non-Disclosure Agreement`, `Cover Page`,
   `Parties`, and `Standard Terms`.
6. Confirm the preview starts with placeholders for unfilled NDA details.

## AI Chat Editing

1. Answer the opening purpose question with a long multi-sentence value and confirm it appears
   in the preview immediately after sending.
2. Answer the effective date question with `2026-07-08` and confirm the preview shows
   `July 8, 2026`.
3. Answer the MNDA term and confidentiality term questions; confirm both preview values update
   immediately after their answers.
4. Answer every Party 1 and Party 2 question; confirm the party table updates without stale
   values.
5. Answer the `Governing law`, `Jurisdiction`, and `MNDA modifications` questions; confirm the
   legal summary updates.
6. Confirm the progress indicator advances after each answer.

## PDF Download

1. Confirm `Download PDF` is hidden until every chat question has been answered.
2. After the final answer, confirm the completion message and `Download PDF` button appear.
3. Click `Download PDF`.
4. Confirm the button changes to `Preparing PDF...` while the file is generated.
5. Confirm a PDF downloads with a filename starting with `mutual-nda-`.
6. Open the PDF and confirm it contains the cover page, party table, all standard terms,
   attribution, and the `not legal advice` disclaimer.
7. Confirm multi-page output has no clipped text, overlapping sections, or missing footer.

## Responsive Layout

1. Test desktop width around `1440px`; confirm chat and preview are both usable.
2. Test tablet width around `768px`; confirm chat controls and document pages do not overlap.
3. Test mobile width around `390px`; confirm all chat controls are reachable and text wraps
   inside its container.

## Regression Checks

1. Refresh after answering questions and confirm the chat intentionally resets to a blank draft.
2. Resize the browser several times and confirm standard terms remain ordered and visible.
3. Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, and `npm run test:e2e`.
