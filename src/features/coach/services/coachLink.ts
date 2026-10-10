export interface LinkedCoach {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

const LINK_KEY = 'o1_my_coach';

export function readLinkedCoach(): LinkedCoach | null {
  try {
    const raw = localStorage.getItem(LINK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LinkedCoach;
    if (!parsed?.id || !parsed?.name) return null;
    return {
      id: String(parsed.id),
      name: String(parsed.name),
      handle: parsed.handle ? String(parsed.handle) : '',
      avatar: parsed.avatar ? String(parsed.avatar) : '',
    };
  } catch {
    return null;
  }
}

export function saveLinkedCoach(coach: LinkedCoach): void {
  const next: LinkedCoach = {
    id: coach.id,
    name: coach.name,
    handle: coach.handle || '',
    avatar: coach.avatar || '',
  };
  localStorage.setItem(LINK_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('o1-coach-linked'));
}
