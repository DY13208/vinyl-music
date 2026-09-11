import React, { Component, ErrorInfo, ReactNode, Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, ContactShadows, RoundedBox, useTexture } from '@react-three/drei';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Group, MathUtils, SRGBColorSpace, Texture } from 'three';
import { useReducedMotion } from 'motion/react';
import type { Album } from '../../../types';
import { platformService } from '../../../platform/platformService';
import { getVinylAppearance } from '../../../utils/vinylAppearance';
import './collectionThreeStage.css';

interface CollectionThreeStageProps {
  albums: readonly Album[];
  selectedAlbumId: string | null;
  onSelectAlbum?: (id: string) => void;
  onOpenAlbumDetail: (album: Album) => void;
}

interface VinylMeshProps {
  album: Album;
  offset: number;
  reducedMotion: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

const FALLBACK_COVER = '/assets/browse-demo/cover-01.svg';

class ThreeStageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('The collection 3D stage was disabled.', error, info.componentStack);
  }
  render() { return this.state.failed ? null : this.props.children; }
}

function VinylMesh({ album, offset, reducedMotion, onSelect, onOpen }: VinylMeshProps) {
  const group = useRef<Group>(null);
  const invalidate = useThree(state => state.invalidate);
  const texture = useTexture(album.coverUrl || FALLBACK_COVER) as Texture;
  const appearance = getVinylAppearance(album);
  const colors = album.vinylColors?.length ? album.vinylColors : [album.vinylColor || '#111214'];
  const discColor = appearance.variant === 'black' ? '#090a0b' : colors[0];
  const selected = offset === 0;

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useEffect(() => invalidate(), [invalidate, offset, selected]);

  useFrame((_, delta) => {
    if (!group.current || reducedMotion) return;
    const targetX = offset * 1.48;
    const targetZ = -Math.abs(offset) * 0.62;
    const targetScale = selected ? 1 : Math.max(.68, .84 - Math.abs(offset) * .04);
    group.current.position.x = MathUtils.damp(group.current.position.x, targetX, 7, delta);
    group.current.position.y = MathUtils.damp(group.current.position.y, selected ? .12 : -.08, 7, delta);
    group.current.position.z = MathUtils.damp(group.current.position.z, targetZ, 7, delta);
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, offset * -.18, 7, delta);
    group.current.scale.setScalar(MathUtils.damp(group.current.scale.x, targetScale, 7, delta));
    const unsettled = Math.abs(group.current.position.x - targetX) > .002
      || Math.abs(group.current.position.z - targetZ) > .002
      || Math.abs(group.current.scale.x - targetScale) > .002;
    if (unsettled) invalidate();
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (selected) onOpen();
    else onSelect();
  };

  return (
    <group
      ref={group}
      position={[offset * 1.48, selected ? .12 : -.08, -Math.abs(offset) * .62]}
      rotation={[0, offset * -.18, 0]}
      scale={selected ? 1 : Math.max(.68, .84 - Math.abs(offset) * .04)}
      onClick={handleClick}
      onPointerOver={(event) => event.stopPropagation()}
    >
      <mesh position={[.32, .02, -.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[.68, .68, .055, 64]} />
        <meshStandardMaterial color={discColor} roughness={.24} metalness={.58} />
      </mesh>
      {[.24, .34, .44, .54, .62].map(radius => (
        <mesh key={radius} position={[.32, .02, -.111]} rotation={[0, 0, 0]}>
          <torusGeometry args={[radius, .004, 6, 64]} />
          <meshBasicMaterial color="#8d927f" transparent opacity={.22} />
        </mesh>
      ))}
      <mesh position={[.32, .02, -.118]}>
        <circleGeometry args={[.17, 48]} />
        <meshStandardMaterial color={appearance.label?.color || '#d9d1bd'} roughness={.72} />
      </mesh>
      <RoundedBox args={[1.12, 1.12, .075]} radius={.018} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#26211c" roughness={.82} />
      </RoundedBox>
      <mesh position={[0, 0, .041]}>
        <planeGeometry args={[1.085, 1.085]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ThreeShelfScene({ albums, selectedIndex, reducedMotion, onSelect, onOpen }: {
  albums: readonly Album[];
  selectedIndex: number;
  reducedMotion: boolean;
  onSelect: (album: Album) => void;
  onOpen: (album: Album) => void;
}) {
  const visible = useMemo(() => albums
    .map((album, index) => ({ album, index, offset: index - selectedIndex }))
    .filter(item => Math.abs(item.offset) <= 2), [albums, selectedIndex]);

  return (
    <>
      <color attach="background" args={['#100c09']} />
      <fog attach="fog" args={['#100c09', 5.4, 10]} />
      <ambientLight intensity={.72} color="#ead9c2" />
      <directionalLight position={[-3, 5, 5]} intensity={2.5} color="#ffd7aa" castShadow shadow-mapSize={[512, 512]} />
      <pointLight position={[3, 1.5, 2.5]} intensity={10} distance={7} color="#b8d6ae" />
      <group position={[0, .12, 0]}>
        {visible.map(({ album, offset }) => (
          <VinylMesh key={album.id} album={album} offset={offset} reducedMotion={reducedMotion}
            onSelect={() => onSelect(album)} onOpen={() => onOpen(album)} />
        ))}
      </group>
      <RoundedBox args={[6.8, .14, 1.5]} radius={.035} smoothness={2} position={[0, -.73, -.22]} receiveShadow>
        <meshStandardMaterial color="#4a3020" roughness={.92} />
      </RoundedBox>
      <ContactShadows position={[0, -.65, .05]} opacity={.62} scale={7} blur={2.7} far={3} resolution={256} frames={1} />
      <AdaptiveDpr pixelated />
    </>
  );
}

export function CollectionThreeStage({ albums, selectedAlbumId, onSelectAlbum, onOpenAlbumDetail }: CollectionThreeStageProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const gesture = useRef({ x: 0, y: 0 });
  const visibleAlbums = albums.slice(0, 12);
  const selectedIndex = Math.max(0, visibleAlbums.findIndex(album => album.id === selectedAlbumId));
  const selectedAlbum = visibleAlbums[selectedIndex] || visibleAlbums[0];
  const supported = platformService.viewport.supportsWebGL();

  if (!selectedAlbum || !supported) return null;

  const selectAt = (index: number) => {
    const next = visibleAlbums[Math.max(0, Math.min(visibleAlbums.length - 1, index))];
    if (next) onSelectAlbum?.(next.id);
  };

  return (
    <section className="ct-three-stage" aria-label="三维唱片陈列"
      onPointerDown={event => { gesture.current = { x: event.clientX, y: event.clientY }; }}
      onPointerUp={event => {
        const dx = event.clientX - gesture.current.x;
        const dy = event.clientY - gesture.current.y;
        if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) selectAt(selectedIndex + (dx < 0 ? 1 : -1));
      }}>
      <ThreeStageBoundary>
        <div className="ct-three-stage__canvas" aria-hidden="true">
          <Canvas camera={{ position: [0, .15, 4.25], fov: 34 }} dpr={[1, 1.5]} shadows gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            frameloop="demand">
            <Suspense fallback={null}>
              <ThreeShelfScene albums={visibleAlbums} selectedIndex={selectedIndex} reducedMotion={reducedMotion}
                onSelect={album => onSelectAlbum?.(album.id)} onOpen={onOpenAlbumDetail} />
            </Suspense>
          </Canvas>
        </div>
      </ThreeStageBoundary>
      <div className="ct-three-stage__controls">
        <button type="button" onClick={() => selectAt(selectedIndex - 1)} disabled={selectedIndex === 0} aria-label="上一张唱片"><ChevronLeft /></button>
        <button type="button" className="ct-three-stage__focus" onClick={() => onOpenAlbumDetail(selectedAlbum)}>
          <strong>{selectedAlbum.title}</strong><span>{selectedAlbum.artist} · 查看专辑</span>
        </button>
        <button type="button" onClick={() => selectAt(selectedIndex + 1)} disabled={selectedIndex === visibleAlbums.length - 1} aria-label="下一张唱片"><ChevronRight /></button>
      </div>
    </section>
  );
}
