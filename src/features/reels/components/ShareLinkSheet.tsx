import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { copyText } from '../../log/publicShare';
import { tactileEngine } from '../../../services/tactileEngine';

export interface ShareLinkTarget {
  title: string;
  url: string;
}

interface ShareLinkSheetProps {
  link: ShareLinkTarget | null;
  onClose: () => void;
}

/** Shown when the device has no share sheet and automatic copy was refused, so the link is never lost. */
export const ShareLinkSheet: React.FC<ShareLinkSheetProps> = ({ link, onClose }) => {
  const fieldRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
    if (link) requestAnimationFrame(() => fieldRef.current?.select());
  }, [link]);

  if (!link) return null;

  const copy = async () => {
    tactileEngine.triggerLightTick();
    const ok = await copyText(link.url);
    if (ok) {
      setCopied(true);
      return;
    }
    fieldRef.current?.focus();
    fieldRef.current?.select();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`Share ${link.title}`}
        className="w-full max-w-xl rounded-t-2xl border-t border-[#1F1F1F] bg-[#0E0E0E] p-4 pb-safe text-[#EAE8DF] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="truncate text-[14px] font-semibold">Share {link.title}</p>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center text-[#8A887F]" aria-label="Close share">
            <X size={20} />
          </button>
        </div>
        <input
          ref={fieldRef}
          readOnly
          value={link.url}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-1 h-[44px] w-full rounded-xl border border-[#1F1F1F] bg-black px-3 text-[13px] outline-none focus:border-[#C4121A]"
          aria-label="Link"
        />
        <button
          type="button"
          onClick={() => void copy()}
          className="mt-3 flex h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white text-[13px] font-semibold text-neutral-950 active:scale-[0.98]"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        {!copied ? <p className="mt-2 text-center text-[11px] text-[#8A887F]">If copy is blocked, press and hold the link to copy it.</p> : null}
      </div>
    </div>
  );
};
