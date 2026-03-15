export type GenderOption = 'male' | 'female';
export type MatchSelection = GenderOption | 'any';
export type SaveKind = 'favorite' | 'rematch_later';

export interface SocialUser {
  id: string;
  username: string;
  displayName?: string;
  profilePhoto?: string;
  country?: string;
  city?: string;
  gender?: GenderOption;
  eloRating?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  isProfilePhotoVerified?: boolean;
  lastActiveAt?: string;
  matchPreferences?: GenderOption[];
  isOnline?: boolean;
  profileCompletion?: number;
  mutualFollow?: boolean;
  followsYou?: boolean;
  canMessage?: boolean;
  isMuted?: boolean;
  savedKinds?: SaveKind[];
}

export interface FriendMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
}

export interface InboxSummary {
  user: SocialUser;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  lastMessageFromMe: boolean;
  unreadCount: number;
  muted: boolean;
  blocked: boolean;
  blockedByThem: boolean;
  canMessage: boolean;
  savedKinds: SaveKind[];
}

export interface SavedPlayerEntry {
  id: string;
  kind: SaveKind;
  sourceGameId?: string | null;
  updatedAt: string;
  targetUser: SocialUser;
}

export interface PlayerFilters {
  minElo: string;
  maxElo: string;
  country: string;
  online: boolean;
  followersOnly: boolean;
  availableToMessage: boolean;
}

export const DEFAULT_PLAYER_FILTERS: PlayerFilters = {
  minElo: '',
  maxElo: '',
  country: '',
  online: false,
  followersOnly: false,
  availableToMessage: false,
};
