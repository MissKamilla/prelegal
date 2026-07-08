"use client";

import { jsPDF } from "jspdf";
import {
  buildNdaMarkdown,
  formatDate,
  initialNdaValues,
  NdaFormValues,
  standardTerms,
} from "@/lib/nda";
import { ChangeEvent, useMemo, useState } from "react";

type Field = {
  key: keyof NdaFormValues;
  label: string;
  type?: "date" | "number" | "textarea" | "text";
  section: "Agreement" | "Party 1" | "Party 2" | "Legal";
};

const fields: Field[] = [
  { key: "effectiveDate", label: "Effective date", type: "date", section: "Agreement" },
  { key: "purpose", label: "Purpose", type: "textarea", section: "Agreement" },
  { key: "mndaTermYears", label: "MNDA term, years", type: "number", section: "Agreement" },
  {
    key: "confidentialityTermYears",
    label: "Confidentiality term, years",
    type: "number",
    section: "Agreement",
  },
  { key: "partyOneName", label: "Company", section: "Party 1" },
  { key: "partyOneSigner", label: "Signer name", section: "Party 1" },
  { key: "partyOneTitle", label: "Signer title", section: "Party 1" },
  { key: "partyOneAddress", label: "Notice address", type: "textarea", section: "Party 1" },
  { key: "partyTwoName", label: "Company", section: "Party 2" },
  { key: "partyTwoSigner", label: "Signer name", section: "Party 2" },
  { key: "partyTwoTitle", label: "Signer title", section: "Party 2" },
  { key: "partyTwoAddress", label: "Notice address", type: "textarea", section: "Party 2" },
  { key: "governingLaw", label: "Governing law", section: "Legal" },
  { key: "jurisdiction", label: "Jurisdiction", section: "Legal" },
  { key: "modifications", label: "MNDA modifications", type: "textarea", section: "Legal" },
];

const sections: Field["section"][] = ["Agreement", "Party 1", "Party 2", "Legal"];

function addWrappedText(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const lines = pdf.splitTextToSize(text, maxWidth) as string[];
  let cursorY = y;

  lines.forEach((line) => {
    if (cursorY > pageHeight - 22) {
      pdf.addPage();
      cursorY = 22;
    }

    pdf.text(line, x, cursorY);
    cursorY += 6;
  });

  return cursorY;
}

export default function Home() {
  const [values, setValues] = useState<NdaFormValues>(initialNdaValues);
  const markdown = useMemo(() => buildNdaMarkdown(values), [values]);

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    key: keyof NdaFormValues,
  ) {
    setValues((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  }

  function downloadPdf() {
    const pdf = new jsPDF({ unit: "mm", format: "letter" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 18;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    pdf.setFont("times", "bold");
    pdf.setFontSize(18);
    y = addWrappedText(pdf, "Mutual Non-Disclosure Agreement", margin, y, maxWidth) + 4;

    pdf.setFont("times", "normal");
    pdf.setFontSize(10);
    markdown.split("\n").forEach((line) => {
      const cleanLine = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
      if (!cleanLine) {
        y += 3;
        return;
      }

      const isHeading = line.startsWith("##") || line.startsWith("# ");
      pdf.setFont("times", isHeading ? "bold" : "normal");
      pdf.setFontSize(isHeading ? 13 : 10);
      y = addWrappedText(pdf, cleanLine, margin, y, maxWidth) + (isHeading ? 2 : 1);
    });

    const fileParty = values.partyOneName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    pdf.save(`mutual-nda-${fileParty || "draft"}.pdf`);
  }

  return (
    <main className="app-shell">
      <section className="editor-panel" aria-label="NDA details">
        <div className="brand-row">
          <span className="brand-mark">PL</span>
          <div>
            <p className="eyebrow">Prelegal</p>
            <h1>Mutual NDA Creator</h1>
          </div>
        </div>

        <div className="actions">
          <button type="button" onClick={downloadPdf}>
            Download PDF
          </button>
        </div>

        <form>
          {sections.map((section) => (
            <fieldset key={section}>
              <legend>{section}</legend>
              {fields
                .filter((field) => field.section === section)
                .map((field) => (
                  <label key={field.key}>
                    <span>{field.label}</span>
                    {field.type === "textarea" ? (
                      <textarea
                        value={values[field.key]}
                        onChange={(event) => updateField(event, field.key)}
                        rows={3}
                      />
                    ) : (
                      <input
                        type={field.type ?? "text"}
                        min={field.type === "number" ? "1" : undefined}
                        value={values[field.key]}
                        onChange={(event) => updateField(event, field.key)}
                      />
                    )}
                  </label>
                ))}
            </fieldset>
          ))}
        </form>
      </section>

      <section className="preview-panel" aria-label="Mutual NDA preview">
        <article className="document">
          <header>
            <p>Common Paper Mutual NDA Draft</p>
            <h2>Mutual Non-Disclosure Agreement</h2>
          </header>

          <section>
            <h3>Cover Page</h3>
            <dl className="summary-grid">
              <div>
                <dt>Purpose</dt>
                <dd>{values.purpose}</dd>
              </div>
              <div>
                <dt>Effective Date</dt>
                <dd>{formatDate(values.effectiveDate)}</dd>
              </div>
              <div>
                <dt>MNDA Term</dt>
                <dd>Expires {values.mndaTermYears} year(s) from Effective Date.</dd>
              </div>
              <div>
                <dt>Term of Confidentiality</dt>
                <dd>{values.confidentialityTermYears} year(s) from Effective Date.</dd>
              </div>
              <div>
                <dt>Governing Law</dt>
                <dd>{values.governingLaw}</dd>
              </div>
              <div>
                <dt>Jurisdiction</dt>
                <dd>{values.jurisdiction}</dd>
              </div>
              <div>
                <dt>Modifications</dt>
                <dd>{values.modifications}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3>Parties</h3>
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Party 1</th>
                  <th>Party 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Company</th>
                  <td>{values.partyOneName}</td>
                  <td>{values.partyTwoName}</td>
                </tr>
                <tr>
                  <th>Print Name</th>
                  <td>{values.partyOneSigner}</td>
                  <td>{values.partyTwoSigner}</td>
                </tr>
                <tr>
                  <th>Title</th>
                  <td>{values.partyOneTitle}</td>
                  <td>{values.partyTwoTitle}</td>
                </tr>
                <tr>
                  <th>Notice Address</th>
                  <td>{values.partyOneAddress}</td>
                  <td>{values.partyTwoAddress}</td>
                </tr>
                <tr>
                  <th>Signature</th>
                  <td />
                  <td />
                </tr>
                <tr>
                  <th>Date</th>
                  <td />
                  <td />
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3>Standard Terms</h3>
            {standardTerms.map((term, index) => (
              <p key={term.title}>
                <strong>
                  {index + 1}. {term.title}.
                </strong>{" "}
                {term.body}
              </p>
            ))}
          </section>

          <footer>
            Common Paper Mutual Non-Disclosure Agreement Version 1.0 is free to use under CC BY
            4.0. This prototype prepares a working draft and is not legal advice.
          </footer>
        </article>
      </section>
    </main>
  );
}
