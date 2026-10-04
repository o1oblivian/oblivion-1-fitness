import React, { useState } from 'react';
import { DemoAthlete } from '../types';
import {
  ChevronLeft,
  MoreVertical,
  Calendar,
  Send,
  Check,
  ChevronRight,
  MapPin,
  Clock,
  Sparkles,
  Search,
  X,
  Navigation,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { supabase } from '../../../services/supabaseClient';
import { useBuddyMessageStore } from '../../../stores/useBuddyMessageStore';
import { useUserStore } from '../../../stores/useUserStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  athlete: DemoAthlete | null;
  onSendInvite?: (invite: { gym: string; dateTime: string; parity: string }) => void;
}

const CURATED_ICEBREAKERS = [
  'Hey! Looks like we train at similar times. Want to team up?',
  'Nice discipline focus! Want to swap programs sometime?',
  'I see you train nearby -- fancy a session together?',
  'Your stats are impressive! What does your split look like?',
  'Looking for a spotter on heavy compound lifts. Are you down?',
  'Let us link up for a joint hypertrophy session this week!',
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'peer';
  text?: string;
  time: string;
  invite?: {
    date: string;
    time: string;
    gym: string;
    address: string;
    parity: string;
    userCommute: string;
    peerCommute: string;
    status: 'Pending Response' | 'Accepted';
  };
}

const VENUES_WORLDWIDE = [
  { id: 'v1', name: 'Iron Works Barbell HQ', address: '15 Bridge Road, Inner West', distKm: 2.4 },
  { id: 'v2', name: 'FitLab Central Metro', address: '240 George St, CBD', distKm: 3.1 },
  { id: 'v3', name: 'PowerHouse Strength & Conditioning', address: '88 Campbell Ave', distKm: 4.5 },
  { id: 'v4', name: 'Anytime Fitness', address: '42 Oxford Street', distKm: 1.2 },
];

export const AthleteMessageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  athlete,
  onSendInvite,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasReplied, setHasReplied] = useState(false);
  const [inputText, setInputText] = useState('');

  // Schedule drawer state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [schedDate, setSchedDate] = useState('09/26/2026');
  const [schedTime, setSchedTime] = useState('6:00 AM');
  const [gymSearch, setGymSearch] = useState('');
  const [suburbSearch, setSuburbSearch] = useState('');
  const [postcodeSearch, setPostcodeSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(VENUES_WORLDWIDE[0]);

  // Synchronize incoming realtime messages for this athlete match
  const liveMessages = useBuddyMessageStore((s) => s.liveMessages);
  const setActiveMatchId = useBuddyMessageStore((s) => s.setActiveMatchId);
  const clearUnread = useBuddyMessageStore((s) => s.clearUnread);
  const currentUserId = useUserStore((s) => s.userId) || 'default-athlete';

  // Fetch messages from Supabase on mount
  React.useEffect(() => {
    if (isOpen && athlete) {
      setActiveMatchId(athlete.id);
      clearUnread();

      const targetAthleteId = athlete.id;
      async function fetchMatchMessages() {
        try {
          const { data, error } = await supabase
            .from('buddy_messages')
            .select('*')
            .or(`match_id.eq.${targetAthleteId},and(sender_id.eq.${currentUserId},recipient_id.eq.${targetAthleteId}),and(sender_id.eq.${targetAthleteId},recipient_id.eq.${currentUserId})`)
            .order('created_at', { ascending: true });

          if (!error && Array.isArray(data) && data.length > 0) {
            const mapped: ChatMessage[] = data.map((row: any) => ({
              id: row.id,
              sender: row.sender_id === currentUserId ? 'user' : 'peer',
              text: row.content || row.text || '',
              time: row.created_at
                ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now',
            }));
            setMessages(mapped);
            setHasReplied(mapped.some((m) => m.sender === 'peer'));
          }
        } catch (err) {
          console.warn('[AthleteMessageModal] Error fetching buddy_messages:', err);
        }
      }

      fetchMatchMessages();
    }
    return () => {
      setActiveMatchId(null);
    };
  }, [isOpen, athlete, currentUserId, setActiveMatchId, clearUnread]);

  // Listen to incoming live messages matching this athlete
  React.useEffect(() => {
    if (!athlete || liveMessages.length === 0) return;
    const latest = liveMessages[liveMessages.length - 1];
    if (latest.sender_id === athlete.id || latest.match_id === athlete.id) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === latest.id)) return prev;
        return [
          ...prev,
          {
            id: latest.id,
            sender: 'peer',
            text: latest.content,
            time: new Date(latest.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ];
      });
      setHasReplied(true);
    }
  }, [liveMessages, athlete]);

  if (!isOpen || !athlete) return null;

  const photo = athlete.image_url || athlete.avatar || '';
  const discipline = athlete.discipline || athlete.training_discipline || 'Hypertrophy';
  const gym = athlete.home_gym || athlete.homeGym || 'Iron Works';

  // Send an icebreaker (initial handshake)
  const handleSelectIcebreaker = (text: string) => {
    tactileEngine.triggerSelectionBuzz();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      time: timeStr,
    };
    setMessages([newMsg]);

    // Dispatch icebreaker to Supabase
    try {
      supabase.from('buddy_messages').insert({
        match_id: athlete.id,
        sender_id: currentUserId,
        recipient_id: athlete.id,
        content: text,
      }).then(() => {});
    } catch (err) {}

    // Simulate peer replying shortly after to unlock direct typing
    setTimeout(() => {
      tactileEngine.triggerSelectionBuzz();
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: 'peer',
        text: `Hey! Absolutely, I usually hit squats and compounds on weekends. Let's lock in a gym slot!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, replyMsg]);
      setHasReplied(true);
    }, 1500);
  };

  // Send custom typed message (only once unlocked after peer reply)
  const handleSendCustomMessage = () => {
    if (!inputText.trim()) return;
    tactileEngine.triggerSelectionBuzz();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      time: timeStr,
    };
    setMessages((prev) => [...prev, newMsg]);

    // Dispatch to Supabase Realtime table buddy_messages
    try {
      supabase.from('buddy_messages').insert({
        match_id: athlete.id,
        sender_id: currentUserId,
        recipient_id: athlete.id,
        content: inputText.trim(),
      }).then(() => {});
    } catch (err) {
      console.warn('[AthleteMessageModal] Supabase dispatch warning:', err);
    }

    setInputText('');
  };

  // Confirm and send Gym Session Invite
  const handleSendSessionInvite = () => {
    tactileEngine.playPRCelebration();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const invitePayload = {
      date: 'Sat, Sep 26',
      time: schedTime,
      gym: selectedVenue.name,
      address: selectedVenue.address,
      parity: '30% Fair Split',
      userCommute: '3 min (0.4 km)',
      peerCommute: `576 min (${athlete.distance_km || 239.1} km)`,
      status: 'Pending Response' as const,
    };

    const inviteMsg: ChatMessage = {
      id: `invite-${Date.now()}`,
      sender: 'user',
      time: timeStr,
      invite: invitePayload,
    };

    setMessages((prev) => [...prev, inviteMsg]);
    setIsScheduleOpen(false);
    onSendInvite?.({
      gym: selectedVenue.name,
      dateTime: `${schedDate} @ ${schedTime}`,
      parity: '30% Fair Split',
    });
  };

  const filteredVenues = VENUES_WORLDWIDE.filter((v) => {
    const q1 = gymSearch.toLowerCase();
    const q2 = suburbSearch.toLowerCase();
    return v.name.toLowerCase().includes(q1) && v.address.toLowerCase().includes(q2);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-0 sm:p-3 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md h-full sm:h-[94vh] sm:rounded-3xl bg-[#09090b] flex flex-col overflow-hidden text-neutral-900 dark:text-white shadow-2xl">
        
        {/* Top Chat Bar Header */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-[#09090b] border-b border-neutral-800 text-white shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onClose();
              }}
              className="p-1 text-neutral-300 hover:text-white active:scale-90 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <img
              src={photo}
              alt={athlete.name}
              className="w-9 h-9 rounded-full object-cover border border-[#C4121A] shadow-xs"
            />

            <div>
              <h3 className="text-xs font-bold text-white tracking-tight leading-none">
                {athlete.name}
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                {discipline} · {gym}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Book Button (High contrast Crimson Pill) */}
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setIsScheduleOpen((prev) => !prev);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#C4121A] hover:bg-[#a50f16] text-white text-[11px] font-bold font-mono uppercase tracking-wider active:scale-95 transition cursor-pointer shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-white" />
              <span>Book</span>
            </button>

            <button
              type="button"
              onClick={() => tactileEngine.triggerSelectionBuzz()}
              className="p-1 text-neutral-400 hover:text-white cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Schedule Training Session Drawer Dropdown */}
        {isScheduleOpen && (
          <div className="bg-[#121214] border-b border-neutral-800 p-4 space-y-3 z-30 max-h-[82vh] overflow-y-auto animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#C4121A] flex items-center justify-center text-white">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">Schedule Training Session</h4>
                  <p className="text-[10px] text-neutral-400 font-mono">Invite {athlete.name} to a gym session</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Date and Time Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#C4121A]" />
                  <span>DATE</span>
                </label>
                <input
                  type="date"
                  value="2026-09-26"
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full bg-[#18181b] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C4121A] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#C4121A]" />
                  <span>TIME</span>
                </label>
                <select
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="w-full bg-[#18181b] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C4121A] cursor-pointer"
                >
                  <option value="6:00 AM">6:00 AM</option>
                  <option value="7:00 AM">7:00 AM</option>
                  <option value="12:30 PM">12:30 PM</option>
                  <option value="5:30 PM">5:30 PM</option>
                  <option value="7:00 PM">7:00 PM</option>
                </select>
              </div>
            </div>

            {/* Search Gym Worldwide */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 flex items-center gap-1">
                <Search className="w-3 h-3 text-[#C4121A]" />
                <span>SEARCH GYM WORLDWIDE</span>
              </span>

              <div className="grid grid-cols-3 gap-1.5">
                <input
                  type="text"
                  value={gymSearch}
                  onChange={(e) => setGymSearch(e.target.value)}
                  placeholder="Gym name / brand (e.g"
                  className="bg-[#18181b] border border-neutral-700 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-neutral-500 focus:outline-none focus:border-[#C4121A]"
                />
                <input
                  type="text"
                  value={suburbSearch}
                  onChange={(e) => setSuburbSearch(e.target.value)}
                  placeholder="Suburb / City ("
                  className="bg-[#18181b] border border-neutral-700 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-neutral-500 focus:outline-none focus:border-[#C4121A]"
                />
                <input
                  type="text"
                  value={postcodeSearch}
                  onChange={(e) => setPostcodeSearch(e.target.value)}
                  placeholder="Post /"
                  className="bg-[#18181b] border border-neutral-700 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-neutral-500 focus:outline-none focus:border-[#C4121A]"
                />
              </div>

              {/* Gym Venue Selection List */}
              <div className="space-y-1 pt-1 max-h-36 overflow-y-auto">
                {filteredVenues.map((v) => {
                  const isSelected = selectedVenue.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        setSelectedVenue(v);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#18181b] border-[#C4121A] text-white'
                          : 'bg-[#09090b] border-neutral-800 text-neutral-300 hover:bg-[#18181b]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold leading-tight">{v.name}</div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-0.5">{v.address}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#C4121A] bg-[#C4121A]' : 'border-neutral-600'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Commute Parity Split */}
            <div className="p-2.5 rounded-xl bg-[#18181b] border border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-neutral-300">
                ⚖ Check Commute Split (You & {athlete.name})
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                30% Fair Split
              </span>
            </div>

            {/* Selected Gym Summary Box */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase text-neutral-400 font-bold block">
                  SELECTED GYM:
                </span>
                <span className="text-xs font-bold text-white block">
                  {selectedVenue.name}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {selectedVenue.address}
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 bg-black/40 px-2 py-1 rounded">
                2026-09-26 @ {schedTime}
              </span>
            </div>

            {/* Send Session Invite Button */}
            <button
              type="button"
              onClick={handleSendSessionInvite}
              className="w-full py-3 rounded-full bg-[#C4121A] hover:bg-[#a50f16] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/30 active:scale-95"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>Send Session Invite</span>
            </button>
          </div>
        )}

        {/* Chat Thread Canvas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Initial State: Send a Message Request to [Athlete Name] with Icebreakers */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-8 text-center space-y-4">
              <img
                src={photo}
                alt={athlete.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-white/10 shadow-lg"
              />

              <div className="space-y-1 max-w-xs">
                <h3 className="text-sm font-bold text-white">
                  Send a Message Request to {athlete.name}
                </h3>
                <p className="text-xs text-neutral-400">
                  Select a curated athletic icebreaker to initiate connection
                </p>
              </div>

              {/* Curated Icebreaker Pill List */}
              <div className="w-full space-y-2 pt-2">
                {CURATED_ICEBREAKERS.map((text, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectIcebreaker(text)}
                    className="w-full p-3 rounded-full bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 hover:border-[#C4121A] text-left text-xs font-medium text-neutral-800 dark:text-neutral-200 transition active:scale-98 flex items-center gap-2 cursor-pointer shadow-xs group"
                  >
                    <ChevronRight className="w-4 h-4 text-[#C4121A] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    <span className="truncate">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Standard Text Bubble */}
                  {m.text && (
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        m.sender === 'user'
                          ? 'bg-[#C4121A] text-white rounded-br-xs'
                          : 'bg-neutral-800 text-neutral-100 rounded-bl-xs'
                      }`}
                    >
                      <p>{m.text}</p>
                      <span className="text-[9px] font-mono text-white/70 block text-right mt-1">
                        {m.time}
                      </span>
                    </div>
                  )}

                  {/* Interactive GYM SESSION INVITE Card */}
                  {m.invite && (
                    <div className="w-full max-w-[85%] rounded-3xl overflow-hidden bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 shadow-xl mt-1 text-neutral-900 dark:text-white">
                      {/* Emerald Header */}
                      <div className="bg-[#059669] text-white px-4 py-2 flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider">
                        <Calendar className="w-4 h-4" />
                        <span>GYM SESSION INVITE</span>
                      </div>

                      {/* Invite Content */}
                      <div className="p-3.5 space-y-2.5">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-[#059669]" />
                            <span>{m.invite.date}</span>
                          </div>
                          <div className="flex items-center gap-2 font-medium">
                            <Clock className="w-3.5 h-3.5 text-[#059669]" />
                            <span>{m.invite.time}</span>
                          </div>
                          <div className="flex items-start gap-2 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold">{m.invite.gym}</div>
                              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                                {m.invite.address}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Commute Parity Breakdown Box */}
                        <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-neutral-600 dark:text-neutral-400">⚖ Commute Parity:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.invite.parity}</span>
                          </div>
                          <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                            🚗 You: {m.invite.userCommute} 🚗 {athlete.name}: {m.invite.peerCommute}
                          </div>
                        </div>

                        {/* Status & Directions Footer */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold">
                            <Clock className="w-3 h-3" />
                            <span>{m.invite.status} ●</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => tactileEngine.triggerSelectionBuzz()}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Directions</span>
                          </button>
                        </div>

                        <span className="text-[9px] font-mono text-neutral-400 block text-right">
                          {m.time}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Chat Input Bar: Only unlocked when peer replies */}
        <div className="p-3 bg-[#09090b] border-t border-neutral-800 flex items-center gap-2">
          {hasReplied ? (
            <>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendCustomMessage();
                }}
                placeholder="Type a message..."
                className="flex-1 bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-700 rounded-full px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-[#C4121A] transition"
              />
              <button
                type="button"
                onClick={handleSendCustomMessage}
                disabled={!inputText.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer shadow-md ${
                  inputText.trim()
                    ? 'bg-[#C4121A] text-white'
                    : 'bg-neutral-800 text-neutral-500 opacity-60'
                }`}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </>
          ) : (
            <div className="w-full py-2.5 px-4 rounded-full bg-[#18181b] border border-neutral-800 text-center">
              <span className="text-[11px] font-mono text-neutral-400">
                {messages.length === 0
                  ? 'Pick an athletic icebreaker above to initiate request'
                  : `Waiting for ${athlete.name} to reply...`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteMessageModal;
