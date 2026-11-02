import {
  ArrowLeftRight, CalendarClock, CalendarDays, ClipboardList, GraduationCap,
  ListChecks, Navigation, Wallet, type LucideIcon,
} from 'lucide-react';

/** A shortcut on the home screen: either asks a question or opens a page. */
export type Starter =
  | { label: string; icon: LucideIcon; prompt: string }
  | { label: string; icon: LucideIcon; href: string };

export const QUICK_STARTERS: Starter[] = [
  { label: 'Directions', icon: Navigation, prompt: 'Where is the Balme Library and how do I get there?' },
  { label: 'Registration', icon: ClipboardList, prompt: 'How do I register my courses on MIS Web?' },
  { label: 'Fees', icon: Wallet, prompt: 'How do I check my fees and pay online?' },
  { label: 'Add/Drop', icon: ArrowLeftRight, prompt: 'What are the rules for Add/Drop?' },
  { label: 'Student loans', icon: GraduationCap, prompt: 'Tell me about SLTF student loans' },
  { label: 'Timetable', icon: CalendarClock, href: '/timetable' },
  { label: 'Planner', icon: ListChecks, href: '/planner' },
  { label: 'Events', icon: CalendarDays, href: '/events' },
];

/** Ideas shown under "Explore inspiration". */
export const INSPIRATION: Array<{ title: string; prompts: string[] }> = [
  {
    title: 'Academics',
    prompts: [
      'How do I register my courses on MIS Web?',
      'What are the rules for Add/Drop?',
      'How does the plagiarism check on Sakai work?',
      'How do I get a transcript?',
    ],
  },
  {
    title: 'Money',
    prompts: [
      'How do I check my fees and pay online?',
      'Tell me about SLTF student loans',
      'What should I do if I cannot pay my fees on time?',
    ],
  },
  {
    title: 'Getting around',
    prompts: [
      'Where is the Balme Library and how do I get there?',
      'How do I get to the Great Hall from the main gate?',
      'Where can I find the Academic Affairs office?',
    ],
  },
  {
    title: 'Campus life',
    prompts: [
      'Tell me about the halls of residence',
      'Which offices should I contact for student support?',
      'How do I avoid scams that target UG students?',
    ],
  },
];
