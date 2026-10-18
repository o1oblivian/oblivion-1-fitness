import { useCallback, useState } from 'react';
import { errorMessage } from '../../../shared/errorMessage';
import { revenueCatService } from '../../services/revenueCatService';
import { useSubscription } from '../../context/SubscriptionContext';

const BILLING_UNAVAILABLE = 'Store billing is unavailable on this device.';

/**
 * Buys a plan through the store and unlocks it. Every paywall uses this, so they all
 * end the same way: the store sheet, a plain message, or success. Never a stuck spinner.
 */
export function useStorePurchase() {
  const { activatePlan } = useSubscription();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /** True once the plan is bought and unlocked. Closing the store sheet is a choice, not an error. */
  const buy = useCallback(
    async (productId: string): Promise<boolean> => {
      setBusy(true);
      setError(null);
      try {
        const result = await revenueCatService.purchasePackage(productId);
        if (!result.success) {
          if (!/cancel/i.test(result.error ?? '')) setError(result.error || BILLING_UNAVAILABLE);
          return false;
        }
        await activatePlan(productId);
        return true;
      } catch (err) {
        setError(errorMessage(err, BILLING_UNAVAILABLE));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [activatePlan],
  );

  return { busy, error, buy, clearError };
}
