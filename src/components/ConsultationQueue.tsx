import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Dumbbell,
  Utensils,
  Moon,
  Scale,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Target,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Eye,
  Pill,
  Footprints,
  AlertTriangle,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { AIRecommendationModal } from './AIRecommendationModal';

interface ConsultationRequest {
  id: string;
  client_email: string;
  coach_email: string;
  status: string;
  goal: string;
  experience_level: string;
  training_days_per_week: number;
  why_now: string;
  snapshot_data: any;
  coach_response_note: string | null;
  proposed_duration_weeks: number | null;
  proposed_focus: string | null;
  proposed_price_cents: number | null;
  created_at: string;
  responded_at: string | null;
  current_supplements: string | null;
  diet_preferences: string | null;
  injuries_limitations: string | null;
  daily_step_goal: number | null;
  current_daily_steps: number | null;
  desired_services: string[] | null;
  budget_range: string | null;
  timeline_goal: string | null;
}

interface ConsultationQueueProps {
  coachEmail: string;
  showToast: (msg: string) => void;
}

export const ConsultationQueue: React.FC<ConsultationQueueProps> = ({ coachEmail, showToast }) => {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [aiRecommendRequest, setAiRecommendRequest] = useState<ConsultationRequest | null>(null);
  const [responseNote, setResponseNote] = useState('');
  const [proposedWeeks, setProposedWeeks] = useState('12');
  const [proposedFocus, setProposedFocus] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [coachEmail]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('consultation_requests')
      .select('*')
      .eq('coach_email', coachEmail)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const handleAccept = async (id: string) => {
    if (!responseNote.trim() || !proposedFocus.trim()) return;

    const { error } = await supabase
      .from('consultation_requests')
      .update({
        status: 'accepted',
        coach_response_note: responseNote.trim(),
        proposed_duration_weeks: parseInt(proposedWeeks) || 12,
        proposed_focus: proposedFocus.trim(),
        proposed_price_cents: proposedPrice ? parseInt(proposedPrice) * 100 : null,
        responded_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      showToast('Failed to respond. Try again.');
      return;
    }

    showToast('Consultation accepted! Client notified.');
    setRespondingId(null);
    setResponseNote('');
    setProposedFocus('');
    setProposedPrice('');
    fetchRequests();
  };

  const handleDecline = async (id: string) => {
    const { error } = await supabase
      .from('consultation_requests')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      showToast('Failed to decline.');
      return;
    }

    showToast('Request declined.');
    fetchRequests();
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const respondedRequests = requests.filter((r) => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-xs font-mono text-gray-400">Loading consultation requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-[#121214] border border-neutral-200/80 dark:border-white/10 rounded-2xl p-8 text-center shadow-xs">
        <ClipboardList className="w-10 h-10 text-neutral-400 dark:text-gray-600 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm font-bold text-neutral-900 dark:text-gray-200">No Consultation Requests Yet</p>
        <p className="text-[11px] text-neutral-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
          When athletes submit consultation requests, they'll appear here with their progress data attached.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Pending Section */}
      {pendingRequests.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
              Incoming Requests
            </span>
            <span className="bg-red-500/15 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono">
              {pendingRequests.length} New
            </span>
          </div>

          {pendingRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              expanded={expandedId === req.id}
              onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
              responding={respondingId === req.id}
              onStartRespond={() => setRespondingId(req.id)}
              onAccept={() => handleAccept(req.id)}
              onDecline={() => handleDecline(req.id)}
              onGenerateAI={() => setAiRecommendRequest(req)}
              responseNote={responseNote}
              setResponseNote={setResponseNote}
              proposedWeeks={proposedWeeks}
              setProposedWeeks={setProposedWeeks}
              proposedFocus={proposedFocus}
              setProposedFocus={setProposedFocus}
              proposedPrice={proposedPrice}
              setProposedPrice={setProposedPrice}
            />
          ))}
        </>
      )}

      {/* Responded Section */}
      {respondedRequests.length > 0 && (
        <>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
              Past Requests
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              {respondedRequests.length} responded
            </span>
          </div>
          {respondedRequests.slice(0, 5).map((req) => (
            <CompactRequestCard key={req.id} request={req} />
          ))}
        </>
      )}
      {aiRecommendRequest && (
        <AIRecommendationModal
          isOpen={!!aiRecommendRequest}
          onClose={() => setAiRecommendRequest(null)}
          intake={{
            clientEmail: aiRecommendRequest.client_email,
            goal: aiRecommendRequest.goal,
            experienceLevel: aiRecommendRequest.experience_level,
            trainingDaysPerWeek: aiRecommendRequest.training_days_per_week,
            whyNow: aiRecommendRequest.why_now,
            currentSupplements: aiRecommendRequest.current_supplements || '',
            dietPreferences: aiRecommendRequest.diet_preferences || '',
            injuriesLimitations: aiRecommendRequest.injuries_limitations || '',
            dailyStepGoal: aiRecommendRequest.daily_step_goal || 10000,
            currentDailySteps: aiRecommendRequest.current_daily_steps || 0,
            timelineGoal: aiRecommendRequest.timeline_goal || '12wk',
            desiredServices: aiRecommendRequest.desired_services || [],
            snapshotData: aiRecommendRequest.snapshot_data || {},
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

const RequestCard: React.FC<{
  request: ConsultationRequest;
  expanded: boolean;
  onToggle: () => void;
  responding: boolean;
  onStartRespond: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onGenerateAI: () => void;
  responseNote: string;
  setResponseNote: (v: string) => void;
  proposedWeeks: string;
  setProposedWeeks: (v: string) => void;
  proposedFocus: string;
  setProposedFocus: (v: string) => void;
  proposedPrice: string;
  setProposedPrice: (v: string) => void;
}> = ({
  request,
  expanded,
  onToggle,
  responding,
  onStartRespond,
  onAccept,
  onDecline,
  onGenerateAI,
  responseNote,
  setResponseNote,
  proposedWeeks,
  setProposedWeeks,
  proposedFocus,
  setProposedFocus,
  proposedPrice,
  setProposedPrice,
}) => {
  const snap = request.snapshot_data || {};
  const timeAgo = getTimeAgo(request.created_at);

  return (
    <div className="bg-white dark:bg-[#121214] border border-neutral-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs dark:shadow-md transition-colors">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {request.client_email.charAt(0).toUpperCase()}
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{request.client_email}</p>
            <p className="text-[10px] font-mono text-neutral-500 dark:text-gray-400 flex items-center gap-1">
              <Target className="w-2.5 h-2.5" /> {request.goal}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-mono text-neutral-500 dark:text-gray-400">{timeAgo}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-neutral-500 dark:text-gray-400" /> : <ChevronDown className="w-4 h-4 text-neutral-500 dark:text-gray-400" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-neutral-100 dark:border-white/5 pt-3">
          {/* Client Details */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-neutral-100 dark:bg-white/5 rounded-xl py-2 px-1 border border-neutral-200/60 dark:border-transparent">
              <Dumbbell className="w-3 h-3 text-neutral-500 dark:text-gray-400 mx-auto mb-0.5" />
              <span className="text-[10px] font-bold text-neutral-800 dark:text-gray-300 block">{request.experience_level}</span>
              <span className="text-[8px] text-neutral-500 dark:text-gray-400 uppercase">Level</span>
            </div>
            <div className="bg-neutral-100 dark:bg-white/5 rounded-xl py-2 px-1 border border-neutral-200/60 dark:border-transparent">
              <Calendar className="w-3 h-3 text-neutral-500 dark:text-gray-400 mx-auto mb-0.5" />
              <span className="text-[10px] font-bold text-neutral-800 dark:text-gray-300 block">{request.training_days_per_week}x/week</span>
              <span className="text-[8px] text-neutral-500 dark:text-gray-400 uppercase">Available</span>
            </div>
            <div className="bg-neutral-100 dark:bg-white/5 rounded-xl py-2 px-1 border border-neutral-200/60 dark:border-transparent">
              <Clock className="w-3 h-3 text-neutral-500 dark:text-gray-400 mx-auto mb-0.5" />
              <span className="text-[10px] font-bold text-neutral-800 dark:text-gray-300 block">{timeAgo}</span>
              <span className="text-[8px] text-neutral-500 dark:text-gray-400 uppercase">Submitted</span>
            </div>
          </div>

          {/* Why Now */}
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1 mb-1">
              <MessageSquare className="w-3 h-3 text-red-500 dark:text-red-400" />
              <span className="text-[9px] font-mono font-bold text-red-600 dark:text-red-400 uppercase">Why Now</span>
            </div>
            <p className="text-xs text-neutral-800 dark:text-gray-300 leading-relaxed italic">
              "{request.why_now}"
            </p>
          </div>

          {/* Intel Intake Details */}
          {(request.desired_services?.length || request.current_supplements || request.diet_preferences || request.injuries_limitations || request.daily_step_goal || request.timeline_goal || request.budget_range) && (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-red-500 dark:text-[#EA4335]" />
                <span className="text-[9px] font-mono font-bold text-red-600 dark:text-[#EA4335] uppercase tracking-wider">
                  Intel Intake Profile
                </span>
              </div>
              <div className="bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-white/10 rounded-xl p-3 space-y-2.5">
                {request.desired_services && request.desired_services.length > 0 && (
                  <IntakeRow icon={<Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />} label="Requested Services">
                    <div className="flex flex-wrap gap-1">
                      {request.desired_services.map((s: string) => (
                        <span key={s} className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono capitalize border border-amber-500/20">
                          {s.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </IntakeRow>
                )}
                {request.timeline_goal && (
                  <IntakeRow icon={<Clock className="w-3 h-3 text-blue-400" />} label="Timeline">
                    <span className="text-[10px] text-white font-bold capitalize">{request.timeline_goal === 'ongoing' ? 'Ongoing' : request.timeline_goal.replace('wk', ' weeks')}</span>
                  </IntakeRow>
                )}
                {request.budget_range && (
                  <IntakeRow icon={<Wallet className="w-3 h-3 text-green-400" />} label="Budget">
                    <span className="text-[10px] text-white font-bold capitalize">{request.budget_range}</span>
                  </IntakeRow>
                )}
                {(request.daily_step_goal || request.current_daily_steps) && (
                  <IntakeRow icon={<Footprints className="w-3 h-3 text-teal-400" />} label="Steps">
                    <span className="text-[10px] text-white font-bold">
                      Goal: {(request.daily_step_goal || 10000).toLocaleString()} / Current avg: {(request.current_daily_steps || 0).toLocaleString()}
                    </span>
                  </IntakeRow>
                )}
                {request.current_supplements && (
                  <IntakeRow icon={<Pill className="w-3 h-3 text-purple-400" />} label="Supplements">
                    <p className="text-[10px] text-gray-300 leading-relaxed">{request.current_supplements}</p>
                  </IntakeRow>
                )}
                {request.diet_preferences && (
                  <IntakeRow icon={<Utensils className="w-3 h-3 text-orange-400" />} label="Diet">
                    <p className="text-[10px] text-gray-300 leading-relaxed">{request.diet_preferences}</p>
                  </IntakeRow>
                )}
                {request.injuries_limitations && (
                  <IntakeRow icon={<AlertTriangle className="w-3 h-3 text-red-400" />} label="Injuries">
                    <p className="text-[10px] text-gray-300 leading-relaxed">{request.injuries_limitations}</p>
                  </IntakeRow>
                )}
              </div>
            </div>
          )}

          {/* Progress Snapshot */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-neutral-500 dark:text-gray-400" />
              <span className="text-[9px] font-mono font-bold text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
                Athlete Progress Snapshot
              </span>
            </div>
            <div className="bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-white/10 rounded-xl p-3 grid grid-cols-2 gap-3">
              <SnapshotMetric
                icon={<Dumbbell className="w-3 h-3 text-blue-500" />}
                label="Training"
                value={`${snap.workouts?.totalSessions || 0} sessions`}
                sub={`${snap.workouts?.avgPerWeek || 0}/week avg`}
              />
              <SnapshotMetric
                icon={<Utensils className="w-3 h-3 text-orange-500" />}
                label="Nutrition"
                value={`${snap.nutrition?.avgCalories || '---'} cal`}
                sub={`${snap.nutrition?.avgProtein || '---'}g protein`}
              />
              <SnapshotMetric
                icon={<Moon className="w-3 h-3 text-indigo-400" />}
                label="Sleep"
                value={`${snap.sleep?.avgHours || '---'} hrs`}
                sub={`${snap.sleep?.qualityScore || '---'}% quality`}
              />
              <SnapshotMetric
                icon={<Scale className="w-3 h-3 text-teal-500" />}
                label="Weight"
                value={`${snap.bodyweight?.current || '---'} kg`}
                sub={snap.bodyweight?.trend || 'unknown'}
              />
              {snap.steps?.avgDaily > 0 && (
                <SnapshotMetric
                  icon={<Footprints className="w-3 h-3 text-green-500" />}
                  label="Avg Steps"
                  value={`${(snap.steps.avgDaily || 0).toLocaleString()}`}
                  sub="steps/day"
                />
              )}
            </div>
            {snap.workouts?.recentPRs?.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-1">
                <TrendingUp className="w-3 h-3 text-amber-500" />
                <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold">Recent PRs:</span>
                {snap.workouts.recentPRs.map((pr: string, i: number) => (
                  <span key={i} className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono">
                    {pr}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons or Response Form */}
          {!responding ? (
            <div className="space-y-2 pt-1">
              <button
                onClick={onGenerateAI}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600/10 to-red-600/10 dark:from-orange-600/20 dark:to-red-600/20 border border-orange-500/30 hover:border-orange-500/50 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5" /> Intel Generate Program & Diet
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onDecline}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-gray-400 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Decline
                </button>
                <button
                  onClick={onStartRespond}
                  className="flex-[2] py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Respond with Proposal
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1 border-t border-neutral-200 dark:border-white/5">
              <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                Your Proposal
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-neutral-500 dark:text-gray-400 uppercase block mb-1">Duration (weeks)</label>
                  <input
                    type="number"
                    value={proposedWeeks}
                    onChange={(e) => setProposedWeeks(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-red-400 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-neutral-500 dark:text-gray-400 uppercase block mb-1">Price ($, optional)</label>
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="e.g. 199"
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-red-400 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono text-neutral-500 dark:text-gray-400 uppercase block mb-1">Focus Area</label>
                <input
                  type="text"
                  value={proposedFocus}
                  onChange={(e) => setProposedFocus(e.target.value)}
                  placeholder="e.g. Hypertrophy + Nutrition Overhaul"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-red-400 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-neutral-500 dark:text-gray-400 uppercase block mb-1">Personal Note to Client</label>
                <textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  placeholder="Reference their snapshot — e.g. 'Your protein is low for your volume, I can fix that...'"
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-white/10 rounded-2xl resize-none focus:outline-none focus:border-red-400 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500"
                />
              </div>

              <button
                onClick={onAccept}
                disabled={!responseNote.trim() || !proposedFocus.trim()}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Send className="w-3.5 h-3.5" /> Send Proposal to Client
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CompactRequestCard: React.FC<{ request: ConsultationRequest }> = ({ request }) => (
  <div className="bg-white dark:bg-[#121214] border border-neutral-200/80 dark:border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
    <div className="flex items-center gap-2 min-w-0">
      <div className={`w-2 h-2 rounded-full ${request.status === 'accepted' ? 'bg-red-500' : 'bg-neutral-400'}`} />
      <span className="text-xs font-bold text-neutral-800 dark:text-gray-300 truncate">{request.client_email}</span>
      <span className="text-[9px] text-neutral-500 dark:text-gray-400 font-mono hidden sm:inline">{request.goal}</span>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {request.proposed_price_cents && (
        <span className="text-[9px] font-mono font-bold text-red-500 dark:text-red-400 flex items-center gap-0.5">
          <DollarSign className="w-2.5 h-2.5" />{(request.proposed_price_cents / 100).toFixed(0)}
        </span>
      )}
      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
        request.status === 'accepted'
          ? 'bg-red-500/15 text-red-600 dark:text-red-400'
          : 'bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-gray-400'
      }`}>
        {request.status}
      </span>
    </div>
  </div>
);

const IntakeRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon, label, children,
}) => (
  <div>
    <div className="flex items-center gap-1 mb-0.5">
      {icon}
      <span className="text-[8px] font-mono text-neutral-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
    <div className="pl-4">{children}</div>
  </div>
);

const SnapshotMetric: React.FC<{ icon: React.ReactNode; label: string; value: string; sub: string }> = ({
  icon, label, value, sub,
}) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5">{icon}</div>
    <div>
      <span className="text-[8px] font-mono text-neutral-500 dark:text-gray-400 uppercase">{label}</span>
      <p className="text-[11px] font-bold text-neutral-900 dark:text-white leading-tight">{value}</p>
      <p className="text-[9px] text-neutral-500 dark:text-gray-400">{sub}</p>
    </div>
  </div>
);

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const Send: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);
