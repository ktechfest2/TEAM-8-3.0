"use client";

import { useState } from "react";

/** A block of commands with a button that copies them. */
export function CopyBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the text can still be selected by hand */
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ln bg-sf">
      <div className="flex items-center justify-between border-b border-ln py-1.5 pl-4 pr-1.5">
        <span className="text-xs font-medium text-mu">Terminal</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="min-h-9 cursor-pointer rounded-full px-3.5 text-sm font-semibold text-gr hover:bg-gl"
          aria-live="polite"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13.5px] leading-relaxed text-tx">
        <code>{children}</code>
      </pre>
    </div>
  );
}
