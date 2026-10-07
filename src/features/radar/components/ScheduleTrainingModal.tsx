import React, { useState } from 'react';
import { DemoAthlete } from '../types';
import { X, Calendar, MapPin, Check, Sparkles } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  athlete: DemoAthlete | null;
  onInviteSent: (details: { gym: string; dateTime: string }) => void;
}

const DATES = [
  { day: 'TODAY', date: '21', full: 'Sep 21' },
  { day: 'TUE', date: '22', full: 'Sep 22' },
  { day: 'WED', date: '23', full: 'Sep 23' },
  { day: 'THU', date: '24', full: 'Sep 24' },
  { day: 'FRI', date: '25', full: 'Sep 25' },
  { day: 'SAT', date: '26', full: 'Sep 26' },
];

const TIME_SLOTS = ['Morning 7:00 AM', 'Midday 12:30 PM', 'Evening 6:00 PM'];
const VERIFIED_GYMS = [
  { id: 'g1', name: 'Oblivion 1 • Downtown Flagship', dist: '0.8 km' },
  { id: 'g2', name: 'IronWorks Athletic Club', dist: '2.4 km' },
  { id: 'g3', name: 'Equinox • Central Corridor', dist: '4.1 km' },
];

export const ScheduleTrainingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  athlete,
  onInviteSent,
}) => {
  const [selectedDateIdx, setSelectedDateIdx] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [selectedGymId, setSelectedGymId] = useState(VERIFIED_GYMS[0].id);

  if (!isOpen || !athlete) return null;
  const gym = VERIFIED_GYMS.find((g) => g.id === selectedGymId) || VERIFIED_GYMS[0];

  const handleConfirm = () => {
    tactileEngine.triggerSelectionBuzz();
    onInviteSent({ gym: gym.name, dateTime: `${DATES[selectedDateIdx].full} @ ${selectedSlot}` });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-4 shadow-xl text-white space-y-3 overflow-y-auto relative"
      >
        {/* Concierge Pass Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-o1-crimson/10 border border-o1-crimson/30 flex items-center justify-center text-o1-crimson">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#0EA5E9] font-bold block">CONCIERGE PASS</span>
              <h3 className="text-sm font-bold text-white tracking-tight font-tactical">Schedule with {athlete.name}</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Date Pills */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Select Training Date</span>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {DATES.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { tactileEngine.triggerDialHaptic(); setSelectedDateIdx(idx); }}
                className={`flex-1 min-w-[54px] py-2.5 px-2 rounded-2xl flex flex-col items-center transition cursor-pointer border ${
                  selectedDateIdx === idx ? 'bg-o1-crimson border-o1-crimson text-white shadow-md' : 'bg-black border-white/[0.07] text-neutral-400 hover:text-white'
                }`}
              >
                <span className="text-[9px] font-mono font-bold tracking-wider">{item.day}</span>
                <span className="text-base font-mono font-black mt-0.5">{item.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Slot Segmented Controls */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Session Window</span>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black border border-white/[0.07]">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => { tactileEngine.triggerDialHaptic(); setSelectedSlot(slot); }}
                className={`py-2 px-1 rounded-xl text-[11px] font-mono font-bold transition text-center truncate cursor-pointer ${
                  selectedSlot === slot ? 'bg-o1-crimson text-white shadow-sm font-tactical' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {slot.replace('Morning ', '').replace('Midday ', '').replace('Evening ', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Verified Partner Gym Selector */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">Select Verified Gym</span>
          <div className="space-y-2">
            {VERIFIED_GYMS.map((g) => (
              <div
                key={g.id}
                onClick={() => { tactileEngine.triggerDialHaptic(); setSelectedGymId(g.id); }}
                className={`p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                  selectedGymId === g.id ? 'bg-o1-well border-white/[0.07] text-white' : 'bg-black border-white/[0.07] text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className={`w-4 h-4 shrink-0 ${selectedGymId === g.id ? 'text-white' : 'text-neutral-500'}`} />
                  <div>
                    <p className="text-xs font-bold text-white">{g.name}</p>
                    <p className="text-[10px] font-mono text-neutral-400">{g.dist} • Verified Oblivion Facility</p>
                  </div>
                </div>
                {selectedGymId === g.id && <Check className="w-4 h-4 text-white/80 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 text-xs font-semibold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Confirm Joint Session</span>
        </button>
      </div>
    </div>
  );
};

export default ScheduleTrainingModal;
