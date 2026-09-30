import { useEffect, useRef, useState, type CSSProperties } from "react";

export const DARK_SOULS_HOLO_CARD_VARIANTS = ["ashen-one", "cindermane"] as const;
export type DarkSoulsHoloCardVariant = (typeof DARK_SOULS_HOLO_CARD_VARIANTS)[number];

/* Both registered documents remain untouched in public/. The album adaptation is
   generated from that exact source at runtime so the original shader scene, motion,
   card geometry and interactions stay intact. */
const DARK_SOULS_DOCUMENTS: Record<DarkSoulsHoloCardVariant, string> = {
  "ashen-one": "/landing-pages/dark-souls-holo-card.html",
  cindermane: "/landing-pages/dark-souls-holo-card-cindermane.html",
};

const DARK_SOULS_TITLES: Record<DarkSoulsHoloCardVariant, string> = {
  "ashen-one": "Dark Souls Holo Card — The Ashen One",
  cindermane: "Dark Souls Holo Card — Cindermane",
};

export type DarkSoulsHoloCardProps = {
  className?: string;
  style?: CSSProperties;
  variant?: DarkSoulsHoloCardVariant;
  baseCoverUrl?: string;
  coverUrl?: string;
  coverLabel?: string;
  albumTitle?: string;
  artistName?: string;
};

type AlbumHoloConfig = {
  coverUrl: string;
  albumTitle: string;
  artistName: string;
};

const safeJson = (value: unknown) => JSON.stringify(value)
  .replaceAll("<", "\\u003c")
  .replaceAll("\u2028", "\\u2028")
  .replaceAll("\u2029", "\\u2029");

function replaceRequired(source: string, anchor: string, replacement: string, label: string) {
  const next = source.replace(anchor, replacement);
  if (next === source) throw new Error(`ThreeUI Dark Souls album anchor missing: ${label}`);
  return next;
}

async function readBlobAsDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Album artwork could not be read"));
    reader.readAsDataURL(blob);
  });
}

async function rasterizeArtwork(url: string) {
  return await new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Album artwork canvas is unavailable"));
        return;
      }
      const width = image.naturalWidth || 1024;
      const height = image.naturalHeight || 1024;
      const side = Math.min(width, height);
      context.drawImage(image, (width - side) / 2, (height - side) / 2, side, side, 0, 0, 1024, 1024);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("Album artwork could not be rasterized"));
    image.src = url;
  });
}

async function inlineArtwork(url: string) {
  if (!url) return url;
  let dataUrl = url;
  let mimeType = url.match(/^data:([^;,]+)/)?.[1] || "";
  if (!url.startsWith("data:")) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Album artwork request failed: ${response.status}`);
    const blob = await response.blob();
    mimeType = blob.type;
    dataUrl = await readBlobAsDataUrl(blob);
  }
  return mimeType === "image/svg+xml" ? rasterizeArtwork(dataUrl) : dataUrl;
}

export function createAlbumHoloDocument(source: string, configValue: AlbumHoloConfig) {
  const config = `<script>window.__VINYL_ALBUM_ARTWORK=${safeJson(configValue)};</script><style id="vinyl-album-card-overrides">.mark{display:none!important}</style>`;
  let document = replaceRequired(source, '<script type="module">', `${config}\n<script type="module">`, "module config");
  document = replaceRequired(
    document,
    '  const at = (n) => window.__CARD_ASSETS && window.__CARD_ASSETS["assets/" + n] || "./assets/" + n;',
    `  const originalAt = (n) => window.__CARD_ASSETS && window.__CARD_ASSETS["assets/" + n] || "./assets/" + n;
  const albumConfig = window.__VINYL_ALBUM_ARTWORK || {};
  const albumCover = albumConfig.coverUrl;
  const at = (n) => n === "background.webp" && albumCover ? albumCover : originalAt(n);`,
    "album artwork source",
  );
  document = replaceRequired(
    document,
    '    loadTex(L, at("background.webp"), true),',
    '    loadTex(L, at("background.webp"), true).catch(() => loadTex(L, originalAt("background.webp"), true)),',
    "album artwork fallback",
  );
  document = replaceRequired(
    document,
    '    loadTex(L, at("lineart_df.webp"), false)\n  ]);\n  for (const t of [tBg, tFx]) {',
    `    loadTex(L, at("lineart_df.webp"), false)
  ]);
  const prepareVinylArtwork = (texture) => {
    if (!texture || !texture.image) return texture;
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = 1536;
    const context = canvas.getContext("2d");
    context.fillStyle = "#090706"; context.fillRect(0, 0, 1024, 1536);
    const iw = texture.image.width || 1024, ih = texture.image.height || 1024;
    const side = Math.min(iw, ih), sx = (iw - side) / 2, sy = (ih - side) / 2;
    context.drawImage(texture.image, sx, sy, side, side, 0, 256, 1024, 1024);
    context.fillStyle = "rgba(4,3,3,.78)";
    context.fillRect(0, 0, 1024, 256); context.fillRect(0, 1280, 1024, 256);
    texture.image = canvas; texture.flipY = false; texture.needsUpdate = true;
    return texture;
  };
  if (albumCover) {
    prepareVinylArtwork(tBg);
    const transparent = document.createElement("canvas"); transparent.width = 2; transparent.height = 2;
    for (const texture of [tSubject, tLine, tLineDF]) {
      texture.image = transparent; texture.flipY = false; texture.needsUpdate = true;
    }
  }
  const createVinylTypeTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048; canvas.height = 3072;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.textBaseline = "middle";

    const splitLines = (text, maxWidth, maxLines, fontSize, family) => {
      context.font = "600 " + fontSize + "px " + family;
      const normalized = String(text || "").trim().replace(/\\s+/g, " ");
      if (!normalized) return [];
      const tokens = normalized.includes(" ") ? normalized.split(" ") : Array.from(normalized);
      const joiner = normalized.includes(" ") ? " " : "";
      const lines = [];
      let line = "";
      for (const token of tokens) {
        const candidate = line ? line + joiner + token : token;
        if (line && context.measureText(candidate).width > maxWidth) {
          lines.push(line);
          line = token;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);
      return lines.length <= maxLines ? lines : null;
    };

    const drawFitted = ({ text, y, maxWidth, maxLines, maxSize, minSize, lineHeight, family, fillStyle }) => {
      let size = maxSize;
      let lines = null;
      while (size >= minSize && !lines) {
        lines = splitLines(text, maxWidth, maxLines, size, family);
        if (!lines) size -= 6;
      }
      if (!lines) {
        size = minSize;
        context.font = "600 " + size + "px " + family;
        let fitted = String(text || "").trim();
        while (fitted.length > 1 && context.measureText(fitted + "…").width > maxWidth) fitted = fitted.slice(0, -1);
        lines = [fitted + (fitted === String(text || "").trim() ? "" : "…")];
      }
      context.font = "600 " + size + "px " + family;
      context.fillStyle = fillStyle;
      const step = size * lineHeight;
      const firstY = y - ((lines.length - 1) * step) / 2;
      lines.forEach((line, index) => context.fillText(line, canvas.width / 2, firstY + index * step));
    };

    drawFitted({
      text: albumConfig.albumTitle || "VINYL SHELF",
      y: 332,
      maxWidth: 1280,
      maxLines: 2,
      maxSize: 82,
      minSize: 44,
      lineHeight: 1.1,
      family: "Georgia, 'Noto Serif SC', serif",
      fillStyle: "rgb(255,0,0)",
    });
    drawFitted({
      text: albumConfig.artistName || "",
      y: 2742,
      maxWidth: 1160,
      maxLines: 1,
      maxSize: 56,
      minSize: 36,
      lineHeight: 1,
      family: "Arial, 'Noto Sans SC', sans-serif",
      fillStyle: "rgb(0,255,0)",
    });
    return canvas;
  };
  tType.image = createVinylTypeTexture();
  tType.flipY = false;
  tType.premultiplyAlpha = false;
  tType.needsUpdate = true;
  for (const t of [tBg, tFx]) {`,
    "album artwork preparation",
  );
  document = replaceRequired(
    document,
    '  const bg = plane(x1 - x0, y0 - y1, bgMat, 0, -40, 1);',
    `  const bg = plane(x1 - x0, y0 - y1, bgMat, 0, -40, 1);
  addEventListener("message", async (event) => {
    if (event.data?.type !== "vinyl-holo-cover" || !event.data.coverUrl) return;
    try {
      const next = prepareVinylArtwork(await loadTex(L, event.data.coverUrl, true));
      next.wrapS = next.wrapT = THREE12.MirroredRepeatWrapping; next.needsUpdate = true;
      const previous = bgMat.uniforms.tBg.value;
      bgMat.uniforms.tBg.value = next;
      if (previous !== tBg) previous?.dispose?.();
    } catch (error) { console.warn("Album artwork could not be updated", error); }
  });`,
    "track artwork bridge",
  );
  return document;
}

export function DarkSoulsHoloCard({
  className = "",
  style,
  variant = "ashen-one",
  baseCoverUrl,
  coverUrl,
  coverLabel,
  albumTitle = "",
  artistName = "",
}: DarkSoulsHoloCardProps) {
  const safeVariant = DARK_SOULS_HOLO_CARD_VARIANTS.includes(variant) ? variant : "ashen-one";
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [documentVisible, setDocumentVisible] = useState(() => (
    typeof document === "undefined" || !document.hidden
  ));
  const [hostVisible, setHostVisible] = useState(true);
  const [source, setSource] = useState<string>();
  const [sourceError, setSourceError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setHostVisible(entry?.isIntersecting ?? true);
    }, { rootMargin: "80px" });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const mounted = hostVisible && documentVisible;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setSource(undefined);
    setSourceError(false);
    const initialCover = baseCoverUrl || coverUrl || "";
    Promise.all([
      fetch(DARK_SOULS_DOCUMENTS[safeVariant]).then(response => {
        if (!response.ok) throw new Error(`ThreeUI source request failed: ${response.status}`);
        return response.text();
      }),
      inlineArtwork(initialCover).catch(() => initialCover),
    ])
      .then(([html, artwork]) => {
        if (!cancelled) setSource(createAlbumHoloDocument(html, {
          coverUrl: artwork,
          albumTitle,
          artistName,
        }));
      })
      .catch(() => {
        if (!cancelled) setSourceError(true);
      });
    return () => { cancelled = true; };
  }, [albumTitle, artistName, baseCoverUrl, safeVariant]);

  useEffect(() => {
    if (!ready || !coverUrl) return undefined;
    let cancelled = false;
    let retry = 0;
    let lateRetry = 0;
    const prepare = async () => {
      const artwork = await inlineArtwork(coverUrl).catch(() => coverUrl);
      if (cancelled) return;
      const send = () => frameRef.current?.contentWindow?.postMessage({ type: "vinyl-holo-cover", coverUrl: artwork }, "*");
      send();
      retry = window.setTimeout(send, 2500);
      lateRetry = window.setTimeout(send, 9000);
    };
    void prepare();
    return () => {
      cancelled = true;
      window.clearTimeout(retry);
      window.clearTimeout(lateRetry);
    };
  }, [coverUrl, ready, safeVariant]);

  return (
    <div
      ref={hostRef}
      className={`threeui-background dark-souls-holo-card${className ? ` ${className}` : ""}`}
      role="group"
      aria-label={coverLabel ? `${coverLabel} 全息封面卡` : "Interactive Dark Souls holographic card"}
      data-state={!mounted ? "paused" : sourceError ? "error" : ready ? "ready" : "loading"}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#050404",
        pointerEvents: "auto",
        ...style,
      }}
    >
      {mounted && source ? (
        <iframe
          key={`${safeVariant}:${baseCoverUrl || "album"}`}
          ref={frameRef}
          title={DARK_SOULS_TITLES[safeVariant]}
          srcDoc={source}
          sandbox="allow-scripts"
          loading="eager"
          onLoad={() => setReady(true)}
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            width: "100%",
            height: "100%",
            border: 0,
            background: "#050404",
            opacity: ready ? 1 : 0,
            pointerEvents: ready ? "auto" : "none",
            transition: "opacity 240ms ease-out",
          }}
        />
      ) : null}
      {sourceError ? <p style={{ margin: 0, padding: 24, color: "#f0dfbd" }}>全息卡牌源文件加载失败</p> : null}
    </div>
  );
}
