import React from 'react';
import { Check, Disc3, Flame, NotebookTabs } from 'lucide-react';
import { albumDetailThemes } from './AlbumDetailTheme';
import type { AlbumDetailThemePreference } from './useAlbumDetailTheme';

export function AlbumDetailThemeSelector({ preference }: { preference: AlbumDetailThemePreference }) {
  return (
    <details className="pt-settings-section">
      <summary>专辑详情页主题</summary>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="专辑详情页主题">
        {albumDetailThemes.map((theme) => {
          const selected = preference.themeId === theme.id;
          const Icon = theme.id === 'archive'
            ? Disc3
            : theme.id === 'cover-notes'
              ? NotebookTabs
              : Flame;
          return (
            <button
              key={theme.id}
              type="button"
              aria-pressed={selected}
              onClick={() => preference.setTheme(theme.id)}
              className={`min-h-24 rounded-md border p-3 text-left ${selected ? 'border-[#a9d69a] bg-[#162316] text-[#dff5d8]' : 'border-[#343d34] text-white/65'}`}
            >
              <span className="mb-3 flex items-center justify-between">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {selected && <Check className="h-4 w-4" aria-hidden="true" />}
              </span>
              <strong className="block text-sm font-medium">{theme.name}</strong>
              <small className="mt-1 block text-[10px] leading-4 opacity-65">{theme.description}</small>
            </button>
          );
        })}
      </div>
      {preference.message && <p role="status">{preference.message}</p>}
    </details>
  );
}
