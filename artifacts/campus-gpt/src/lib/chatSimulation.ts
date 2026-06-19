import { Citation } from '@workspace/api-client-react';

export interface SimulatedResponse {
  content: string;
  citations: Citation[];
  followUps: string[];
  toolChips: string[];
}

const responses: SimulatedResponse[] = [
  {
    content: "Based on your degree requirements, you should take **CS3230** (Design and Analysis of Algorithms) and **CS2105** (Introduction to Software Engineering) next semester [1]. \n\nSince you are also interested in AI, **CS3243** (Introduction to Artificial Intelligence) would be a great fit [2]. Let me know if you want me to add these to your academic planner.",
    citations: [
      { index: 1, title: "CS Degree Requirements 2023/24", url: "https://nus.edu.sg", domain: "nus.edu.sg", excerpt: "Students must complete CS3230 and CS2105 before proceeding to level 4000 modules." },
      { index: 2, title: "AI Focus Area Guidelines", url: "https://nus.edu.sg", domain: "nus.edu.sg", excerpt: "CS3243 is the foundational module for the AI focus area." }
    ],
    followUps: ["Add to my planner", "What are the prerequisites for CS3243?", "Show timetable options"],
    toolChips: ["🔎 Searching course catalog...", "📊 Analyzing degree progress..."]
  },
  {
    content: "You have an urgent deadline coming up: **CS3243 Midterm** is tomorrow at 2:00 PM [1]. \n\nYou also have a lab report for **CS2105** due on Friday [2]. Would you like me to schedule study blocks for these?",
    citations: [
      { index: 1, title: "CS3243 Midterm Announcement", url: "https://canvas.nus.edu.sg", domain: "canvas.nus.edu.sg", excerpt: "The midterm will be held on Thursday at 2:00 PM in MPSH1." },
      { index: 2, title: "CS2105 Lab 3 Submission", url: "https://canvas.nus.edu.sg", domain: "canvas.nus.edu.sg", excerpt: "Lab 3 report is due this Friday by 23:59." }
    ],
    followUps: ["Schedule study blocks", "What's covered in the midterm?", "Show my timetable"],
    toolChips: ["📅 Checking planner...", "📥 Fetching latest announcements..."]
  },
  {
    content: "The hall reapplication exercise for next academic year opens on **March 15th** and closes on **March 30th** [1]. \n\nSince you are currently in King Edward VII Hall, you can apply under the senior retention scheme [2]. Make sure your CCA points are updated before the portal opens.",
    citations: [
      { index: 1, title: "Hostel Admission Exercise Dates", url: "https://nus.edu.sg", domain: "nus.edu.sg", excerpt: "Applications for senior retention open on March 15 and close on March 30." },
      { index: 2, title: "KEVII Hall Retention Criteria", url: "https://kevii.nus.edu.sg", domain: "kevii.nus.edu.sg", excerpt: "Residents applying for retention must have a minimum of 30 CCA points." }
    ],
    followUps: ["How to check CCA points?", "Draft my portfolio", "Set a reminder"],
    toolChips: ["🏛 Fetching hall policies...", "⏰ Checking academic calendar..."]
  },
  {
    content: "For your CS2030 project, I recommend looking into **Java Streams** and **Optional** [1]. These will help you handle the asynchronous data processing required for the task. \n\nI found a relevant slide from Lecture 7 that explains how to chain stream operations effectively [2].",
    citations: [
      { index: 1, title: "CS2030 Project Guidelines", url: "https://canvas.nus.edu.sg", domain: "canvas.nus.edu.sg", excerpt: "Students are expected to utilize Java Streams and Optional for data manipulation." },
      { index: 2, title: "Lecture 7: Advanced Streams", url: "https://canvas.nus.edu.sg", domain: "canvas.nus.edu.sg", excerpt: "Chaining stream operations allows for concise and readable data processing." }
    ],
    followUps: ["Explain Java Optional", "Give me a code example", "Open Lecture 7 slides"],
    toolChips: ["📚 Scanning CS2030 materials...", "🔍 Finding code examples..."]
  }
];

export function getSimulatedResponse(query: string): SimulatedResponse {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('plan') || lowerQuery.includes('semester') || lowerQuery.includes('course')) {
    return responses[0];
  }
  if (lowerQuery.includes('deadline') || lowerQuery.includes('urgent') || lowerQuery.includes('due')) {
    return responses[1];
  }
  if (lowerQuery.includes('hall') || lowerQuery.includes('stay') || lowerQuery.includes('apply')) {
    return responses[2];
  }
  if (lowerQuery.includes('help') || lowerQuery.includes('project') || lowerQuery.includes('cs2030')) {
    return responses[3];
  }
  // Default to a random response
  return responses[Math.floor(Math.random() * responses.length)];
}
