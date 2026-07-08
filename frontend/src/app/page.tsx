"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  formatDate,
  initialNdaValues,
  NdaFormValues,
  standardTerms,
} from "@/lib/nda";
import { ChangeEvent, FormEvent, useLayoutEffect, useRef, useState } from "react";

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

type FakeUser = {
  email: string;
  displayName: string;
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<FakeUser | null>(null);
  const [loginEmail, setLoginEmail] = useState("demo@prelegal.example");
  const [displayName, setDisplayName] = useState("Demo User");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [values, setValues] = useState<NdaFormValues>(initialNdaValues);
  const [isDownloading, setIsDownloading] = useState(false);
  const [termsPages, setTermsPages] = useState([standardTerms]);
  const pageRefs = useRef<Array<HTMLElement | null>>([]);
  const termsMeasureRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    function getOuterHeight(element: Element) {
      const styles = window.getComputedStyle(element);
      return (
        element.getBoundingClientRect().height +
        Number.parseFloat(styles.marginTop) +
        Number.parseFloat(styles.marginBottom)
      );
    }

    function paginateTerms() {
      const measurePage = termsMeasureRef.current;
      if (!measurePage) {
        return;
      }

      const styles = window.getComputedStyle(measurePage);
      const verticalPadding =
        Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
      const availableHeight = measurePage.clientHeight - verticalPadding;
      const heading = measurePage.querySelector("h3");
      const footer = measurePage.querySelector("footer");
      const paragraphNodes = Array.from(measurePage.querySelectorAll("[data-term-index]"));
      const headingHeight = heading ? getOuterHeight(heading) : 0;
      const footerHeight = footer ? getOuterHeight(footer) : 0;
      const pageHeightLimit = availableHeight - headingHeight - footerHeight;
      const nextPages: typeof standardTerms[] = [];
      let currentPage: typeof standardTerms = [];
      let currentHeight = 0;

      paragraphNodes.forEach((paragraph, index) => {
        const paragraphHeight = getOuterHeight(paragraph);
        const term = standardTerms[index];

        if (currentPage.length > 0 && currentHeight + paragraphHeight > pageHeightLimit) {
          nextPages.push(currentPage);
          currentPage = [];
          currentHeight = 0;
        }

        currentPage.push(term);
        currentHeight += paragraphHeight;
      });

      if (currentPage.length > 0) {
        nextPages.push(currentPage);
      }

      setTermsPages(nextPages.length > 0 ? nextPages : [standardTerms]);
    }

    paginateTerms();
    window.addEventListener("resize", paginateTerms);
    document.fonts?.ready.then(paginateTerms);

    return () => {
      window.removeEventListener("resize", paginateTerms);
    };
  }, []);

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    key: keyof NdaFormValues,
  ) {
    setValues((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  }

  async function fakeLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fallbackUser = {
      email: loginEmail,
      displayName,
    };

    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/fake-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          display_name: displayName,
        }),
      });

      if (!response.ok) {
        setCurrentUser(fallbackUser);
        return;
      }

      const result = (await response.json()) as { user?: FakeUser };
      setCurrentUser(result.user ?? fallbackUser);
    } catch {
      setCurrentUser(fallbackUser);
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function downloadPdf() {
    const pages = pageRefs.current.filter((page): page is HTMLElement => Boolean(page));

    if (!pages.length || isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const pdf = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (const [index, page] of pages.entries()) {
        const canvas = await html2canvas(page, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          windowWidth: Math.max(window.innerWidth, 1200),
          windowHeight: page.scrollHeight,
        });

        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          0,
          0,
          pageWidth,
          pageHeight,
        );
      }

      const fileParty = values.partyOneName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      pdf.save(`mutual-nda-${fileParty || "draft"}.pdf`);
    } finally {
      setIsDownloading(false);
    }
  }

  if (!currentUser) {
    return (
      <main className="login-shell">
        <section className="login-panel" aria-label="Fake login">
          <div className="brand-row">
            <span className="brand-mark">PL</span>
            <div>
              <p className="eyebrow">Prelegal</p>
              <h1>Sign in to Prelegal</h1>
            </div>
          </div>

          <form className="login-form" onSubmit={fakeLogin}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
            </label>

            <label>
              <span>Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </label>

            <button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? "Entering..." : "Enter platform"}
            </button>
          </form>
        </section>
      </main>
    );
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

        <p className="platform-user">
          Signed in as <strong>{currentUser.displayName}</strong>
        </p>

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
        <div className="document-stack">
          <article className="document document-page pagination-measure" ref={termsMeasureRef}>
            <section>
              <h3>Standard Terms</h3>
              {standardTerms.map((term, index) => (
                <p data-term-index={index} key={term.title}>
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

          <article
            className="document document-page"
            ref={(node) => {
              pageRefs.current[0] = node;
            }}
          >
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
          </article>

          {termsPages.map((terms, pageIndex) => (
            <article
              className="document document-page"
              key={pageIndex}
              ref={(node) => {
                pageRefs.current[pageIndex + 1] = node;
              }}
            >
              <section>
                <h3>{pageIndex === 0 ? "Standard Terms" : "Standard Terms Continued"}</h3>
                {terms.map((term, termIndex) => (
                  <p key={term.title}>
                    <strong>
                      {termsPages
                        .slice(0, pageIndex)
                        .reduce((total, page) => total + page.length, 0) +
                        termIndex +
                        1}
                      . {term.title}.
                    </strong>{" "}
                    {term.body}
                  </p>
                ))}
              </section>

              {pageIndex === termsPages.length - 1 ? (
                <footer>
                  Common Paper Mutual Non-Disclosure Agreement Version 1.0 is free to use under
                  CC BY 4.0. This prototype prepares a working draft and is not legal advice.
                </footer>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
