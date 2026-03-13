import React, { useRef, useEffect, useCallback, forwardRef } from "react";
import { Link, LinkProps } from "react-router-dom";

// Map route paths to dynamic import functions used by React.lazy in App.tsx
const routePrefetchers: Record<string, () => Promise<unknown>> = {
  "/": () => import("../../pages/public/HomePage").then((m) => m.HomePage),
  "/packages": () =>
    import("../../pages/public/PackagesPage").then((m) => m.PackagesPage),
  "/about": () =>
    import("../../pages/public/AboutPage").then((m) => m.AboutPage),
  "/contact": () =>
    import("../../pages/public/ContactPage").then((m) => m.ContactPage),
};

interface PrefetchLinkProps extends LinkProps {
  prefetchEnabled?: boolean; // enable/disable our custom chunk prefetch
  prefetchOn?: "hover" | "focus" | "viewport" | "immediate";
}

/**
 * PrefetchLink triggers dynamic import of the target route chunk before navigation
 * to reduce user-perceived latency. Keeps overhead low by allowing strategies.
 */
export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  (
    { prefetchEnabled = true, prefetchOn = "hover", to, ...rest },
    externalRef,
  ) => {
    const hasPrefetchedRef = useRef(false);
    const linkRef = useRef<HTMLAnchorElement | null>(null);

    const mergedRef = useCallback(
      (node: HTMLAnchorElement | null) => {
        linkRef.current = node;
        if (typeof externalRef === "function") externalRef(node);
        else if (externalRef)
          (
            externalRef as React.MutableRefObject<HTMLAnchorElement | null>
          ).current = node;
      },
      [externalRef],
    );

    const doPrefetch = () => {
      if (!prefetchEnabled || hasPrefetchedRef.current) return;
      const path =
        typeof to === "string" ? to.split("?")[0] : to.pathname || "";
      const fn = routePrefetchers[path];
      if (fn) {
        fn().catch(() => {
          /* swallow prefetch errors */
        });
        hasPrefetchedRef.current = true;
      }
    };

    useEffect(() => {
      if (prefetchOn === "immediate") doPrefetch();
      if (prefetchOn === "viewport" && linkRef.current) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                doPrefetch();
                observer.disconnect();
              }
            });
          },
          { rootMargin: "150px" },
        );
        observer.observe(linkRef.current);
        return () => observer.disconnect();
      }
    }, [prefetchOn]);

    return (
      <Link
        ref={mergedRef}
        to={to}
        onMouseEnter={prefetchOn === "hover" ? doPrefetch : rest.onMouseEnter}
        onFocus={prefetchOn === "focus" ? doPrefetch : rest.onFocus}
        {...rest}
      />
    );
  },
);

PrefetchLink.displayName = "PrefetchLink";

export default PrefetchLink;
