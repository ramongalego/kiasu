import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p',
  'strong',
  'em',
  'u',
  's',
  'code',
  'ul',
  'ol',
  'li',
  'br',
];

export function sanitizeRichText(
  raw: string | undefined | null,
): string | null {
  if (!raw) return null;
  const clean = sanitizeHtml(raw, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
  }).trim();
  return clean || null;
}
