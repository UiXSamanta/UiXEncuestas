import { API_BASE_URL, SUPABASE_ANON_KEY } from './site-config';

export interface SurveyOgData {
  titulo: string;
  descripcion: string;
  ogImage: string | null;
}

const CRAWLER_PATTERNS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'slackbot',
  'telegrambot',
  'discordbot',
  'pinterest',
  'googlebot',
  'bingbot',
  'applebot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'vkshare',
  'w3c_validator',
];

export function isSocialCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some((bot) => ua.includes(bot));
}

function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function fetchSurveyOgData(id: string): Promise<SurveyOgData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/encuestas/${id}`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return null;

    const payload = await response.json();
    const encuesta = payload?.data ?? payload;
    if (!encuesta || typeof encuesta !== 'object') return null;

    const titulo =
      encuesta.pantalla_bienvenida?.titulo ||
      encuesta.nombre_encuesta ||
      'Encuesta';
    const descripcion =
      encuesta.pantalla_bienvenida?.descripcion ||
      'Comparte tu opinión y ayúdanos a mejorar.';
    const ogImage =
      encuesta.pantalla_bienvenida?.opengraph_enabled !== false &&
      encuesta.pantalla_bienvenida?.opengraph_url
        ? encuesta.pantalla_bienvenida.opengraph_url
        : null;

    return { titulo, descripcion, ogImage };
  } catch {
    return null;
  }
}

export function buildOgHtml(pageUrl: string, data: SurveyOgData): string {
  const { titulo, descripcion, ogImage } = data;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escHtml(titulo)}</title>
  <meta name="description" content="${escHtml(descripcion)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escHtml(pageUrl)}" />
  <meta property="og:title" content="${escHtml(titulo)}" />
  <meta property="og:description" content="${escHtml(descripcion)}" />
  ${
    ogImage
      ? `<meta property="og:image" content="${escHtml(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />`
      : ''
  }
  <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${escHtml(titulo)}" />
  <meta name="twitter:description" content="${escHtml(descripcion)}" />
  ${ogImage ? `<meta name="twitter:image" content="${escHtml(ogImage)}" />` : ''}
</head>
<body></body>
</html>`;
}
