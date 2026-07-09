"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  emptyNdaValues,
  formatDate,
  NdaFormValues,
  standardTerms,
} from "@/lib/nda";
import { FormEvent, useLayoutEffect, useRef, useState } from "react";

type Field = {
  key: keyof NdaFormValues;
  label: string;
  question: string;
  section: "Agreement" | "Party 1" | "Party 2" | "Legal";
};

const fields: Field[] = [
  {
    key: "purpose",
    label: "Purpose",
    question: "What is the purpose of this Mutual NDA?",
    section: "Agreement",
  },
  {
    key: "effectiveDate",
    label: "Effective date",
    question: "What effective date should appear on the NDA? Use YYYY-MM-DD if you can.",
    section: "Agreement",
  },
  {
    key: "mndaTermYears",
    label: "MNDA term, years",
    question: "How many years should the MNDA remain in effect?",
    section: "Agreement",
  },
  {
    key: "confidentialityTermYears",
    label: "Confidentiality term, years",
    question: "How many years should confidentiality obligations survive?",
    section: "Agreement",
  },
  {
    key: "partyOneName",
    label: "Company",
    question: "What is Party 1's legal company name?",
    section: "Party 1",
  },
  {
    key: "partyOneSigner",
    label: "Signer name",
    question: "Who will sign for Party 1?",
    section: "Party 1",
  },
  {
    key: "partyOneTitle",
    label: "Signer title",
    question: "What is Party 1 signer's title?",
    section: "Party 1",
  },
  {
    key: "partyOneAddress",
    label: "Notice address",
    question: "What notice address or email should Party 1 use?",
    section: "Party 1",
  },
  {
    key: "partyTwoName",
    label: "Company",
    question: "What is Party 2's legal company name?",
    section: "Party 2",
  },
  {
    key: "partyTwoSigner",
    label: "Signer name",
    question: "Who will sign for Party 2?",
    section: "Party 2",
  },
  {
    key: "partyTwoTitle",
    label: "Signer title",
    question: "What is Party 2 signer's title?",
    section: "Party 2",
  },
  {
    key: "partyTwoAddress",
    label: "Notice address",
    question: "What notice address or email should Party 2 use?",
    section: "Party 2",
  },
  {
    key: "governingLaw",
    label: "Governing law",
    question: "Which state's law should govern the NDA?",
    section: "Legal",
  },
  {
    key: "jurisdiction",
    label: "Jurisdiction",
    question: "Which courts should have jurisdiction?",
    section: "Legal",
  },
  {
    key: "modifications",
    label: "MNDA modifications",
    question: 'Any modifications to the MNDA? You can answer "None."',
    section: "Legal",
  },
];

const sections: Field["section"][] = ["Agreement", "Party 1", "Party 2", "Legal"];

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

type FakeUser = {
  email: string;
  displayName: string;
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<FakeUser | null>(null);
  const [loginEmail, setLoginEmail] = useState("demo@prelegal.example");
  const [displayName, setDisplayName] = useState("Demo User");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [values, setValues] = useState<NdaFormValues>(emptyNdaValues);
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi, I can help prepare a Mutual NDA. I will ask for the key details and update the draft after each answer.",
    },
    {
      id: 2,
      role: "assistant",
      content: fields[0].question,
    },
  ]);
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

  const completedFields = fields.filter((field) => values[field.key].trim()).length;
  const isDraftComplete = completedFields === fields.length;
  const activeField = fields[activeFieldIndex];

  function previewValue(key: keyof NdaFormValues, fallback: string) {
    return values[key].trim() || fallback;
  }

  function submitChatAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const answer = chatInput.trim();
    if (!answer || isDraftComplete || !activeField) {
      return;
    }

    const nextFieldIndex = activeFieldIndex + 1;
    const nextField = fields[nextFieldIndex];

    setValues((current) => ({
      ...current,
      [activeField.key]: answer,
    }));
    setChatInput("");
    setActiveFieldIndex(nextFieldIndex);
    setChatMessages((current) => [
      ...current,
      {
        id: current.length + 1,
        role: "user",
        content: answer,
      },
      {
        id: current.length + 2,
        role: "assistant",
        content: nextField
          ? `Got it. ${nextField.question}`
          : "Thanks. All required NDA details are filled in. Please review the preview, then download the PDF when ready.",
      },
    ]);
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

        <div className="chat-progress" aria-label="NDA completion progress">
          {completedFields} of {fields.length} details collected
        </div>

        <section className="chat-panel" aria-label="AI chat for Mutual NDA">
          <div className="chat-thread">
            {chatMessages.map((message) => (
              <div className={`chat-message ${message.role}`} key={message.id}>
                <span>{message.role === "assistant" ? "AI" : "You"}</span>
                <p>{message.content}</p>
              </div>
            ))}
          </div>

          {isDraftComplete ? (
            <div className="complete-panel">
              <p>All fields are complete. Review the preview before downloading.</p>
              <button type="button" onClick={downloadPdf} disabled={isDownloading}>
                {isDownloading ? "Preparing PDF..." : "Download PDF"}
              </button>
            </div>
          ) : (
            <form className="chat-form" onSubmit={submitChatAnswer}>
              <label htmlFor="chat-answer">
                <span>{activeField.label}</span>
                <textarea
                  id="chat-answer"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  rows={4}
                  placeholder="Type your answer..."
                  autoFocus
                />
              </label>
              <button type="submit" disabled={!chatInput.trim()}>
                Send answer
              </button>
            </form>
          )}
        </section>

        <section className="field-summary" aria-label="Collected NDA details">
          {sections.map((section) => (
            <div key={section}>
              <h2>{section}</h2>
              <dl>
                {fields
                  .filter((field) => field.section === section)
                  .map((field) => (
                    <div key={field.key}>
                      <dt>{field.label}</dt>
                      <dd>{values[field.key] || "Pending"}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
        </section>
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
                  <dd>{previewValue("purpose", "[Purpose]")}</dd>
                </div>
                <div>
                  <dt>Effective Date</dt>
                  <dd>{formatDate(values.effectiveDate)}</dd>
                </div>
                <div>
                  <dt>MNDA Term</dt>
                  <dd>
                    Expires {previewValue("mndaTermYears", "[number]")} year(s) from Effective
                    Date.
                  </dd>
                </div>
                <div>
                  <dt>Term of Confidentiality</dt>
                  <dd>
                    {previewValue("confidentialityTermYears", "[number]")} year(s) from Effective
                    Date.
                  </dd>
                </div>
                <div>
                  <dt>Governing Law</dt>
                  <dd>{previewValue("governingLaw", "[state]")}</dd>
                </div>
                <div>
                  <dt>Jurisdiction</dt>
                  <dd>{previewValue("jurisdiction", "[courts]")}</dd>
                </div>
                <div>
                  <dt>Modifications</dt>
                  <dd>{previewValue("modifications", "None.")}</dd>
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
                    <td>{previewValue("partyOneName", "[Party 1 company]")}</td>
                    <td>{previewValue("partyTwoName", "[Party 2 company]")}</td>
                  </tr>
                  <tr>
                    <th>Print Name</th>
                    <td>{previewValue("partyOneSigner", "[Party 1 signer]")}</td>
                    <td>{previewValue("partyTwoSigner", "[Party 2 signer]")}</td>
                  </tr>
                  <tr>
                    <th>Title</th>
                    <td>{previewValue("partyOneTitle", "[Party 1 title]")}</td>
                    <td>{previewValue("partyTwoTitle", "[Party 2 title]")}</td>
                  </tr>
                  <tr>
                    <th>Notice Address</th>
                    <td>{previewValue("partyOneAddress", "[Party 1 notice address]")}</td>
                    <td>{previewValue("partyTwoAddress", "[Party 2 notice address]")}</td>
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
