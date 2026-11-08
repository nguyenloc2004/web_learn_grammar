// Router nhẹ dựa trên hash (#/topic/present-perfect), không cần server.

export interface Route {
  name: string;
  params: Record<string, string>;
  query: URLSearchParams;
}

const patterns: { name: string; re: RegExp; keys: string[] }[] = [
  { name: 'catalog', re: /^\/?$/, keys: [] },
  { name: 'topic', re: /^\/topic\/([^/]+)\/?$/, keys: ['id'] },
  { name: 'quiz', re: /^\/quiz\/?$/, keys: [] },
  { name: 'result', re: /^\/result\/?$/, keys: [] },
  { name: 'mistakes', re: /^\/mistakes\/?$/, keys: [] },
  { name: 'exam', re: /^\/exam\/?$/, keys: [] },
  { name: 'stats', re: /^\/stats\/?$/, keys: [] },
  { name: 'data', re: /^\/data\/?$/, keys: [] },
];

function parse(): Route {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  const query = new URLSearchParams(qs);
  for (const p of patterns) {
    const m = path.match(p.re);
    if (m) {
      const params: Record<string, string> = {};
      p.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { name: p.name, params, query };
    }
  }
  return { name: 'not-found', params: {}, query };
}

export const router = $state<{ route: Route }>({ route: parse() });

window.addEventListener('hashchange', () => {
  router.route = parse();
  window.scrollTo(0, 0);
});

export function navigate(path: string) {
  const target = '#' + path;
  if (location.hash === target) router.route = parse();
  else location.hash = target;
}

export const href = (path: string) => '#' + path;
