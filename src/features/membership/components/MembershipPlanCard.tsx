import React from 'react';
import { Check } from 'lucide-react';
import { IAPProductInfo } from '../../../types/iap';
import { tactileEngine } from '../../../services/tactileEngine';

interface Props {
  product: IAPProductInfo;
  isSelected: boolean;
  onSelect: (productId: string) => void;
}

function badgeTone(badge: string): string {
  const key = badge.toUpperCase();
  if (key.includes('POPULAR') || key.includes('FOUNDER')) return 'text-o1-gold border-o1-gold/40';
  if (key.includes('PRO')) return 'text-o1-teal border-o1-teal/40';
  if (key.includes('ALL')) return 'text-o1-olive border-o1-olive/40';
  return 'text-neutral-300 border-white/[0.14]';
}

export const MembershipPlanCard: React.FC<Props> = ({ product, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => {
        tactileEngine.triggerSelectionBuzz();
        onSelect(product.productId);
      }}
      className={`rounded-2xl p-3 sm:p-3.5 transition-all cursor-pointer relative flex flex-col justify-between border ${
        isSelected
          ? 'bg-o1-well border-white/30'
          : 'bg-o1-card border-white/[0.07] hover:border-white/[0.14]'
      }`}
    >
      <div>
        {/* Top: Badge + Radio Check */}
        <div className="flex items-center justify-between gap-1 mb-1.5 min-h-[22px]">
          {product.badge ? (
            <span
              className={`text-o1-label font-sans font-semibold px-2 py-0.5 rounded-full border bg-o1-card ${badgeTone(product.badge)}`}
            >
              {product.badge}
            </span>
          ) : (
            <span />
          )}

          {/* Radio circle */}
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              isSelected
                ? 'border-white/40 bg-white text-neutral-950'
                : 'border-white/[0.07] bg-o1-card'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-xs sm:text-sm text-white leading-tight">{product.name}</h3>

        {/* Description / Subtitle */}
        <p className="text-o1-label sm:text-o1-label text-neutral-400 mt-1 line-clamp-2 leading-snug">
          {product.description}
        </p>
      </div>

      {/* Price */}
      <div className="mt-2.5 pt-2 border-t border-white/[0.05] flex items-baseline gap-1">
        <span className="font-mono font-black text-xs sm:text-sm text-white">{product.price}</span>
        {product.periodText && (
          <span className="text-o1-label font-mono text-neutral-400">{product.periodText}</span>
        )}
      </div>
    </div>
  );
};
