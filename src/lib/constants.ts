export const IMAGE_UPLOAD = {
  MAX_BYTES: 2 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

export const YOUTUBE_OEMBED = {
  MAX_RESPONSE_BYTES: 50 * 1024,
  FETCH_TIMEOUT_MS: 5_000,
  URL_PATTERN:
    /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i,
} as const;

export const DISCOVERY = {
  MS_PER_DAY: 86_400_000,
  FRESHNESS_WINDOW_DAYS: 14,
  PREMIUM_BOOST: 10,
  SCORE_WEIGHT_NET_VOTES: 3,
  SCORE_WEIGHT_COPIES: 5,
  MAX_LISTS: 300,
} as const;

export const USER_PROFILE = {
  MAX_PUBLIC_LISTS: 200,
} as const;

export const RATE_LIMIT = {
  USERNAME_CHECK_PER_MIN: 30,
  AUTH_RESOLVE_PER_MIN: 10,
  VOTE_PER_MIN: 60,
  COPY_PER_MIN: 20,
  SUPPORT_PER_DAY: 10,
  YOUTUBE_PER_MIN: 30,
} as const;
