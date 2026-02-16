import { NextRequest, NextResponse } from 'next/server';

const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i;
const OG_TITLE_RE = /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i;
const OG_TITLE_RE_ALT = /<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'bot' },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Could not fetch page' },
        { status: 404 },
      );
    }

    const html = await res.text();

    // Prefer og:title, fall back to <title>
    const ogMatch = html.match(OG_TITLE_RE) ?? html.match(OG_TITLE_RE_ALT);
    const titleMatch = html.match(TITLE_RE);
    const raw = ogMatch?.[1] ?? titleMatch?.[1];

    if (!raw) {
      return NextResponse.json({ error: 'No title found' }, { status: 404 });
    }

    // Decode HTML entities
    const title = raw
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .trim();

    return NextResponse.json({ title });
  } catch {
    return NextResponse.json(
      { error: 'Could not fetch page' },
      { status: 500 },
    );
  }
}
