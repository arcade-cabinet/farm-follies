/**
 * Menu Background Component
 * Renders orientation-aware background image with a semi-transparent overlay.
 * Covers the full screen behind menu content.
 */

import { useOrientation } from "@/game/hooks/useOrientation";

const BACKGROUNDS = {
  portrait: `${import.meta.env.BASE_URL}assets/images/menu_portrait.png`,
  landscape: `${import.meta.env.BASE_URL}assets/images/menu_landscape.png`,
};

interface MenuBackgroundProps {
  /** Overlay opacity from 0 to 1 (default 0.55) */
  overlayOpacity?: number;
}

export function MenuBackground({ overlayOpacity = 0.55 }: MenuBackgroundProps) {
  const orientation = useOrientation();
  const src = BACKGROUNDS[orientation];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {/* Background image */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {/* Semi-transparent overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      />
    </div>
  );
}
