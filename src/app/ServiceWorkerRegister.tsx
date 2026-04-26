"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const cacheLoadedResources = () => {
      try {
        const ctrl = navigator.serviceWorker.controller;
        if (!ctrl) return;
        const entries = performance.getEntriesByType(
          "resource"
        ) as PerformanceResourceTiming[];
        const urls = entries
          .map((e) => e.name)
          .filter((u) => {
            try {
              const parsed = new URL(u);
              if (parsed.origin !== window.location.origin) return false;
              // Only cache static assets
              return (
                /\/_next\//.test(parsed.pathname) ||
                /\.(?:js|css|woff2?|ttf|svg|png|jpg|jpeg|webp|mpeg|mp3|wav|ogg|ico)$/i.test(
                  parsed.pathname
                )
              );
            } catch {
              return false;
            }
          });
        if (urls.length > 0) {
          ctrl.postMessage({ type: "CACHE_URLS", urls });
        }
      } catch {
        // ignore
      }
    };

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });
        // After registration, ask SW to cache everything the page loaded.
        // Wait until controller is available so messages reach the SW.
        if (navigator.serviceWorker.controller) {
          cacheLoadedResources();
        } else {
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => {
              // Once controlled, cache the loaded resources
              cacheLoadedResources();
            },
            { once: true }
          );
        }
      } catch {
        // Silent failure — app still works online
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);
  return null;
}
