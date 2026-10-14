import type { LucideIcon } from 'lucide-react';

export type View = 'feed' | 'polls' | 'hub' | 'opportunities' | 'copilot';

export type InitiativeCategory =
  | 'Education'
  | 'Business'
  | 'Public Policy'
  | 'Environment'
  | 'Community'
  | 'Tech & Coding';

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface Initiative {
  id: string;
  category: InitiativeCategory;
  author: string;
  title: string;
  description: string;
  endorsements: number;
  volunteersNeeded: number;
  volunteersJoined: number;
  comments: Comment[];
  postedAt: string;
  link?: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  author: string;
  postedAt: string;
}

export type ApplicationFeeType = 'free' | 'waiver' | 'paid';

export type FeeWaiverDetail =
  | 'always-free'
  | 'info-session'
  | 'auto-international'
  | 'upon-request';

export type DegreeLevel = 'Undergraduate' | "Graduate / Master's" | 'PhD';

export interface EnglishWaiver {
  available: boolean;
  detail: string;
  acceptedProofs: string[];
}

export interface SchoolIntel {
  languageTesting: string;
  standardizedTests: string;
  keyIntakes: string;
  deadlines: string;
}

export interface University {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  countryFlag: string;
  type: string;
  degreeLevels: DegreeLevel[];
  applicationFeeType: ApplicationFeeType;
  applicationFeeDisplay: string;
  feeNote: string;
  feeWaiverDetail: FeeWaiverDetail;
  intel: SchoolIntel;
  englishWaiver: EnglishWaiver;
  portalUrl: string;
  ranking: string;
  acceptanceRate: string;
  established: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  results?: CopilotResult[];
}

export interface CopilotUniversityResult {
  kind: 'university';
  university: University;
}

export interface CopilotInitiativeResult {
  kind: 'initiative';
  initiative: Initiative;
}

export type CopilotResult = CopilotUniversityResult | CopilotInitiativeResult;

export interface CivioUser {
  email: string;
  displayName: string;
}

export type OpportunityCategory =
  | 'Youth & Civic Summit'
  | 'Fellowship'
  | 'Tech & Business Internship';

export type FundingType =
  | 'Fully Funded'
  | 'Partial Funding'
  | 'Virtual / Online';

export type TargetAudience =
  | 'African Youth'
  | 'Global / All Countries'
  | 'Developing Economies';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  fundingType: FundingType;
  targetAudience: TargetAudience;
  region: string;
  description: string;
  keywords: string[];
  deadline: string;
  link: string;
  eligibility: string;
  benefits: string;
}

export interface ApiUniversity {
  name: string;
  alpha_two_code: string;
  country: string;
  web_page: string;
  domains: string[];
}

export type UniversitySearchResult = University | (ApiUniversity & { _merged?: false; _isApi: true });
