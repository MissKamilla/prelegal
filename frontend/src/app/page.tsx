"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  buildDocumentMarkdown,
  createEmptyDraftValues,
  documentSections,
  DraftValues,
  findSupportedDocument,
  formatDate,
  getDraftValue,
  suggestSupportedDocument,
  supportedDocuments,
  SupportedDocument,
} from "@/lib/documents";
import { FormEvent, useLayoutEffect, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

type FakeUser = {
  id: number;
  email: string;
  displayName: string;
};

type AuthMode = "signin" | "signup";

type SavedDocumentSummary = {
  id: number;
  title: string;
  documentType: string;
  createdAt: string;
};

type SavedDocument = SavedDocumentSummary & {
  content: string;
  values: DraftValues;
};

type LocalAccount = FakeUser & {
  password: string;
};

function supportedDocumentList() {
  return supportedDocuments.map((document) => document.shortName).join(", ");
}

function initialMessages(): ChatMessage[] {
  return [
    {
      id: 1,
      role: "assistant",
      content:
        "Hi, I can help prepare a legal document from Prelegal's supported templates.",
    },
    {
      id: 2,
      role: "assistant",
      content: `Which document do you need? I currently support: ${supportedDocumentList()}.`,
    },
  ];
}

function localStorageKey(name: string) {
  return `prelegal:${name}`;
}

function readLocalJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(localStorageKey(key));
  return rawValue ? (JSON.parse(rawValue) as T) : fallback;
}

function writeLocalJson<T>(key: string, value: T) {
  window.localStorage.setItem(localStorageKey(key), JSON.stringify(value));
}

function localAuthenticate(
  mode: AuthMode,
  email: string,
  displayName: string,
  password: string,
) {
  const accounts = readLocalJson<LocalAccount[]>("accounts", []);
  const existingAccount = accounts.find((account) => account.email === email.toLowerCase());

  if (mode === "signin") {
    if (!existingAccount || existingAccount.password !== password) {
      throw new Error("Invalid email or password");
    }

    return existingAccount;
  }

  if (existingAccount) {
    throw new Error("Email is already registered");
  }

  const user = {
    id: Date.now(),
    email: email.toLowerCase(),
    displayName,
    password,
  };
  writeLocalJson("accounts", [...accounts, user]);
  return user;
}

function saveLocalDocument(
  userId: number,
  document: SupportedDocument,
  values: DraftValues,
): SavedDocument {
  const savedDocuments = readLocalJson<SavedDocument[]>(`document-details:${userId}`, []);
  const savedDocument: SavedDocument = {
    id: Date.now(),
    title: document.title,
    documentType: document.id,
    createdAt: new Date().toISOString(),
    content: buildDocumentMarkdown(document, values),
    values,
  };
  const nextDocuments = [savedDocument, ...savedDocuments];

  writeLocalJson(`document-details:${userId}`, nextDocuments);
  writeLocalJson(
    `documents:${userId}`,
    nextDocuments.map(({ id, title, documentType, createdAt }) => ({
      id,
      title,
      documentType,
      createdAt,
    })),
  );

  return savedDocument;
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<FakeUser | null>(null);
  const [loginEmail, setLoginEmail] = useState("demo@prelegal.example");
  const [displayName, setDisplayName] = useState("Demo User");
  const [password, setPassword] = useState("password123");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocumentSummary[]>([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [savedDocumentId, setSavedDocumentId] = useState<number | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<SupportedDocument | null>(null);
  const [suggestedDocument, setSuggestedDocument] = useState<SupportedDocument | null>(null);
  const [values, setValues] = useState<DraftValues>({});
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [isDownloading, setIsDownloading] = useState(false);
  const [termPages, setTermPages] = useState<SupportedDocument["templateSections"][]>([]);
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
      if (!measurePage || !selectedDocument) {
        setTermPages([]);
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
      const nextPages: SupportedDocument["templateSections"][] = [];
      let currentPage: SupportedDocument["templateSections"] = [];
      let currentHeight = 0;

      paragraphNodes.forEach((paragraph, index) => {
        const paragraphHeight = getOuterHeight(paragraph);
        const term = selectedDocument.templateSections[index];

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

      setTermPages(nextPages.length > 0 ? nextPages : [selectedDocument.templateSections]);
    }

    paginateTerms();
    window.addEventListener("resize", paginateTerms);
    document.fonts?.ready.then(paginateTerms);

    return () => {
      window.removeEventListener("resize", paginateTerms);
    };
  }, [selectedDocument]);

  const completedFields = selectedDocument
    ? selectedDocument.fields.filter((field) => values[field.key]?.trim()).length
    : 0;
  const totalFields = selectedDocument?.fields.length ?? 0;
  const isDraftComplete = Boolean(selectedDocument && completedFields === totalFields);
  const activeField = selectedDocument?.fields[activeFieldIndex];

  async function loadSavedDocuments(userId: number) {
    try {
      const response = await fetch(`/api/users/${userId}/documents`);
      if (!response.ok) {
        setSavedDocuments(readLocalJson<SavedDocumentSummary[]>(`documents:${userId}`, []));
        return;
      }

      const result = (await response.json()) as { documents?: SavedDocumentSummary[] };
      setSavedDocuments(result.documents ?? []);
    } catch {
      setSavedDocuments(readLocalJson<SavedDocumentSummary[]>(`documents:${userId}`, []));
    }
  }

  function addMessages(nextMessages: Omit<ChatMessage, "id">[]) {
    setChatMessages((current) => [
      ...current,
      ...nextMessages.map((message, index) => ({
        ...message,
        id: current.length + index + 1,
      })),
    ]);
  }

  function chooseDocument(document: SupportedDocument, prefix?: string) {
    setSelectedDocument(document);
    setSuggestedDocument(null);
    setValues(createEmptyDraftValues(document));
    setActiveFieldIndex(0);
    setSavedDocumentId(null);
    setSaveStatus("");
    addMessages([
      {
        role: "assistant",
        content: `${prefix ?? "Great."} We'll create a ${document.title}. ${document.fields[0].question}`,
      },
    ]);
  }

  function handleDocumentSelection(answer: string) {
    const yesToSuggestion = suggestedDocument && /\b(yes|yeah|yep|ok|okay|sure|use it|that works)\b/i.test(answer);

    if (yesToSuggestion) {
      chooseDocument(suggestedDocument, "Got it.");
      return;
    }

    const document = findSupportedDocument(answer);

    if (document) {
      chooseDocument(document);
      return;
    }

    const suggestion = suggestSupportedDocument(answer);
    setSuggestedDocument(suggestion);
    addMessages([
      {
        role: "assistant",
        content:
          `I can't generate "${answer}" because it is not one of the supported templates. ` +
          `The closest supported option is ${suggestion.title}. Would you like to use that instead?`,
      },
    ]);
  }

  function submitChatAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const answer = chatInput.trim();
    if (!answer) {
      return;
    }

    setChatInput("");
    addMessages([{ role: "user", content: answer }]);

    if (!selectedDocument) {
      handleDocumentSelection(answer);
      return;
    }

    if (isDraftComplete || !activeField) {
      return;
    }

    const nextFieldIndex = activeFieldIndex + 1;
    const nextField = selectedDocument.fields[nextFieldIndex];
    const nextValues = {
      ...values,
      [activeField.key]: answer,
    };

    setValues(nextValues);
    setActiveFieldIndex(nextFieldIndex);
    addMessages([
      {
        role: "assistant",
        content: nextField
          ? `Got it. ${nextField.question}`
          : "Thanks. All required details are filled in. Please review the preview, then download the PDF when ready.",
      },
    ]);

    if (!nextField) {
      void saveDocument(nextValues);
    }
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");

    setIsLoggingIn(true);

    try {
      const response = await fetch(authMode === "signin" ? "/api/signin" : "/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          authMode === "signin"
            ? {
                email: loginEmail,
                password,
              }
            : {
                email: loginEmail,
                display_name: displayName,
                password,
              },
        ),
      });

      if (!response.ok) {
        if (response.status === 404) {
          const user = localAuthenticate(authMode, loginEmail, displayName, password);
          setCurrentUser(user);
          await loadSavedDocuments(user.id);
          return;
        }

        const result = (await response.json()) as { detail?: string };
        setAuthError(result.detail ?? "Unable to sign in");
        return;
      }

      const result = (await response.json()) as { user?: FakeUser };
      if (result.user) {
        setCurrentUser(result.user);
        await loadSavedDocuments(result.user.id);
      }
    } catch {
      try {
        const user = localAuthenticate(authMode, loginEmail, displayName, password);
        setCurrentUser(user);
        await loadSavedDocuments(user.id);
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Unable to sign in");
      }
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function saveDocument(nextValues: DraftValues = values) {
    if (!currentUser || !selectedDocument || savedDocumentId) {
      return;
    }

    setSaveStatus("Saving draft...");

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          title: selectedDocument.title,
          document_type: selectedDocument.id,
          content: buildDocumentMarkdown(selectedDocument, nextValues),
          values: nextValues,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          const localDocument = saveLocalDocument(currentUser.id, selectedDocument, nextValues);
          setSavedDocumentId(localDocument.id);
          setSaveStatus("Draft saved to your documents.");
          await loadSavedDocuments(currentUser.id);
          return;
        }

        setSaveStatus("Draft was not saved.");
        return;
      }

      const result = (await response.json()) as { document?: SavedDocument };
      if (result.document) {
        setSavedDocumentId(result.document.id);
        setSaveStatus("Draft saved to your documents.");
        await loadSavedDocuments(currentUser.id);
      }
    } catch {
      const localDocument = saveLocalDocument(currentUser.id, selectedDocument, nextValues);
      setSavedDocumentId(localDocument.id);
      setSaveStatus("Draft saved to your documents.");
      await loadSavedDocuments(currentUser.id);
    }
  }

  async function openSavedDocument(documentId: number) {
    if (!currentUser) {
      return;
    }

    let savedDocument: SavedDocument | undefined;

    try {
      const response = await fetch(`/api/users/${currentUser.id}/documents/${documentId}`);
      if (response.ok) {
        const result = (await response.json()) as { document?: SavedDocument };
        savedDocument = result.document;
      }
    } catch {
      savedDocument = undefined;
    }

    savedDocument ??= readLocalJson<SavedDocument[]>(`document-details:${currentUser.id}`, []).find(
      (document) => document.id === documentId,
    );

    const document = supportedDocuments.find((item) => item.id === savedDocument?.documentType);

    if (!savedDocument || !document) {
      return;
    }

    setSelectedDocument(document);
    setSuggestedDocument(null);
    setValues(savedDocument.values);
    setActiveFieldIndex(document.fields.length);
    setSavedDocumentId(savedDocument.id);
    setSaveStatus("Loaded saved draft.");
    setChatMessages([
      ...initialMessages(),
      {
        id: 3,
        role: "assistant",
        content: `Loaded your saved ${document.title} from ${savedDocument.createdAt}.`,
      },
    ]);
  }

  async function downloadPdf() {
    const pages = pageRefs.current.filter((page): page is HTMLElement => Boolean(page));

    if (!pages.length || isDownloading || !selectedDocument) {
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

      const fileParty = (values.partyOneName ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const fileDocument = selectedDocument.id.replace(/[^a-z0-9]+/g, "-");
      pdf.save(`${fileDocument}-${fileParty || "draft"}.pdf`);
    } finally {
      setIsDownloading(false);
    }
  }

  if (!currentUser) {
    return (
      <main className="login-shell">
        <section className="login-panel" aria-label="Account access">
          <div className="brand-row">
            <span className="brand-mark">PL</span>
            <div>
              <p className="eyebrow">Prelegal</p>
              <h1>{authMode === "signin" ? "Sign in to Prelegal" : "Create your account"}</h1>
            </div>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              aria-selected={authMode === "signin"}
              onClick={() => {
                setAuthMode("signin");
                setAuthError("");
              }}
              role="tab"
              type="button"
            >
              Sign in
            </button>
            <button
              aria-selected={authMode === "signup"}
              onClick={() => {
                setAuthMode("signup");
                setAuthError("");
              }}
              role="tab"
              type="button"
            >
              Sign up
            </button>
          </div>

          <form className="login-form" onSubmit={authenticate}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
            </label>

            {authMode === "signup" ? (
              <label>
                <span>Display name</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                />
              </label>
            ) : null}

            <label>
              <span>Password</span>
              <input
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>

            {authError ? <p className="form-error">{authError}</p> : null}

            <button type="submit" disabled={isLoggingIn}>
              {isLoggingIn
                ? "Working..."
                : authMode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="editor-panel" aria-label="Document details">
        <div className="brand-row">
          <span className="brand-mark">PL</span>
          <div>
            <p className="eyebrow">Prelegal</p>
            <h1>Legal Document Creator</h1>
          </div>
        </div>

        <p className="platform-user">
          Signed in as <strong>{currentUser.displayName}</strong>
        </p>

        <div className="legal-disclaimer">
          Documents are draft materials only and should be reviewed by a qualified lawyer before use.
        </div>

        <div className="chat-progress" aria-label="Document completion progress">
          {selectedDocument
            ? `${completedFields} of ${totalFields} details collected`
            : "Choose a supported document to begin"}
        </div>

        <section className="chat-panel" aria-label="AI chat for legal documents">
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
              {saveStatus ? <p>{saveStatus}</p> : null}
              <button type="button" onClick={downloadPdf} disabled={isDownloading}>
                {isDownloading ? "Preparing PDF..." : "Download PDF"}
              </button>
            </div>
          ) : (
            <form className="chat-form" onSubmit={submitChatAnswer}>
              <label htmlFor="chat-answer">
                <span>{activeField?.label ?? "Document type"}</span>
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

        <section className="field-summary" aria-label="Collected document details">
          <div>
            <h2>Your Documents</h2>
            {savedDocuments.length ? (
              <ul className="saved-document-list">
                {savedDocuments.map((document) => (
                  <li key={document.id}>
                    <button type="button" onClick={() => void openSavedDocument(document.id)}>
                      <span>{document.title}</span>
                      <small>{document.createdAt}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No saved documents yet.</p>
            )}
          </div>

          <div>
            <h2>Supported Templates</h2>
            <ul className="document-list">
              {supportedDocuments.map((document) => (
                <li key={document.id}>{document.shortName}</li>
              ))}
            </ul>
          </div>

          {selectedDocument ? (
            <>
              <div>
                <h2>Selected Document</h2>
                <dl>
                  <div>
                    <dt>Template</dt>
                    <dd>{selectedDocument.title}</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>{selectedDocument.filename}</dd>
                  </div>
                </dl>
              </div>

              {documentSections.map((section) => (
                <div key={section}>
                  <h2>{section}</h2>
                  <dl>
                    {selectedDocument.fields
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
            </>
          ) : null}
        </section>
      </section>

      <section className="preview-panel" aria-label="Legal document preview">
        <div className="document-stack">
          {selectedDocument ? (
            <>
              <article className="document document-page pagination-measure" ref={termsMeasureRef}>
                <section>
                  <h3>Template Terms</h3>
                  {selectedDocument.templateSections.map((term, index) => (
                    <p data-term-index={index} key={term.title}>
                      <strong>
                        {index + 1}. {term.title}.
                      </strong>{" "}
                      {term.body}
                    </p>
                  ))}
                </section>
                <footer>
                  Template source: {selectedDocument.filename}. This prototype prepares a
                  working draft and requires legal review before use.
                </footer>
              </article>

              <article
                className="document document-page"
                ref={(node) => {
                  pageRefs.current[0] = node;
                }}
              >
                <header>
                  <p>Prelegal Draft</p>
                  <h2>{selectedDocument.title}</h2>
                </header>

                <section>
                  <h3>Draft Details</h3>
                  <dl className="summary-grid">
                    {selectedDocument.fields.map((field) => (
                      <div key={field.key}>
                        <dt>{field.label}</dt>
                        <dd>
                          {field.key === "effectiveDate"
                            ? formatDate(values[field.key])
                            : getDraftValue(values, field)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section>
                  <h3>Signature Blocks</h3>
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
                        <td>{values.partyOneName || "[Party 1 legal name]"}</td>
                        <td>{values.partyTwoName || "[Party 2 legal name]"}</td>
                      </tr>
                      <tr>
                        <th>Print Name</th>
                        <td>{values.partyOneSigner || "[Party 1 signer]"}</td>
                        <td>{values.partyTwoSigner || "[Party 2 signer]"}</td>
                      </tr>
                      <tr>
                        <th>Title</th>
                        <td>{values.partyOneTitle || "[Party 1 signer title]"}</td>
                        <td>{values.partyTwoTitle || "[Party 2 signer title]"}</td>
                      </tr>
                      <tr>
                        <th>Notice Address</th>
                        <td>{values.partyOneAddress || "[Party 1 notice address]"}</td>
                        <td>{values.partyTwoAddress || "[Party 2 notice address]"}</td>
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

              {termPages.map((terms, pageIndex) => (
                <article
                  className="document document-page"
                  key={pageIndex}
                  ref={(node) => {
                    pageRefs.current[pageIndex + 1] = node;
                  }}
                >
                  <section>
                    <h3>{pageIndex === 0 ? "Template Terms" : "Template Terms Continued"}</h3>
                    {terms.map((term, termIndex) => (
                      <p key={term.title}>
                        <strong>
                          {termPages
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

                  {pageIndex === termPages.length - 1 ? (
                    <footer>
                      Template source: {selectedDocument.filename}. This prototype prepares a
                      working draft and requires legal review before use.
                    </footer>
                  ) : null}
                </article>
              ))}

            </>
          ) : (
            <article className="document document-page empty-preview">
              <header>
                <p>Prelegal Draft</p>
                <h2>Choose a document</h2>
              </header>
              <section>
                <h3>Supported Templates</h3>
                <p>
                  Start in the chat by asking for one of the supported legal document types. If
                  the requested document is unsupported, the assistant will offer the closest
                  available template.
                </p>
                <ul>
                  {supportedDocuments.map((document) => (
                    <li key={document.id}>
                      <strong>{document.title}.</strong> {document.description}
                    </li>
                  ))}
                </ul>
              </section>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
