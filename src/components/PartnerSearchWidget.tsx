import React, { useEffect, useState } from "react";

export default function PartnerSearchWidget() {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const scriptId = "ab-embedded-search-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "text/javascript";
      script.src = "https://app.applyboard.com/assets/embedded_search.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto my-4 px-4">
      {/* Embedded ApplyBoard container - zero forced height so no blank gaps */}
      <div
        id="ab-embedded-search"
        data-host="https://app.applyboard.com"
        data-rp-ref="94595"
        data-orientation="vertical"
        data-default-countries=""
        className="w-full"
      />

      {/* Fallback & Fast CTA card if iframe has not injected */}
      {!scriptLoaded && (
        <div className="p-6 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">
            Official Partner Desk
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Explore 1,500+ Partner Universities
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Search programs, verify eligibility criteria, and submit applications directly with partner fee-waiver benefits.
          </p>
          <a
            href="https://app.applyboard.com/partners/2369466/invite-student"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
          >
            Open Partner Application Portal &rarr;
          </a>
        </div>
      )}
    </div>
  );
}