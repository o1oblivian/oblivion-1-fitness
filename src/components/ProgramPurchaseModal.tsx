import React, { useState, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Check,
  Dumbbell,
  Shield,
  AlertCircle,
  Clock,
  TrendingUp,
  ChevronRight,
  Zap,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { ProgramPreview, PurchaseRecord, formatPrice, calcCommission, PLATFORM_COMMISSION_PCT } from '@/utils/reelsTypes';
import { recordCoachEarning } from '@/utils/subscriptionStore';
import { createEnrollment, DispatchMode } from '@/utils/programScheduleStore';

interface ProgramPurchaseModalProps {
  program: ProgramPreview | null;
  currentUserEmail: string;
  onClose: () => void;
  onPurchased: (programId: string) => void;
}

export const ProgramPurchaseModal: React.FC<ProgramPurchaseModalProps> = ({
  program,
  currentUserEmail,
  onClose,
  onPurchased,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseComplete, setPurchaseComplete] = useState<PurchaseRecord | null>(null);

  // Dispatch preferences
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>('auto');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const commission = useMemo(
    () => (program ? calcCommission(program.price_cents) : { fee: 0, payout: 0 }),
    [program]
  );

  if (!program) return null;

  const isFree = program.price_cents === 0;

  const handlePurchase = async () => {
    if (!currentUserEmail) {
      setError('You must be signed in to purchase a program');
      return;
    }

    const _tier = localStorage.getItem('o1fc_cached_tier') || 'free';
    const _created = localStorage.getItem('o1fc_account_created');
    const _trialDays = _created ? Math.max(0, 90 - (Date.now() - new Date(_created).getTime()) / 86400000) : 90;
    const _paid = ['premium','premium_travel','coach_pro'].includes(_tier) || _trialDays > 0;
    if (!_paid && !isFree) {
      setError('Upgrade to Premium to purchase paid programs');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Check if already purchased
      const { data: existing } = await supabase
        .from('program_purchases')
        .select('id')
        .eq('buyer_email', currentUserEmail)
        .eq('program_id', program.id)
        .eq('status', 'completed')
        .maybeSingle();

      if (existing) {
        setError('You already own this program');
        setIsProcessing(false);
        return;
      }

      // Record the purchase with platform commission
      const { data, error: insertError } = await supabase
        .from('program_purchases')
        .insert({
          buyer_email: currentUserEmail,
          program_id: program.id,
          coach_email: program.coach_email,
          price_cents: program.price_cents,
          platform_commission_pct: PLATFORM_COMMISSION_PCT,
          platform_fee_cents: commission.fee,
          coach_payout_cents: commission.payout,
          status: 'completed',
        })
        .select('id, buyer_email, program_id, coach_email, price_cents, platform_commission_pct, platform_fee_cents, coach_payout_cents, status, created_at')
        .single();

      if (insertError) throw insertError;

      setPurchaseComplete(data as PurchaseRecord);

      if (!isFree) {
        recordCoachEarning({
          purchaseId: data.id,
          buyerEmail: currentUserEmail,
          programTitle: program.title,
          saleAmountCents: program.price_cents,
          platformFeeCents: commission.fee,
          coachPayoutCents: commission.payout,
        }).catch(() => {});
      }

      // Create enrollment with schedule
      createEnrollment({
        athleteEmail: currentUserEmail,
        programId: program.id,
        coachEmail: program.coach_email,
        dispatchMode,
        startDate,
        trainingDays: selectedDays,
        programContent: program.program_content || [],
      }).catch(() => {});

      setIsProcessing(false);
    } catch (err: any) {
      setError(err.message || 'Purchase failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (purchaseComplete) {
      onPurchased(program.id);
    }
    setError(null);
    setPurchaseComplete(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[190] bg-white dark:bg-[#121414] overflow-y-auto">
      <div className="bg-white w-full h-full min-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-32 bg-[#1A1E1D] relative overflow-hidden">
            {program.cover_image_url ? (
              <img src={program.cover_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1A1E1D] via-[#2A2F2D] to-[#DC2626]/30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 min-w-[44px] min-h-[44px] rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center cursor-pointer border border-white/10 active:scale-95"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 pb-28">
          {purchaseComplete ? (
            /* Purchase Success State */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
                <Check className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-[#000000] mb-1">Program Unlocked!</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                You now have full access to <span className="font-bold text-[#000000]">{program.title}</span>. Check your library to start training.
              </p>
              <div className="bg-[#F2F2F7] rounded-xl p-3 border border-[rgba(0,0,0,0.08)] text-left space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-500">Order ID</span>
                  <span className="text-[#000000] font-bold truncate ml-2">{purchaseComplete.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="text-[#000000] font-bold">{formatPrice(purchaseComplete.price_cents)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-500">Date</span>
                  <span className="text-[#000000] font-bold">{new Date(purchaseComplete.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-full mt-4 py-3 bg-[#DC2626] text-white font-bold text-xs rounded-xl hover:bg-[#B91C1C] active:scale-95 transition-all cursor-pointer"
              >
                Start Training
              </button>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {error && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Program Title */}
              <div>
                <h3 className="text-base font-bold text-[#000000] tracking-tight">{program.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">{program.description}</p>
              </div>

              {/* Program Meta */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#F2F2F7] rounded-xl p-2 border border-[rgba(0,0,0,0.08)] text-center">
                  <Clock className="w-3.5 h-3.5 text-[#DC2626] mx-auto mb-1" />
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Duration</div>
                  <div className="text-xs font-bold text-[#000000]">{program.duration_weeks} weeks</div>
                </div>
                <div className="bg-[#F2F2F7] rounded-xl p-2 border border-[rgba(0,0,0,0.08)] text-center">
                  <TrendingUp className="w-3.5 h-3.5 text-[#7A9382] mx-auto mb-1" />
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Level</div>
                  <div className="text-xs font-bold text-[#000000]">{program.difficulty}</div>
                </div>
                <div className="bg-[#F2F2F7] rounded-xl p-2 border border-[rgba(0,0,0,0.08)] text-center">
                  <Dumbbell className="w-3.5 h-3.5 text-[#000000] mx-auto mb-1" />
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Type</div>
                  <div className="text-xs font-bold text-[#000000]">{program.category}</div>
                </div>
              </div>

              {/* Price breakdown */}
              {!isFree && (
                <div className="bg-[#F2F2F7] rounded-xl p-4 border border-[rgba(0,0,0,0.08)] space-y-2">
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Price Breakdown</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Program Price</span>
                    <span className="font-bold text-[#000000]">{formatPrice(program.price_cents)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Platform Fee ({PLATFORM_COMMISSION_PCT}%)</span>
                    <span className="text-[#DC2626] font-mono">-{formatPrice(commission.fee)}</span>
                  </div>
                  <div className="border-t border-[rgba(0,0,0,0.08)] pt-2 flex justify-between text-xs">
                    <span className="text-gray-600">Coach Receives</span>
                    <span className="font-bold text-red-600">{formatPrice(commission.payout)}</span>
                  </div>
                </div>
              )}

              {/* Dispatch Mode Selection */}
              <div className="bg-[#F2F2F7] rounded-xl p-3.5 border border-[rgba(0,0,0,0.08)] space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Workout Delivery</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setDispatchMode('auto')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                      dispatchMode === 'auto'
                        ? 'bg-[#DC2626] text-white border-[#DC2626]'
                        : 'bg-white text-gray-600 border-[rgba(0,0,0,0.08)] hover:bg-gray-50'
                    }`}
                  >
                    <Zap className="w-3 h-3 inline mr-1" />
                    Auto
                  </button>
                  <button
                    onClick={() => setDispatchMode('manual')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                      dispatchMode === 'manual'
                        ? 'bg-[#DC2626] text-white border-[#DC2626]'
                        : 'bg-white text-gray-600 border-[rgba(0,0,0,0.08)] hover:bg-gray-50'
                    }`}
                  >
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Manual
                  </button>
                </div>

                <p className="text-[10px] text-gray-500 leading-relaxed">
                  {dispatchMode === 'auto'
                    ? 'Sessions will be delivered to your feed automatically on your training days.'
                    : 'Your coach will send each session manually when ready.'}
                </p>

                {dispatchMode === 'auto' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white text-xs font-mono text-[#000000] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Training Days</label>
                      <div className="flex gap-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <button
                            key={day}
                            onClick={() => setSelectedDays(prev =>
                              prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                            )}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer border ${
                              selectedDays.includes(day)
                                ? 'bg-[#DC2626] text-white border-[#DC2626]'
                                : 'bg-white text-gray-500 border-[rgba(0,0,0,0.08)]'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Security badge */}
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                <Shield className="w-3.5 h-3.5 text-[#7A9382]" />
                <span>Secure purchase · Instant access · {isFree ? 'No payment required' : 'Payment processed in-app'}</span>
              </div>

              {/* CTA Button */}
              <button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#DC2626] text-white font-bold text-sm rounded-xl hover:bg-[#B91C1C] active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    {isFree ? 'Get Free Program' : `Buy for ${formatPrice(program.price_cents)}`}
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-gray-400 font-mono">
                By purchasing, you agree to the program terms. Access is granted instantly.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
