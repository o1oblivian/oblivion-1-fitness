import { supabase } from './supabaseClient';

let seq = 0;

/**
 * A fresh realtime channel for database-change listeners. `supabase.channel(name)` hands back an
 * existing channel with the same name, and removing a channel is asynchronous, so a screen that
 * re-subscribes quickly would get the old, already-subscribed channel and crash when adding
 * listeners. A unique suffix makes every subscription its own channel.
 */
export function liveChannel(name: string) {
  seq += 1;
  return supabase.channel(`${name}#${Date.now().toString(36)}${seq}`);
}
