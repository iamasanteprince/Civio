import type { Poll } from '@/types';

export const polls: Poll[] = [
  {
    id: 'app-fees',
    question: 'Should university application fees be abolished for public universities?',
    description:
      'Many students miss out on applying to public universities due to application fee barriers. Should public institutions eliminate these fees entirely?',
    options: [
      { id: 'yes', label: 'Yes — abolish all application fees for public universities', votes: 342 },
      { id: 'means', label: 'Yes, but only for low-income and first-generation applicants', votes: 178 },
      { id: 'no', label: 'No — fees are necessary to cover administrative costs', votes: 45 },
    ],
    totalVotes: 565,
    author: 'adwoa@civio.org',
    postedAt: '10/10/2026',
  },
  {
    id: 'community-need',
    question: 'Most urgent community need: Youth Tech Hub vs. Micro-grant Fund?',
    description:
      'If we had $10,000 to invest in one initiative, which would create the most impact for young people in our community?',
    options: [
      { id: 'tech-hub', label: 'Youth Tech Hub — coding workspace with mentors and laptops', votes: 287 },
      { id: 'micro-grant', label: 'Micro-grant Fund — small grants for student entrepreneurs', votes: 198 },
      { id: 'split', label: 'Split the funding between both initiatives', votes: 156 },
    ],
    totalVotes: 641,
    author: 'abena@startupbridge.org',
    postedAt: '08/10/2026',
  },
  {
    id: 'ielts-waiver',
    question: 'Should WAEC English automatically exempt students from IELTS/TOEFL worldwide?',
    description:
      'West African students who pass WAEC English still pay for IELTS/TOEFL when applying abroad. Should WAEC English be globally accepted as proof of proficiency?',
    options: [
      { id: 'auto', label: 'Yes — WAEC English C6+ should automatically exempt IELTS/TOEFL', votes: 521 },
      { id: 'conditional', label: 'Only at universities that already accept English-medium MOI', votes: 89 },
      { id: 'keep', label: 'No — standardized tests ensure consistent language standards', votes: 23 },
    ],
    totalVotes: 633,
    author: 'kwesi@knust.edu.gh',
    postedAt: '06/10/2026',
  },
  {
    id: 'stem-vs-arts',
    question: 'Should community funding prioritize STEM education over arts and humanities?',
    description:
      'Local governments and donors often direct funding toward STEM programs. Is this the right priority, or should arts, literature, and civic education receive equal investment?',
    options: [
      { id: 'stem', label: 'STEM first — it drives jobs and economic growth', votes: 167 },
      { id: 'equal', label: 'Equal funding — arts and STEM are both essential', votes: 312 },
      { id: 'arts', label: 'Arts and civic education need more support right now', votes: 98 },
    ],
    totalVotes: 577,
    author: 'yaw@civicvoice.gh',
    postedAt: '03/10/2026',
  },
];
