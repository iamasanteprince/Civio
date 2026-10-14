export type View = 'visa' | 'hub' | 'opportunities' | 'asante' | 'forum';

export interface DiscussionComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  verified: boolean;
  userId?: string;
  guestSessionId?: string;
  editedAt?: string;
}

export type DiscussionStore = Record<string, DiscussionComment[]>;

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
  organizer: string;
  goal: string;
  verificationUrl: string;
  verificationStatus: 'pending' | 'verified';
  title: string;
  description: string;
  volunteersNeeded: number;
  volunteersJoined: number;
  comments: Comment[];
  postedAt: string;
  link?: string;
  userId?: string;
  guestSessionId?: string;
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

export interface AsanteMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  results?: AsanteResult[];
}

export interface AsanteUniversityResult {
  kind: 'university';
  university: University;
}

export interface AsanteInitiativeResult {
  kind: 'initiative';
  initiative: Initiative;
}

export interface AsanteApiUniversityResult {
  kind: 'global-university';
  university: ApiUniversity;
}

export interface AsanteOpportunityResult {
  kind: 'opportunity';
  opportunity: Opportunity;
}

export type AsanteResult =
  | AsanteUniversityResult
  | AsanteInitiativeResult
  | AsanteApiUniversityResult
  | AsanteOpportunityResult;

export interface CivioUser {
  id: string;
  email: string;
  displayName: string;
  isVerified: boolean;
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
  web_pages: string[];
  domains: string[];
  state_province?: string | null;
}

export type UniversitySearchResult = University | (ApiUniversity & { _merged?: false; _isApi: true });
