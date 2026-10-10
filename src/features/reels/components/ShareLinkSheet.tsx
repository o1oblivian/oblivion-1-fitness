import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Mail, MessageCircle, MessageSquare, Send, X } from 'lucide-react';
import { copyText } from '../../log/publicShare';
import { tactileEngine } from '../../../services/tactileEngine';

export interface ShareLinkTarget {
  title: string;
  url: string;
  text?: string;
}

interface ShareLinkSheetProps {
  link: ShareLinkTarget | null;
  onClose: () => void;
}

interface ShareChannel {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: (url: string, text: string, title: string) => string;
}

const enc = encodeURIComponent;

const CHANNELS: ShareChannel[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={20} />, href: (url, text) => `https://wa.me/?text=${enc(`${text} ${url}`)}` },
  { id: 'sms', label: 'Messages', icon: <MessageSquare size={20} />, href: (url, text) => `sms:?&body=${enc(`${text} ${url}`)}` },
  { id: 'email', label: 'Email', icon: <Mail size={20} />, href: (url, text, title) => `mailto:?subject=${enc(title)}&body=${enc(`${text}\n${url}`)}` },
  { id: 'telegram', label: 'Telegram', icon: <Send size={20} />, href: (url, text) => `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
  { id: 'x', label: 'X', icon: <span className="text-[17px] font-bold leading-none">𝕏</span>, href: (url, text) => `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
  { id: 'facebook', label: 'Facebook', icon: <span className="text-[18px] font-bold leading-none">f</span>, href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
];

function openChannel(href: string) {
  if (href.startsWith('sms:') || href.startsWith('mailto:')) {
    window.location.href = href;
    return;
  }
  window.open(href, '_blank', 'noopener,noreferrer');
}

/** Share options for devices without a system share sheet (e.g. web over plain HTTP). */
export const ShareLinkSheet: React.FC<ShareLinkSheetProps> = ({ link, onClose }) => {
  const fieldRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [link]);

  if (!link) return null;
  const text = link.text || link.title;

  const copy = async () => {
    tactileEngine.triggerLightTick();
    if (await copyText(link.url)) {
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

        <div className="mt-2 grid grid-cols-4 gap-2">
          {CHANNELS.map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                openChannel(channel.href(link.url, text, link.title));
                onClose();
              }}
              className="flex flex-col items-center gap-1.5 rounded-xl py-2 active:scale-[0.97]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1A1A] text-[#EAE8DF]">{channel.icon}</span>
              <span className="text-[11px] text-[#8A887F]">{channel.label}</span>
            </button>
          ))}
          <button type="button" onClick={() => void copy()} className="flex flex-col items-center gap-1.5 rounded-xl py-2 active:scale-[0.97]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1A1A] text-[#EAE8DF]">
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </span>
            <span className="text-[11px] text-[#8A887F]">{copied ? 'Copied' : 'Copy link'}</span>
          </button>
        </div>

        <input
          ref={fieldRef}
          readOnly
          value={link.url}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-3 h-[44px] w-full rounded-xl border border-[#1F1F1F] bg-black px-3 text-[12px] text-[#8A887F] outline-none focus:border-[#C4121A]"
          aria-label="Link"
        />
      </div>
    </div>
  );
};
