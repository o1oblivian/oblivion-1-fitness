import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Link2, Unlink, Target, Plus, Send, Dumbbell, Trophy,
  Copy, CheckCircle2, Clock, ArrowRight, Flame, X, ChevronRight,
  Loader2, Zap, TrendingUp,
} from 'lucide-react';
import {
  TandemPair, TandemGoal, TandemWorkout, TandemActivityEntry,
  createTandemPair, joinTandemPair, getActivePair, getPendingPair,
  dissolvePair, fetchTandemGoals, createTandemGoal, contributeToGoal,
  fetchReceivedWorkouts, fetchSentWorkouts, updateWorkoutStatus,
  fetchTandemActivity, logTandemActivity, getPartnerProfile,
  searchByHandleOrCode, pairWithUser,
} from '@/utils/tandemStore';
import { supabase } from '@/utils/supabase';
import { TandemSendWorkoutModal } from './TandemSendWorkoutModal';

interface TandemViewProps {
  theme: 'dark' | 'light' | 'system';
  showToast: (msg: string, type?: 'success' | 'error') => void;
  currentUserEmail: string;
}

type TandemTab = 'dashboard' | 'workouts' | 'goals';

export const TandemView: React.FC<TandemViewProps> = ({ theme, showToast, currentUserEmail }) => {
  const isLight = theme === 'light';
  const [pair, setPair] = useState<TandemPair | null>(null);
  const [pendingPair, setPendingPair] = useState<TandemPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [partnerName, setPartnerName] = useState('Partner');
  const [activeTab, setActiveTab] = useState<TandemTab>('dashboard');

  const [goals, setGoals] = useState<TandemGoal[]>([]);
  const [receivedWorkouts, setReceivedWorkouts] = useState<TandemWorkout[]>([]);
  const [sentWorkouts, setSentWorkouts] = useState<TandemWorkout[]>([]);
  const [activity, setActivity] = useState<TandemActivityEntry[]>([]);

  const [showNewGoal, setShowNewGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalUnit, setGoalUnit] = useState('sessions');
  const [showSendWorkout, setShowSendWorkout] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<{ userId: string; name: string; handle: string } | null>(null);
  const [connectingUser, setConnectingUser] = useState(false);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const isUserA = pair?.user_a === currentUserId;

  const loadData = useCallback(async () => {
    if (!pair) return;
    const [g, rw, sw, act] = await Promise.all([
      fetchTandemGoals(pair.id),
      fetchReceivedWorkouts(pair.id),
      fetchSentWorkouts(pair.id),
      fetchTandemActivity(pair.id),
    ]);
    setGoals(g);
    setReceivedWorkouts(rw);
    setSentWorkouts(sw);
    setActivity(act);
  }, [pair]);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id || '';
      setCurrentUserId(uid);
      const active = await getActivePair();
      if (active) {
        setPair(active);
        const partnerId = active.user_a === uid ? active.user_b : active.user_a;
        if (partnerId) {
          const profile = await getPartnerProfile(partnerId);
          if (profile) setPartnerName(profile.name);
        }
      } else {
        const pending = await getPendingPair();
        setPendingPair(pending);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (pair) loadData();
  }, [pair, loadData]);

  const handleCreate = async () => {
    setCreating(true);
    const { pair: newPair, error } = await createTandemPair();
    if (error) { showToast(error, 'error'); setCreating(false); return; }
    if (newPair) setPendingPair(newPair);
    setCreating(false);
  };

  const handleJoin = async () => {
    if (joinCode.length < 4) { showToast('Enter the full code', 'error'); return; }
    setJoining(true);
    const { pair: joined, error } = await joinTandemPair(joinCode);
    if (error) { showToast(error, 'error'); setJoining(false); return; }
    if (joined) {
      setPair(joined);
      setPendingPair(null);
      showToast('Paired up! You\'re now training together.', 'success');
    }
    setJoining(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setFoundUser(null);
    const result = await searchByHandleOrCode(searchQuery);
    if (result) {
      setFoundUser(result);
    } else {
      showToast('No athlete found with that handle or code', 'error');
    }
    setSearching(false);
  };

  const handleConnectUser = async () => {
    if (!foundUser) return;
    setConnectingUser(true);
    const { pair: newPair, error } = await pairWithUser(foundUser.userId);
    if (error) { showToast(error, 'error'); setConnectingUser(false); return; }
    if (newPair) {
      setPair(newPair);
      setPendingPair(null);
      setShowSuccess(foundUser.handle || foundUser.name);
      setFoundUser(null);
      setSearchQuery('');
      setTimeout(() => setShowSuccess(null), 4000);
    }
    setConnectingUser(false);
  };

  const handleCopy = () => {
    if (pendingPair) {
      navigator.clipboard.writeText(pendingPair.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDissolve = async () => {
    if (!pair) return;
    await dissolvePair(pair.id);
    setPair(null);
    setPendingPair(null);
    setShowUnlinkConfirm(false);
    showToast('Partnership dissolved', 'success');
  };

  const handleCreateGoal = async () => {
    if (!pair || !goalTitle || !goalTarget) return;
    const g = await createTandemGoal(pair.id, goalTitle, parseFloat(goalTarget), goalUnit);
    if (g) {
      setGoals(prev => [g, ...prev]);
      setShowNewGoal(false);
      setGoalTitle('');
      setGoalTarget('');
      showToast('Shared goal created!', 'success');
    }
  };

  const handleContribute = async (goal: TandemGoal) => {
    const ok = await contributeToGoal(goal.id, isUserA, 1);
    if (ok) {
      await logTandemActivity(pair!.id, 'goal_contribution', `Contributed to "${goal.title}"`);
      loadData();
      showToast('+1 logged!', 'success');
    }
  };

  const handleAcceptWorkout = async (w: TandemWorkout) => {
    await updateWorkoutStatus(w.id, 'accepted');
    loadData();
    showToast('Workout accepted! Time to crush it.', 'success');
  };

  const handleCompleteWorkout = async (w: TandemWorkout) => {
    await updateWorkoutStatus(w.id, 'completed');
    if (pair) await logTandemActivity(pair.id, 'workout_logged', `Completed "${w.title}"`);
    loadData();
    showToast('Workout completed!', 'success');
  };

  const cardBg = isLight ? 'bg-white/60 border-black/5' : 'bg-white/[0.04] border-white/[0.06]';
  const textPrimary = isLight ? 'text-gray-900' : 'text-white';
  const textSecondary = isLight ? 'text-gray-500' : 'text-white/50';
  const accentGradient = 'from-red-500 to-cyan-500';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className={`w-8 h-8 animate-spin ${textSecondary}`} />
      </div>
    );
  }

  // ── Not paired: show pairing controls directly ──
  if (!pair) {
    return (
      <div className="px-2 sm:px-4 pt-1 pb-2 space-y-4 tab-enter">
        <div className="text-center pt-3">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${accentGradient} mb-4`}>
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Tandem Mode</h2>
          <p className={`text-sm mt-2 max-w-xs mx-auto ${textSecondary}`}>
            Pair up with a training partner to unlock shared goals, send workouts, and track progress together.
          </p>
        </div>

        {/* Your profile card */}
        {currentUserEmail && (
          <div className={`rounded-2xl border p-4 ${cardBg}`}>
            <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${textSecondary}`}>Your Profile</p>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${accentGradient} flex items-center justify-center text-white font-bold text-lg`}>
                {currentUserEmail.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={`text-sm font-semibold ${textPrimary}`}>{currentUserEmail}</p>
                <p className={`text-xs ${textSecondary}`}>This is what your partner will see</p>
              </div>
            </div>
          </div>
        )}

        {/* Pairing actions */}
        {pendingPair ? (
          <div className={`rounded-2xl border p-5 text-center space-y-3 ${cardBg}`}>
            <p className={`text-sm font-semibold ${textPrimary}`}>Share this code with your partner</p>
            <div className={`text-3xl font-mono font-bold tracking-[0.3em] ${textPrimary}`}>
              {pendingPair.invite_code}
            </div>
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                copied
                  ? 'bg-red-500/20 text-red-400'
                  : isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <p className={`text-xs ${textSecondary}`}>Waiting for your partner to join...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className={`w-full py-3.5 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r ${accentGradient} shadow-lg shadow-red-500/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50`}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Invite Link'}
            </button>

            <div className="flex items-center gap-3">
              <div className={`flex-1 h-px ${isLight ? 'bg-gray-200' : 'bg-white/10'}`} />
              <span className={`text-xs ${textSecondary}`}>or find a buddy</span>
              <div className={`flex-1 h-px ${isLight ? 'bg-gray-200' : 'bg-white/10'}`} />
            </div>

            {/* Handle / Invite Code Search */}
            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="@handle or invite code"
                maxLength={20}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-mono tracking-wider border transition focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                  isLight ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400' : 'bg-white/5 border-white/10 text-white placeholder-white/30'
                }`}
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className={`px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r ${accentGradient} transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40`}
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Found User Card */}
            {foundUser && (
              <div className={`rounded-2xl border p-4 ${cardBg} animate-in fade-in duration-300`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${accentGradient} flex items-center justify-center text-white font-bold text-lg`}>
                    {foundUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${textPrimary}`}>{foundUser.name}</p>
                    {foundUser.handle && (
                      <p className="text-xs font-mono text-red-400">@{foundUser.handle}</p>
                    )}
                  </div>
                  <button
                    onClick={handleConnectUser}
                    disabled={connectingUser}
                    className={`px-4 py-2 rounded-xl font-semibold text-xs text-white bg-gradient-to-r ${accentGradient} transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50`}
                  >
                    {connectingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Connect'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success celebration card */}
        {showSuccess && (
          <div className={`rounded-2xl border-2 border-red-500/30 bg-red-500/10 p-5 text-center animate-in fade-in zoom-in-95 duration-300`}>
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${accentGradient} flex items-center justify-center mx-auto mb-3`}>
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <p className={`text-base font-bold ${textPrimary}`}>Connected with @{showSuccess}!</p>
            <p className={`text-sm mt-1 ${textSecondary}`}>You are now workout buddies.</p>
          </div>
        )}

        {/* Feature preview */}
        <div className="space-y-2 pt-2">
          {[
            { icon: Target, label: 'Shared Goals', desc: 'Set combined targets you both contribute to' },
            { icon: Send, label: 'Send Workouts', desc: 'Build a session and push it to your partner' },
            { icon: TrendingUp, label: 'Live Activity', desc: 'See when your partner trains in real-time' },
            { icon: Flame, label: 'Shared Streak', desc: 'Keep the fire going — both must show up' },
          ].map(f => (
            <div key={f.label} className={`flex items-center gap-3 rounded-xl border p-3 ${cardBg}`}>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accentGradient} flex items-center justify-center flex-shrink-0`}>
                <f.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${textPrimary}`}>{f.label}</p>
                <p className={`text-xs ${textSecondary}`}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Paired: show dashboard ──
  const pendingWorkouts = receivedWorkouts.filter(w => w.status === 'pending');
  const acceptedWorkouts = receivedWorkouts.filter(w => w.status === 'accepted');
  const tabs: { key: TandemTab; label: string; count?: number }[] = [
    { key: 'dashboard', label: 'Overview' },
    { key: 'workouts', label: 'Workouts', count: pendingWorkouts.length },
    { key: 'goals', label: 'Goals', count: goals.length },
  ];

  return (
    <div className="px-2 sm:px-4 pt-1 pb-2 space-y-3 tab-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${accentGradient} flex items-center justify-center`}>
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${textPrimary}`}>Tandem</h2>
            <p className={`text-xs ${textSecondary}`}>
              Paired with <span className="font-semibold text-red-400">{partnerName}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowUnlinkConfirm(true)}
          className={`p-2 rounded-xl transition ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
        >
          <Unlink className={`w-4 h-4 ${textSecondary}`} />
        </button>
      </div>

      {/* Tab bar */}
      <div className={`flex gap-1 p-1 rounded-2xl border ${cardBg}`}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all relative ${
              activeTab === t.key
                ? `text-white bg-gradient-to-r ${accentGradient} shadow`
                : `${textSecondary} hover:${isLight ? 'bg-gray-100' : 'bg-white/5'}`
            }`}
          >
            {t.label}
            {!!t.count && t.count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* Shared Goal Ring */}
          {goals.length > 0 && (
            <div className={`rounded-2xl border p-5 ${cardBg}`}>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-4 ${textSecondary}`}>
                <Target className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Active Goal
              </p>
              <SharedGoalRing goal={goals[0]} isUserA={isUserA} isLight={isLight} onContribute={() => handleContribute(goals[0])} />
            </div>
          )}

          {/* Pending Workouts */}
          {pendingWorkouts.length > 0 && (
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${textSecondary}`}>
                <Dumbbell className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Workouts From Partner
              </p>
              {pendingWorkouts.slice(0, 2).map(w => (
                <WorkoutCard key={w.id} workout={w} isLight={isLight} onAccept={() => handleAcceptWorkout(w)} />
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowSendWorkout(true)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${cardBg} active:scale-95 transition-transform`}
            >
              <Send className={`w-5 h-5 text-red-400`} />
              <span className={`text-xs font-semibold ${textPrimary}`}>Send Workout</span>
            </button>
            <button
              onClick={() => { setActiveTab('goals'); setShowNewGoal(true); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${cardBg} active:scale-95 transition-transform`}
            >
              <Target className={`w-5 h-5 text-cyan-400`} />
              <span className={`text-xs font-semibold ${textPrimary}`}>New Goal</span>
            </button>
          </div>

          {/* Active workouts to complete */}
          {acceptedWorkouts.length > 0 && (
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${textSecondary}`}>
                <Zap className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> In Progress
              </p>
              {acceptedWorkouts.map(w => (
                <div key={w.id} className={`flex items-center justify-between py-2 border-b last:border-0 ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
                  <div>
                    <p className={`text-sm font-semibold ${textPrimary}`}>{w.title}</p>
                    <p className={`text-xs ${textSecondary}`}>{(w.exercises as any[]).length} exercises</p>
                  </div>
                  <button
                    onClick={() => handleCompleteWorkout(w)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 active:scale-95 transition-transform"
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Activity Feed */}
          {activity.length > 0 && (
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${textSecondary}`}>
                Recent Activity
              </p>
              {activity.slice(0, 5).map(a => (
                <div key={a.id} className={`flex items-start gap-2.5 py-2 border-b last:border-0 ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${a.user_id === currentUserId ? 'bg-red-400' : 'bg-cyan-400'}`} />
                  <div>
                    <p className={`text-xs ${textPrimary}`}>{a.description}</p>
                    <p className={`text-[10px] ${textSecondary}`}>{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workouts tab */}
      {activeTab === 'workouts' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowSendWorkout(true)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r ${accentGradient} active:scale-[0.98] transition-transform`}
          >
            <Send className="w-4 h-4" /> Build & Send Workout
          </button>

          {pendingWorkouts.length > 0 && (
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${textSecondary}`}>Received</p>
              {pendingWorkouts.map(w => (
                <WorkoutCard key={w.id} workout={w} isLight={isLight} onAccept={() => handleAcceptWorkout(w)} expanded />
              ))}
            </div>
          )}

          {acceptedWorkouts.length > 0 && (
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${textSecondary}`}>In Progress</p>
              {acceptedWorkouts.map(w => (
                <WorkoutCard key={w.id} workout={w} isLight={isLight} onComplete={() => handleCompleteWorkout(w)} expanded />
              ))}
            </div>
          )}

          {sentWorkouts.length > 0 && (
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${textSecondary}`}>Sent</p>
              {sentWorkouts.map(w => (
                <div key={w.id} className={`rounded-xl border p-3 mb-2 ${isLight ? 'bg-white/60 border-black/5' : 'bg-white/[0.04] border-white/[0.06]'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{w.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      w.status === 'completed' ? 'bg-red-500/20 text-red-400' :
                      w.status === 'accepted' ? 'bg-cyan-500/20 text-cyan-400' :
                      w.status === 'declined' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>{w.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {receivedWorkouts.length === 0 && sentWorkouts.length === 0 && (
            <div className="text-center py-12">
              <Dumbbell className={`w-10 h-10 mx-auto mb-3 ${textSecondary}`} />
              <p className={`text-sm ${textSecondary}`}>No workouts yet. Build one for your partner!</p>
            </div>
          )}
        </div>
      )}

      {/* Goals tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowNewGoal(true)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r ${accentGradient} active:scale-[0.98] transition-transform`}
          >
            <Plus className="w-4 h-4" /> Create Shared Goal
          </button>

          {goals.map(g => (
            <div key={g.id} className={`rounded-2xl border p-4 ${cardBg}`}>
              <SharedGoalRing goal={g} isUserA={isUserA} isLight={isLight} onContribute={() => handleContribute(g)} />
            </div>
          ))}

          {goals.length === 0 && !showNewGoal && (
            <div className="text-center py-12">
              <Target className={`w-10 h-10 mx-auto mb-3 ${textSecondary}`} />
              <p className={`text-sm ${textSecondary}`}>No shared goals yet. Create one to start!</p>
            </div>
          )}
        </div>
      )}

      {/* New Goal Form */}
      {showNewGoal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNewGoal(false)}>
          <div className={`w-full max-w-md rounded-t-3xl p-5 pb-[calc(env(safe-area-inset-bottom,1rem)+5rem)] ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${textPrimary}`}>New Shared Goal</h3>
              <button onClick={() => setShowNewGoal(false)}><X className={`w-5 h-5 ${textSecondary}`} /></button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={goalTitle}
                onChange={e => setGoalTitle(e.target.value)}
                placeholder="e.g. 50 combined workouts"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none ${
                  isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white'
                }`}
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  value={goalTarget}
                  onChange={e => setGoalTarget(e.target.value)}
                  placeholder="Target"
                  className={`flex-1 px-4 py-3 rounded-xl border text-sm outline-none ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
                <select
                  value={goalUnit}
                  onChange={e => setGoalUnit(e.target.value)}
                  className={`px-4 py-3 rounded-xl border text-sm outline-none ${
                    isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  <option value="sessions">Sessions</option>
                  <option value="kg">Kg lifted</option>
                  <option value="steps">Steps</option>
                  <option value="km">Km run</option>
                  <option value="minutes">Minutes</option>
                </select>
              </div>
              <button
                onClick={handleCreateGoal}
                disabled={!goalTitle || !goalTarget}
                className={`w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r ${accentGradient} disabled:opacity-40 active:scale-[0.98] transition-transform`}
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Workout Modal */}
      {showSendWorkout && pair && (
        <TandemSendWorkoutModal
          isOpen={showSendWorkout}
          onClose={() => setShowSendWorkout(false)}
          pairId={pair.id}
          receiverId={(isUserA ? pair.user_b : pair.user_a) || ''}
          theme={theme}
          showToast={showToast}
          onSent={() => { loadData(); setShowSendWorkout(false); }}
        />
      )}

      {/* Unlink confirm */}
      {showUnlinkConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUnlinkConfirm(false)}>
          <div className={`w-[85%] max-w-sm rounded-2xl p-5 ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-2 ${textPrimary}`}>End Partnership?</h3>
            <p className={`text-sm mb-5 ${textSecondary}`}>
              This will dissolve your Tandem pair. Shared goals and workout history will remain but the live connection ends.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowUnlinkConfirm(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${isLight ? 'border-gray-200 text-gray-700' : 'border-white/10 text-white/70'}`}>
                Cancel
              </button>
              <button onClick={handleDissolve} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 active:scale-95 transition-transform">
                Unlink
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Shared Goal Ring subcomponent ──
function SharedGoalRing({ goal, isUserA, isLight, onContribute }: {
  goal: TandemGoal; isUserA: boolean; isLight: boolean; onContribute: () => void;
}) {
  const total = goal.current_value_a + goal.current_value_b;
  const pct = Math.min((total / goal.target_value) * 100, 100);
  const pctA = goal.target_value > 0 ? (goal.current_value_a / goal.target_value) * 100 : 0;
  const pctB = goal.target_value > 0 ? (goal.current_value_b / goal.target_value) * 100 : 0;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeA = (Math.min(pctA, 100) / 100) * circumference;
  const strokeB = (Math.min(pctB, 100 - pctA) / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke={isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)'} strokeWidth="8" />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke="#10b981" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${strokeA} ${circumference - strokeA}`}
            className="transition-all duration-700"
          />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke="#06b6d4" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${strokeB} ${circumference - strokeB}`}
            strokeDashoffset={-strokeA}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>{Math.round(pct)}%</span>
          <span className={`text-[9px] ${isLight ? 'text-gray-500' : 'text-white/40'}`}>{total}/{goal.target_value}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{goal.title}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-white/50'}`}>You: {isUserA ? goal.current_value_a : goal.current_value_b}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Partner: {isUserA ? goal.current_value_b : goal.current_value_a}</span>
          </div>
        </div>
        <p className={`text-[10px] mt-1 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{goal.unit}</p>
        <button
          onClick={onContribute}
          className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 active:scale-95 transition-transform flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Log +1
        </button>
      </div>
    </div>
  );
}

// ── Workout Card subcomponent ──
function WorkoutCard({ workout, isLight, onAccept, onComplete, expanded }: {
  workout: TandemWorkout; isLight: boolean; onAccept?: () => void; onComplete?: () => void; expanded?: boolean;
}) {
  const [open, setOpen] = useState(!!expanded);
  const exercises = workout.exercises as any[];
  return (
    <div className={`rounded-xl border p-3 mb-2 ${isLight ? 'bg-white/60 border-black/5' : 'bg-white/[0.04] border-white/[0.06]'}`}>
      <div className="flex items-center justify-between">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 text-left">
          <Dumbbell className={`w-4 h-4 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
          <span className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{workout.title}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''} ${isLight ? 'text-gray-400' : 'text-white/30'}`} />
        </button>
        {workout.status === 'pending' && onAccept && (
          <button onClick={onAccept} className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-red-500 active:scale-95 transition-transform">
            Accept
          </button>
        )}
        {workout.status === 'accepted' && onComplete && (
          <button onClick={onComplete} className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-cyan-500 active:scale-95 transition-transform">
            Complete
          </button>
        )}
      </div>
      {open && exercises.length > 0 && (
        <div className="mt-2 space-y-1.5 pl-6">
          {exercises.map((ex: any, i: number) => (
            <div key={i} className={`text-xs ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
              <span className="font-semibold">{ex.name}</span> — {ex.sets} x {ex.reps}{ex.rest ? `, rest ${ex.rest}` : ''}
            </div>
          ))}
          {workout.notes && <p className={`text-xs italic mt-1 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{workout.notes}</p>}
        </div>
      )}
    </div>
  );
}
