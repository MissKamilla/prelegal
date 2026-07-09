export type NdaFormValues = {
  effectiveDate: string;
  purpose: string;
  partyOneName: string;
  partyOneSigner: string;
  partyOneTitle: string;
  partyOneAddress: string;
  partyTwoName: string;
  partyTwoSigner: string;
  partyTwoTitle: string;
  partyTwoAddress: string;
  mndaTermYears: string;
  confidentialityTermYears: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
};

export const initialNdaValues: NdaFormValues = {
  effectiveDate: new Date().toISOString().slice(0, 10),
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  partyOneName: "Acme, Inc.",
  partyOneSigner: "Jane Founder",
  partyOneTitle: "CEO",
  partyOneAddress: "legal@acme.example",
  partyTwoName: "Example Partner LLC",
  partyTwoSigner: "Alex Partner",
  partyTwoTitle: "Managing Director",
  partyTwoAddress: "notices@example-partner.example",
  mndaTermYears: "1",
  confidentialityTermYears: "1",
  governingLaw: "Delaware",
  jurisdiction: "courts located in New Castle, DE",
  modifications: "None.",
};

export const emptyNdaValues: NdaFormValues = {
  effectiveDate: "",
  purpose: "",
  partyOneName: "",
  partyOneSigner: "",
  partyOneTitle: "",
  partyOneAddress: "",
  partyTwoName: "",
  partyTwoSigner: "",
  partyTwoTitle: "",
  partyTwoAddress: "",
  mndaTermYears: "",
  confidentialityTermYears: "",
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
};

export const standardTerms = [
  {
    title: "Introduction",
    body:
      "This Mutual Non-Disclosure Agreement, which incorporates these Standard Terms and the Cover Page, allows each party to disclose or make available information in connection with the Purpose. Confidential Information includes information identified as confidential or proprietary, information that should reasonably be understood as confidential due to its nature and circumstances, the existence and status of the parties' discussions, and information on the Cover Page.",
  },
  {
    title: "Use and Protection of Confidential Information",
    body:
      "The Receiving Party shall use Confidential Information solely for the Purpose, not disclose Confidential Information to third parties without prior written approval except to representatives with a reasonable need to know, and protect Confidential Information using at least the same protections it uses for its own similar information but no less than a reasonable standard of care.",
  },
  {
    title: "Exceptions",
    body:
      "The Receiving Party's obligations do not apply to information it can demonstrate is or becomes publicly available through no fault of the Receiving Party, was rightfully known before receipt without confidentiality restrictions, was rightfully obtained from a third party without confidentiality restrictions, or was independently developed without using or referencing Confidential Information.",
  },
  {
    title: "Disclosures Required by Law",
    body:
      "The Receiving Party may disclose Confidential Information to the extent required by law, regulation, subpoena, court order, or regulatory authority, provided it gives reasonable advance notice when legally permitted and reasonably cooperates with efforts to obtain confidential treatment.",
  },
  {
    title: "Term and Termination",
    body:
      "This MNDA commences on the Effective Date and expires at the end of the MNDA Term. Either party may terminate this MNDA upon written notice. The Receiving Party's obligations relating to Confidential Information survive for the Term of Confidentiality.",
  },
  {
    title: "Return or Destruction of Confidential Information",
    body:
      "Upon expiration, termination, or earlier written request, the Receiving Party will cease using Confidential Information and promptly return or destroy Confidential Information in its possession or control, except that it may retain information under standard backup or record retention policies or as required by law.",
  },
  {
    title: "Proprietary Rights",
    body:
      "The Disclosing Party retains all intellectual property and other rights in its Confidential Information, and disclosure grants no license under those rights.",
  },
  {
    title: "Disclaimer",
    body:
      "All Confidential Information is provided as is, with all faults, and without warranties, including implied warranties of title, merchantability, and fitness for a particular purpose.",
  },
  {
    title: "Governing Law and Jurisdiction",
    body:
      "This MNDA and all related matters are governed by the law named on the Cover Page. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the courts identified on the Cover Page, and each party submits to that jurisdiction.",
  },
  {
    title: "General",
    body:
      "Neither party is obligated to disclose Confidential Information or proceed with any proposed transaction. Assignment requires consent except in connection with a merger, reorganization, acquisition, or transfer of substantially all assets or voting securities. This MNDA is the entire agreement for its subject matter and may be amended only in a signed writing.",
  },
];

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

export function buildNdaMarkdown(values: NdaFormValues) {
  const terms = standardTerms
    .map((term, index) => `${index + 1}. ${term.title}. ${term.body}`)
    .join("\n\n");

  return `# Mutual Non-Disclosure Agreement

## Cover Page

Purpose: ${values.purpose}

Effective Date: ${formatDate(values.effectiveDate)}

MNDA Term: Expires ${values.mndaTermYears || "[number]"} year(s) from Effective Date.

Term of Confidentiality: ${values.confidentialityTermYears || "[number]"} year(s) from Effective Date, except trade secrets remain protected while they are trade secrets under applicable law.

Governing Law: ${values.governingLaw || "[state]"}

Jurisdiction: ${values.jurisdiction || "[courts]"}

MNDA Modifications: ${values.modifications || "None."}

## Parties

| Field | Party 1 | Party 2 |
| --- | --- | --- |
| Company | ${values.partyOneName} | ${values.partyTwoName} |
| Print Name | ${values.partyOneSigner} | ${values.partyTwoSigner} |
| Title | ${values.partyOneTitle} | ${values.partyTwoTitle} |
| Notice Address | ${values.partyOneAddress} | ${values.partyTwoAddress} |
| Signature |  |  |
| Date |  |  |

## Standard Terms

${terms}

Common Paper Mutual Non-Disclosure Agreement Version 1.0 is free to use under CC BY 4.0. This prototype prepares a working draft and is not legal advice.`;
}
