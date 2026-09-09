import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Album } from '../types';
import { audioEngine } from '../services/audioEngine';
import { getVinylAppearance, VinylAppearance } from '../utils/vinylAppearance';

interface ThreeUIVinylShelfProps {
  items: Album[];
  page: number;
  onPageChange: (page: number) => void;
  onOpenAlbumDetail: (album: Album) => void;
}

const PAGE_SIZE = 6;

const createVinylPattern = ({ variant, colors }: VinylAppearance) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const [a, b, c] = colors;
  context.translate(256, 256);
  context.beginPath(); context.arc(0, 0, 252, 0, Math.PI * 2); context.clip();
  context.fillStyle = variant === 'black' ? '#0a0a0c' : a;
  context.fillRect(-256, -256, 512, 512);
  if (variant === 'clear' || variant === 'translucent') {
    context.globalAlpha = variant === 'clear' ? .32 : .7;
    context.fillStyle = a; context.fillRect(-256, -256, 512, 512); context.globalAlpha = 1;
  } else if (variant === 'split') {
    context.fillStyle = b; context.fillRect(0, -256, 256, 512);
  } else if (variant === 'marble') {
    context.lineCap = 'round';
    [[b, 34, -80], [c, 22, 55], [b, 13, 118]].forEach(([color, width, offset]) => {
      context.strokeStyle = color as string; context.globalAlpha = .55; context.lineWidth = width as number;
      context.beginPath(); context.moveTo(-290, offset as number); context.bezierCurveTo(-120, (offset as number) - 110, 85, (offset as number) + 120, 290, (offset as number) - 35); context.stroke();
    });
    context.globalAlpha = 1;
  } else if (variant === 'splatter') {
    const dots = [[-112,-98,16], [104,-72,23], [-63,121,29], [139,110,14], [-154,35,11], [44,58,9], [24,-155,13]];
    dots.forEach(([x, y, radius], index) => { context.fillStyle = index % 2 ? b : c; context.globalAlpha = .68; context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill(); });
    context.globalAlpha = 1;
  } else if (variant === 'liquid') {
    context.fillStyle = b; context.globalAlpha = .48; context.beginPath(); context.ellipse(82, -64, 150, 92, -.45, 0, Math.PI * 2); context.fill();
    context.fillStyle = c; context.globalAlpha = .56; context.beginPath(); context.ellipse(-75, 108, 175, 80, .28, 0, Math.PI * 2); context.fill(); context.globalAlpha = 1;
  }
  return canvas;
};

type ShelfGroup = THREE.Group & {
  userData: {
    album: Album;
    homePosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    targetScale: number;
    coverMaterial: THREE.MeshStandardMaterial;
    bodyMaterial: THREE.MeshStandardMaterial;
  };
};

export const ThreeUIVinylShelf: React.FC<ThreeUIVinylShelfProps> = ({
  items,
  page,
  onPageChange,
  onOpenAlbumDetail,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ onOpenAlbumDetail, page, onPageChange });
  propsRef.current = { onOpenAlbumDetail, page, onPageChange };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let disposed = false;
    let frame = 0;
    let hovered: ShelfGroup | null = null;
    let pressed: ShelfGroup | null = null;
    let openTimer = 0;
    let pointerDown = { x: 0, y: 0 };
    let pointer = { x: 0, y: 0 };
    let dragging = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pageItems = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070402, 0.038);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.set(0, -0.08, 11.2);
    camera.lookAt(0, -0.05, 0);

    scene.add(new THREE.HemisphereLight(0xd8d3c8, 0x100906, 1.38));
    const keyLight = new THREE.SpotLight(0xffc38f, 58, 20, Math.PI * 0.28, 0.72, 1.7);
    keyLight.position.set(-1.8, 5.5, 6.8);
    keyLight.target.position.set(0, 0, 0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight, keyLight.target);
    const rimLight = new THREE.PointLight(0xe0a06c, 12, 13, 2);
    rimLight.position.set(3.2, 1.5, 3.4);
    scene.add(rimLight);

    const stage = new THREE.Group();
    stage.rotation.x = -0.015;
    scene.add(stage);

    const materialLoader = new THREE.TextureLoader();
    materialLoader.setCrossOrigin('anonymous');
    const woodTexture = materialLoader.load('/assets/vinyl/shelf-dark-wood.webp');
    woodTexture.colorSpace = THREE.SRGBColorSpace;
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(1.35, 3.1);
    const shelfWoodTexture = woodTexture.clone();
    shelfWoodTexture.needsUpdate = true;
    shelfWoodTexture.repeat.set(1.35, .62);
    const vinylTexture = materialLoader.load('/assets/vinyl/vinyl-texture.webp');
    vinylTexture.colorSpace = THREE.SRGBColorSpace;

    const backPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.35, 6.2),
      new THREE.MeshStandardMaterial({ map: woodTexture, color: 0x82756e, roughness: 0.9, metalness: 0.01 })
    );
    backPanel.position.set(0, -0.15, -0.82);
    backPanel.receiveShadow = true;
    stage.add(backPanel);

    const shelfMaterial = new THREE.MeshStandardMaterial({ map: shelfWoodTexture, color: 0x8a7770, roughness: 0.76, metalness: 0.02 });
    const shelfEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x9a6241, emissive: 0x321208, emissiveIntensity: 0.32, roughness: 0.55, metalness: 0.04 });
    const shelfGeometry = new THREE.BoxGeometry(3.35, 0.13, 0.72);
    const edgeGeometry = new THREE.BoxGeometry(3.4, 0.055, 0.11);
    const rowBackGeometry = new THREE.PlaneGeometry(3.18, 1.82);
    const rowBackMaterial = new THREE.MeshBasicMaterial({ map: woodTexture, color: 0xd0c7c2 });
    const dividerGeometry = new THREE.BoxGeometry(0.035, 1.8, 0.12);
    [2.47, .54, -1.39].forEach((y) => {
      const rowBack = new THREE.Mesh(rowBackGeometry, rowBackMaterial);
      rowBack.position.set(0, y, -0.76);
      rowBack.receiveShadow = true;
      stage.add(rowBack);
      const divider = new THREE.Mesh(dividerGeometry, shelfMaterial);
      divider.position.set(0, y, -0.58);
      stage.add(divider);
    });
    [-2.35, -0.42, 1.51, 3.44].forEach((y, shelfIndex) => {
      const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
      shelf.position.set(0, y, -0.34);
      shelf.receiveShadow = true;
      stage.add(shelf);
      const edge = new THREE.Mesh(edgeGeometry, shelfEdgeMaterial);
      edge.position.set(0, y + 0.085, 0.11);
      stage.add(edge);
      const glow = new THREE.PointLight(0xffb071, shelfIndex === 3 ? 2.8 : 5.1, 3.4, 2.2);
      glow.position.set(0, y + 0.34, 1.05);
      stage.add(glow);
    });

    const sideGeometry = new THREE.BoxGeometry(0.12, 6.2, 0.74);
    [-1.67, 1.67].forEach((x) => {
      const side = new THREE.Mesh(sideGeometry, shelfMaterial);
      side.position.set(x, 0.05, -0.34);
      stage.add(side);
    });

    const sleeveGeometry = new THREE.BoxGeometry(1.14, 1.14, 0.07);
    const coverGeometry = new THREE.PlaneGeometry(1.11, 1.11);
    const discGeometry = new THREE.CylinderGeometry(0.59, 0.59, 0.05, 64);
    discGeometry.rotateX(Math.PI / 2);
    const grooveGeometry = new THREE.CircleGeometry(0.575, 64);
    const labelGeometry = new THREE.CircleGeometry(0.16, 48);
    const holeGeometry = new THREE.CircleGeometry(0.018, 20);
    const discMaterial = new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.29, metalness: 0.64 });
    const grooveCanvas = document.createElement('canvas');
    grooveCanvas.width = grooveCanvas.height = 256;
    const grooveContext = grooveCanvas.getContext('2d');
    if (grooveContext) {
      grooveContext.fillStyle = '#08090a';
      grooveContext.fillRect(0, 0, 256, 256);
      for (let radius = 42; radius < 126; radius += 3.2) {
        grooveContext.beginPath();
        grooveContext.arc(128, 128, radius, 0, Math.PI * 2);
        grooveContext.strokeStyle = radius % 7 < 3.2 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.055)';
        grooveContext.lineWidth = 0.7;
        grooveContext.stroke();
      }
      const sheen = grooveContext.createLinearGradient(28, 24, 222, 232);
      sheen.addColorStop(0, 'rgba(255,255,255,.02)');
      sheen.addColorStop(.42, 'rgba(255,255,255,.18)');
      sheen.addColorStop(.55, 'rgba(255,255,255,.025)');
      sheen.addColorStop(1, 'rgba(255,255,255,.09)');
      grooveContext.fillStyle = sheen;
      grooveContext.fillRect(0, 0, 256, 256);
    }
    const grooveTexture = new THREE.CanvasTexture(grooveCanvas);
    grooveTexture.colorSpace = THREE.SRGBColorSpace;
    const grooveMaterial = new THREE.MeshStandardMaterial({ map: vinylTexture, transparent: true, opacity: .34, roughness: 0.34, metalness: 0.48 });
    const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const groups: ShelfGroup[] = [];
    const clickTargets: THREE.Object3D[] = [];

    pageItems.forEach((album, index) => {
      const appearance = getVinylAppearance(album);
      const col = index % 2;
      const row = Math.floor(index / 2);
      const group = new THREE.Group() as ShelfGroup;
      const x = (col - 0.5) * 1.64 + (row % 2 ? 0.025 : -0.015);
      const y = 2.18 - row * 1.93;
      const z = (col === 1 ? 0.07 : 0) + row * 0.018;
      const homePosition = new THREE.Vector3(x, y, z);
      group.position.copy(homePosition);
      group.rotation.set(0, (col - 0.5) * -0.08, (col - 0.5) * 0.018);

      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x171719, roughness: 0.78, metalness: 0.02 });
      const sleeve = new THREE.Mesh(sleeveGeometry, bodyMaterial);
      sleeve.castShadow = true;
      sleeve.userData.albumGroup = group;
      group.add(sleeve);

      const coverMaterial = new THREE.MeshStandardMaterial({ color: 0x727272, roughness: 0.72, metalness: 0.01 });
      const cover = new THREE.Mesh(coverGeometry, coverMaterial);
      cover.position.z = 0.041;
      cover.userData.albumGroup = group;
      group.add(cover);
      loader.load(album.coverUrl, (texture) => {
        if (disposed) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        coverMaterial.map = texture;
        coverMaterial.color.set(0xffffff);
        coverMaterial.needsUpdate = true;
      });

      const disc = new THREE.Mesh(discGeometry, discMaterial);
      disc.position.set(0.31, 0, -0.052);
      disc.castShadow = true;
      disc.userData.albumGroup = group;
      group.add(disc);
      const variantTexture = new THREE.CanvasTexture(createVinylPattern(appearance));
      variantTexture.colorSpace = THREE.SRGBColorSpace;
      const variantMaterial = new THREE.MeshStandardMaterial({ map: variantTexture, color: 0xffffff, transparent: appearance.variant === 'clear' || appearance.variant === 'translucent', opacity: appearance.variant === 'clear' ? .58 : appearance.variant === 'translucent' ? .82 : 1, roughness: .38, metalness: .28 });
      const variantFace = new THREE.Mesh(grooveGeometry, variantMaterial);
      variantFace.position.set(0.31, 0, -0.021);
      group.add(variantFace);
      if (appearance.variant === 'picture') {
        loader.load(album.coverUrl, (texture) => {
          if (disposed) { texture.dispose(); return; }
          texture.colorSpace = THREE.SRGBColorSpace;
          variantTexture.dispose();
          variantMaterial.map = texture;
          variantMaterial.color.set(0xaaa6a2);
          variantMaterial.needsUpdate = true;
        });
      }
      const grooves = new THREE.Mesh(grooveGeometry, grooveMaterial);
      grooves.position.set(0.31, 0, -0.018);
      group.add(grooves);
      const labelMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(album.color || '#202124'), roughness: 0.68, metalness: 0.02 });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(0.31, 0, -0.015);
      label.rotation.y = Math.PI;
      group.add(label);
      const hole = new THREE.Mesh(holeGeometry, holeMaterial);
      hole.position.set(0.31, 0, -0.013);
      hole.rotation.y = Math.PI;
      group.add(hole);

      group.userData = { album, homePosition, targetPosition: homePosition.clone(), targetScale: 1, coverMaterial, bodyMaterial };
      groups.push(group);
      clickTargets.push(sleeve, cover, disc);
      stage.add(group);
    });

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2(3, 3);
    const updatePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      pointer = { x: event.clientX, y: event.clientY };
    };
    const hitTest = () => {
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(clickTargets, false)[0];
      return (hit?.object.userData.albumGroup as ShelfGroup | undefined) ?? null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      updatePointer(event);
      if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 9) dragging = true;
      const nextHovered = hitTest();
      if (hovered !== nextHovered) {
        hovered = nextHovered;
        canvas.style.cursor = hovered ? 'pointer' : dragging ? 'grabbing' : 'grab';
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      updatePointer(event);
      pointerDown = { x: event.clientX, y: event.clientY };
      pointer = pointerDown;
      dragging = false;
      pressed = hitTest();
      if (pressed) pressed.userData.targetScale = 0.98;
      canvas.setPointerCapture?.(event.pointerId);
    };
    const handlePointerUp = (event: PointerEvent) => {
      const dx = event.clientX - pointerDown.x;
      if (dragging) {
        if (pressed) pressed.userData.targetScale = 1;
        pressed = null;
        if (Math.abs(dx) > 48) {
          const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
          propsRef.current.onPageChange(Math.max(0, Math.min(pages - 1, propsRef.current.page + (dx < 0 ? 1 : -1))));
          audioEngine.triggerHaptic('light');
        }
        return;
      }
      updatePointer(event);
      const hit = hitTest();
      if (!hit) return;
      const album = hit.userData.album;
      hit.userData.targetScale = 1.018;
      pressed = null;
      audioEngine.triggerHaptic('light');
      openTimer = window.setTimeout(() => propsRef.current.onOpenAlbumDetail(album), reducedMotion ? 0 : 140);
    };

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 500 ? 1.5 : 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width <= 430 ? 31 : 29;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let last = performance.now();
    const render = (now: number) => {
      frame = 0;
      if (disposed || document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const speed = reducedMotion ? 1 : Math.min(1, dt * 9.5);
      groups.forEach((group) => {
        group.position.lerp(group.userData.targetPosition, speed);
        const scale = THREE.MathUtils.lerp(group.scale.x, group.userData.targetScale, speed);
        const hoverLift = hovered === group && pressed !== group ? 0.01 : 0;
        group.scale.setScalar(scale + hoverLift);
      });
      const parallaxX = (pointer.x / Math.max(1, window.innerWidth) - 0.5) * 0.08;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, parallaxX, reducedMotion ? 1 : 0.06);
      camera.lookAt(0, -0.05, 0);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    const resume = () => { if (!document.hidden && !frame) { last = performance.now(); frame = requestAnimationFrame(render); } };
    const pause = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
    const visibility = () => document.hidden ? pause() : resume();

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', () => { dragging = false; });
    document.addEventListener('visibilitychange', visibility);
    resume();

    return () => {
      disposed = true;
      window.clearTimeout(openTimer);
      pause();
      observer.disconnect();
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('visibilitychange', visibility);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => {
            const standard = material as THREE.MeshStandardMaterial;
            standard.map?.dispose();
            if (![discMaterial, grooveMaterial, shelfMaterial, shelfEdgeMaterial, holeMaterial].includes(material as never)) material.dispose();
          });
        }
      });
      [shelfGeometry, edgeGeometry, rowBackGeometry, dividerGeometry, sideGeometry, sleeveGeometry, coverGeometry, discGeometry, grooveGeometry, labelGeometry, holeGeometry].forEach((geometry) => geometry.dispose());
      grooveTexture.dispose(); woodTexture.dispose(); shelfWoodTexture.dispose(); vinylTexture.dispose();
      discMaterial.dispose(); grooveMaterial.dispose(); shelfMaterial.dispose(); shelfEdgeMaterial.dispose(); rowBackMaterial.dispose(); holeMaterial.dispose();
      renderer.dispose();
    };
  }, [items, page]);

  return (
    <div ref={hostRef} className="threeui-vinyl-shelf" data-threeui-source="BookshelfScene">
      <canvas ref={canvasRef} aria-label="可交互的 3D 黑胶收藏柜；拖动翻页，点击唱片抽出查看" />
    </div>
  );
};
