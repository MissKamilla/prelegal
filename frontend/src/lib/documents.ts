export type DocumentField = {
  key: string;
  label: string;
  question: string;
  section: "Document" | "Parties" | "Business Terms" | "Legal";
  placeholder: string;
};

export type TemplateSection = {
  title: string;
  body: string;
};

export type SupportedDocument = {
  id: string;
  title: string;
  shortName: string;
  description: string;
  filename: string;
  aliases: string[];
  fields: DocumentField[];
  templateSections: TemplateSection[];
};

export type DraftValues = Record<string, string>;

const commonPartyFields: DocumentField[] = [
  {
    key: "effectiveDate",
    label: "Effective date",
    question: "What effective date should appear on the document? Use YYYY-MM-DD if you can.",
    section: "Document",
    placeholder: "[Effective date]",
  },
  {
    key: "partyOneName",
    label: "Party 1",
    question: "What is the first party's legal name?",
    section: "Parties",
    placeholder: "[Party 1 legal name]",
  },
  {
    key: "partyOneSigner",
    label: "Party 1 signer",
    question: "Who will sign for the first party?",
    section: "Parties",
    placeholder: "[Party 1 signer]",
  },
  {
    key: "partyOneTitle",
    label: "Party 1 signer title",
    question: "What is the first party signer's title?",
    section: "Parties",
    placeholder: "[Party 1 signer title]",
  },
  {
    key: "partyOneAddress",
    label: "Party 1 notice address",
    question: "What notice address or email should the first party use?",
    section: "Parties",
    placeholder: "[Party 1 notice address]",
  },
  {
    key: "partyTwoName",
    label: "Party 2",
    question: "What is the second party's legal name?",
    section: "Parties",
    placeholder: "[Party 2 legal name]",
  },
  {
    key: "partyTwoSigner",
    label: "Party 2 signer",
    question: "Who will sign for the second party?",
    section: "Parties",
    placeholder: "[Party 2 signer]",
  },
  {
    key: "partyTwoTitle",
    label: "Party 2 signer title",
    question: "What is the second party signer's title?",
    section: "Parties",
    placeholder: "[Party 2 signer title]",
  },
  {
    key: "partyTwoAddress",
    label: "Party 2 notice address",
    question: "What notice address or email should the second party use?",
    section: "Parties",
    placeholder: "[Party 2 notice address]",
  },
];

const legalFields: DocumentField[] = [
  {
    key: "governingLaw",
    label: "Governing law",
    question: "Which state's law should govern the document?",
    section: "Legal",
    placeholder: "[Governing law]",
  },
  {
    key: "jurisdiction",
    label: "Jurisdiction",
    question: "Which courts should have jurisdiction?",
    section: "Legal",
    placeholder: "[Jurisdiction]",
  },
  {
    key: "specialTerms",
    label: "Special terms",
    question: 'Any special terms or modifications? You can answer "None."',
    section: "Legal",
    placeholder: "None.",
  },
];

function fields(...businessFields: DocumentField[]) {
  return [...commonPartyFields, ...businessFields, ...legalFields];
}

function businessField(
  key: string,
  label: string,
  question: string,
  placeholder: string,
): DocumentField {
  return {
    key,
    label,
    question,
    section: "Business Terms",
    placeholder,
  };
}

export const supportedDocuments: SupportedDocument[] = [
  {
    id: "mutual-nda",
    title: "Mutual Non-Disclosure Agreement",
    shortName: "Mutual NDA",
    description: "Mutual confidentiality agreement for exchanging sensitive information.",
    filename: "Mutual-NDA.md",
    aliases: ["mutual nda", "nda", "non disclosure", "confidentiality agreement"],
    fields: fields(
      businessField("purpose", "Purpose", "What is the purpose of this Mutual NDA?", "[Purpose]"),
      businessField("mndaTermYears", "MNDA term", "How many years should the MNDA remain in effect?", "[MNDA term]"),
      businessField(
        "confidentialityTermYears",
        "Confidentiality term",
        "How many years should confidentiality obligations survive?",
        "[Confidentiality term]",
      ),
    ),
    templateSections: [
      {
        title: "Use and Protection of Confidential Information",
        body:
          "Each receiving party uses confidential information only for the stated purpose, limits disclosure to representatives with a need to know, and protects it using reasonable care.",
      },
      {
        title: "Exceptions and Required Disclosures",
        body:
          "Standard exceptions cover information already known, public through no fault, independently developed, or received without restriction. Required legal disclosures are allowed with notice when permitted.",
      },
      {
        title: "Term, Return, and General Terms",
        body:
          "The MNDA runs for the stated term, confidentiality obligations survive for the selected period, and information must be returned or destroyed when required.",
      },
    ],
  },
  {
    id: "cloud-service-agreement",
    title: "Cloud Service Agreement",
    shortName: "Cloud Service Agreement",
    description: "Terms for providing hosted software or cloud services.",
    filename: "CSA.md",
    aliases: ["cloud service", "csa", "saas", "software as a service", "subscription"],
    fields: fields(
      businessField("product", "Cloud service", "What cloud service or product is being provided?", "[Cloud service]"),
      businessField("subscriptionPeriod", "Subscription period", "What is the subscription period?", "[Subscription period]"),
      businessField("fees", "Fees", "What fees or pricing terms should be included?", "[Fees]"),
      businessField("support", "Support", "What technical support commitments should apply?", "[Support terms]"),
    ),
    templateSections: [
      {
        title: "Access, Support, and Customer Content",
        body:
          "The provider grants customer access to the cloud service during the subscription period and may use customer content only as needed to provide and maintain the product.",
      },
      {
        title: "Restrictions, Privacy, and Security",
        body:
          "The customer must follow use restrictions and documentation. Personal data, prohibited data, and security obligations are handled under the agreement and related policies.",
      },
      {
        title: "Payment, Termination, Liability, and General Terms",
        body:
          "The template covers fees, taxes, payment disputes, termination rights, confidentiality, indemnification, liability limits, governing law, and definitions.",
      },
    ],
  },
  {
    id: "service-level-agreement",
    title: "Service Level Agreement",
    shortName: "SLA",
    description: "Availability, support, and service credit commitments.",
    filename: "sla.md",
    aliases: ["service level", "sla", "uptime", "service credits", "availability"],
    fields: fields(
      businessField("service", "Covered service", "Which service is covered by the SLA?", "[Covered service]"),
      businessField("availability", "Availability target", "What uptime or availability target should apply?", "[Availability target]"),
      businessField("credits", "Service credits", "What service credits or remedies should apply?", "[Service credits]"),
    ),
    templateSections: [
      {
        title: "Service Level Commitment",
        body:
          "The provider commits to the selected service level for the covered service, subject to exclusions and measurement rules.",
      },
      {
        title: "Service Credits and Exclusions",
        body:
          "The template addresses credit calculations, claim process, exclusions, maintenance windows, and sole-remedy language.",
      },
    ],
  },
  {
    id: "data-processing-agreement",
    title: "Data Processing Agreement",
    shortName: "DPA",
    description: "Privacy and personal data processing terms.",
    filename: "DPA.md",
    aliases: ["dpa", "data processing", "privacy", "gdpr", "personal data"],
    fields: fields(
      businessField("processingPurpose", "Processing purpose", "What is the purpose of the personal data processing?", "[Processing purpose]"),
      businessField("personalData", "Personal data", "What categories of personal data are involved?", "[Personal data categories]"),
      businessField("dataSubjects", "Data subjects", "What categories of data subjects are involved?", "[Data subject categories]"),
    ),
    templateSections: [
      {
        title: "Processing Instructions and Security",
        body:
          "The processor handles personal data only under documented instructions, applies security measures, and assists with compliance obligations.",
      },
      {
        title: "Subprocessors, Transfers, and Data Subject Requests",
        body:
          "The template covers subprocessors, international transfer safeguards, data subject requests, audits, deletion, and return of personal data.",
      },
    ],
  },
  {
    id: "design-partner-agreement",
    title: "Design Partner Agreement",
    shortName: "Design Partner Agreement",
    description: "Terms for early design partners testing or shaping a product.",
    filename: "design-partner-agreement.md",
    aliases: ["design partner", "beta partner", "pilot partner", "early access"],
    fields: fields(
      businessField("product", "Product", "What product or feature will the design partner evaluate?", "[Product]"),
      businessField("feedback", "Feedback expectations", "What feedback or participation is expected?", "[Feedback expectations]"),
      businessField("accessPeriod", "Access period", "What access or evaluation period should apply?", "[Access period]"),
    ),
    templateSections: [
      {
        title: "Evaluation Access and Feedback",
        body:
          "The design partner receives limited access to evaluate the product and may provide feedback that the provider can use to improve the offering.",
      },
      {
        title: "Confidentiality, Restrictions, and No Production Use",
        body:
          "The template covers restrictions, beta disclaimers, confidentiality, ownership, termination, and general legal terms.",
      },
    ],
  },
  {
    id: "professional-services-agreement",
    title: "Professional Services Agreement",
    shortName: "PSA",
    description: "Terms for services, SOWs, deliverables, and fees.",
    filename: "psa.md",
    aliases: ["professional services", "psa", "services agreement", "consulting", "statement of work", "sow"],
    fields: fields(
      businessField("services", "Services", "What services will be provided?", "[Services]"),
      businessField("deliverables", "Deliverables", "What deliverables, if any, should be included?", "[Deliverables]"),
      businessField("fees", "Fees", "What fees and payment terms should apply?", "[Fees]"),
      businessField("timeline", "Timeline", "What timeline or SOW term should apply?", "[Timeline]"),
    ),
    templateSections: [
      {
        title: "Services, Deliverables, and Cooperation",
        body:
          "The provider performs services under SOWs, the customer cooperates, and deliverables may be subject to acceptance and correction procedures.",
      },
      {
        title: "IP, Payment, Termination, and Confidentiality",
        body:
          "The template covers ownership of deliverables, pre-existing materials, fees, taxes, termination, warranties, indemnity, insurance, confidentiality, and general terms.",
      },
    ],
  },
  {
    id: "partnership-agreement",
    title: "Partnership Agreement",
    shortName: "Partnership Agreement",
    description: "Commercial partnership terms and responsibilities.",
    filename: "Partnership-Agreement.md",
    aliases: ["partnership", "partner agreement", "reseller", "referral", "channel"],
    fields: fields(
      businessField("partnershipScope", "Partnership scope", "What is the scope of the partnership?", "[Partnership scope]"),
      businessField("obligations", "Obligations", "What key obligations should each partner have?", "[Partner obligations]"),
      businessField("economics", "Economics", "What revenue share, fees, or economics should apply?", "[Economics]"),
    ),
    templateSections: [
      {
        title: "Partner Activities and Obligations",
        body:
          "The template sets responsibilities for partner activities, compliance, customer interactions, and limits on authority.",
      },
      {
        title: "Economics, Branding, Termination, and General Terms",
        body:
          "The agreement covers payment mechanics, intellectual property, marketing, confidentiality, liability, termination, and standard legal terms.",
      },
    ],
  },
  {
    id: "business-associate-agreement",
    title: "Business Associate Agreement",
    shortName: "BAA",
    description: "HIPAA business associate terms for protected health information.",
    filename: "BAA.md",
    aliases: ["baa", "business associate", "hipaa", "health information", "phi"],
    fields: fields(
      businessField("permittedUse", "Permitted use", "What permitted uses or services involve PHI?", "[Permitted use]"),
      businessField("phi", "PHI involved", "What protected health information is involved?", "[PHI involved]"),
      businessField("safeguards", "Safeguards", "What safeguards or compliance notes should be included?", "[Safeguards]"),
    ),
    templateSections: [
      {
        title: "Permitted Uses, Safeguards, and Reporting",
        body:
          "The business associate may use PHI only as permitted, must apply safeguards, and must report unauthorized uses or disclosures.",
      },
      {
        title: "Subcontractors, Access, Amendment, and Termination",
        body:
          "The template covers subcontractor obligations, individual rights support, accounting of disclosures, return or destruction of PHI, and HIPAA definitions.",
      },
    ],
  },
  {
    id: "software-license-agreement",
    title: "Software License Agreement",
    shortName: "Software License Agreement",
    description: "License terms for installed or downloadable software.",
    filename: "Software-License-Agreement.md",
    aliases: ["software license", "license agreement", "installed software", "downloadable software"],
    fields: fields(
      businessField("software", "Software", "What software is being licensed?", "[Software]"),
      businessField("licenseScope", "License scope", "What license scope or use limits should apply?", "[License scope]"),
      businessField("licenseTerm", "License term", "What license term should apply?", "[License term]"),
      businessField("fees", "Fees", "What license fees or payment terms should apply?", "[Fees]"),
    ),
    templateSections: [
      {
        title: "License Grant and Restrictions",
        body:
          "The provider grants the selected license rights while reserving ownership and applying restrictions on copying, sublicensing, reverse engineering, and misuse.",
      },
      {
        title: "Fees, Support, IP, Termination, and General Terms",
        body:
          "The template covers fees, taxes, support, feedback, warranties, disclaimers, indemnity, liability limits, confidentiality, and definitions.",
      },
    ],
  },
  {
    id: "pilot-agreement",
    title: "Pilot Agreement",
    shortName: "Pilot Agreement",
    description: "Limited pilot or trial terms for a product.",
    filename: "Pilot-Agreement.md",
    aliases: ["pilot", "trial", "proof of concept", "poc", "evaluation"],
    fields: fields(
      businessField("product", "Pilot product", "What product or service is being piloted?", "[Pilot product]"),
      businessField("pilotGoals", "Pilot goals", "What goals or success criteria should the pilot have?", "[Pilot goals]"),
      businessField("pilotTerm", "Pilot term", "How long should the pilot run?", "[Pilot term]"),
    ),
    templateSections: [
      {
        title: "Pilot Access and Evaluation",
        body:
          "The customer receives limited pilot access to evaluate the product for the stated goals during the pilot term.",
      },
      {
        title: "Restrictions, Disclaimer, Termination, and General Terms",
        body:
          "The template addresses non-production use, feedback, ownership, confidentiality, warranty disclaimers, limits of liability, and termination.",
      },
    ],
  },
  {
    id: "ai-addendum",
    title: "AI Addendum",
    shortName: "AI Addendum",
    description: "Supplemental terms for AI features, inputs, outputs, and restrictions.",
    filename: "AI-Addendum.md",
    aliases: ["ai addendum", "artificial intelligence", "machine learning", "ai terms", "generative ai"],
    fields: fields(
      businessField("aiServices", "AI services", "What AI services or features are covered?", "[AI services]"),
      businessField("inputs", "Inputs", "What inputs may users submit?", "[Inputs]"),
      businessField("outputs", "Outputs", "What outputs may the AI service generate?", "[Outputs]"),
      businessField("restrictions", "Restrictions", "What AI-specific restrictions should apply?", "[Restrictions]"),
    ),
    templateSections: [
      {
        title: "AI Services, Input, and Output",
        body:
          "The addendum covers use of AI services, rights to inputs, generation and handling of outputs, and provider rights needed to operate the AI system.",
      },
      {
        title: "Restrictions, Personal Data, and Nature of AI",
        body:
          "The template addresses regulated-use restrictions, IP concerns, personal data, AI limitations, output similarity, and key definitions.",
      },
    ],
  },
];

export const documentSections: DocumentField["section"][] = [
  "Document",
  "Parties",
  "Business Terms",
  "Legal",
];

export function createEmptyDraftValues(document: SupportedDocument): DraftValues {
  return Object.fromEntries(document.fields.map((field) => [field.key, ""]));
}

export function formatDate(value: string) {
  if (!value) {
    return "[Effective date]";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function getDraftValue(
  values: DraftValues,
  field: DocumentField,
  options?: { formatDates?: boolean },
) {
  const value = values[field.key]?.trim();

  if (!value) {
    return field.placeholder;
  }

  if (options?.formatDates && field.key === "effectiveDate") {
    return formatDate(value);
  }

  return value;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function scoreDocument(document: SupportedDocument, request: string) {
  const normalizedRequest = normalize(request);
  const terms = [document.title, document.shortName, ...document.aliases].map(normalize);

  if (terms.some((term) => normalizedRequest === term || normalizedRequest.includes(term))) {
    return 100;
  }

  const requestWords = new Set(normalizedRequest.split(" ").filter(Boolean));
  return terms.reduce((highestScore, term) => {
    const termWords = term.split(" ").filter(Boolean);
    const matches = termWords.filter((word) => requestWords.has(word)).length;
    return Math.max(highestScore, matches);
  }, 0);
}

export function findSupportedDocument(request: string) {
  const matches = supportedDocuments
    .map((document) => ({
      document,
      score: scoreDocument(document, request),
    }))
    .sort((left, right) => right.score - left.score);

  const best = matches[0];
  return best && best.score >= 2 ? best.document : null;
}

export function suggestSupportedDocument(request: string) {
  const normalizedRequest = normalize(request);

  if (/\b(employment|employee|contractor|consulting|consultant|services?)\b/.test(normalizedRequest)) {
    return supportedDocuments.find((document) => document.id === "professional-services-agreement")!;
  }

  if (/\b(privacy|data|gdpr|personal)\b/.test(normalizedRequest)) {
    return supportedDocuments.find((document) => document.id === "data-processing-agreement")!;
  }

  if (/\b(health|hipaa|phi|medical)\b/.test(normalizedRequest)) {
    return supportedDocuments.find((document) => document.id === "business-associate-agreement")!;
  }

  if (/\b(software|license|licence)\b/.test(normalizedRequest)) {
    return supportedDocuments.find((document) => document.id === "software-license-agreement")!;
  }

  if (/\b(ai|artificial|machine learning|ml)\b/.test(normalizedRequest)) {
    return supportedDocuments.find((document) => document.id === "ai-addendum")!;
  }

  return supportedDocuments[0];
}

export function buildDocumentMarkdown(document: SupportedDocument, values: DraftValues) {
  const details = document.fields
    .map((field) => `| ${field.label} | ${getDraftValue(values, field, { formatDates: true })} |`)
    .join("\n");
  const sections = document.templateSections
    .map((section, index) => `${index + 1}. ${section.title}. ${section.body}`)
    .join("\n\n");

  return `# ${document.title}

## Draft Details

| Field | Value |
| --- | --- |
${details}

## Template Terms

Template source: ${document.filename}

${sections}

This prototype prepares a working draft and is not legal advice.`;
}
