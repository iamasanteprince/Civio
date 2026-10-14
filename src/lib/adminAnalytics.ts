export interface AdminSignup {
  email: string;
  displayName: string | null;
  createdAt: string;
  ageConsentGiven: boolean;
  ageConsentTimestamp: string | null;
}

export interface AdminAnalytics {
  totalMembers: number;
  recentSignups: AdminSignup[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseAdminAnalytics(value: unknown): AdminAnalytics {
  if (
    !isObject(value) ||
    typeof value.total_members !== 'number' ||
    !Number.isSafeInteger(value.total_members) ||
    !Array.isArray(value.recent_signups)
  ) {
    throw new Error('The admin analytics response has an invalid format.');
  }

  const recentSignups = value.recent_signups.map((entry): AdminSignup => {
    if (
      !isObject(entry) ||
      typeof entry.email !== 'string' ||
      typeof entry.created_at !== 'string' ||
      (entry.display_name !== null && typeof entry.display_name !== 'string') ||
      (entry.age_consent_timestamp !== null && typeof entry.age_consent_timestamp !== 'string')
    ) {
      throw new Error('The recent signup data has an invalid format.');
    }

    return {
      email: entry.email,
      displayName: typeof entry.display_name === 'string' ? entry.display_name : null,
      createdAt: entry.created_at,
      ageConsentGiven: entry.age_consent_given === true,
      ageConsentTimestamp: typeof entry.age_consent_timestamp === 'string'
        ? entry.age_consent_timestamp
        : null,
    };
  });

  return {
    totalMembers: value.total_members,
    recentSignups,
  };
}
