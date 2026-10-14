import type { University, Initiative, AsanteResult, Opportunity } from '@/types';
import { universities } from '@/data/universities';
import { opportunities } from '@/data/opportunities';
import { searchGlobalUniversities } from '@/data/universityDirectory';
import { getVisaIntelForQuery } from '@/data/visaIntel';

export interface AsanteAnswer {
  content: string;
  results: AsanteResult[];
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
    type: 'university-search',
    keywords: ['university', 'universities', 'college', 'colleges', 'institution', 'admission', 'admissions'],
  },
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
    keywords: ['initiative', 'community', 'project', 'program', 'volunteer', 'opportunity', 'local', 'youth', 'environment', 'solar', 'water', 'sanitation', 'library', 'stem', 'mentorship'],
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

function searchInitiatives(query: string, initiativeData: Initiative[]): Initiative[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/).filter((t) => t.length > 2);
  return initiativeData.filter((init) => {
    const haystack = (
      init.title + ' ' + init.description + ' ' + init.category + ' ' + init.author
    ).toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });
}

function searchOpportunities(query: string): Opportunity[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter((term) => term.length > 2);
  if (!terms.length) return [];
  return opportunities.filter((opportunity) => {
    const haystack = [
      opportunity.title,
      opportunity.organization,
      opportunity.category,
      opportunity.fundingType,
      opportunity.targetAudience,
      opportunity.region,
      opportunity.description,
      opportunity.eligibility,
      opportunity.benefits,
      ...opportunity.keywords,
    ].join(' ').toLowerCase();
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
  Organizer: ${init.organizer} (${init.verificationStatus === 'verified' ? 'verified' : 'verification pending'})
  Goal: ${init.goal}
  Volunteers: ${init.volunteersJoined}/${init.volunteersNeeded}
  ${init.description}`;
}

function handleUniversitySearch(query: string): AsanteAnswer {
  const matched = searchUniversitiesByName(query);
  if (matched.length === 0) {
    const broader = searchUniversitiesBroad(query);
    if (broader.length > 0) {
      return {
        content: `I found ${broader.length} relevant institution record(s) in Civio's local database. Fee and testing details are not independently verified; confirm them with each university:\n\n` +
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
        ? `Here's Civio's admissions record for **${matched[0].name}**. Verify fees, deadlines, and testing requirements with the university:\n\n` +
          formatUniversitySummary(matched[0]) +
          `\n\nUse the portal link below to start your application.`
        : `I found ${matched.length} matching institutions:\n\n` +
          matched.map(formatUniversitySummary).join('\n\n') +
          `\n\nTap any result card to visit the official admissions portal.`,
    results: matched.map((u) => ({ kind: 'university' as const, university: u })),
  };
}

function handleFeeWaiver(): AsanteAnswer {
  const freeSchools = universities.filter((u) => u.applicationFeeType === 'free');
  const waiverSchools = universities.filter((u) => u.applicationFeeType === 'waiver');
  const paidSchools = universities.filter((u) => u.applicationFeeType === 'paid');
  const all = [...freeSchools, ...waiverSchools, ...paidSchools];

  let content = `These are the application fee statuses in Civio's local records. They are not independently verified and can change; confirm details with the institution before applying:\n\n`;

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

  content += `\nFee and waiver policies vary by program and can change. Confirm the fee and any waiver process on the institution's official admissions site before applying.`;

  return {
    content,
    results: all.map((u) => ({ kind: 'university' as const, university: u })),
  };
}

function handleIeltsWaiver(): AsanteAnswer {
  const withWaiver = universities.filter((u) => u.englishWaiver.available);
  const withoutWaiver = universities.filter((u) => !u.englishWaiver.available);

  let content = `These are the English proficiency notes in Civio's local records. They are not independently verified; confirm current WAEC/IELTS policy with the specific program:\n\n`;

  content += `**IELTS / TOEFL Waiver Available:**\n`;
  withWaiver.forEach((u) => {
    content += `• **${u.shortName}** (${u.country}) — ${u.englishWaiver.detail}\n`;
    content += `  Accepted proofs: ${u.englishWaiver.acceptedProofs.join(', ')}\n`;
  });

  content += `\n**No Waiver (Test Required):**\n`;
  withoutWaiver.forEach((u) => {
    content += `• **${u.shortName}** (${u.country}) — ${u.englishWaiver.detail}\n`;
  });

  content += `\n**How to check or request a waiver:**\n1. Review the current English-language policy for your specific program.\n2. Ask admissions whether a WAEC/WASSCE result or Medium of Instruction (MOI) letter is accepted.\n3. Submit only the evidence the institution requests. A waiver is not guaranteed and requirements differ by school.`;

  return {
    content,
    results: withWaiver.map((u) => ({ kind: 'university' as const, university: u })),
  };
}

function handleScholarshipInfo(initiativeData: Initiative[]): AsanteAnswer {
  const scholarshipSessions = initiativeData.filter(
    (i) => i.category === 'Education' && i.title.toLowerCase().includes('scholarship')
  );
  const fundedOpportunities = opportunities.filter((opportunity) =>
    opportunity.fundingType === 'Fully Funded' &&
    (opportunity.category === 'Fellowship' || /scholarship|fellowship/i.test(opportunity.title))
  );

  let content = `Here are the scholarship and fellowship listings currently in Civio's opportunities catalogue. Confirm current funding and eligibility with each organizer before applying:\n\n`;

  content += `**Community Scholarship Resources:**\n`;
  if (scholarshipSessions.length > 0) {
    scholarshipSessions.forEach((s) => {
      content += `• ${s.title} — ${s.description}\n`;
    });
  } else {
    content += `• No community scholarship sessions are currently listed in Civio.\n`;
  }

  if (fundedOpportunities.length) {
    content += `\n**Fully funded catalogue listings:**\n`;
    fundedOpportunities.forEach((opportunity) => {
      content += `• ${opportunity.title} — ${opportunity.organization} (deadline: ${opportunity.deadline})\n`;
    });
  } else {
    content += `\nNo fully funded scholarships or fellowships are currently listed in the opportunities catalogue.`;
  }
  content += `\n\nUse the official links on the result cards to confirm current terms.`;

  const results: AsanteResult[] = [
    ...scholarshipSessions.map((i) => ({ kind: 'initiative' as const, initiative: i })),
    ...fundedOpportunities.map((opportunity) => ({ kind: 'opportunity' as const, opportunity })),
  ];

  return { content, results };
}

function handleInitiativeSearch(query: string, initiativeData: Initiative[]): AsanteAnswer {
  const matched = query.trim() ? searchInitiatives(query, initiativeData) : initiativeData;

  if (matched.length === 0) {
    return {
      content: `I searched the ${initiativeData.length} community initiatives currently listed and couldn't find a match for "${query}". Submit a project with organizer details and evidence to add a community initiative.`,
      results: [],
    };
  }

  let content = `I found ${matched.length} community initiative(s) in Civio's feed${query.trim() ? ` matching "${query}"` : ''}:\n\n`;
  matched.forEach((init, i) => {
    content += `${i + 1}. ${formatInitiativeSummary(init)}\n`;
  });
  content += `\nOpen a result card to review the organizer's evidence and project details.`;

  return {
    content,
    results: matched.map((i) => ({ kind: 'initiative' as const, initiative: i })),
  };
}

function handleCodingWorkspace(initiativeData: Initiative[]): AsanteAnswer {
  const techInits = initiativeData.filter((i) => i.category === 'Tech & Coding');

  let content = `Here are the tech and coding initiatives currently listed in the community feed:\n\n`;
  techInits.forEach((init, i) => {
    content += `${i + 1}. ${formatInitiativeSummary(init)}\n`;
  });
  content += `\nCheck each listing for organizer verification status and project evidence before getting involved.`;

  return {
    content,
    results: techInits.map((i) => ({ kind: 'initiative' as const, initiative: i })),
  };
}

function handleVolunteerSearch(initiativeData: Initiative[]): AsanteAnswer {
  const withOpenings = initiativeData.filter((i) => i.volunteersJoined < i.volunteersNeeded);

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

function handleGreeting(initiativeData: Initiative[]): AsanteAnswer {
  return {
    content: `Hi! I'm Asante, your admissions, opportunities, and intelligence assistant. I search Civio's ${universities.length} detailed admissions records and ${initiativeData.length} current community initiative listings, and can query the live Hipo global university directory.\n\nAsk me about fee waivers, WAEC/IELTS requirements, fully funded opportunities, a university by name, or a community project. Always confirm changing eligibility and application details with the official source.`,
    results: [],
  };
}

function handleGeneralSearch(query: string, initiativeData: Initiative[]): AsanteAnswer {
  const matchedUnis = searchUniversitiesBroad(query);
  const matchedInits = searchInitiatives(query, initiativeData);
  const matchedOpportunities = searchOpportunities(query);
  const results: AsanteResult[] = [
    ...matchedUnis.map((u) => ({ kind: 'university' as const, university: u })),
    ...matchedInits.map((i) => ({ kind: 'initiative' as const, initiative: i })),
    ...matchedOpportunities.map((opportunity) => ({ kind: 'opportunity' as const, opportunity })),
  ];

  if (results.length === 0) {
    return {
      content: `I didn't find a match in Civio's detailed records for "${query}". I can still query the live Hipo global university directory for institution names. For fee-waiver and language-test requirements, use a specific question and confirm the result with the institution.`,
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
      content += `• ${i.title} (${i.category}) — organizer: ${i.organizer}; verification: ${i.verificationStatus}\n`;
    });
  }

  if (matchedOpportunities.length > 0) {
    content += `\n**Matching Opportunities (${matchedOpportunities.length}):**\n`;
    matchedOpportunities.forEach((opportunity) => {
      content += `• ${opportunity.title} — ${opportunity.fundingType}; deadline ${opportunity.deadline}\n`;
    });
  }

  content += `\nOpen the result cards for details and official links.`;

  return { content, results };
}

function handleVisaQuestion(query: string): AsanteAnswer | null {
  const visa = getVisaIntelForQuery(query);
  if (!visa) return null;

  const normalized = query.toLowerCase();
  const relevantFacts = visa.facts.filter((fact) => {
    const label = fact.label.toLowerCase();
    if (/\b(ielts|waec|english|cas|language test|language waiver)\b/.test(normalized)) {
      return label.includes('english');
    }
    if (/\b(fee|fees|sevis|mrv|ihs)\b/.test(normalized)) return label.includes('fee');
    if (/\b(work|opt|pgwp|graduate route|employment)\b/.test(normalized)) {
      return label.includes('work') || label.includes('after graduation');
    }
    if (/\b(pal|attestation)\b/.test(normalized)) return label.includes('attestation');
    if (/\b(funds?|blocked account|sperrkonto|maintenance|how much|amount|cost)\b/.test(normalized)) {
      return /proof of funds|blocked account|maintenance funds/.test(label);
    }
    return true;
  });
  const facts = relevantFacts.length ? relevantFacts : visa.facts;

  return {
    content: `**${visa.country} — ${visa.title}**\n\n` +
      facts.map((fact) => `• **${fact.label}:** ${fact.value}`).join('\n\n') +
      '\n\nOpen the Visa & Immigration Intel tab for the official government sources and the proof-of-funds calculator. Requirements can change and your individual case may differ.',
    results: [],
  };
}

export function getAsanteLocalAnswer(query: string, initiativeData: Initiative[]): AsanteAnswer {
  const normalized = query.toLowerCase().trim();

  if (normalized.length === 0) {
    return {
      content: "I didn't catch that. Could you rephrase your question?",
      results: [],
    };
  }

  const visaAnswer = handleVisaQuestion(query);
  if (visaAnswer) return visaAnswer;

  const namedUni = searchUniversitiesByName(query);
  const intent = detectIntent(query);

  if (namedUni.length > 0 && intent.type !== 'fee-waiver' && intent.type !== 'ielts-waiver' && intent.type !== 'greeting') {
    return handleUniversitySearch(query);
  }

  switch (intent.type) {
    case 'university-search':
      return handleUniversitySearch(query);
    case 'greeting':
      return handleGreeting(initiativeData);
    case 'fee-waiver':
      return handleFeeWaiver();
    case 'ielts-waiver':
      return handleIeltsWaiver();
    case 'scholarship-info':
      return handleScholarshipInfo(initiativeData);
    case 'initiative-search':
      return handleInitiativeSearch(query, initiativeData);
    case 'coding-workspace':
      return handleCodingWorkspace(initiativeData);
    case 'volunteer-search':
      return handleVolunteerSearch(initiativeData);
    default:
      return handleGeneralSearch(query, initiativeData);
  }
}

export async function getAsanteAnswer(query: string, initiativeData: Initiative[]): Promise<AsanteAnswer> {
  const localAnswer = getAsanteLocalAnswer(query, initiativeData);
  if (getVisaIntelForQuery(query)) return localAnswer;

  const normalized = query.toLowerCase().trim();
  const intent = detectIntent(query);
  const globalDirectorySearch =
    /9,?000|global universities|global university|all universities|worldwide universities/i.test(normalized);
  const shouldSearchGlobalDirectory =
    globalDirectorySearch ||
    (localAnswer.results.length === 0 &&
      (intent.type === 'university-search' || intent.type === 'general-search'));

  if (!shouldSearchGlobalDirectory) return localAnswer;

  const name = globalDirectorySearch ? '' : query.trim();
  const results = (await searchGlobalUniversities(name)).slice(0, 12);
  const globalResults: AsanteResult[] = results.map((university) => ({
    kind: 'global-university',
    university,
  }));

  if (!results.length) {
    return {
      content: `The Hipo global university directory returned no institutions matching "${query}". Try a shorter name or search by country.`,
      results: [],
    };
  }

  return {
    content: `${globalDirectorySearch ? 'Here are the first' : 'I found'} ${results.length} result(s) from the Hipo global university directory${globalDirectorySearch ? ' (showing the first 12; browse the full directory in Admissions Hub)' : ` matching "${query}"`}.\n\nThe directory provides institution names and website links, not accreditation, fees, application portals, deadlines, or test-waiver policies. Verify those details with each institution.`,
    results: globalResults,
  };
}
