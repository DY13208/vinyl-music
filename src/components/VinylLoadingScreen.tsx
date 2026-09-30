import React from 'react';

interface VinylLoadingScreenProps {
  message?: string;
}

export function VinylLoadingScreen({
  message = '正在载入你的唱片空间',
}: VinylLoadingScreenProps) {
  return (
    <main
      className="vinyl-loading-screen relative isolate flex min-h-screen min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#080806] px-6 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(32px,env(safe-area-inset-top))] text-[#F3F4EF]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="vinyl-loading-grain absolute inset-0 z-10 opacity-[0.08]" aria-hidden="true" />

      <div className="vinyl-loading-visual absolute inset-0" aria-hidden="true">
        <img
          className="h-full w-full object-cover"
          src="/assets/loading/splash-turntable-v2.png"
          alt=""
          draggable={false}
        />
        <div className="vinyl-loading-light-sweep absolute inset-0" />
        <div className="vinyl-loading-vignette absolute inset-0" />
      </div>

      <section className="vinyl-loading-content relative z-20 flex min-h-[100dvh] w-full max-w-sm flex-col items-center justify-end pb-[7vh] text-center">
        <div className="vinyl-loading-brand mb-auto mt-[5vh] flex items-center gap-2.5" aria-label="Vinyl Shelf">
          <span className="vinyl-loading-brand__mark" aria-hidden="true" />
          <span>VINYL SHELF</span>
        </div>

        <div className="vinyl-loading-copy space-y-2">
          <h1 className="m-0 text-[17px] font-medium leading-snug tracking-[-0.012em] text-[#F1F3EE]">
            {message}
          </h1>
          <p className="m-0 text-[11px] font-normal tracking-[0.08em] text-white/45">
            让音乐回到生活的形状
          </p>
        </div>

        <div className="vinyl-loading-progress mt-5 h-px w-16 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <span className="block h-full w-1/2 rounded-full bg-[#6AAE52]" />
        </div>
      </section>
    </main>
  );
}
