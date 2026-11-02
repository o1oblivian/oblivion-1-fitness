import React from 'react';
import type { IAPProductInfo } from '../../../types/iap';
import { founderPassLine, isFounderProduct, type FounderPasses } from '../useFounderPasses';

interface Props {
  product: IAPProductInfo;
  founder: FounderPasses | null;
}

/** "4,321 of 5,000 Founder Passes left" under the Founder Pass. Nothing for other plans or before the server answers. */
export const FounderPassCount: React.FC<Props> = ({ product, founder }) => {
  const line = isFounderProduct(product.productId) ? founderPassLine(founder) : '';
  if (!line) return null;
  return (
    <span
      className="mt-1 block text-o1-label font-num font-semibold text-o1-gold"
      aria-live="polite"
    >
      {line}
    </span>
  );
};
