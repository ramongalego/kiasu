'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const emptySubscribe = () => () => {};

export function AdUnit() {
  const pushed = useRef(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet or ad blocker active
    }
  }, []);

  if (!mounted) return null;

  return (
    <aside aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-6060398577686624"
        data-ad-slot="8409043137"
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
