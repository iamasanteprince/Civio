const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/gi;

export function sanitizePlainText(value: string): string {
  const withoutControls = Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return !(code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f) || code === 0x7f);
    })
    .join('');
  return withoutControls.replace(HTML_TAG_PATTERN, '').trim();
}

export function getPostCooldownRemaining(): number {
  try {
    const lastSubmittedAt = Number(sessionStorage.getItem('civio-post-last-submitted-at'));
    if (!Number.isFinite(lastSubmittedAt) || lastSubmittedAt <= 0) return 0;
    return Math.max(0, 5000 - (Date.now() - lastSubmittedAt));
  } catch (error) {
    console.error('Could not read the local posting cooldown.', error);
    return 0;
  }
}

export function recordPostSubmission(): void {
  try {
    sessionStorage.setItem('civio-post-last-submitted-at', String(Date.now()));
  } catch (error) {
    console.error('Could not save the local posting cooldown.', error);
  }
}

export function getAuthCooldownRemaining(): number {
  try {
    const nextAllowedAt = Number(sessionStorage.getItem('civio-auth-next-allowed-at'));
    if (!Number.isFinite(nextAllowedAt) || nextAllowedAt <= 0) return 0;
    return Math.max(0, nextAllowedAt - Date.now());
  } catch (error) {
    console.error('Could not read the local authentication cooldown.', error);
    return 0;
  }
}

export function recordAuthFailure(): void {
  try {
    sessionStorage.setItem('civio-auth-next-allowed-at', String(Date.now() + 5000));
  } catch (error) {
    console.error('Could not save the local authentication cooldown.', error);
  }
}

export function clearAuthCooldown(): void {
  try {
    sessionStorage.removeItem('civio-auth-next-allowed-at');
  } catch (error) {
    console.error('Could not clear the local authentication cooldown.', error);
  }
}

let guestSessionIdCache: string | null = null;

export function getGuestSessionId(): string {
  const key = 'civio-guest-session-id';
  if (guestSessionIdCache) return guestSessionIdCache;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) {
      guestSessionIdCache = existing;
      return existing;
    }

    guestSessionIdCache = crypto.randomUUID();
    sessionStorage.setItem(key, guestSessionIdCache);
    return guestSessionIdCache;
  } catch {
    guestSessionIdCache = crypto.randomUUID();
    return guestSessionIdCache;
  }
}

export function resetGuestSessionId(): void {
  guestSessionIdCache = null;
  try {
    sessionStorage.removeItem('civio-guest-session-id');
  } catch (error) {
    console.error('Could not clear the local guest session identifier.', error);
  }
}
