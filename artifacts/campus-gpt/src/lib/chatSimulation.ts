import { Citation } from '@workspace/api-client-react';

export interface SimulatedResponse {
  content: string;
  citations: Citation[];
  followUps: string[];
  toolChips: string[];
}

const responses: SimulatedResponse[] = [
  {
    content: "To register your courses on **MIS Web**, go to [mis.ug.edu.gh](https://mis.ug.edu.gh) and log in with your student ID and PIN. Navigate to **Course Registration** under the Academic menu. Select your semester, choose your courses, and click **Submit Registration** before the deadline [1].\n\nFor HERC/UGRC courses, registration is done separately at [sts.ug.edu.gh](https://sts.ug.edu.gh) using your index number and the PIN from your confidential PDF [2].",
    citations: [
      { index: 1, title: "MIS Web Student Portal Guide", url: "https://ug.edu.gh", domain: "ug.edu.gh", excerpt: "Course registration is available on MIS Web during the registration window each semester." },
      { index: 2, title: "HERC/UGRC Registration – STS Portal", url: "https://sts.ug.edu.gh", domain: "sts.ug.edu.gh", excerpt: "Use your index number and PIN from the confidential PDF to register HERC and UGRC courses." }
    ],
    followUps: ["When does registration close?", "What is the Add/Drop period?", "How do I get my PIN?"],
    toolChips: ["🔎 Searching campus database...", "📋 Checking registration deadlines..."]
  },
  {
    content: "UG semester fees can be paid through the **GCB bank payment system** or via the **UG Student Payment Portal** at [fees.ug.edu.gh](https://fees.ug.edu.gh). You will need your index number to generate a payment slip [1].\n\nFor fee breakdown and scholarship deductions, check **MIS Web → Student Finance**. If you receive SLTF support, the disbursement is reflected there automatically [2].",
    citations: [
      { index: 1, title: "UG Fees Payment Guide", url: "https://ug.edu.gh", domain: "ug.edu.gh", excerpt: "Students must pay fees at designated GCB branches or through the online portal before the deadline." },
      { index: 2, title: "SLTF Loan Disbursement Info", url: "https://sltf.gov.gh", domain: "sltf.gov.gh", excerpt: "SLTF loans are disbursed directly to UG and reflected on the student finance dashboard." }
    ],
    followUps: ["How do I apply for SLTF?", "What happens if I miss the fee deadline?", "Where is the GCB bank on campus?"],
    toolChips: ["💳 Checking fees portal...", "📊 Loading finance information..."]
  },
  {
    content: "The **Add/Drop period** usually runs for the first two weeks of each semester. You can add or drop courses on **MIS Web** during this window without academic penalty [1].\n\nAfter the Add/Drop window closes, you can apply for a **Late Withdrawal** through your department — this incurs a 'W' on your transcript but not a failing grade. Your Departmental Exams Officer handles all exceptions [2].",
    citations: [
      { index: 1, title: "UG Academic Calendar – Add/Drop Rules", url: "https://ug.edu.gh", domain: "ug.edu.gh", excerpt: "The Add/Drop window opens on the first day of lectures and closes at the end of week two." },
      { index: 2, title: "Late Withdrawal Policy", url: "https://ug.edu.gh", domain: "ug.edu.gh", excerpt: "Students wishing to withdraw after the Add/Drop period must apply via the Departmental Exams Officer." }
    ],
    followUps: ["When does the semester start?", "Who is my Departmental Exams Officer?", "What is a 'W' grade?"],
    toolChips: ["📅 Checking academic calendar...", "📥 Fetching registration rules..."]
  },
  {
    content: "**SLTF (Student Loan Trust Fund)** loans cover tuition and living expenses for eligible Ghanaian students. To apply, visit [sltf.gov.gh](https://sltf.gov.gh) and create an account with your Ghana Card details [1].\n\nRequired documents: admission letter, Ghana Card, guarantor details, and proof of enrollment from the UG Registrar. Disbursements are made directly to UG on your behalf [2].",
    citations: [
      { index: 1, title: "SLTF Application Portal", url: "https://sltf.gov.gh", domain: "sltf.gov.gh", excerpt: "New applicants must register with a valid Ghana Card and complete the online loan application." },
      { index: 2, title: "SLTF Documentation Requirements", url: "https://sltf.gov.gh", domain: "sltf.gov.gh", excerpt: "Applicants must provide an admission letter, Ghana Card, and guarantor information." }
    ],
    followUps: ["How much does SLTF cover?", "When are SLTF disbursements made?", "Can postgraduate students apply?"],
    toolChips: ["🏦 Fetching SLTF information...", "📋 Checking eligibility criteria..."]
  }
];

export function getSimulatedResponse(query: string): SimulatedResponse {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('register') || lowerQuery.includes('course') || lowerQuery.includes('mis') || lowerQuery.includes('herc')) {
    return responses[0];
  }
  if (lowerQuery.includes('fee') || lowerQuery.includes('pay') || lowerQuery.includes('finance')) {
    return responses[1];
  }
  if (lowerQuery.includes('add') || lowerQuery.includes('drop') || lowerQuery.includes('withdraw') || lowerQuery.includes('deadline')) {
    return responses[2];
  }
  if (lowerQuery.includes('sltf') || lowerQuery.includes('loan') || lowerQuery.includes('scholarship')) {
    return responses[3];
  }
  return responses[Math.floor(Math.random() * responses.length)];
}
