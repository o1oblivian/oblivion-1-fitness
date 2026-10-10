import React, { useEffect, useState } from 'react';
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
  Search,
  X,
  Navigation,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useBuddyMessageStore } from '../../../stores/useBuddyMessageStore';
import { useUserStore } from '../../../stores/useUserStore';
import { searchVenues, VenueHit } from '../services/venueSearch';
import { rememberLine, postLine, readThread } from '../services/buddyMatch';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  athlete: DemoAthlete | null;
  onSendInvite?: (invite: { gym: string; dateTime: string; parity: string }) => void;
  allowCompose?: boolean;
  scheduleOpen?: boolean;
  onUnmatch?: () => void;
  onBlock?: () => void;
  onReport?: (reason: string) => void;
  onLine?: (text: string) => void;
  sessionUserId?: string;
}

const CURATED_ICEBREAKERS = [
  'Hey! Looks like we train at similar times. Want to team up?',
  'Nice discipline focus! Want to swap programs sometime?',
  'I see you train nearby -- fancy a session together?',
  'Your stats are impressive! What does your split look like?',
  'Looking for a spotter on heavy compound lifts. Are you down?',
  'Let us link up for a joint hypertrophy session this week!',
];

const INVITE_MARK = 'o1invite:';
const ACCEPT_MARK = 'o1accept:';

function encodeInvite(invite: NonNullable<ChatMessage['invite']>): string {
  return `${INVITE_MARK}${JSON.stringify(invite)}`;
}

function applyAccepts(rows: ChatMessage[]): ChatMessage[] {
  const accepted = new Set(rows.map((row) => row.acceptId).filter(Boolean));
  return rows
    .filter((row) => !row.acceptId)
    .map((row) => (
      row.invite && accepted.has(row.id)
        ? { ...row, invite: { ...row.invite, status: 'Accepted' as const } }
        : row
    ));
}

function readStoredMessage(row: { id?: string; sender_id?: string; content?: string; text?: string; created_at?: string }, myId: string): ChatMessage {
  const raw = String(row.content || row.text || '');
  const time = row.created_at
    ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';
  const sender: ChatMessage['sender'] = row.sender_id === myId ? 'user' : 'peer';
  if (raw.startsWith(INVITE_MARK)) {
    try {
      return { id: String(row.id || `msg-${Date.now()}`), sender, time, invite: JSON.parse(raw.slice(INVITE_MARK.length)) };
    } catch {
      /* Fall through to plain text. */
    }
  }
  if (raw.startsWith(ACCEPT_MARK)) {
    return { id: String(row.id || `msg-${Date.now()}`), sender, time, text: 'Accepted the session', acceptId: raw.slice(ACCEPT_MARK.length) };
  }
  return { id: String(row.id || `msg-${Date.now()}`), sender, time, text: raw };
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'peer';
  text?: string;
  time: string;
  acceptId?: string;
  invite?: {
    date: string;
    time: string;
    gym: string;
    address: string;
    parity: string;
    status: 'Pending Response' | 'Accepted';
    lat?: number;
    lng?: number;
  };
}

export const AthleteMessageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  athlete,
  onSendInvite,
  allowCompose = false,
  scheduleOpen = false,
  onUnmatch,
  onBlock,
  onReport,
  onLine,
  sessionUserId = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasReplied, setHasReplied] = useState(false);
  const [inputText, setInputText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const [isScheduleOpen, setIsScheduleOpen] = useState(scheduleOpen);
  const [schedDate, setSchedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [schedTime, setSchedTime] = useState('6:00 AM');
  const [gymSearch, setGymSearch] = useState('');
  const [suburbSearch, setSuburbSearch] = useState('');
  const [postcodeSearch, setPostcodeSearch] = useState('');
  const [venues, setVenues] = useState<VenueHit[]>([]);
  const [venueNote, setVenueNote] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<VenueHit | null>(null);
  const [sendNote, setSendNote] = useState('');

  // Synchronize incoming realtime messages for this athlete match
  const liveMessages = useBuddyMessageStore((s) => s.liveMessages);
  const setActiveMatchId = useBuddyMessageStore((s) => s.setActiveMatchId);
  const clearUnread = useBuddyMessageStore((s) => s.clearUnread);
  const storedUserId = useUserStore((s) => s.userId);
  const currentUserId = sessionUserId || storedUserId;

  // Fetch messages from Supabase on mount
  React.useEffect(() => {
    if (isOpen && athlete && currentUserId) {
      setActiveMatchId(athlete.id);
      clearUnread();

      const targetAthleteId = athlete.id;
      async function fetchMatchMessages() {
        try {
          const lines = await readThread(currentUserId, targetAthleteId);
          const mapped = applyAccepts(lines.map((line) => readStoredMessage({
            id: line.id,
            sender_id: line.senderId,
            content: line.body,
            created_at: line.at,
          }, currentUserId)));
          if (mapped.length > 0) {
            setMessages(mapped);
            setHasReplied(mapped.some((m) => m.sender === 'peer'));
          }
        } catch (err) {
          console.warn('[AthleteMessageModal] Error fetching buddy_messages:', err);
        }
      }

      void fetchMatchMessages();
      const timer = window.setInterval(() => { void fetchMatchMessages(); }, 8000);
      return () => {
        window.clearInterval(timer);
        setActiveMatchId(null);
      };
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
        const incoming = readStoredMessage({
          id: latest.id,
          sender_id: latest.sender_id,
          content: latest.content,
          created_at: latest.created_at,
        }, currentUserId || '');
        return applyAccepts([...prev, incoming]);
      });
      setHasReplied(true);
    }
  }, [liveMessages, athlete]);

  useEffect(() => {
    if (scheduleOpen) setIsScheduleOpen(true);
  }, [scheduleOpen, athlete?.id]);

  useEffect(() => {
    const query = `${gymSearch} ${suburbSearch} ${postcodeSearch}`.trim();
    if (query.length < 2) {
      setVenues([]);
      setVenueNote('');
      return;
    }
    let cancelled = false;
    setVenueNote('Searching');
    const timer = window.setTimeout(() => {
      void searchVenues(gymSearch, suburbSearch, postcodeSearch)
        .then((hits) => {
          if (cancelled) return;
          setVenues(hits);
          setVenueNote(hits.length ? '' : 'No venues for that search');
        })
        .catch(() => {
          if (cancelled) return;
          setVenues([]);
          setVenueNote('Search did not respond');
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [gymSearch, suburbSearch, postcodeSearch]);

  if (!isOpen || !athlete) return null;

  const photo = athlete.image_url || athlete.avatar || '';
  const discipline = athlete.discipline || athlete.training_discipline || '';
  const gym = athlete.home_gym || athlete.homeGym || '';

  const deliverLine = async (text: string, optimisticId: string): Promise<boolean> => {
    if (!currentUserId) {
      setMessages((prev) => prev.filter((row) => row.id !== optimisticId));
      setSendNote('Sign in to send');
      return false;
    }
    const saved = await postLine(currentUserId, athlete.id, text);
    if (!saved.ok) {
      setMessages((prev) => prev.filter((row) => row.id !== optimisticId));
      setSendNote(saved.error || 'Message did not send');
      return false;
    }
    setSendNote('');
    rememberLine(athlete.id, text);
    onLine?.(text);
    return true;
  };

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
    setMessages((prev) => [...prev, newMsg]);
    void deliverLine(text, newMsg.id).then((ok) => {
      if (ok) setHasReplied(true);
    });
  };

  // Send custom typed message (only once unlocked after peer reply)
  const handleSendCustomMessage = () => {
    const text = inputText.trim();
    if (!text) return;
    tactileEngine.triggerSelectionBuzz();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      time: timeStr,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    void deliverLine(text, newMsg.id).then((ok) => {
      if (!ok) setInputText(text);
    });
  };

  // Confirm and send Gym Session Invite
  const handleSendSessionInvite = () => {
    if (!selectedVenue) {
      setVenueNote('Pick a venue from the search');
      return;
    }
    tactileEngine.playPRCelebration();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const invitePayload = {
      date: schedDate,
      time: schedTime,
      gym: selectedVenue.name,
      address: selectedVenue.address,
      parity: Number.isFinite(Number(athlete.distance_km)) ? `${athlete.distance_km} km` : '',
      status: 'Pending Response' as const,
      lat: selectedVenue.lat,
      lng: selectedVenue.lng,
    };
    const inviteMsg: ChatMessage = {
      id: `invite-${Date.now()}`,
      sender: 'user' as const,
      time: timeStr,
      invite: invitePayload,
    };
    setMessages((prev) => [...prev, inviteMsg]);
    setIsScheduleOpen(false);
    const venueName = selectedVenue.name;
    void (async () => {
      if (!currentUserId) {
        setMessages((prev) => prev.filter((row) => row.id !== inviteMsg.id));
        setSendNote('Sign in to send');
        return;
      }
      const saved = await postLine(currentUserId, athlete.id, encodeInvite(invitePayload));
      if (!saved.ok) {
        setMessages((prev) => prev.filter((row) => row.id !== inviteMsg.id));
        setSendNote(saved.error || 'Invite did not send');
        return;
      }
      setHasReplied(true);
      setSendNote('');
      rememberLine(athlete.id, `Session at ${venueName}`);
      onLine?.(`Session at ${venueName}`);
      onSendInvite?.({
        gym: venueName,
        dateTime: `${schedDate} @ ${schedTime}`,
        parity: invitePayload.parity,
      });
    })();
  };

  return (
    <div className="fixed inset-0 z-50 flex o1-sheet-scrim o1-page-scrim animate-in fade-in duration-200 select-none">
      <div className="o1-sheet-card o1-page relative bg-black flex flex-col overflow-hidden text-white">
        
        {/* Top Chat Bar Header */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-black border-b border-white/[0.05] text-white shrink-0">
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
              className="w-9 h-9 rounded-full object-cover border border-o1-crimson shadow-xs"
            />

            <div>
              <h3 className="text-xs font-bold text-white tracking-tight leading-none">
                {athlete.name}
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                {[discipline, gym].filter(Boolean).join(' · ')}
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
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-o1-crimson hover:bg-o1-crimson-hover text-white text-[11px] font-bold font-mono tracking-wider active:scale-95 transition cursor-pointer shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-white" />
              <span>Book</span>
            </button>

            <button
              type="button"
              aria-label="Chat actions"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setMenuOpen((open) => !open);
              }}
              className="p-1 text-neutral-400 hover:text-white cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="absolute right-3 top-14 z-20 w-48 rounded-2xl border border-white/[0.07] bg-[#121214] p-1 shadow-xl">
            <button type="button" onClick={() => { setMenuOpen(false); onUnmatch?.(); }} className="flex w-full rounded-xl px-3 py-2.5 text-left text-[13px] text-white">Unmatch</button>
            <button type="button" onClick={() => { setMenuOpen(false); onBlock?.(); }} className="flex w-full rounded-xl px-3 py-2.5 text-left text-[13px] text-white">Block</button>
            <button type="button" onClick={() => { setMenuOpen(false); setReportOpen(true); }} className="flex w-full rounded-xl px-3 py-2.5 text-left text-[13px] text-white">Report</button>
          </div>
        )}
        {reportOpen && (
          <div className="border-b border-white/[0.07] bg-[#121214] px-4 py-3">
            <p className="text-[13px] font-semibold text-white">Report behaviour</p>
            <textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value.slice(0, 240))}
              placeholder="What happened"
              className="mt-2 h-20 w-full rounded-xl border border-white/[0.07] bg-[#161616] px-3 py-2 text-[13px] text-white outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const reason = reportReason.trim();
                if (!reason) return;
                onReport?.(reason);
                setReportReason('');
                setReportOpen(false);
              }}
              className="mt-2 h-9 rounded-full bg-white px-4 text-[12px] font-semibold text-neutral-950"
            >
              Send report
            </button>
          </div>
        )}

        {/* Schedule Training Session Drawer Dropdown */}
        {isScheduleOpen && (
          <div className="bg-o1-card border-b border-white/[0.05] p-4 space-y-3 z-30 max-h-[80vh] overflow-y-auto animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-o1-crimson flex items-center justify-center text-white">
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
                <label className="text-[10px] font-mono font-bold text-neutral-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-o1-crimson" />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-o1-crimson cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-o1-crimson" />
                  <span>Time</span>
                </label>
                <select
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-o1-crimson cursor-pointer"
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
              <span className="text-[10px] font-mono font-bold text-neutral-400 flex items-center gap-1">
                <Search className="w-3 h-3 text-o1-crimson" />
                <span>Search Gym Worldwide</span>
              </span>

              <div className="grid grid-cols-3 gap-1.5">
                <input
                  type="text"
                  value={gymSearch}
                  onChange={(e) => setGymSearch(e.target.value)}
                  placeholder="Gym name"
                  className="bg-o1-well border border-white/[0.07] rounded-xl px-2 py-1.5 text-[10px] text-white placeholder-neutral-500 focus:outline-none focus:border-o1-crimson"
                />
                <input
                  type="text"
                  value={suburbSearch}
                  onChange={(e) => setSuburbSearch(e.target.value)}
                  placeholder="Suburb or city"
                  className="bg-o1-well border border-white/[0.07] rounded-xl px-2 py-1.5 text-[10px] text-white placeholder-neutral-500 focus:outline-none focus:border-o1-crimson"
                />
                <input
                  type="text"
                  value={postcodeSearch}
                  onChange={(e) => setPostcodeSearch(e.target.value)}
                  placeholder="Postcode"
                  className="bg-o1-well border border-white/[0.07] rounded-xl px-2 py-1.5 text-[10px] text-white placeholder-neutral-500 focus:outline-none focus:border-o1-crimson"
                />
              </div>

              {/* Gym Venue Selection List */}
              <div className="space-y-1 pt-1 max-h-36 overflow-y-auto">
                {venueNote ? <p className="px-1 text-[11px] text-neutral-400">{venueNote}</p> : null}
                {venues.map((v) => {
                  const isSelected = selectedVenue?.id === v.id;
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
                          ? 'bg-o1-well border-o1-crimson text-white'
                          : 'bg-black border-white/[0.07] text-neutral-300 hover:bg-o1-well'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold leading-tight">{v.name}</div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-0.5">{v.address}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-o1-crimson bg-o1-crimson' : 'border-white/[0.07]'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Commute Parity Split */}
            <div className="p-2.5 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-between text-xs">
              <span className="text-[11px] text-neutral-300">
                {athlete.name}
              </span>
              <span className="text-[11px] font-semibold text-white">
                {Number.isFinite(Number(athlete.distance_km)) ? `${athlete.distance_km} km` : 'Distance unknown'}
              </span>
            </div>

            {/* Selected Gym Summary Box */}
            <div className="p-3 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-neutral-400 font-bold block">
                  Selected Gym:
                </span>
                <span className="text-xs font-bold text-white block">
                  {selectedVenue ? selectedVenue.name : 'None yet'}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {selectedVenue?.address || 'Search a gym, suburb, or postcode'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 bg-black/40 px-2 py-1 rounded">
                {schedDate} @ {schedTime}
              </span>
            </div>

            {/* Send Session Invite Button */}
            <button
              type="button"
              onClick={handleSendSessionInvite}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
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
                className="w-20 h-20 rounded-full object-cover border border-white/[0.07] shadow-lg"
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
                    className="w-full p-3 rounded-full bg-o1-card border border-white/[0.07] hover:border-o1-crimson text-left text-xs font-medium text-neutral-200 transition active:scale-98 flex items-center gap-2 cursor-pointer shadow-xs group"
                  >
                    <ChevronRight className="w-4 h-4 text-o1-crimson shrink-0 group-hover:translate-x-0.5 transition-transform" />
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
                          ? 'bg-o1-crimson text-white rounded-br-xs'
                          : 'bg-white/[0.08] text-neutral-100 rounded-bl-xs'
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
                    <div className="w-full max-w-[85%] rounded-2xl overflow-hidden bg-o1-card border border-white/[0.07] shadow-xl mt-1 text-white">
                      {/* Emerald Header */}
                      <div className="bg-[#4F8F9A] text-white px-4 py-2 flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider">
                        <Calendar className="w-4 h-4" />
                        <span>Gym Session Invite</span>
                      </div>

                      {/* Invite Content */}
                      <div className="p-3.5 space-y-2.5">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-[#4F8F9A]" />
                            <span>{m.invite.date}</span>
                          </div>
                          <div className="flex items-center gap-2 font-medium">
                            <Clock className="w-3.5 h-3.5 text-[#4F8F9A]" />
                            <span>{m.invite.time}</span>
                          </div>
                          <div className="flex items-start gap-2 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#4F8F9A] shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold">{m.invite.gym}</div>
                              <div className="text-[10px] text-neutral-400 font-mono">
                                {m.invite.address}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Commute Parity Breakdown Box */}
                        {m.invite.parity ? (
                          <p className="text-[11px] text-neutral-400">{m.invite.parity} away</p>
                        ) : null}

                        {/* Status & Directions Footer */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-neutral-300">{m.invite.status}</span>
                          {m.sender === 'peer' && m.invite.status === 'Pending Response' && (
                            <button
                              type="button"
                              onClick={() => {
                                tactileEngine.triggerSelectionBuzz();
                                const gymName = m.invite?.gym || 'session';
                                setMessages((prev) => prev.map((row) => row.id === m.id && row.invite
                                  ? { ...row, invite: { ...row.invite, status: 'Accepted' } }
                                  : row));
                                void (async () => {
                                  if (!currentUserId) {
                                    setMessages((prev) => prev.map((row) => row.id === m.id && row.invite
                                      ? { ...row, invite: { ...row.invite, status: 'Pending Response' } }
                                      : row));
                                    setSendNote('Sign in to send');
                                    return;
                                  }
                                  const saved = await postLine(currentUserId, athlete.id, `${ACCEPT_MARK}${m.id}`);
                                  if (!saved.ok) {
                                    setMessages((prev) => prev.map((row) => row.id === m.id && row.invite
                                      ? { ...row, invite: { ...row.invite, status: 'Pending Response' } }
                                      : row));
                                    setSendNote(saved.error || 'Accept did not send');
                                    return;
                                  }
                                  rememberLine(athlete.id, `Accepted ${gymName}`);
                                  onLine?.(`Accepted ${gymName}`);
                                })();
                              }}
                              className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-950"
                            >
                              Accept
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              tactileEngine.triggerSelectionBuzz();
                              if (m.invite?.lat == null || m.invite.lng == null) return;
                              window.open(`https://www.openstreetmap.org/?mlat=${m.invite.lat}&mlon=${m.invite.lng}#map=16/${m.invite.lat}/${m.invite.lng}`, '_blank', 'noopener');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-200 hover:underline cursor-pointer"
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
        <div className="p-3 bg-black border-t border-white/[0.05]">
          {sendNote ? <p className="mb-2 text-center text-[11px] text-neutral-400">{sendNote}</p> : null}
          <div className="flex items-center gap-2">
          {hasReplied || allowCompose ? (
            <>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendCustomMessage();
                }}
                placeholder="Type a message..."
                className="flex-1 bg-o1-well border border-white/[0.07] rounded-full px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-o1-crimson transition"
              />
              <button
                type="button"
                onClick={handleSendCustomMessage}
                disabled={!inputText.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer shadow-md ${
                  inputText.trim()
                    ? 'bg-o1-crimson text-white'
                    : 'bg-white/[0.08] text-neutral-500 opacity-60'
                }`}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </>
          ) : (
            <div className="w-full py-2.5 px-4 rounded-full bg-o1-well border border-white/[0.07] text-center">
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
    </div>
  );
};

export default AthleteMessageModal;
