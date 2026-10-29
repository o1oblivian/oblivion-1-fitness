import { Check } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { TIER_PLANS } from '../../membership/planCatalog';
import { founderPassLine, useFounderPasses } from '../../membership/useFounderPasses';
import { freeAccessLine, useFreeAccessSpots } from '../../membership/useFreeAccessSpots';
import type { StorePlans } from '../../membership/useStorePlans';
import type { MembershipTier } from '../consultationTypes';
import { PERIOD_LABEL } from '../inductionHelpers';
import { glass, glassActive } from '../inductionStyles';
import type { TaxonomyOption } from '../useClubTaxonomyStore';
import { Radio } from './Radio';

export type Audience = 'athlete' | 'coach';

interface PlanChoicesProps {
  audience: Audience;
  /** The membership options for the chosen audience, in display order. */
  tiers: TaxonomyOption[];
  picked: MembershipTier;
  priceOf: StorePlans['priceOf'];
  onAudience: (audience: Audience) => void;
  onPick: (tier: MembershipTier) => void;
}

/** The Athlete/Coach switch and the list of membership options, with the picked plan expanded. */
export function PlanChoices({
  audience,
  tiers,
  picked,
  priceOf,
  onAudience,
  onPick,
}: PlanChoicesProps) {
  const founder = useFounderPasses(true);
  const founderLine = founderPassLine(founder);
  const freeLine = freeAccessLine(useFreeAccessSpots(audience === 'athlete'));
  return (
    <main className="mx-auto w-full max-w-[480px] min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-6 animate-in fade-in duration-300">
      <h1 className="text-o1-title font-light leading-tight tracking-[-0.01em]">
        Choose your membership
      </h1>
      <p className="mt-1.5 text-o1-caption font-normal leading-snug text-o1-muted">
        Your plan is ready. Pick how you want to train.
      </p>

      <div
        role="tablist"
        className="mt-4 grid grid-cols-2 rounded-full bg-white/[0.06] p-0.5 backdrop-blur-md"
      >
        {(['athlete', 'coach'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={audience === key}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onAudience(key);
            }}
            className={`h-8 rounded-full text-o1-caption font-normal transition-colors ${audience === key ? 'bg-white/[0.1] text-o1-text' : 'text-o1-muted'}`}
          >
            {key === 'athlete' ? 'Athlete' : 'Coach'}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2" role="radiogroup" aria-label="Membership">
        {tiers.map((tier) => {
          const key = tier.optionKey as MembershipTier;
          const copy = TIER_PLANS[key];
          const active = picked === key;
          const badge =
            key === 'pro' || key === 'coach_pro'
              ? 'Most popular'
              : key === 'founders_pass'
                ? 'Lifetime'
                : '';
          return (
            <button
              key={tier.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onPick(key);
              }}
              className={`w-full rounded-2xl px-4 py-3.5 text-left transition ${active ? glassActive : glass}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-o1-control font-normal">{tier.label}</span>
                    {badge ? (
                      <span className="rounded-full bg-o1-gold/10 px-1.5 py-px text-o1-label font-normal text-o1-gold">
                        {badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-o1-label font-normal leading-snug text-o1-muted">
                    {copy.headline}
                  </p>
                  {(key === 'founders_pass' && founderLine) || (key === 'core' && freeLine) ? (
                    <p className="mt-0.5 text-o1-label font-normal tabular-nums text-o1-gold">
                      {key === 'founders_pass' ? founderLine : freeLine}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-right">
                    <span className="block text-o1-title font-light leading-none tabular-nums">
                      {copy.product.isFree ? 'Free' : priceOf(copy.product)}
                    </span>
                    {!copy.product.isFree ? (
                      <span className="mt-1 block text-o1-label font-normal text-o1-muted">
                        {PERIOD_LABEL[copy.product.periodText || ''] || ''}
                      </span>
                    ) : null}
                  </span>
                  <Radio active={active} />
                </div>
              </div>
              {active ? (
                <ul className="mt-3 space-y-1.5 animate-in fade-in duration-200">
                  {copy.highlights.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2 text-o1-label font-normal leading-snug"
                    >
                      <Check
                        className="mt-0.5 h-3 w-3 shrink-0 text-o1-crimson"
                        strokeWidth={2.25}
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </button>
          );
        })}
      </div>
    </main>
  );
}
