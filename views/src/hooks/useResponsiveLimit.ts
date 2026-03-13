import { useState, useEffect } from "react";

const MOBILE_LIMIT = 5;
const DESKTOP_LIMIT = 10;
const MQ = "(min-width: 768px)";

export function useResponsiveLimit(): number {
  const [limit, setLimit] = useState<number>(() =>
    typeof window === "undefined"
      ? DESKTOP_LIMIT
      : window.matchMedia(MQ).matches
        ? DESKTOP_LIMIT
        : MOBILE_LIMIT,
  );

  useEffect(() => {
    const mql = window.matchMedia(MQ);
    const handler = (e: MediaQueryListEvent) => {
      setLimit(e.matches ? DESKTOP_LIMIT : MOBILE_LIMIT);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return limit;
}
