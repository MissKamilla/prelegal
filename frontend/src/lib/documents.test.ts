import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDocumentMarkdown,
  createEmptyDraftValues,
  findSupportedDocument,
  formatDate,
  getDraftValue,
  suggestSupportedDocument,
  supportedDocuments,
} from "./documents.ts";

describe("supportedDocuments", () => {
  it("includes every supported legal document type from the template catalog", () => {
    assert.deepEqual(
      supportedDocuments.map((document) => document.title),
      [
        "Mutual Non-Disclosure Agreement",
        "Cloud Service Agreement",
        "Service Level Agreement",
        "Data Processing Agreement",
        "Design Partner Agreement",
        "Professional Services Agreement",
        "Partnership Agreement",
        "Business Associate Agreement",
        "Software License Agreement",
        "Pilot Agreement",
        "AI Addendum",
      ],
    );
  });
});

describe("findSupportedDocument", () => {
  it("matches supported documents by title and aliases", () => {
    assert.equal(findSupportedDocument("I need a SaaS subscription agreement")?.id, "cloud-service-agreement");
    assert.equal(findSupportedDocument("please draft a HIPAA BAA")?.id, "business-associate-agreement");
    assert.equal(findSupportedDocument("AI terms for generated outputs")?.id, "ai-addendum");
  });

  it("returns null for unsupported requests", () => {
    assert.equal(findSupportedDocument("employment offer letter"), null);
  });
});

describe("suggestSupportedDocument", () => {
  it("offers the closest supported fallback for unsupported requests", () => {
    assert.equal(suggestSupportedDocument("employment consulting contract").id, "professional-services-agreement");
    assert.equal(suggestSupportedDocument("privacy policy").id, "data-processing-agreement");
  });
});

describe("draft values", () => {
  const document = supportedDocuments[0];

  it("creates a blank draft for every field in a document", () => {
    const values = createEmptyDraftValues(document);

    document.fields.forEach((field) => {
      assert.equal(values[field.key], "");
    });
  });

  it("formats dates and uses placeholders for blank values", () => {
    const values = createEmptyDraftValues(document);
    const effectiveDate = document.fields.find((field) => field.key === "effectiveDate")!;
    const purpose = document.fields.find((field) => field.key === "purpose")!;

    assert.equal(formatDate("2026-07-08"), "July 8, 2026");
    assert.equal(getDraftValue(values, purpose), "[Purpose]");
    assert.equal(getDraftValue({ ...values, effectiveDate: "2026-07-08" }, effectiveDate, { formatDates: true }), "July 8, 2026");
  });

  it("builds markdown with the selected template source and user details", () => {
    const values = {
      ...createEmptyDraftValues(document),
      partyOneName: "Northstar Labs, Inc.",
      partyTwoName: "Harbor AI LLC",
      purpose: "Exploring a co-development agreement.",
    };
    const markdown = buildDocumentMarkdown(document, values);

    assert.match(markdown, /^# Mutual Non-Disclosure Agreement/);
    assert.match(markdown, /Template source: Mutual-NDA\.md/);
    assert.match(markdown, /Northstar Labs, Inc\./);
    assert.match(markdown, /Harbor AI LLC/);
    assert.match(markdown, /Exploring a co-development agreement\./);
  });
});
