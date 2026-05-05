import type { ChecklistSection } from "./types";

export const sections: ChecklistSection[] = [
  {
    title: "Practice Standard 100 – Valuation Conclusions and Valuation Reports",
    questions: [
      {
        id: "q1",
        number: 1,
        allowsNA: false,
        text: "The Valuator has selected the appropriate Practice Standards, i.e., they are acting independently and objectively to provide a conclusion of value for shares, assets, liabilities, or any other business interest (\"Valuation Conclusion\").",
      },
      {
        id: "q2",
        number: 2,
        allowsNA: false,
        text: "The Valuator has the appropriate professional competence for the engagement.",
      },
      {
        id: "q3",
        number: 3,
        allowsNA: false,
        text: "The Valuator has applied professional judgment and professional skepticism when relying upon management representations and financial information.",
      },
      {
        id: "q4",
        number: 4,
        allowsNA: true,
        text: "When appropriate, the Valuator has consulted applicable Practice Bulletins and/or reached out to CBV Institute Professional Practice staff.",
      },
    ],
  },
  {
    title: "Oral Valuation Conclusions",
    questions: [
      {
        id: "q5",
        number: 5,
        allowsNA: true,
        text: "When communicated orally, does the oral communication amount to a Valuation Conclusion?",
      },
      {
        id: "q6",
        number: 6,
        allowsNA: true,
        text: "When the Valuation Conclusion has been communicated orally, was the substance of the oral report appropriately documented in the working papers?",
      },
      {
        id: "q7",
        number: 7,
        allowsNA: true,
        text: "Does the Valuation Conclusion communicated orally comply with Practice Standards No. 100, 120, and 130?",
      },
      {
        id: "q8",
        number: 8,
        allowsNA: true,
        text: "Were required disclosures (from PS 110) verbally communicated to the client/intended users of the oral report?",
      },
    ],
  },
  {
    title: "Levels of Valuation Conclusions",
    questions: [
      {
        id: "q12",
        number: 12,
        allowsNA: false,
        text: "The Valuator has selected the appropriate level of the Valuation Conclusion (Calculation, Estimate, Comprehensive), consistent with PS 100 definitions and with guidance in Practice Bulletin No. 3.",
      },
      {
        id: "q13",
        number: 13,
        allowsNA: false,
        text: "The Valuation Conclusion is not misleading to intended users and is not dependent on any assumptions known by the Valuator to be false.",
      },
      {
        id: "q14",
        number: 14,
        allowsNA: false,
        text: "The level of Valuation Conclusion was communicated to the client in writing at the beginning of the engagement (e.g., within the terms of a written engagement agreement).",
      },
      {
        id: "q15",
        number: 15,
        allowsNA: true,
        text: "If the level of Valuation Conclusion changed during the engagement, changes were communicated to the client in writing.",
      },
      {
        id: "q16",
        number: 16,
        allowsNA: false,
        text: "The level of Valuation Conclusion selected is appropriate for the intended users, purpose, and the facts and circumstances of the engagement including the availability and reliability of information.",
      },
    ],
  },
  {
    title: "Practice Standard 110 – Valuation Reports - Report Disclosure Standards",
    questions: [
      {
        id: "q17",
        number: 17,
        allowsNA: false,
        text: "For draft work products, has the Valuator met and disclosed all four of the following conditions are met and explicitly disclosed on the work product:\na) the work product is clearly marked as being in draft form and subject to change, and includes a statement that such changes could be significant;\nb) the draft work product is issued for the purpose of obtaining comment, further instructions or information required to complete the Valuation Report;\nc) the Valuator knows, or reasonably ought to know, that the intended reader does not intend to rely on the draft work product or distribute the draft work product to a third party who might in turn rely on the draft work product; and\nd) the Valuator has a reasonable expectation at the time the draft work product is provided that a Valuation Report will be completed and issued in due course.",
      },
      {
        id: "q18",
        number: 18,
        allowsNA: false,
        text: "Overall, the content and level of detail is appropriate for the engagement (given the report's purpose and the needs of the intended users). The report provides intended users with a clear understanding of how the Valuator arrived at the Valuation Conclusion. It includes all information necessary for the intended users to understand the Scope of Work performed, information relied upon, professional judgments made, significant inputs and assumptions and the basis for conclusions reached.",
      },
      {
        id: "q19",
        number: 19,
        allowsNA: false,
        text: "To whom the report is addressed, the identity of the client, and any other intended users.",
      },
      {
        id: "q20",
        number: 20,
        allowsNA: false,
        text: "Description of the shares, assets, liabilities or interest in the business being valued.",
      },
      {
        id: "q21",
        number: 21,
        allowsNA: false,
        text: "Date of the Valuation Conclusion (\"Val Date\").",
      },
      {
        id: "q22",
        number: 22,
        allowsNA: false,
        text: "Date of the Valuation Report.",
      },
      {
        id: "q23",
        number: 23,
        allowsNA: false,
        text: "Purpose and intended use for the which the Valuation Report has been prepared.",
      },
      {
        id: "q24",
        number: 24,
        allowsNA: false,
        text: "Name of the Valuator and the firm responsible for issuing the report.",
      },
      {
        id: "q25",
        number: 25,
        allowsNA: false,
        text: "Statement that report was prepared by Valuator acting independently and objectively.",
      },
      {
        id: "q26",
        number: 26,
        allowsNA: false,
        text: "Statement that Valuator's compensation is not contingent on any action or event resulting from the use of the Valuation Report.",
      },
      {
        id: "q27",
        number: 27,
        allowsNA: false,
        text: "Statement that the Valuation Report has been prepared in conformity with the Practice Standards of CBV Institute.",
      },
      {
        id: "q28",
        number: 28,
        allowsNA: false,
        text: "Level of Valuation Conclusion provided in the report (Comprehensive/Estimate/Calculation).",
      },
      {
        id: "q29",
        number: 29,
        allowsNA: false,
        text: "Statement that professional judgment is applied by Valuator in determining the appropriate Scope of Work for the engagement, and also for classifying a particular Valuation Conclusion as Comprehensive/Estimate/Calculation, based on discussions with the client(s) regarding purpose and intended use.",
      },
    ],
  },
  {
    title: "Report Limitations",
    questions: [
      {
        id: "q30",
        number: 30,
        allowsNA: true,
        text: "For Estimate Valuation Conclusions: disclosure that the conclusion expressed is based on the extent of review, inquiry, analysis and independent corroboration procedures performed and that such procedures would have been more extensive had a Comprehensive Valuation Conclusion been completed. Therefore, the conclusion expressed might have been different had a Comprehensive Valuation Conclusion been provided.",
      },
      {
        id: "q31",
        number: 31,
        allowsNA: true,
        text: "For Calculation Valuation Conclusions: disclosure that the conclusion expressed is based on the extent of review, inquiry, analysis and independent corroboration procedures performed and that such procedures would have been more extensive had either a Comprehensive Valuation Conclusion or an Estimate Valuation Conclusion been completed. Therefore, the conclusion expressed might have been different had a Comprehensive Valuation Conclusion or an Estimate Valuation Conclusion been provided.",
      },
    ],
  },
  {
    title: "Specific Disclosure Standards",
    questions: [
      {
        id: "q32",
        number: 32,
        allowsNA: false,
        text: "Premise of value, basis of value, valuation approach(es) and method(s) used, explaining the rationale for their selection and basic mechanics.",
      },
      {
        id: "q33",
        number: 33,
        allowsNA: false,
        text: "Definitions for basis of value used (such as \"Fair Market Value\", \"market value\", \"fair value\", or \"adjusted net asset value\") and any other technical terms which might not be self-evident along with the source of the definition (e.g., Practice Bulletin No. 2 - International Valuation Glossary – Business Valuation, IFRS, etc).",
      },
      {
        id: "q34",
        number: 34,
        allowsNA: false,
        text: "A description of the business, interest, asset or liability being valued that is appropriate for the intended purpose and users, including at least a basic description of the business.",
      },
      {
        id: "q35",
        number: 35,
        allowsNA: false,
        text: "The relevant industry and economic factors that affect the Valuation Conclusion.",
      },
      {
        id: "q36",
        number: 36,
        allowsNA: false,
        text: "Summary of relevant financial information (current and historical financial position information, earnings/cash information, as well as forward-looking financial information).",
      },
      {
        id: "q37",
        number: 37,
        allowsNA: false,
        text: "Significant inputs to the Valuation Conclusion and identification of the source (whether they were independently developed or provided by management) or explanation of how the inputs were developed.",
        bullets: [
          "adjustments leading to the selection of normalized earnings or cash flow levels",
          "future cash flows",
          "growth rates (e.g., industry and economic outlooks)",
          "rates of return earned",
          "rates of return required by capital providers and the corresponding discount rates (e.g., WACC, cost of equity), or capitalization rates (e.g., multipliers based on WACC or market multiples)",
          "relevant earnings/cash flow risk factors",
          "tax rates",
          "redundant assets",
          "excess or deficient working capital",
          "minority interest or other discounts or premiums",
        ],
      },
      {
        id: "q38",
        number: 38,
        allowsNA: false,
        text: "Significant assumptions made in arriving at the Valuation Conclusion and the basis for making each assumption.",
        bullets: [
          "the Fair Market Value of capital assets or real estate",
          "market compensation for positions held by shareholders or related parties",
          "key or significant normalizing adjustments, such as discretionary expenses",
          "the assumption that information in financial statements is fairly presented",
          "assumptions regarding the existence and/or measurement of highly uncertain liabilities, such as litigation, environmental claims, etc.",
        ],
      },
      {
        id: "q39",
        number: 39,
        allowsNA: false,
        text: "Significant valuation calculations (e.g. schedules) used to arrive at the Valuation Conclusion.",
      },
      {
        id: "q40",
        number: 40,
        allowsNA: false,
        text: "Whether potential acquirers who might enjoy post-acquisition economies of scale, synergies, or strategic advantages were considered in arriving at the Valuation Conclusion and the reasons why or why not.",
      },
    ],
  },
  {
    title: "Report Scope of Review",
    questions: [
      {
        id: "q41",
        number: 41,
        allowsNA: false,
        text: "Scope of review section that clearly identifies the specific information (e.g., documents, data, interviews) the Valuator relied upon to arrive at the Valuation Conclusion.",
      },
    ],
  },
  {
    title: "Scope Limitations",
    questions: [
      {
        id: "q42",
        number: 42,
        allowsNA: true,
        text: "If any scope limitations exist, the report contains a scope limitations section, identifying any scope limitations and adequately explaining each, setting out the reasons for the limitation and its possible impact(s) on the Valuation Conclusion.",
      },
      {
        id: "q43",
        number: 43,
        allowsNA: true,
        text: "No indication that any scope limitations are significant to a degree that they jeopardize the credibility of the Valuation Conclusion, and the Valuator must not render a Valuation Conclusion.",
      },
    ],
  },
  {
    title: "Restrictions",
    questions: [
      {
        id: "q44",
        number: 44,
        allowsNA: false,
        text: "Any restrictions that affect the Valuation Conclusion including:\na) Statement restricting use of report to persons for whom it was prepared and only for stated purpose and intended use\nb) Statement giving Valuator right (but not the obligation) to make revisions under specified circumstances, such as when facts existing at the Valuation Date become apparent to the Valuator after the report is issued.",
      },
    ],
  },
  {
    title: "Conclusion",
    questions: [
      {
        id: "q45",
        number: 45,
        allowsNA: false,
        text: "Conclusion as to value of shares, assets, liabilities, or any other interest in a business being valued, stated as either a point estimate or a range, and including a reference the type level of Valuation Report Conclusion being provided, the Valuator's scope of review, key significant inputs and assumptions relied upon, and any restrictions and/or qualifications scope limitations.",
      },
    ],
  },
  {
    title: "Practice Standard 120 – Valuation Reports – Scope of Work Standards",
    questions: [
      {
        id: "q46",
        number: 46,
        allowsNA: false,
        text: "Evidence of Valuator obtaining clear instructions including the expected Scope of Work and level of Valuation Conclusion to be provided (note: engagement agreement is required).",
      },
      {
        id: "q47",
        number: 47,
        allowsNA: true,
        text: "If any subsequent significant changes to the terms of engagement, they are documented and agreed to in writing.",
      },
      {
        id: "q48",
        number: 48,
        allowsNA: false,
        text: "Evidence of the work being adequately planned, properly executed, and performed with due care and an objective state of mind.",
      },
      {
        id: "q49",
        number: 49,
        allowsNA: false,
        text: "Evidence of work performed by person(s) having adequate technical training and proficiency in business valuation concepts, principles and techniques to competently value the subject of the valuation.",
      },
      {
        id: "q50",
        number: 50,
        allowsNA: false,
        text: "Was the Valuation Conclusion based on sufficient and appropriate information given the intended purpose and intended users?",
      },
      {
        id: "q51",
        number: 51,
        allowsNA: false,
        text: "Evidence of Valuator assessing the reliability of external sources and tools, such as opinions of other experts or specialists (e.g., real estate appraisers), artificial intelligence, or other sources of data or technology.",
      },
      {
        id: "q52",
        number: 52,
        allowsNA: true,
        text: "Evidence of Valuator considering the extent of any limitations to Scope of Work. If limitations jeopardize the credibility of the Valuation Conclusion, Valuator has not rendered a Valuation Conclusion.",
      },
      {
        id: "q53",
        number: 53,
        allowsNA: false,
        text: "Evidence of a quality review process to ensure that the valuation has been performed in accordance with the Practice Standards and the Code of Ethics, including application of professional skepticism and review and challenge of key judgment areas in the valuation.",
      },
      {
        id: "q54",
        number: 54,
        allowsNA: false,
        text: "Evidence that Valuator obtained a sufficient understanding of the subject of the valuation.",
      },
      {
        id: "q55",
        number: 55,
        allowsNA: false,
        text: "Evidence that Valuator obtained a sufficient understanding of underlying business operations and other information relevant to the valuation (must be entity-specific). Examples include: ownership, history of the business, relevant capital transactions, key management, divisions or segments, product and/or services offerings, geographical scope of operations, impacts of regulation, material agreements or contracts.",
      },
      {
        id: "q56",
        number: 56,
        allowsNA: false,
        text: "Evidence that Valuator obtained sufficient financial information to appropriately understand subject being valued, including past results, future prospects and present financial position.",
      },
      {
        id: "q57",
        number: 57,
        allowsNA: false,
        text: "Evidence that Valuator obtained a sufficient understanding of the relevant industry(ies) in which the underlying business operates.",
        bullets: [
          "Critical success factors",
          "Competitors and their respective market shares",
          "Industry regulations",
          "Industry projections and forecasts",
          "New developments or trends",
          "Environmental, social and governance (ESG) or other sustainability issues or opportunities",
          "Trading volumes, prices and financial and valuation ratios of guideline public companies",
          "Guideline market transactions",
        ],
      },
      {
        id: "q58",
        number: 58,
        allowsNA: false,
        text: "Evidence that Valuator obtained sufficient information relating to the general economic conditions affecting the business operations at Valuation Date.",
      },
      {
        id: "q59",
        number: 59,
        allowsNA: false,
        text: "Evidence that Valuator obtained relevant prior or current valuations or indicators of value of the business that is the subject of the valuation (examples might include valuations by other Valuators or analysts, market trading prices, equity transaction details, formal offers involving the subject being valued).",
      },
      {
        id: "q60",
        number: 60,
        allowsNA: false,
        text: "Evidence that Valuator determined the appropriate premise of value and basis of value.",
      },
      {
        id: "q61",
        number: 61,
        allowsNA: false,
        text: "Evidence that Valuator determined the appropriate valuation approach(es) and method(s).",
      },
      {
        id: "q62",
        number: 62,
        allowsNA: false,
        text: "Evidence that Valuator determined and applied an appropriate and reliable valuation model: The valuation model used is appropriate for the purpose and intended use of the valuation? The valuation model is mathematically and technically accurate (e.g., appropriately applying valuation theory)?",
      },
      {
        id: "q63",
        number: 63,
        allowsNA: false,
        text: "Evidence that Valuator determined inputs and assumptions that are reasonable and appropriate, considering the intended purpose and intended uses of the Valuation Conclusion.",
      },
      {
        id: "q64",
        number: 64,
        allowsNA: false,
        text: "All significant inputs and assumptions are supported.",
      },
      {
        id: "q65",
        number: 65,
        allowsNA: true,
        text: "If any significant inputs or assumptions cannot be supported, they are disclosed clearly as a scope limitation (preferred: standalone Scope Limitations section of the report).",
      },
      {
        id: "q66",
        number: 66,
        allowsNA: false,
        text: "Valuator has considered and documented the reasonableness and appropriateness of the overall Valuation Conclusion by performing reasonability tests of the Valuation Conclusion.",
        bullets: [
          "Valuator has considered the availability of market-based data relevant to the valuation?",
          "Valuator has considered multiple valuation approaches or methods? (if they have resulted in different indications of value, the Valuator has compared, analyzed and documented how they arrived at the Valuation Conclusion considering these differing indicators of value)",
        ],
      },
      {
        id: "q67",
        number: 67,
        allowsNA: true,
        text: "Evidence that Valuator considered the necessity of relying upon the work of a specialist.",
      },
      {
        id: "q68",
        number: 68,
        allowsNA: true,
        text: "Prior to engaging or relying upon the work of a specialist hired by client, Valuator has obtained reasonable support that it is appropriate to rely on the specialist (specialist's independence and objectivity, and their reputation for competence, any apparent deficiencies in the specialist's work?).",
      },
      {
        id: "q69",
        number: 69,
        allowsNA: false,
        text: "Evidence of written client/management representations.",
      },
    ],
  },
  {
    title: "Practice Standard 130 – Valuation Reports – File Documentation Standards",
    questions: [
      {
        id: "q70",
        number: 70,
        allowsNA: false,
        text: "Procedures undertaken and factors considered to ensure the independence and objectivity of the Valuator documented and retained on file.",
      },
      {
        id: "q71",
        number: 71,
        allowsNA: false,
        text: "Work performed was documented and files maintained in organized manner.",
      },
      {
        id: "q72",
        number: 72,
        allowsNA: false,
        text: "Form and extent of working papers suits the circumstances and needs of the engagement taking into consideration the level of Valuation Conclusion.",
      },
      {
        id: "q73",
        number: 73,
        allowsNA: false,
        text: "No indication that documents and working papers evidencing the nature and extent of work performed has been purged from the file before the end of the minimum period set out by the Mandatory Practice Inspection Program (five calendar years following the date of the Valuation Report).",
      },
      {
        id: "q74",
        number: 74,
        allowsNA: false,
        text: "Identities of Valuators performing the engagement documented.",
      },
      {
        id: "q75",
        number: 75,
        allowsNA: false,
        text: "Copy of final issued Valuation Report retained on file.",
      },
      {
        id: "q76",
        number: 76,
        allowsNA: false,
        text: "Engagement agreement and any instructions from the client (or client's representative) retained on file.",
      },
      {
        id: "q77",
        number: 77,
        allowsNA: false,
        text: "Summaries of key meetings, discussions and correspondence retained on file.",
      },
      {
        id: "q78",
        number: 78,
        allowsNA: false,
        text: "Information relied upon is retained on file (or accessible by the Valuator).",
        bullets: [
          "Significant information that provides the Valuator with an understanding of the subject of the valuation and its underlying business operations",
          "Financial statements or a summary of historical operating results and financial position of the underlying business",
          "Future oriented financial information, such as financial projections, forecasts, and budgets",
          "Information regarding the industry analysis performed",
          "Information regarding the general economic review performed",
        ],
      },
      {
        id: "q79",
        number: 79,
        allowsNA: false,
        text: "Documentation of premise of value, basis of value, valuation approaches, methods and techniques selected, along with reasons for selection.",
      },
      {
        id: "q80",
        number: 80,
        allowsNA: false,
        text: "Documentation of significant inputs and assumptions used.",
      },
      {
        id: "q81",
        number: 81,
        allowsNA: false,
        text: "Documentation of valuation calculations – including necessary explanations and supporting documentation.",
      },
      {
        id: "q82",
        number: 82,
        allowsNA: false,
        text: "Documentation of the work performed to test the reasonableness and appropriateness of the overall Valuation Conclusion.",
      },
      {
        id: "q83",
        number: 83,
        allowsNA: false,
        text: "Documentation to evidence the quality review process applied to the engagement.",
      },
      {
        id: "q84",
        number: 84,
        allowsNA: false,
        text: "Documentation of any conclusions of specialists relied upon (including copy of written report if prepared).",
      },
      {
        id: "q85",
        number: 85,
        allowsNA: false,
        text: "Client/management representation letter or notation of why no such letter was obtained.",
      },
      {
        id: "q86",
        number: 86,
        allowsNA: false,
        text: "The draft valuation report when the representation letter(s) indicates that the client or management relied on a draft copy of the Valuation Report in order to make its representations. Where no rep letter has been received, documentation of the reasons for not getting a rep letter signed.",
      },
    ],
  },
];

// Runtime assertion: exactly 83 questions expected
const allQs = sections.flatMap((s) => s.questions);
if (allQs.length !== 83) {
  throw new Error(
    `Expected 83 checklist questions but found ${allQs.length}. Check data.ts for missing or extra entries.`,
  );
}
