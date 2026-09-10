import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { TonearmDefinitions } from './TonearmDefinitions';

export interface TonearmProps {
  /** Whether the turntable is actively playing */
  isPlaying: boolean;
  /** Optional playback progress (0-100) to track across record grooves */
  progressPercent?: number;
  /** Additional CSS class names */
  className?: string;
  /** Base scale height in pixels (default: 280) */
  size?: number;
  /** Optional callback when the tonearm is clicked to toggle play/pause */
  onTogglePlay?: () => void;
}

/**
 * High-precision, authentic analog turntable tonearm and rest stand (唱针与休止支架).
 *
 * Engineering Details:
 * 1. 唱针休止支架 (Tonearm Rest Stand):
 *    - Placed with precision on the right side of the platter deck at (104, 188)
 *    - Volumetric 3D construction: beveled plinth flange with bolt rivets, cylindrical
 *      anodized chrome pillar, cueing elevator rail, neoprene U-saddle notch, and safety latch clip
 *    - Deep directional plinth drop-shadow for pronounced tactile relief and elevation (立体感)
 *
 * 2. 万向旋转基座 & 唱臂 (Gimbal Pivot & Rotating Arm):
 *    - Gimbal pivot located at (104, 44) with counterweight extending rear-right
 *    - CSS `transform-origin: 104px 44px` and `transform-box: view-box`
 *    - Rotates counter-clockwise from cradle rest (0°) to record grooves (-17.5° to -27.5°)
 *    - When playing, swings gracefully over the vinyl disc with elevated drop-shadows onto the grooves
 *    - Haptic tactile feedback on cueing needle drop & lift
 */
export const Tonearm: React.FC<TonearmProps> = ({
  isPlaying,
  progressPercent = 0,
  className = '',
  size = 280,
  onTogglePlay,
}) => {
  const prevPlayingRef = useRef<boolean>(isPlaying);

  // Trigger tactile haptic feedback when tonearm lands on or lifts from the vinyl groove
  useEffect(() => {
    if (prevPlayingRef.current !== isPlaying) {
      if (isPlaying) {
        // Needle drops down onto the spinning vinyl record groove
        const timer = setTimeout(() => {
          audioEngine.triggerHaptic('medium');
        }, 360);
        return () => clearTimeout(timer);
      } else {
        // Needle lifts up from the groove to park on the cradle rest
        audioEngine.triggerHaptic('light');
      }
      prevPlayingRef.current = isPlaying;
    }
  }, [isPlaying]);

  // Angular Kinematics (Pivot center at 104, 44):
  // Parked position on cradle stand: 0 degrees (vertical straight down along x = 104 on right deck)
  // Playing positions: Swings clockwise (+20.5° to +33.0°), smoothly extending left onto the vinyl record grooves
  // Lead-in outer groove: +20.5 degrees | Lead-out inner groove: +33.0 degrees
  const restAngle = 0;
  const leadInAngle = 20.5;
  const leadOutAngle = 33.0;
  const clampedProgress = Math.min(100, Math.max(0, progressPercent));
  const activeGrooveAngle =
    leadInAngle + (clampedProgress / 100) * (leadOutAngle - leadInAngle);

  const targetAngle = isPlaying ? activeGrooveAngle : restAngle;

  const handleArmClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePlay) {
      onTogglePlay();
    }
  };

  // Dimensions based on 150 x 290 coordinate bounding box (Aspect ratio ≈ 1 : 1.933)
  const scale = size / 280;
  const width = Math.round(150 * scale);
  const height = Math.round(290 * scale);

  return (
    <div
      id="tonearm-component"
      className={`absolute right-0 top-0 z-20 select-none pointer-events-none ${className}`}
      style={{
        width,
        height,
      }}
    >
      <svg
        viewBox="0 0 150 290"
        className="w-full h-full overflow-visible pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <TonearmDefinitions />

        {/* =====================================================================
            LAYER 1: FIXED ELEMENTS ON PLINTH (唱针支架 & 万向轴承底座)
            Permanently mounted on the right deck, behind the tonearm
            ===================================================================== */}

        {/* --- A. 唱针休止支架 (TONEARM REST CRADLE STAND) ---
            Precisely positioned on the right side of the platter deck at (104, 188).
            When parked (0°), the tonearm wand nests directly inside the U-saddle.
        */}
        <g id="tonearm-cradle-stand" filter="url(#cradle-deep-shadow)">
          {/* 1. Deep Ambient Contact Shadow on Plinth Deck */}
          <ellipse cx="101" cy="201" rx="15" ry="5.5" fill="#000000" opacity="0.8" />

          {/* 2. Heavy Machined Plinth Mounting Base Plate (法兰盘底盘) */}
          <ellipse
            cx="104"
            cy="196"
            rx="14"
            ry="6"
            fill="url(#plinth-flange-grad)"
            stroke="#4A4C5C"
            strokeWidth="1.2"
          />
          {/* Inner Recessed Disc with Chamfer Rim */}
          <ellipse
            cx="104"
            cy="195"
            rx="10.5"
            ry="4.2"
            fill="#121319"
            stroke="#242630"
            strokeWidth="0.8"
          />
          {/* Miniature Plinth Anchor Bolts (Hex Screw Rivets) */}
          <circle cx="96.5" cy="195" r="1" fill="#6A6D7E" />
          <circle cx="104" cy="197" r="1" fill="#6A6D7E" />
          <circle cx="111.5" cy="195" r="1" fill="#6A6D7E" />

          {/* 3. Solid Upright Elevator Column Pillar (实心金属支撑柱) */}
          <rect
            x="101"
            y="171"
            width="6"
            height="24"
            rx="2"
            fill="url(#cradle-pillar-metal)"
            stroke="#16171E"
            strokeWidth="0.8"
          />

          {/* 4. Height Adjustment Knurled Collar (高度微调环) */}
          <rect
            x="99"
            y="183"
            width="10"
            height="3.5"
            rx="1"
            fill="url(#collar-knurl-grad)"
            stroke="#23242E"
            strokeWidth="0.8"
          />

          {/* 5. Curved Cueing Lift Arc Platform (提臂升降滑轨弧板) */}
          <path
            d="M 87 178 Q 96 182.5 105 183.5"
            fill="none"
            stroke="#0D0E12"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M 87 177 Q 96 181.5 105 182.5"
            fill="none"
            stroke="url(#cradle-pillar-metal)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          {/* Anti-vibration rubber damper on top of lift arc */}
          <path
            d="M 88 176 Q 96 180.5 104 181.5"
            fill="none"
            stroke="#14151B"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* 6. U-Shaped Rest Saddle Bracket (U型唱臂休止托架) */}
          {/* Cast Metal Bracket Body */}
          <path
            d="M 95 168 C 95 178.5, 113 178.5, 113 168"
            fill="none"
            stroke="url(#cradle-bracket-grad)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Soft Silicone/Neoprene Shock-Absorbing Rest Saddle Notch */}
          <path
            d="M 96.5 169 C 96.5 177, 111.5 177, 111.5 169"
            fill="none"
            stroke="#090A0D"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* 7. Safety Locking Clamp Latch (支架安全卡扣) */}
          {isPlaying ? (
            /* Latch Open: Swung outward to the right when tonearm is playing */
            <g id="latch-open">
              <path
                d="M 113 167 Q 119 161 123 165"
                fill="none"
                stroke="#5E6174"
                strokeWidth="1.8"
                strokeLinecap="round"
                style={{ transition: 'all 0.4s ease' }}
              />
              <circle cx="113" cy="167" r="1.4" fill="#B0B3C4" />
            </g>
          ) : (
            /* Latch Closed: Clamped gently over the parked tonearm wand */
            <g id="latch-closed">
              <path
                d="M 113 167 Q 108 159 101 161"
                fill="none"
                stroke="#707386"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ transition: 'all 0.4s ease' }}
              />
              <circle cx="113" cy="167" r="1.4" fill="#E0E2EE" />
            </g>
          )}

          {/* 8. Micro Status Indicator LED on Pillar Base */}
          <circle
            cx="104"
            cy="193"
            r="1.4"
            fill="#2FE92B"
            opacity={isPlaying ? 0.35 : 0.95}
            filter={!isPlaying ? 'drop-shadow(0 0 3px #2FE92B)' : undefined}
          />
        </g>

        {/* --- B. 万向轴承固定底座 (GIMBAL MOUNTING PLATFORM AT TOP-RIGHT) ---
            Fixed to plinth deck at (104, 44)
        */}
        <g id="gimbal-fixed-deck-mount">
          {/* Deep gimbal ambient shadow */}
          <circle cx="102" cy="46" r="25" fill="#000000" opacity="0.65" />

          {/* Outer Plinth Gimbal Bezel Ring */}
          <circle
            cx="104"
            cy="44"
            r="24"
            fill="url(#gimbal-base-radial)"
            stroke="#383A49"
            strokeWidth="1.8"
          />
          {/* Inner Precision Track Ring */}
          <circle
            cx="104"
            cy="44"
            r="19"
            fill="#0F1014"
            stroke="#21222C"
            strokeWidth="1.2"
          />

          {/* Lateral Anti-Skating Calibration Dial on Plinth */}
          <circle cx="83" cy="56" r="5" fill="#181921" stroke="#3D4050" strokeWidth="1.2" />
          <circle cx="83" cy="56" r="2" fill="#2A2C38" />
          <line x1="83" y1="53" x2="83" y2="58" stroke="#2FE92B" strokeWidth="1.2" opacity="0.75" />
        </g>

        {/* =====================================================================
            LAYER 2: ROTATING TONEARM ASSEMBLY (唱臂、配重、唱头与钻石唱针)
            Rotates around pivot (104, 44) using CSS transform-origin and transform
            ===================================================================== */}
        <g
          id="tonearm-rotating-arm"
          onClick={handleArmClick}
          className="pointer-events-auto cursor-pointer group"
          style={{
            transformBox: 'view-box',
            transformOrigin: '104px 44px',
            transform: `rotate(${targetAngle}deg) ${
              isPlaying ? 'scale(1)' : 'scale(1.025) translateY(-2px)'
            }`,
            transition: 'transform 0.65s cubic-bezier(0.25, 1, 0.35, 1)',
            filter: isPlaying
              ? 'drop-shadow(-6px 12px 14px rgba(0,0,0,0.92)) drop-shadow(-2px 4px 6px rgba(0,0,0,0.8))'
              : 'drop-shadow(-4px 8px 10px rgba(0,0,0,0.7))',
          }}
        >
          <title>点击起落黑胶唱针 (播放 / 暂停)</title>
          {/* 1. REAR EXTENSION STUB (Extends backward into top-right plinth corner) */}
          <line
            x1="104"
            y1="44"
            x2="124"
            y2="18"
            stroke="#1C1D24"
            strokeWidth="5.5"
            strokeLinecap="round"
          />

          {/* 2. HEAVY MACHINED COUNTERWEIGHT (配重坨 - Top-Right Corner) */}
          <g transform="rotate(-38 124 18)">
            {/* Weight Cylinder Body */}
            <rect
              x="114"
              y="9"
              width="21"
              height="18"
              rx="3"
              fill="url(#counterweight-grad)"
              stroke="#434555"
              strokeWidth="1.3"
            />
            {/* Knurled Grip Texture on Rear Edge */}
            <line x1="131" y1="10" x2="131" y2="26" stroke="#16171E" strokeWidth="1.5" />
            <line x1="133" y1="10" x2="133" y2="26" stroke="#252732" strokeWidth="1" />
            {/* Tracking Force Graduation Scale Ring */}
            <line
              x1="117"
              y1="9"
              x2="117"
              y2="27"
              stroke="#2FE92B"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Zero-Balance Index Markings */}
            <line x1="120" y1="12" x2="120" y2="15" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
            <line x1="120" y1="21" x2="120" y2="24" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
          </g>

          {/* 3. GIMBAL HOUSING & JEWEL BEARING (万向轴承球罩 - 104, 44) */}
          <circle cx="104" cy="44" r="11.5" fill="#1C1E26" stroke="#4C4F62" strokeWidth="1.6" />
          <circle cx="104" cy="44" r="7" fill="#101116" stroke="#2B2D3A" strokeWidth="1.2" />
          {/* Precision Jewel Bearing Screw Center */}
          <circle
            cx="104"
            cy="44"
            r="2.5"
            fill={isPlaying ? '#2FE92B' : '#FFFFFF'}
            opacity={isPlaying ? 1 : 0.75}
            filter={isPlaying ? 'drop-shadow(0 0 3px #2FE92B)' : undefined}
          />
          <line x1="102" y1="44" x2="106" y2="44" stroke="#0D0E12" strokeWidth="0.8" />

          {/* 4. CUEING LIFT LEVER (提臂手柄 - Flips down during play) */}
          <line
            x1="93"
            y1="47"
            x2="87"
            y2={isPlaying ? '55' : '49'}
            stroke="#686B7E"
            strokeWidth="2.2"
            strokeLinecap="round"
            style={{ transition: 'all 0.35s ease' }}
          />
          <circle
            cx="87"
            cy={isPlaying ? '55' : '49'}
            r="1.4"
            fill="#B8BACB"
            style={{ transition: 'all 0.35s ease' }}
          />

          {/* 5. METALLIC TONEARM WAND TUBE (唱臂金属直管)
              Connects gimbal pivot (104, 44) down to headshell collar (104, 224).
              When parked (0°), it nests cleanly inside the cradle rest at (104, 188).
          */}
          {/* Deep Wand Shadow Core */}
          <line
            x1="104"
            y1="44"
            x2="104"
            y2="224"
            stroke="#0D0E12"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {/* Main Cylindrical Metallic Tube */}
          <line
            x1="104"
            y1="44"
            x2="104"
            y2="224"
            stroke="url(#wand-metallic-tube)"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          {/* Primary High-Gloss Specular Highlight Sheen */}
          <line
            x1="103.2"
            y1="44"
            x2="103.2"
            y2="224"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          {/* Secondary Soft Reflection Sheen */}
          <line
            x1="104.7"
            y1="44"
            x2="104.7"
            y2="224"
            stroke="rgba(190,200,230,0.25)"
            strokeWidth="0.6"
            strokeLinecap="round"
          />

          {/* 6. COUPLING COLLAR (唱头锁紧套筒 - 104, 224) */}
          <circle cx="104" cy="224" r="4.2" fill="#282A36" stroke="#121319" strokeWidth="1.2" />
          <line x1="101" y1="224" x2="107" y2="224" stroke="#2FE92B" strokeWidth="1.2" opacity="0.85" />

          {/* 7. CARTRIDGE HEADSHELL & DIAMOND STYLUS (唱头架与唱针组件)
              Vibrates subtly during playback to simulate groove friction
          */}
          <g
            id="cartridge-needle-assembly"
            className={isPlaying ? 'animate-needle-vibrate' : ''}
          >
            {/* Aerodynamic Concorde Integrated Headshell Body */}
            <path
              d="M 101 225 L 98 243 L 93 256 L 96 260 L 99 260 L 105 242 L 108 224 Z"
              fill="url(#cartridge-grad)"
              stroke="#383A4A"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* Headshell Neon Green Brand Accent Stripe */}
            <line
              x1="103.5"
              y1="230"
              x2="97.5"
              y2="251"
              stroke="#2FE92B"
              strokeWidth="2"
              strokeLinecap="round"
              filter={isPlaying ? 'drop-shadow(0 0 3px #2FE92B)' : undefined}
            />

            {/* Finger Lift Cue Hook (提针指钩 - Extends to the right) */}
            <path
              d="M 106 233 Q 117 231 116 240"
              fill="none"
              stroke="#6C6F82"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="116" cy="240" r="1.3" fill="#C2C5D6" />

            {/* Stylus Cantilever (精密钻石针杆) */}
            <line
              x1="97.5"
              y1="257"
              x2="97.5"
              y2="262.5"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Diamond Stylus Needle Tip (钻石针尖) */}
            <circle cx="97.5" cy="263" r="1.5" fill="#FFFFFF" />

            {/* Active Vinyl Groove Contact Light & Reflection */}
            {isPlaying && (
              <g id="stylus-groove-glow">
                {/* Needle Tip Radiant Contact Point */}
                <circle
                  cx="97.5"
                  cy="263"
                  r="3.5"
                  fill="#2FE92B"
                  opacity="0.95"
                  className="animate-stylus-glow"
                  filter="url(#stylus-groove-glow-filter)"
                />
                {/* Surface Reflection Pool on Glossy Vinyl Grooves */}
                <ellipse
                  cx="97.5"
                  cy="265"
                  rx="7"
                  ry="2.6"
                  fill="#2FE92B"
                  opacity="0.45"
                  filter="url(#stylus-groove-glow-filter)"
                />
              </g>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
};

export default Tonearm;
