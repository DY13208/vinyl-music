import React from 'react';
type Props = { children: React.ReactNode };
export function ShelfHeader({ children }: Props) { return <header className="collection-room__header ct-heading ct-heading--shelf">{children}</header>; }
export function EditorialHeader({ children }: Props) { return <header className="collection-room__header ct-heading ct-heading--editorial">{children}</header>; }
export function CinematicHeader({ children }: Props) { return <header className="collection-room__header ct-heading ct-heading--cinematic">{children}<span className="ct-heading__tagline">让声音与片刻，留在唱片架。</span></header>; }
export function GlassHeader({ children }: Props) { return <header className="collection-room__header ct-heading ct-heading--glass">{children}</header>; }
export function CoverWallHeader({ children }: Props) { return <header className="collection-room__header ct-heading ct-heading--cover-wall">{children}</header>; }
