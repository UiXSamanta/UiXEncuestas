import {
  RESERVED_ROOT_SEGMENTS,
  UUID_RE,
} from './lib/site-config';
import {
  buildOgHtml,
  fetchSurveyOgData,
  isSocialCrawler,
} from './lib/og-meta';

/** Extract survey ID from welcome-page paths only (not /questions). */
function extractSurveyId(pathname: string): string | null {
  const canonical = pathname.match(/^\/survey\/([^/]+)\/?$/);
  if (canonical) {
    const id = canonical[1];
    return UUID_RE.test(id) ? id : null;
  }

  const legacy = pathname.match(/^\/([^/]+)\/?$/);
  if (!legacy) return null;

  const segment = legacy[1];
  if (RESERVED_ROOT_SEGMENTS.has(segment)) return null;
  return UUID_RE.test(segment) ? segment : null;
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get('user-agent');
  if (!isSocialCrawler(userAgent)) return;

  const url = new URL(request.url);
  const surveyId = extractSurveyId(url.pathname);
  if (!surveyId) return;

  const ogData = await fetchSurveyOgData(surveyId);
  if (!ogData) return;

  const html = buildOgHtml(url.toString(), ogData);
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

export const config = {
  matcher: ['/survey/:path*', '/:path*'],
};
