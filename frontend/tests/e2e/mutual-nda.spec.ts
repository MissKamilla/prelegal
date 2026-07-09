import { expect, Page, test } from "@playwright/test";

async function enterPlatform(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in to Prelegal" })).toBeVisible();
  await page.getByRole("button", { name: "Enter platform" }).click();
  await expect(page.getByRole("heading", { name: "Mutual NDA Creator" })).toBeVisible();
}

const ndaAnswers = [
  "Exploring a co-development agreement.",
  "2026-07-08",
  "2",
  "4",
  "Northstar Labs, Inc.",
  "Nora North",
  "General Counsel",
  "legal@northstar.example",
  "Harbor AI LLC",
  "Hank Harbor",
  "COO",
  "notices@harbor.example",
  "New York",
  "state and federal courts located in New York County, NY",
  "Residual knowledge clause excluded.",
];

async function sendChatAnswer(page: Page, answer: string) {
  await page
    .locator("#chat-answer")
    .fill(answer);
  await page.getByRole("button", { name: "Send answer" }).click();
}

test.describe("Mutual NDA Creator", () => {
  test("starts the AI chat with a greeting and first question", async ({ page }) => {
    await enterPlatform(page);

    await expect(page.getByRole("heading", { name: "Mutual NDA Creator" })).toBeVisible();
    await expect(page.getByLabel("AI chat for Mutual NDA")).toContainText(
      "Hi, I can help prepare a Mutual NDA.",
    );
    await expect(page.getByLabel("AI chat for Mutual NDA")).toContainText(
      "What is the purpose of this Mutual NDA?",
    );
    await expect(page.getByLabel("NDA completion progress")).toHaveText(
      "0 of 15 details collected",
    );
    await expect(page.getByRole("button", { name: "Download PDF" })).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" }),
    ).toBeVisible();
    const visibleDocuments = page.locator("article.document:not(.pagination-measure)");
    await expect(visibleDocuments.getByText("[Purpose]").first()).toBeVisible();
    await expect(
      visibleDocuments.getByText("Use and Protection of Confidential Information").first(),
    ).toBeVisible();
    await expect(
      visibleDocuments.getByText("This prototype prepares a working draft").first(),
    ).toBeVisible();
  });

  test("updates the preview immediately after each chat answer", async ({ page }) => {
    await enterPlatform(page);

    const preview = page.getByLabel("Mutual NDA preview");
    await sendChatAnswer(page, ndaAnswers[0]);
    await expect(preview.getByText("Exploring a co-development agreement.")).toBeVisible();

    await sendChatAnswer(page, ndaAnswers[1]);
    await expect(preview.getByText("July 8, 2026")).toBeVisible();

    await sendChatAnswer(page, ndaAnswers[2]);
    await expect(preview.getByText("Expires 2 year(s) from Effective Date.")).toBeVisible();

    await sendChatAnswer(page, ndaAnswers[3]);
    await expect(preview.getByText("4 year(s) from Effective Date.")).toBeVisible();

    await sendChatAnswer(page, ndaAnswers[4]);
    await expect(preview.getByText("Northstar Labs, Inc.")).toBeVisible();

    await sendChatAnswer(page, ndaAnswers[5]);
    await sendChatAnswer(page, ndaAnswers[6]);
    await sendChatAnswer(page, ndaAnswers[7]);
    await sendChatAnswer(page, ndaAnswers[8]);
    await expect(preview.getByText("Harbor AI LLC")).toBeVisible();

    await sendChatAnswer(page, ndaAnswers[9]);
    await sendChatAnswer(page, ndaAnswers[10]);
    await sendChatAnswer(page, ndaAnswers[11]);
    await sendChatAnswer(page, ndaAnswers[12]);
    await expect(preview.getByText("New York", { exact: true })).toBeVisible();

    await sendChatAnswer(page, ndaAnswers[13]);
    await sendChatAnswer(page, ndaAnswers[14]);
    await expect(preview.getByText("Residual knowledge clause excluded.")).toBeVisible();
  });

  test("shows confirmation and PDF download only after all fields are complete", async ({ page }) => {
    await enterPlatform(page);

    await expect(page.getByRole("button", { name: "Download PDF" })).toHaveCount(0);
    for (const answer of ndaAnswers) {
      await sendChatAnswer(page, answer);
    }

    await expect(
      page.getByText("All fields are complete. Review the preview before downloading."),
    ).toBeVisible();
    const downloadButton = page.getByRole("button", { name: "Download PDF" });
    await expect(downloadButton).toBeEnabled();
    await expect(page.getByLabel("NDA completion progress")).toHaveText(
      "15 of 15 details collected",
    );
  });
});
