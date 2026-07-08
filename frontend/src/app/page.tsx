"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  formatDate,
  initialNdaValues,
  NdaFormValues,
  standardTerms,
} from "@/lib/nda";
import { ChangeEvent, useRef, useState } from "react";

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

export default function Home() {
  const [values, setValues] = useState<NdaFormValues>(initialNdaValues);
  const [isDownloading, setIsDownloading] = useState(false);
  const documentRef = useRef<HTMLElement>(null);

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    key: keyof NdaFormValues,
  ) {
    setValues((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  }

  async function downloadPdf() {
    if (!documentRef.current || isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const source = documentRef.current;
      const canvas = await html2canvas(source, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        windowWidth: source.scrollWidth,
        windowHeight: source.scrollHeight,
      });

      const pdf = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;
      const imageWidth = contentWidth;
      const pageCanvasHeight = (contentHeight * canvas.width) / imageWidth;
      let renderedCanvasY = 0;
      let pageIndex = 0;

      while (renderedCanvasY < canvas.height) {
        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedCanvasY);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const context = pageCanvas.getContext("2d");
        if (!context) {
          throw new Error("Unable to prepare PDF page.");
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        context.drawImage(
          canvas,
          0,
          renderedCanvasY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight,
        );

        if (pageIndex > 0) {
          pdf.addPage();
        }

        const pageImageHeight = (sliceHeight * imageWidth) / canvas.width;
        pdf.addImage(
          pageCanvas.toDataURL("image/png"),
          "PNG",
          margin,
          margin,
          imageWidth,
          pageImageHeight,
        );

        renderedCanvasY += sliceHeight;
        pageIndex += 1;
      }

      const fileParty = values.partyOneName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      pdf.save(`mutual-nda-${fileParty || "draft"}.pdf`);
    } finally {
      setIsDownloading(false);
    }
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
          <button type="button" onClick={downloadPdf} disabled={isDownloading}>
            {isDownloading ? "Preparing PDF..." : "Download PDF"}
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
        <article className="document" ref={documentRef}>
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
