import type { GenderOption, MatchSelection, PlayerFilters } from '../types/social';

export const formatLastActive = (
  lastActiveAt?: string | null,
  isOnline?: boolean,
): string => {
  if (isOnline) {
    return 'Online now';
  }

  if (!lastActiveAt) {
    return 'Recently active';
  }

  const date = new Date(lastActiveAt);
  if (Number.isNaN(date.getTime())) {
    return 'Recently active';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

export const formatConversationTime = (value?: string | null): string => {
  if (!value) {
    return 'No messages yet';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

export const describeMatchPreferences = (
  preferences?: GenderOption[] | null,
): string => {
  const normalized = Array.isArray(preferences)
    ? preferences.filter((value): value is GenderOption => value === 'male' || value === 'female')
    : [];

  if (normalized.length === 2) {
    return 'Men and women';
  }

  if (normalized[0] === 'male') {
    return 'Men';
  }

  if (normalized[0] === 'female') {
    return 'Women';
  }

  return 'Men and women';
};

export const getMatchSelectionFromPreferences = (
  preferences?: GenderOption[] | null,
): MatchSelection => {
  const normalized = Array.isArray(preferences)
    ? preferences.filter((value): value is GenderOption => value === 'male' || value === 'female')
    : [];

  if (normalized.length === 1) {
    return normalized[0];
  }

  return 'any';
};

export const buildDiscoveryParams = (
  query: string | null,
  filters: PlayerFilters,
): URLSearchParams => {
  const params = new URLSearchParams();

  if (query && query.trim()) {
    params.set('q', query.trim());
  }

  if (filters.minElo.trim()) {
    params.set('minElo', filters.minElo.trim());
  }

  if (filters.maxElo.trim()) {
    params.set('maxElo', filters.maxElo.trim());
  }

  if (filters.country.trim()) {
    params.set('country', filters.country.trim());
  }

  if (filters.online) {
    params.set('online', 'true');
  }

  if (filters.followersOnly) {
    params.set('followersOnly', 'true');
  }

  if (filters.availableToMessage) {
    params.set('availableToMessage', 'true');
  }

  return params;
};
