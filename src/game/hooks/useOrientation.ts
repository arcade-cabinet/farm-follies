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
      setOrientation(
        window.innerWidth > window.innerHeight ? "landscape" : "portrait"
      );
    };

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", () => {
      // Delay to let the browser finish rotating
      setTimeout(update, 100);
    });

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return orientation;
}
