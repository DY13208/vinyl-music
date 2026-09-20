// Only public artwork CDNs can be fetched by the server. Never forward a user
// upload, local address, arbitrary URL, cookie, or collection record.
const PUBLIC_HOSTS = [
  /^(p\d+|p\d+\.music)\.126\.net$/,
  /^y\.gtimg\.cn$/,
  /^(imge|imgessl)\.kugou\.com$/,
  /^img\d*\.kuwo\.cn$/,
  /^is\d+-ssl\.mzstatic\.com$/,
  /^cdn-images\.dzcdn\.net$/,
  /^i\.scdn\.co$/,
  /^i\.discogs\.com$/,
  /^coverartarchive\.org$/,
  /^(archive\.org|ia\d+\.us\.archive\.org|ia\d+\.archive\.org)$/,
  /^images\.unsplash\.com$/,
];

export function publicArtworkUrl(source: string): string | null {
  try {
    const url = new URL(source.startsWith('//') ? `https:${source}` : source);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    if (!PUBLIC_HOSTS.some(pattern => pattern.test(url.hostname))) return null;
    url.protocol = 'https:';
    url.hash = '';
    return url.href;
  } catch { return null; }
}

export function isDomesticArtwork(source: string): boolean {
  const normalized = publicArtworkUrl(source);
  return !!normalized && /\.(126\.net|gtimg\.cn|kugou\.com|kuwo\.cn)$/.test(new URL(normalized).hostname);
}

export const artworkKey = (source: string) => publicArtworkUrl(source) || source;
export const artworkRequestUrl = (source: string) => {
  const url = publicArtworkUrl(source);
  return url ? `/api/artwork?url=${encodeURIComponent(url)}` : source;
};
