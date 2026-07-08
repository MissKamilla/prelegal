import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildNdaMarkdown,
  formatDate,
  initialNdaValues,
  standardTerms,
  type NdaFormValues,
} from "./nda.ts";

describe("formatDate", () => {
  it("formats a valid ISO date for the agreement preview", () => {
    assert.equal(formatDate("2026-07-08"), "July 8, 2026");
  });

  it("returns an effective date placeholder when the value is empty", () => {
    assert.equal(formatDate(""), "[Effective date]");
  });

  it("preserves invalid user input instead of hiding it", () => {
    assert.equal(formatDate("not-a-date"), "not-a-date");
  });
});

describe("buildNdaMarkdown", () => {
  const customValues: NdaFormValues = {
    ...initialNdaValues,
    effectiveDate: "2026-07-08",
    purpose: "Evaluating a joint product launch.",
    partyOneName: "Northstar Labs, Inc.",
    partyOneSigner: "Nora North",
    partyOneTitle: "General Counsel",
    partyOneAddress: "legal@northstar.example",
    partyTwoName: "Harbor AI LLC",
    partyTwoSigner: "Hank Harbor",
    partyTwoTitle: "COO",
    partyTwoAddress: "notices@harbor.example",
    mndaTermYears: "3",
    confidentialityTermYears: "5",
    governingLaw: "New York",
    jurisdiction: "state and federal courts located in New York County, NY",
    modifications: "Residual knowledge clause excluded.",
  };

  it("builds a complete cover page with user-provided agreement details", () => {
    const markdown = buildNdaMarkdown(customValues);

    assert.match(markdown, /^# Mutual Non-Disclosure Agreement/);
    assert.match(markdown, /Purpose: Evaluating a joint product launch\./);
    assert.match(markdown, /Effective Date: July 8, 2026/);
    assert.match(markdown, /MNDA Term: Expires 3 year\(s\) from Effective Date\./);
    assert.match(
      markdown,
      /Term of Confidentiality: 5 year\(s\) from Effective Date/,
    );
    assert.match(markdown, /Governing Law: New York/);
    assert.match(
      markdown,
      /Jurisdiction: state and federal courts located in New York County, NY/,
    );
    assert.match(markdown, /MNDA Modifications: Residual knowledge clause excluded\./);
  });

  it("renders both party signature blocks in the markdown table", () => {
    const markdown = buildNdaMarkdown(customValues);

    assert.match(markdown, /\| Company \| Northstar Labs, Inc\. \| Harbor AI LLC \|/);
    assert.match(markdown, /\| Print Name \| Nora North \| Hank Harbor \|/);
    assert.match(markdown, /\| Title \| General Counsel \| COO \|/);
    assert.match(
      markdown,
      /\| Notice Address \| legal@northstar\.example \| notices@harbor\.example \|/,
    );
    assert.match(markdown, /\| Signature \|  \|  \|/);
    assert.match(markdown, /\| Date \|  \|  \|/);
  });

  it("includes every standard term in order with attribution and disclaimer", () => {
    const markdown = buildNdaMarkdown(customValues);

    standardTerms.forEach((term, index) => {
      assert.match(markdown, new RegExp(`${index + 1}\\. ${term.title}\\.`));
      assert.match(markdown, new RegExp(term.body.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    });

    assert.match(markdown, /Common Paper Mutual Non-Disclosure Agreement Version 1\.0/);
    assert.match(markdown, /not legal advice/);
  });

  it("uses placeholders and defaults for blank optional legal fields", () => {
    const markdown = buildNdaMarkdown({
      ...customValues,
      mndaTermYears: "",
      confidentialityTermYears: "",
      governingLaw: "",
      jurisdiction: "",
      modifications: "",
    });

    assert.match(markdown, /MNDA Term: Expires \[number\] year\(s\)/);
    assert.match(markdown, /Term of Confidentiality: \[number\] year\(s\)/);
    assert.match(markdown, /Governing Law: \[state\]/);
    assert.match(markdown, /Jurisdiction: \[courts\]/);
    assert.match(markdown, /MNDA Modifications: None\./);
  });
});
