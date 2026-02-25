import { NextResponse } from 'next/server';

// Google News RSS queries for Vietnamese stock market coverage
const RSS_FEEDS = [
  {
    url: 'https://news.google.com/rss/search?q=ch%E1%BB%A9ng+kho%C3%A1n+vi%E1%BB%87t+nam&hl=vi&gl=VN&ceid=VN:vi',
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=c%E1%BB%95+phi%E1%BA%BFu+HOSE+HNX&hl=vi&gl=VN&ceid=VN:vi',
    source: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=VN-Index+th%E1%BB%8B+tr%C6%B0%E1%BB%9Dng+ch%E1%BB%A9ng+kho%C3%A1n&hl=vi&gl=VN&ceid=VN:vi',
    source: 'Google News',
  },
];

function extractText(xml, tag) {
  const re = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`,
    'i'
  );
  const m = xml.match(re);
  if (!m) return '';
  return (m[1] ?? m[2] ?? '').trim();
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseRSS(xml, defaultSource) {
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  const articles = [];
  let match;

  while ((match = itemRe.exec(xml)) !== null) {
    const item = match[1];
    const title = stripHtml(extractText(item, 'title'));
    const rawLink = extractText(item, 'link');
    const link = rawLink || item.match(/<link>([^<]+)<\/link>/)?.[1] || '';
    const description = stripHtml(extractText(item, 'description')).slice(0, 300);
    const pubDate = extractText(item, 'pubDate');
    const source = extractText(item, 'source') || defaultSource;

    if (title && link) {
      articles.push({
        id: Buffer.from(title).toString('base64').slice(0, 16),
        title,
        description,
        url: link,
        source,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
  }

  return articles;
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      RSS_FEEDS.map(({ url, source }) =>
        fetch(url, {
          next: { revalidate: 300 },
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Finsight/1.0)' },
        })
          .then((r) => r.text())
          .then((xml) => parseRSS(xml, source))
      )
    );

    const all = results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    // Deduplicate by first 60 chars of title
    const seen = new Set();
    const unique = all.filter((a) => {
      const key = a.title.slice(0, 60).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort newest first
    unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    return NextResponse.json({ data: unique.slice(0, 40) });
  } catch (err) {
    console.error('[/api/news]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
