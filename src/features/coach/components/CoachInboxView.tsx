import React, { useState, useEffect } from 'react';
import { MessageSquare, Inbox, Send } from 'lucide-react';
import { fetchCoachMessages } from '../services/coachService';

export const CoachInboxView: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; time: string; message: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await fetchCoachMessages('coach_alpha');
        if (isMounted) {
          setMessages(data);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setMessages([]);
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-3xl p-4 shadow-sm space-y-4 transition-colors duration-200 select-none">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-tactical font-bold text-xs uppercase text-neutral-900 dark:text-white tracking-wider">
              Encrypted Coach Inbox
            </h4>
            <p className="text-[10px] font-mono text-neutral-500">
              Athlete check-ins and video kinematics stream
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-white/5">
          {messages.length} Messages
        </span>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs font-mono text-neutral-400">
          Syncing inbox messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-[#18181B] border border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-2">
          <Inbox className="w-6 h-6 text-neutral-400 dark:text-neutral-500 mx-auto" />
          <h5 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-tactical uppercase tracking-wider">
            NO RECORDS FOUND // SYNCHRONIZING...
          </h5>
          <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto leading-relaxed">
            Direct check-in inquiries, athlete feedback, and video submissions will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="text-left bg-neutral-50 dark:bg-[#18181B] p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-1"
            >
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-sky-600 dark:text-sky-400 font-bold">{msg.sender}</span>
                <span className="text-neutral-400">{msg.time}</span>
              </div>
              <p className="text-xs text-neutral-800 dark:text-neutral-200">
                &ldquo;{msg.message}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
