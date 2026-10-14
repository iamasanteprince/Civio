import type { University, Initiative, CopilotResult } from '@/types';
import { universities } from '@/data/universities';
import { initiatives } from '@/data/initiatives';

export interface CopilotAnswer {
  content: string;
  results: CopilotResult[];
}

interface Intent {
  type:
    | 'university-search'
    | 'fee-waiver'
    | 'ielts-waiver'
    | 'scholarship-info'
    | 'initiative-search'
    | 'volunteer-search'
    | 'coding-workspace'
    | 'greeting'
    | 'general-search';
  keywords: string[];
}

const INTENTS: Intent[] = [
  {
    type: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'help', 'what can you do', 'start'],
  },
  {
    type: 'fee-waiver',
    keywords: ['fee waiver', 'application fee', 'free application', '$0', 'zero fee', 'no fee', 'waiver code', 'app fee'],
  },
  {
    type: 'ielts-waiver',
    keywords: ['ielts', 'toefl', 'english test', 'english proficiency', 'waive', 'waiver', 'wassce', 'waec', 'kcse', 'duolingo', 'english medium', 'language test', 'language requirement'],
  },
  {
    type: 'scholarship-info',
    keywords: ['scholarship', 'fully funded', 'fund', 'tuition', 'stipend', 'mastercard', 'chevening', 'daad', 'fulbright', 'commonwealth', 'financial aid'],
  },
  {
    type: 'initiative-search',
    keywords: ['initiative', 'community', 'project', 'program', 'volunteer', 'opportunity', 'local', 'youth'],
  },
  {
    type: 'coding-workspace',
    keywords: ['coding', 'coding workspace', 'tech hub', 'programming', 'bootcamp', 'python', 'javascript', 'html', 'stem', 'robotics'],
  },
  {
    type: 'volunteer-search',
    keywords: ['volunteer', 'join', 'help out', 'contribute', 'get involved', 'participate'],
  },
];

function detectIntent(query: string): Intent {
  const normalized = query.toLowerCase().trim();
  let bestIntent: Intent | null = null;
  let bestScore = 0;

  for (const intent of INTENTS) {
    let score = 0;
    for (const keyword of intent.keywords) {
      if (normalized.includes(keyword)) {
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return bestIntent || { type: 'general-search', keywords: [] };
}

function searchUniversitiesByName(query: string): University[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return universities.filter((u) => {
    const nameHaystack = (u.name + ' ' + u.shortName + ' ' + u.city + ' ' + u.country).toLowerCase();
    return nameHaystack.includes(q) || q.includes(u.shortName.toLowerCase());
  });
}

function searchUniversitiesBroad(query: string): University[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/).filter((t) => t.length > 2);
  return universities.filter((u) => {
    const haystack = (
      u.name + ' ' + u.shortName + ' ' + u.city + ' ' + u.country + ' ' +
      u.intel.languageTesting + ' ' + u.intel.standardizedTests
    ).toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });
}

function searchInitiatives(query: string): Initiative[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/).filter((t) => t.length > 2);
  return initiatives.filter((init) => {
    const haystack = (
      init.title + ' ' + init.description + ' ' + init.category + ' ' + init.author
    ).toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });
}

function formatUniversitySummary(u: University): string {
  const feeLine =
    u.applicationFeeType === 'free'
      ? `$0 application fee (always free — no fee for any program)`
      : u.applicationFeeType === 'waiver'
        ? u.feeWaiverDetail === 'auto-international'
          ? `${u.applicationFeeDisplay} (automatic waiver for eligible international applicants)`
          : `${u.applicationFeeDisplay} (${u.feeNote})`
        : `${u.applicationFeeDisplay} (waiver upon request for eligible low-income applicants)`;

  const waiverLine = u.englishWaiver.available
    ? `English Proficiency Waiver: ${u.englishWaiver.detail}`
    : `English Proficiency: ${u.englishWaiver.detail}`;

  return `**${u.name}** (${u.city}, ${u.country})
  Fee Status: ${feeLine}
  ${waiverLine}
  Language Testing: ${u.intel.languageTesting}
  Standardized Tests: ${u.intel.standardizedTests}
  Key Intakes: ${u.intel.keyIntakes}
  Deadlines: ${u.intel.deadlines}`;
}

function formatInitiativeSummary(init: Initiative): string {
  return `**${init.title}**
  Category: ${init.category}
  By: ${init.author}
  Endorsements: ${init.endorsements} | Volunteers: ${init.volunteersJoined}/${init.volunteersNeeded}
  ${init.description}`;
}

function handleUniversitySearch(query: string): CopilotAnswer {
  const matched = searchUniversitiesByName(query);
  if (matched.length === 0) {
    const broader = searchUniversitiesBroad(query);
    if (broader.length > 0) {
      return {
        content: `I found ${broader.length} relevant institution(s) in Civio's database:\n\n` +
          broader.map(formatUniversitySummary).join('\n\n') +
          `\n\nTap any result card below to visit the official admissions portal directly.`,
        results: broader.map((u) => ({ kind: 'university' as const, university: u })),
      };
    }
    return {
      content: `I couldn't find a university matching "${query}" in the current database. Here are all ${universities.length} institutions I have data on — try searching by name, country, or program type.\n\nAlternatively, ask me about fee waivers, IELTS exemptions, or community initiatives.`,
      results: [],
    };
  }

  return {
    content:
      matched.length === 1
        ? `Here's the full admissions intelligence for **${matched[0].name}**:\n\n` +
          formatUniversitySummary(matched[0]) +
          `\n\nUse the portal link below to start your application.`
        : `I found ${matched.length} matching institutions:\n\n` +
          matched.map(formatUniversitySummary).join('\n\n') +
          `\n\nTap any result card to visit the official admissions portal.`,
    results: matched.map((u) => ({ kind: 'university' as const, university: u })),
  };
}

function handleFeeWaiver(): CopilotAnswer {
  const freeSchools = universities.filter((u) => u.applicationFeeType === 'free');
  const waiverSchools = universities.filter((u) => u.applicationFeeType === 'waiver');
  const paidSchools = universities.filter((u) => u.applicationFeeType === 'paid');
  const all = [...freeSchools, ...waiverSchools, ...paidSchools];

  let content = `Here's the complete application fee breakdown from Civio's database:\n\n`;

  content += `**$0 Application Fee (Always Free):**\n`;
  freeSchools.forEach((u) => {
    content += `• ${u.name} (${u.country}) — $0 for all programs. No waivers needed.\n`;
  });

  content += `\n**Fee Waiver Available (Apply at No Cost):**\n`;
  waiverSchools.forEach((u) => {
    const waiverType =
      u.feeWaiverDetail === 'auto-international'
        ? 'Automatic waiver for international applicants'
        : 'Waiver code available via info session / portal';
    content += `• ${u.name} (${u.country}) — ${u.applicationFeeDisplay}. ${waiverType}. ${u.feeNote}\n`;
  });

  content += `\n**Standard Fee (Waiver on Request):**\n`;
  paidSchools.forEach((u) => {
    content += `• ${u.name} (${u.country}) — ${u.applicationFeeDisplay}. ${u.feeNote}\n`;
  });

  content += `\n**Pro tip:** When applying, look for the "fee waiver" or "promo code" field in the application portal. If you don't see one, email the admissions office — most will grant a waiver upon request, especially for international applicants from developing countries.\n\nYou can also check the Civic Engagement Feed for community-led scholarship info sessions that share waiver codes.`;

  return {
    content,
    results: all.map((u) => ({ kind: 'university' as const, university: u })),
  };
}

function handleIeltsWaiver(): CopilotAnswer {
  const withWaiver = universities.filter((u) => u.englishWaiver.available);
  const withoutWaiver = universities.filter((u) => !u.englishWaiver.available);

  let content = `Here's the English proficiency waiver landscape from Civio's database:\n\n`;

  content += `**IELTS / TOEFL Waiver Available:**\n`;
  withWaiver.forEach((u) => {
    content += `• **${u.shortName}** (${u.country}) — ${u.englishWaiver.detail}\n`;
    content += `  Accepted proofs: ${u.englishWaiver.acceptedProofs.join(', ')}\n`;
  });

  content += `\n**No Waiver (Test Required):**\n`;
  withoutWaiver.forEach((u) => {
    content += `• **${u.shortName}** (${u.country}) — ${u.englishWaiver.detail}\n`;
  });

  content += `\n**How to request a waiver:**\n1. Check if your previous degree was taught in English.\n2. Request a "Medium of Instruction" (MOI) letter from your university's registrar.\n3. Submit the MOI letter with your application — most universities will waive the IELTS requirement.\n\nIf your university doesn't issue MOI letters, a letter from your department head confirming English instruction is often accepted.`;

  return {
    content,
    results: withWaiver.map((u) => ({ kind: 'university' as const, university: u })),
  };
}

function handleScholarshipInfo(): CopilotAnswer {
  const scholarshipSessions = initiatives.filter(
    (i) => i.category === 'Education' && i.title.toLowerCase().includes('scholarship')
  );
  const relevantUnis = universities.filter(
    (u) => u.applicationFeeType === 'free' || u.applicationFeeType === 'waiver'
  );

  let content = `Here's what I can tell you about scholarships through Civio:\n\n`;

  content += `**Community Scholarship Resources:**\n`;
  if (scholarshipSessions.length > 0) {
    scholarshipSessions.forEach((s) => {
      content += `• ${s.title} — ${s.description}\n`;
    });
  } else {
    content += `• Check the Civic Engagement Feed for scholarship info sessions and peer-led application support groups.\n`;
  }

  content += `\n**Universities with Free or Waivable Application Fees:**\n`;
  relevantUnis.forEach((u) => {
    content += `• ${u.shortName} (${u.country}) — ${u.applicationFeeDisplay}\n`;
  });

  content += `\n**Major scholarships to research:**\n• Mastercard Foundation Scholars Program — full funding for African students\n• DAAD EPOS — full funding for development-related postgraduate study in Germany\n• Chevening — fully funded master's in the UK\n• Commonwealth Scholarship — full funding for Commonwealth country nationals\n• Fulbright — full funding for international students in the US\n\nTap the cards below for direct portal access and community resources.`;

  const results: CopilotResult[] = [
    ...scholarshipSessions.map((i) => ({ kind: 'initiative' as const, initiative: i })),
    ...relevantUnis.map((u) => ({ kind: 'university' as const, university: u })),
  ];

  return { content, results };
}

function handleInitiativeSearch(query: string): CopilotAnswer {
  const matched = query.trim() ? searchInitiatives(query) : initiatives;

  if (matched.length === 0) {
    return {
      content: `I searched all ${initiatives.length} community initiatives but couldn't find a match for "${query}". Here are some categories to explore: Education, Business, Public Policy, Environment, Community, and Tech & Coding. Try asking about "coding workspace", "scholarship sessions", or "volunteer opportunities".`,
      results: [],
    };
  }

  let content = `I found ${matched.length} community initiative(s) in Civio's feed${query.trim() ? ` matching "${query}"` : ''}:\n\n`;
  matched.forEach((init, i) => {
    content += `${i + 1}. ${formatInitiativeSummary(init)}\n`;
  });
  content += `\nTap the result cards below to endorse, volunteer, or join the discussion.`;

  return {
    content,
    results: matched.map((i) => ({ kind: 'initiative' as const, initiative: i })),
  };
}

function handleCodingWorkspace(): CopilotAnswer {
  const techInits = initiatives.filter((i) => i.category === 'Tech & Coding');

  let content = `Here are the tech and coding initiatives in Civio's community feed:\n\n`;
  techInits.forEach((init, i) => {
    content += `${i + 1}. ${formatInitiativeSummary(init)}\n`;
  });
  content += `\nThese programs provide hands-on training, mentorship, and sometimes equipment. Tap the cards below to endorse, volunteer, or join.`;

  return {
    content,
    results: techInits.map((i) => ({ kind: 'initiative' as const, initiative: i })),
  };
}

function handleVolunteerSearch(): CopilotAnswer {
  const withOpenings = initiatives.filter((i) => i.volunteersJoined < i.volunteersNeeded);

  let content = `Here are ${withOpenings.length} initiatives currently looking for volunteers:\n\n`;
  withOpenings.forEach((init, i) => {
    const spots = init.volunteersNeeded - init.volunteersJoined;
    content += `${i + 1}. **${init.title}** — ${spots} volunteer spot${spots !== 1 ? 's' : ''} open (${init.volunteersJoined}/${init.volunteersNeeded} filled)\n   ${init.description}\n`;
  });
  content += `\nTap the cards below to volunteer or learn more.`;

  return {
    content,
    results: withOpenings.map((i) => ({ kind: 'initiative' as const, initiative: i })),
  };
}

function handleGreeting(): CopilotAnswer {
  return {
    content: `Hi! I'm Civio Copilot, your AI advisor for civic engagement and educational empowerment. I search Civio's live database of ${universities.length} universities and ${initiatives.length} community initiatives.\n\nI can help you with:\n• Finding universities with $0 application fees or fee waivers\n• English proficiency / IELTS waiver requirements (WASSCE, WAEC, Duolingo)\n• Scholarship info sessions and application strategies\n• Community initiatives — coding workspaces, volunteer opportunities, education programs\n• Specific university admissions intelligence by name\n\nAsk me about any specific university or initiative, or tap a quick-prompt pill below!`,
    results: [],
  };
}

function handleGeneralSearch(query: string): CopilotAnswer {
  const matchedUnis = searchUniversitiesBroad(query);
  const matchedInits = searchInitiatives(query);
  const results: CopilotResult[] = [
    ...matchedUnis.map((u) => ({ kind: 'university' as const, university: u })),
    ...matchedInits.map((i) => ({ kind: 'initiative' as const, initiative: i })),
  ];

  if (results.length === 0) {
    return {
      content: `I searched Civio's entire database for "${query}" but didn't find exact matches. Here's what I can help you find:\n\n• Universities by name, country, or program type (${universities.length} institutions)\n• Community initiatives — education, coding, volunteering, and more (${initiatives.length} listings)\n• Fee waiver details and IELTS/English proficiency exemptions\n• Scholarship info sessions and application guidance\n\nTry asking about a specific university like "Minnesota State University" or "KNUST", or search initiatives like "coding workspace" or "volunteer opportunities".`,
      results: [],
    };
  }

  let content = `I searched Civio's database for "${query}" and found ${results.length} matching listing(s):\n\n`;

  if (matchedUnis.length > 0) {
    content += `**Matching Institutions (${matchedUnis.length}):**\n`;
    matchedUnis.forEach((u) => {
      content += `• ${u.name} (${u.city}, ${u.country}) — ${u.applicationFeeDisplay}\n`;
    });
  }

  if (matchedInits.length > 0) {
    content += `\n**Matching Initiatives (${matchedInits.length}):**\n`;
    matchedInits.forEach((i) => {
      content += `• ${i.title} (${i.category}) — ${i.endorsements} endorsements\n`;
    });
  }

  content += `\nTap the result cards below for full details and direct links.`;

  return { content, results };
}

export function getCopilotAnswer(query: string): CopilotAnswer {
  const normalized = query.toLowerCase().trim();

  if (normalized.length === 0) {
    return {
      content: "I didn't catch that. Could you rephrase your question?",
      results: [],
    };
  }

  const namedUni = searchUniversitiesByName(query);
  const intent = detectIntent(query);

  if (namedUni.length > 0 && intent.type !== 'fee-waiver' && intent.type !== 'ielts-waiver' && intent.type !== 'greeting') {
    return handleUniversitySearch(query);
  }

  switch (intent.type) {
    case 'greeting':
      return handleGreeting();
    case 'fee-waiver':
      return handleFeeWaiver();
    case 'ielts-waiver':
      return handleIeltsWaiver();
    case 'scholarship-info':
      return handleScholarshipInfo();
    case 'initiative-search':
      return handleInitiativeSearch(query);
    case 'coding-workspace':
      return handleCodingWorkspace();
    case 'volunteer-search':
      return handleVolunteerSearch();
    default:
      return handleGeneralSearch(query);
  }
}
