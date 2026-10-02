import React from 'react';
import { Check } from 'lucide-react';
import { IAPProductInfo } from '../../../types/iap';
import { tactileEngine } from '../../../services/tactileEngine';

interface Props {
  product: IAPProductInfo;
  isSelected: boolean;
  onSelect: (productId: string) => void;
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
          ? 'bg-white dark:bg-[#18181b] border-[#C4121A] ring-1 ring-[#C4121A] shadow-md shadow-[#C4121A]/10'
          : 'bg-neutral-50/60 dark:bg-[#121214] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      <div>
        {/* Top: Badge + Radio Check */}
        <div className="flex items-center justify-between gap-1 mb-1.5 min-h-[22px]">
          {product.badge ? (
            <span className="bg-[#C4121A] text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
              {product.badge}
            </span>
          ) : (
            <span />
          )}

          {/* Radio circle */}
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              isSelected
                ? 'border-[#C4121A] bg-[#C4121A] text-white'
                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-[#18181b]'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white leading-tight">
          {product.name}
        </h3>

        {/* Description / Subtitle */}
        <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-snug">
          {product.description}
        </p>
      </div>

      {/* Price */}
      <div className="mt-2.5 pt-2 border-t border-neutral-200/60 dark:border-neutral-800 flex items-baseline gap-1">
        <span className="font-mono font-black text-xs sm:text-sm text-neutral-900 dark:text-white">
          {product.price}
        </span>
        {product.periodText && (
          <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
            {product.periodText}
          </span>
        )}
      </div>
    </div>
  );
};
export default MembershipPlanCard;
