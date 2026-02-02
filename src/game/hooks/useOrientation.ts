/**
 * useOrientation Hook
 * Detects portrait vs landscape orientation based on window dimensions.
 * Re-evaluates on resize and orientation change events.
 */

import { useEffect, useState } from "react";

export type Orientation = "portrait" | "landscape";

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(() =>
    typeof window !== "undefined" && window.innerWidth > window.innerHeight
      ? "landscape"
      : "portrait"
  );

  useEffect(() => {
    const update = () => {
      setOrientation(window.innerWidth > window.innerHeight ? "landscape" : "portrait");
    };

    const handleOrientationChange = () => {
      // Delay to let the browser finish rotating
      setTimeout(update, 100);
    };

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  return orientation;
}
