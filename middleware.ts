import {
  RESERVED_ROOT_SEGMENTS,
  UUID_RE,
} from './lib/site-config';
import {
  buildOgHtml,
  buildOgHtmlWithRedirect,
  fetchSurveyOgData,
  isSocialCrawler,
} from './lib/og-meta';

/** Extract survey ID from welcome or questions paths. */
function extractSurveyId(pathname: string): string | null {
  const canonical = pathname.match(/^\/survey\/([^/]+)(?:\/questions)?\/?$/);
  if (canonical) {
    const id = canonical[1];
    return UUID_RE.test(id) ? id : null;
  }

  const legacyQuestions = pathname.match(/^\/([^/]+)\/questions\/?$/);
  if (legacyQuestions) {
    const id = legacyQuestions[1];
    if (RESERVED_ROOT_SEGMENTS.has(id)) return null;
    return UUID_RE.test(id) ? id : null;
  }

  const legacy = pathname.match(/^\/([^/]+)\/?$/);
  if (!legacy) return null;

  const segment = legacy[1];
  if (RESERVED_ROOT_SEGMENTS.has(segment)) return null;
  return UUID_RE.test(segment) ? segment : null;
}

/** Map any survey path to the canonical welcome URL used for OG tags. */
function canonicalWelcomeUrl(origin: string, surveyId: string): string {
  return `${origin}/survey/${surveyId}`;
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  // Second hop: browser continues to the SPA after OG shell.
  if (url.searchParams.has('_app')) return;

  const surveyId = extractSurveyId(url.pathname);
  if (!surveyId) return;

  const ogData = await fetchSurveyOgData(surveyId);
  if (!ogData) return;

  const welcomeUrl = canonicalWelcomeUrl(url.origin, surveyId);
  const userAgent = request.headers.get('user-agent');
  const isBot = isSocialCrawler(userAgent);

  const html = isBot
    ? buildOgHtml(welcomeUrl, ogData)
    : buildOgHtmlWithRedirect(
        welcomeUrl,
        `${welcomeUrl}?_app=1`,
        ogData,
      );

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
