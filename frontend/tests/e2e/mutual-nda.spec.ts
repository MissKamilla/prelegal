import { expect, Page, test } from "@playwright/test";

async function enterPlatform(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in to Prelegal" })).toBeVisible();
  await page.getByRole("button", { name: "Enter platform" }).click();
  await expect(page.getByRole("heading", { name: "Legal Document Creator" })).toBeVisible();
}

async function sendChatAnswer(page: Page, answer: string) {
  await page.locator("#chat-answer").fill(answer);
  await page.getByRole("button", { name: "Send answer" }).click();
}

const cloudServiceAnswers = [
  "2026-07-08",
  "Northstar Labs, Inc.",
  "Nora North",
  "General Counsel",
  "legal@northstar.example",
  "Harbor AI LLC",
  "Hank Harbor",
  "COO",
  "notices@harbor.example",
  "Workflow automation platform",
  "12 months",
  "$5,000 per month",
  "Priority email support",
  "New York",
  "state and federal courts located in New York County, NY",
  "No auto-renewal.",
];

test.describe("Legal Document Creator", () => {
  test("starts with a supported document picker and blank preview", async ({ page }) => {
    await enterPlatform(page);

    await expect(page.getByLabel("AI chat for legal documents")).toContainText(
      "Which document do you need?",
    );
    await expect(page.getByLabel("AI chat for legal documents")).toContainText(
      "Cloud Service Agreement",
    );
    await expect(page.getByLabel("Document completion progress")).toHaveText(
      "Choose a supported document to begin",
    );
    await expect(page.getByRole("button", { name: "Download PDF" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Choose a document" })).toBeVisible();
    await expect(page.getByText("Software License Agreement", { exact: true })).toBeVisible();
    await expect(page.getByText("AI Addendum", { exact: true })).toBeVisible();
  });

  test("selects a supported document and updates the preview after each answer", async ({ page }) => {
    await enterPlatform(page);

    await sendChatAnswer(page, "Cloud Service Agreement");

    const preview = page.getByLabel("Legal document preview");
    const visibleDocuments = page.locator("article.document:not(.pagination-measure)");
    await expect(preview.getByRole("heading", { name: "Cloud Service Agreement" })).toBeVisible();
    await expect(visibleDocuments.getByText("Template source: CSA.md").first()).toBeVisible();
    await expect(page.getByLabel("Document completion progress")).toHaveText(
      "0 of 16 details collected",
    );

    await sendChatAnswer(page, cloudServiceAnswers[0]);
    await expect(preview.getByText("July 8, 2026")).toBeVisible();

    await sendChatAnswer(page, cloudServiceAnswers[1]);
    await expect(preview.getByText("Northstar Labs, Inc.").first()).toBeVisible();

    for (const answer of cloudServiceAnswers.slice(2, 9)) {
      await sendChatAnswer(page, answer);
    }

    await sendChatAnswer(page, cloudServiceAnswers[9]);
    await expect(preview.getByText("Workflow automation platform").first()).toBeVisible();

    for (const answer of cloudServiceAnswers.slice(10)) {
      await sendChatAnswer(page, answer);
    }

    await expect(
      page.getByText("All fields are complete. Review the preview before downloading."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Download PDF" })).toBeEnabled();
    await expect(page.getByLabel("Document completion progress")).toHaveText(
      "16 of 16 details collected",
    );
  });

  test("offers a closest supported template for an unsupported request", async ({ page }) => {
    await enterPlatform(page);

    await sendChatAnswer(page, "employment offer letter");

    await expect(page.getByLabel("AI chat for legal documents")).toContainText(
      "I can't generate",
    );
    await expect(page.getByLabel("AI chat for legal documents")).toContainText(
      "Professional Services Agreement",
    );

    await sendChatAnswer(page, "yes");

    await expect(
      page.getByLabel("Legal document preview").getByRole("heading", {
        name: "Professional Services Agreement",
      }),
    ).toBeVisible();
    await expect(page.getByLabel("Document completion progress")).toHaveText(
      "0 of 16 details collected",
    );
  });
});
