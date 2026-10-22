import React from 'react';
import { Loader2 } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { PAGE_SIZE } from '../hooks/useFoodBrowse';

interface FoodListFooterProps {
  total: number;
  shownCount: number;
  stillLoading: boolean;
  /** True when the Fast food list is showing, whose values come from chain menus. */
  isFastFood: boolean;
  hasPackagedProducts: boolean;
  onShowMore: () => void;
}

/** Below a category list: the "Show more" button, then either a loading note or where the data comes from. */
export const FoodListFooter: React.FC<FoodListFooterProps> = ({
  total,
  shownCount,
  stillLoading,
  isFastFood,
  hasPackagedProducts,
  onShowMore,
}) => (
  <>
    {total > shownCount ? (
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onShowMore();
        }}
        className="w-full h-11 rounded-2xl border border-white/[0.08] bg-o1-surface text-xs font-sans font-semibold text-o1-text cursor-pointer active:scale-[0.99]"
      >
        Show {Math.min(PAGE_SIZE, total - shownCount)} more
        <span className="text-o1-muted"> · {total - shownCount} left</span>
      </button>
    ) : null}
    {stillLoading ? (
      <p className="flex items-center justify-center gap-2 py-3 text-o1-label text-o1-muted">
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
        Loading more foods…
      </p>
    ) : (
      <p className="py-3 text-center text-o1-label text-o1-muted">
        {isFastFood
          ? 'Chain menu values are from US menus, via USDA FoodData Central'
          : 'Plain foods from USDA FoodData Central'}
        {hasPackagedProducts ? ' · packaged products from Open Food Facts' : ''}
      </p>
    )}
  </>
);
