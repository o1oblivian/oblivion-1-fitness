import { safeStorage } from '../utils/safeStorage';

/** Same contact address as the published privacy policy and terms. */
export const SUPPORT_EMAIL = 'o1oblivianfitness@gmail.com';

/** Opens the phone's mail app with a draft; nothing is sent until the person sends it. */
export function openSupportEmail(subject: string, body: string): void {
  const account = safeStorage.getItem<string>('o1fc_user_email', '') || '';
  const footer = account ? `\n\n—\nAccount: ${account}` : '';
  const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + footer)}`;
  window.location.href = href;
}
