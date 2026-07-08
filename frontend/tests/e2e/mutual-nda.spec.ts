import { expect, Page, test } from "@playwright/test";

async function enterPlatform(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in to Prelegal" })).toBeVisible();
  await page.getByRole("button", { name: "Enter platform" }).click();
  await expect(page.getByRole("heading", { name: "Mutual NDA Creator" })).toBeVisible();
}

test.describe("Mutual NDA Creator", () => {
  test("renders the default draft and standard terms", async ({ page }) => {
    await enterPlatform(page);

    await expect(page.getByRole("heading", { name: "Mutual NDA Creator" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" }),
    ).toBeVisible();
    await expect(page.getByText("Acme, Inc.")).toBeVisible();
    await expect(page.getByText("Example Partner LLC")).toBeVisible();
    const visibleDocuments = page.locator("article.document:not(.pagination-measure)");
    await expect(
      visibleDocuments.getByText("Use and Protection of Confidential Information").first(),
    ).toBeVisible();
    await expect(
      visibleDocuments.getByText("This prototype prepares a working draft").first(),
    ).toBeVisible();
  });

  test("updates the preview when agreement and party fields change", async ({ page }) => {
    await enterPlatform(page);

    await page.getByLabel("Purpose").fill("Exploring a co-development agreement.");
    await page.getByLabel("Effective date").fill("2026-07-08");
    await page.getByLabel("MNDA term, years").fill("2");
    await page.getByLabel("Confidentiality term, years").fill("4");
    await page
      .locator("fieldset", { hasText: "Party 1" })
      .getByLabel("Company")
      .fill("Northstar Labs, Inc.");
    await page
      .locator("fieldset", { hasText: "Party 2" })
      .getByLabel("Company")
      .fill("Harbor AI LLC");
    await page.getByLabel("Governing law").fill("New York");
    await page.getByLabel("Jurisdiction").fill("state and federal courts located in New York County, NY");
    await page.getByLabel("MNDA modifications").fill("Residual knowledge clause excluded.");

    const preview = page.getByLabel("Mutual NDA preview");
    await expect(preview.getByText("Exploring a co-development agreement.")).toBeVisible();
    await expect(preview.getByText("July 8, 2026")).toBeVisible();
    await expect(preview.getByText("Expires 2 year(s) from Effective Date.")).toBeVisible();
    await expect(preview.getByText("4 year(s) from Effective Date.")).toBeVisible();
    await expect(preview.getByText("Northstar Labs, Inc.")).toBeVisible();
    await expect(preview.getByText("Harbor AI LLC")).toBeVisible();
    await expect(preview.getByText("New York", { exact: true })).toBeVisible();
    await expect(preview.getByText("Residual knowledge clause excluded.")).toBeVisible();
  });

  test("keeps the PDF action available without mutating the form", async ({ page }) => {
    await enterPlatform(page);

    const downloadButton = page.getByRole("button", { name: "Download PDF" });
    await expect(downloadButton).toBeEnabled();
    await expect(page.getByLabel("Purpose")).toHaveValue(
      "Evaluating whether to enter into a business relationship with the other party.",
    );
  });
});
