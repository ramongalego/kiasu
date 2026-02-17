import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_RE =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i;

const MAX_RESPONSE_BYTES = 50 * 1024; // 50 KB

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  if (!YOUTUBE_RE.test(url)) {
    return NextResponse.json(
      { error: 'URL must be a YouTube video link' },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(5000) },
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
      if (totalBytes > MAX_RESPONSE_BYTES) {
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

    return NextResponse.json({ title: data.title });
  } catch {
    return NextResponse.json(
      { error: 'Could not fetch video info' },
      { status: 500 },
    );
  }
}
