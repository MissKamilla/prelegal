# Manual Test Checklist

Use this checklist before releasing changes to the legal document creator. Record the browser,
OS, date, tester, and pass/fail result for each scenario.

## Environment

- Install dependencies in `frontend/` with `npm install`.
- If Playwright Chromium is not installed yet, run `npx playwright install chromium`.
- Start the app with `npm run dev`.
- Open `http://localhost:3000`.

## Smoke Test

1. Confirm the page loads without console errors.
2. Confirm the account screen shows the Prelegal brand, `Sign in to Prelegal`, and sign in/sign up tabs.
3. Switch to `Sign up`, create an account, and confirm the app opens.
4. Confirm the left editor shows the Prelegal brand, `Legal Document Creator` heading, and
   the document picker chat prompt.
5. Confirm the supported template list includes Mutual NDA, Cloud Service Agreement, DPA,
   PSA, BAA, Software License Agreement, Pilot Agreement, and AI Addendum.
6. Confirm the right preview starts with `Choose a document` and explains supported templates.
7. Confirm the draft/legal-review disclaimer is visible.

## Authentication

1. Sign up with a new email, display name, and password.
2. Refresh the app and sign in with the same email and password.
3. Confirm wrong passwords show an error and do not enter the app.

## AI Chat Editing

1. Ask for `Cloud Service Agreement` and confirm the preview switches to that title.
2. Confirm the progress indicator shows the number of details required for the selected document.
3. Answer the effective date question with `2026-07-08` and confirm the preview shows
   `July 8, 2026`.
4. Answer every Party 1 and Party 2 question; confirm the signature table updates without stale
   values.
5. Answer each business-term question for the selected document; confirm each value appears in
   the preview immediately after sending.
6. Answer the `Governing law`, `Jurisdiction`, and special-terms questions; confirm the legal
   summary updates.
7. Confirm the progress indicator advances after each answer.

## Saved Documents

1. Complete all questions for a supported document.
2. Confirm the completion state says the draft was saved.
3. Confirm the document appears under `Your Documents`.
4. Click the saved document and confirm the preview reloads with the saved values.

## Unsupported Documents

1. Refresh the app and ask for an unsupported document such as `employment offer letter`.
2. Confirm the chat explains that the requested document cannot be generated.
3. Confirm the chat offers the closest supported template, such as Professional Services Agreement.
4. Reply `yes` and confirm the preview switches to the suggested supported document.

## PDF Download

1. Confirm `Download PDF` is hidden until every chat question has been answered.
2. After the final answer, confirm the completion message and `Download PDF` button appear.
3. Click `Download PDF`.
4. Confirm the button changes to `Preparing PDF...` while the file is generated.
5. Confirm a PDF downloads with a filename based on the selected document type.
6. Open the PDF and confirm it contains the draft details, signature table, template terms,
   attribution, and the legal-review disclaimer.
7. Confirm multi-page output has no clipped text, overlapping sections, or missing footer.

## Responsive Layout

1. Test desktop width around `1440px`; confirm chat and preview are both usable.
2. Test tablet width around `768px`; confirm chat controls and document pages do not overlap.
3. Test mobile width around `390px`; confirm all chat controls are reachable and text wraps
   inside its container.

## Regression Checks

1. Restart the backend and confirm the temporary database resets.
2. Resize the browser several times and confirm template terms remain ordered and visible.
3. Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, and `npm run test:e2e`.
