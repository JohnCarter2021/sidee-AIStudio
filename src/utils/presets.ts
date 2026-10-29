import { AppItem, Category } from '../types';

export const CATEGORIES: Category[] = ['Media', 'Anime', 'Music', 'Tools', 'Custom'];

export const BUILT_IN_PRESETS: Record<string, Partial<AppItem>> = {
  nuvio: {
    name: 'Nuvio',
    app_id: 'nuviodebug',
    url: 'https://nuviotvsmart.vercel.app/vidaa.html',
    image: 'https://nuviotvsmart.vercel.app/assets/images/tizenIcon.png',
    icon: 'assets/nuvio-wordmark.png',
    description: 'Browse and stream your library',
    category: 'Media',
    source: 'built-in',
  },
  stremio: {
    name: 'Stremio',
    app_id: 'stremiodebug',
    url: 'https://noobygains.github.io/stremio-vidaa-tv/?install_source=sidee',
    server_builder: 'stremio',
    server_optional: true,
    server_placeholder: 'Streaming server URL (optional)',
    image: 'https://noobygains.github.io/stremio-vidaa-tv/icon.png',
    description: 'Full Stremio TV for VIDAA with D-pad navigation',
    category: 'Media',
    source: 'built-in',
  },
  jellyfin: {
    name: 'Jellyfin',
    app_id: 'jellyfin',
    url: '', // built from user's server address
    needs_server: true,
    server_placeholder: "Your server's IP or URL",
    image: 'https://raw.githubusercontent.com/Empi9245/Sidee/main/assets/jellyfin-tile-bold.png',
    icon: 'assets/jellyfin.png',
    description: 'Your media from your Jellyfin server',
    category: 'Media',
    source: 'built-in',
  },

  // User requested Anime streaming sources with pulled official website logos
  reanime: {
    name: 'Re:ANIME',
    app_id: 'reanime',
    url: 'https://reanime.to/home',
    image: '/assets/logos/reanime.png',
    icon: 'assets/logos/reanime.png',
    description: 'Subbed, dubbed and auto-next anime streaming hub with auto-skip',
    category: 'Anime',
    source: 'built-in',
  },
  anikototv: {
    name: 'AniKoto TV',
    app_id: 'anikototv',
    url: 'https://anikototv.to/home',
    image: '/assets/logos/anikoto.png',
    icon: 'assets/logos/anikoto.png',
    description: 'TV-optimized anime experience with soft/hard subs, dubs and auto-play',
    category: 'Anime',
    source: 'built-in',
  },
  miruro: {
    name: 'Miruro',
    app_id: 'miruro',
    url: 'https://miruro.cx',
    image: '/assets/logos/miruro.png',
    icon: 'assets/logos/miruro.png',
    description: 'High-speed soft/hard subbed anime with modern player controls',
    category: 'Anime',
    source: 'built-in',
  },
  animepahe: {
    name: 'AnimePahe',
    app_id: 'animepahe',
    url: 'https://animepahe.pw/',
    image: '/assets/logos/animepahe.png',
    icon: 'assets/logos/animepahe.png',
    description: 'Ultra-lightweight anime streaming portal with clean video playback',
    category: 'Anime',
    source: 'built-in',
  },

  // FMHY Video Streaming Aggregators with official website logos
  movy: {
    name: 'Movy',
    app_id: 'movy',
    url: 'https://www.movy.sx/',
    image: '/assets/logos/movy.png',
    icon: 'assets/logos/movy.png',
    description: 'Movies, TV shows and anime aggregator with 4K auto-next streams',
    category: 'Media',
    source: 'built-in',
  },
  cinejoy: {
    name: 'Cinejoy',
    app_id: 'cinejoy',
    url: 'https://cinejoy.pk/',
    image: '/assets/logos/cinejoy.png',
    icon: 'assets/logos/cinejoy.png',
    description: 'Clean on-demand movie and TV series streaming with auto-next',
    category: 'Media',
    source: 'built-in',
  },
  popcornmovies: {
    name: 'PopcornMovies',
    app_id: 'popcornmovies',
    url: 'https://popcornmovies.ac/',
    image: '/assets/logos/popcornmovies.png',
    icon: 'assets/logos/popcornmovies.png',
    description: 'Browse and stream trending blockbusters and TV shows with multi-servers',
    category: 'Media',
    source: 'built-in',
  },
  flystream: {
    name: 'FlyStream',
    app_id: 'flystream',
    url: 'https://flystream.net/',
    image: '/assets/logos/flystream.png',
    icon: 'assets/logos/flystream.png',
    description: 'Multi-server movies and series streaming aggregator with 4K sources',
    category: 'Media',
    source: 'built-in',
  },
  rivestream: {
    name: 'Rive',
    app_id: 'rivestream',
    url: 'https://www.rivestream.app/',
    image: '/assets/logos/rivestream.png',
    icon: 'assets/logos/rivestream.png',
    description: 'Fast streaming web app with high-resolution sources and clean layout',
    category: 'Media',
    source: 'built-in',
  },
  sevenmovies: {
    name: '7Movies',
    app_id: 'sevenmovies',
    url: 'https://7movies.ac/',
    image: '/assets/logos/sevenmovies.png',
    icon: 'assets/logos/sevenmovies.png',
    description: 'Full catalog of movies, series and anime with auto-next streaming',
    category: 'Media',
    source: 'built-in',
  },
};

export function getBuiltInApps(): AppItem[] {
  return Object.entries(BUILT_IN_PRESETS).map(([key, p]) => ({
    key,
    app_id: p.app_id || key,
    name: p.name || key,
    url: p.url || '',
    image: p.image || '',
    icon: p.icon || '',
    description: p.description || '',
    category: (p.category as Category) || 'Media',
    needs_server: Boolean(p.needs_server),
    server_builder: p.server_builder || '',
    server_optional: Boolean(p.server_optional),
    server_placeholder: p.server_placeholder || '',
    source: 'built-in',
  }));
}

export function isPrivateHost(server: string): boolean {
  try {
    const raw = server.includes('://') ? server : '//' + server;
    const url = new URL(raw, 'http://dummy.lan');
    const host = (url.hostname || '').replace(/\.$/, '').toLowerCase();
    if (host.endsWith('.local')) return true;

    const parts = host.split('.').map(Number);
    if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
      if (parts[0] === 10) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function buildServerUrl(serverInput: string): string {
  const server = serverInput.trim().replace(/\/+$/, '');
  const hasScheme = server.includes('://');
  const raw = hasScheme ? server : '//' + server;

  let url: URL;
  try {
    url = new URL(raw, 'http://dummy.lan');
  } catch {
    throw new Error("Enter your Jellyfin server's LAN IP or full URL.");
  }

  const host = (url.hostname || '').replace(/\.$/, '').toLowerCase();
  if (!host) {
    throw new Error("Enter your Jellyfin server's LAN IP or full URL.");
  }

  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1'
  ) {
    throw new Error(
      "Use your Jellyfin server's LAN IP or URL; localhost and loopback addresses refer to the TV itself."
    );
  }

  const scheme = hasScheme
    ? url.protocol.replace(':', '')
    : isPrivateHost(server)
      ? 'http'
      : 'https';

  let port = url.port;
  if (!hasScheme && !port) {
    port = '8096';
  }

  const authority = port ? `${host}:${port}` : host;
  let path = url.pathname.replace(/\/+$/, '');
  if (!/\/web(\/index\.html)?$/.test(path)) {
    path += '/web/index.html';
  }

  const query = url.search ? url.search : '';
  const hash = url.hash ? url.hash : '';
  return `${scheme}://${authority}${path}${query}${hash}`;
}

export function buildStremioUrl(serverInput: string = ''): string {
  const base = 'https://noobygains.github.io/stremio-vidaa-tv/?install_source=sidee';
  const server = serverInput.trim().replace(/\/+$/, '');
  if (!server) return base;

  let parsed: URL;
  try {
    parsed = new URL(server);
  } catch {
    throw new Error('Paste the full Stremio streaming server URL, including http:// or https://.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Paste the full Stremio streaming server URL, including http:// or https://.');
  }

  const host = parsed.hostname.replace(/\.$/, '').toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1'
  ) {
    throw new Error('Use the Stremio server address reachable by your TV; localhost points to the TV itself.');
  }

  return `${base}&server=${encodeURIComponent(server)}`;
}

export function resolveUrl(app: AppItem, server: string = ''): string {
  if (app.needs_server) {
    if (!server) {
      throw new Error(`${app.name} requires your server address: e.g. 192.168.1.100:8096`);
    }
    return buildServerUrl(server);
  }
  if (app.server_builder === 'stremio') {
    return buildStremioUrl(server);
  }
  return app.url || '';
}

export function validateCustomApp(data: Partial<AppItem>): AppItem {
  const appId = (data.app_id || '').trim().toLowerCase();
  const name = (data.name || '').trim();
  const url = (data.url || '').trim();
  const image = (data.image || '').trim();
  const description = (data.description || '').trim();
  const category = (data.category || 'Custom') as Category;

  if (!/^[a-z0-9_]{1,32}$/.test(appId)) {
    throw new Error('App ID must use lowercase letters, digits or _ (max 32)');
  }
  if (!/^[\w \-']{1,40}$/.test(name)) {
    throw new Error('App name is invalid (max 40 characters)');
  }
  if (url.length > 300 || image.length > 300 || description.length > 200) {
    throw new Error('Custom app text is too long');
  }

  if (url.startsWith('https://')) {
    // Valid
  } else if (url.startsWith('http://') && isPrivateHost(url)) {
    // Valid private LAN
  } else {
    throw new Error('URL must use https (or http on your LAN)');
  }

  if (image && !image.startsWith('https://') && !image.startsWith('/assets/') && !image.startsWith('assets/') && !image.startsWith('data:image/')) {
    throw new Error('Icon URL must use https or local asset');
  }

  if (!CATEGORIES.includes(category)) {
    throw new Error(`Category must be one of: ${CATEGORIES.join(', ')}`);
  }

  return {
    key: appId,
    app_id: appId,
    name,
    url,
    image,
    icon: '',
    description,
    category,
    needs_server: false,
    server_builder: '',
    server_placeholder: '',
    source: 'custom',
  };
}
