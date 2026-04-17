import { NextRequest, NextResponse } from 'next/server';
import { YOUTUBE_OEMBED, RATE_LIMIT } from '@/lib/constants';
import { rateLimit, getClientIp, MINUTE_MS } from '@/lib/rate-limit';
import { env, appBaseUrl } from '@/lib/env';

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  const allowed = new Set<string>([appBaseUrl()]);
  if (env.VERCEL_URL) allowed.add(`https://${env.VERCEL_URL}`);
  return allowed.has(origin);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getClientIp(request.headers);
  const limit = rateLimit(
    `youtube:${ip}`,
    RATE_LIMIT.YOUTUBE_PER_MIN,
    MINUTE_MS,
  );
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  if (!YOUTUBE_OEMBED.URL_PATTERN.test(url)) {
    return NextResponse.json(
      { error: 'URL must be a YouTube video link' },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(YOUTUBE_OEMBED.FETCH_TIMEOUT_MS) },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Could not fetch video info' },
        { status: 404 },
      );
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { error: 'Could not fetch video info' },
        { status: 500 },
      );
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > YOUTUBE_OEMBED.MAX_RESPONSE_BYTES) {
        reader.cancel();
        return NextResponse.json(
          { error: 'Response too large' },
          { status: 502 },
        );
      }
      chunks.push(value);
    }

    const text = new TextDecoder().decode(
      Buffer.concat(chunks.map((c) => Buffer.from(c))),
    );
    const data = JSON.parse(text);
    const title = typeof data?.title === 'string' ? data.title : null;
    if (!title) {
      return NextResponse.json(
        { error: 'Could not fetch video info' },
        { status: 502 },
      );
    }

    return NextResponse.json({ title });
  } catch {
    return NextResponse.json(
      { error: 'Could not fetch video info' },
      { status: 500 },
    );
  }
}
