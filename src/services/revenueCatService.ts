import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import { errorMessage } from '../../shared/errorMessage';
import { getAuthenticatedUserId, getCachedUserId } from './authUser';
import { isNativeStorePlatform, resolveNativeStoreKey } from './purchasesService';

/** RevenueCat entitlement that unlocks Club Pass Pro. */
export const REVENUECAT_ENTITLEMENT_PRO = 'o1fc_pro';
/** Google Play base product (base plan id is appended as `o1fc_pro_monthly:monthly`). */
export const REVENUECAT_TIER_MONTHLY = 'o1fc_pro_monthly';
const STORAGE_KEY = 'o1fc_revenuecat_entitlements';
const STATUS_KEY = 'o1fc_subscription_status';

export type PlanKind = 'lifetime' | 'monthly' | 'coach';
export type StorePlatform = 'ios' | 'android' | 'web';

export function planKind(planId: string): PlanKind {
  const id = planId.toLowerCase();
  if (/founder|lifetime/.test(id)) return 'lifetime';
  if (id.includes('coach')) return 'coach';
  return 'monthly';
}

const PLAN_NAMES: Record<PlanKind, string> = {
  lifetime: 'O1 Founder Pass (Lifetime)',
  monthly: 'O1 Pass Pro (Monthly)',
  coach: 'O1 Coach Pro (Monthly)',
};

export interface StoreCatalog {
  packages: PurchasesPackage[];
}

export interface EntitlementInfo {
  isActive: boolean;
  tierId: string;
  tierName: string;
  platform: StorePlatform;
  expiresAt: string | null;
  willRenew: boolean;
}

export type PurchaseResult = { success: boolean; error?: string };

function currentPlatform(): StorePlatform {
  if (!isNativeStorePlatform()) return 'web';
  return Capacitor.getPlatform() === 'android' ? 'android' : 'ios';
}

export function freeEntitlement(platform: StorePlatform = currentPlatform()): EntitlementInfo {
  return {
    isActive: false,
    tierId: 'o1fc_core_free',
    tierName: 'Core Athlete',
    platform,
    expiresAt: null,
    willRenew: false,
  };
}

/** Every package in the current offering, or across all offerings when there is no current one. */
export function packagesFromOfferings(
  offerings: PurchasesOfferings | null | undefined,
): PurchasesPackage[] {
  const current = offerings?.current?.availablePackages;
  if (current?.length) return current;
  return Object.values(offerings?.all ?? {}).flatMap(
    (offering) => offering?.availablePackages ?? [],
  );
}

function packageLabel(pkg: PurchasesPackage): string {
  return `${pkg.identifier} ${pkg.packageType} ${pkg.product.identifier}`.toLowerCase();
}

const productMatches = (id: string, planId: string) => id === planId || id.startsWith(`${planId}:`);

/** The store package for one plan. Each plan only ever resolves to its own kind of product, never a sibling plan. */
export function findPackageForPlan(
  packages: PurchasesPackage[],
  planId: string,
): PurchasesPackage | null {
  const exact = packages.find(
    (pkg) =>
      pkg.identifier === planId ||
      pkg.product.identifier === planId ||
      productMatches(pkg.product.identifier, planId) ||
      productMatches(pkg.identifier, planId),
  );
  if (exact) return exact;
  const kind = planKind(planId);
  return (
    packages.find((pkg) => {
      const label = packageLabel(pkg);
      if (kind === 'lifetime') return /founder|lifetime/.test(label);
      if (kind === 'coach') return label.includes('coach');
      return /month/.test(label) && !/coach|founder|lifetime/.test(label);
    }) ?? null
  );
}

function hasProEntitlement(info: CustomerInfo): boolean {
  return Object.values(info.entitlements.active).some(
    (e) => e.isActive && e.identifier === REVENUECAT_ENTITLEMENT_PRO,
  );
}

/** True when the store shows this specific plan as owned. */
export function ownsPlan(info: CustomerInfo | null | undefined, planId: string): boolean {
  if (!info) return false;
  const kind = planKind(planId);
  const owned =
    kind === 'lifetime' ? info.allPurchasedProductIdentifiers : info.activeSubscriptions;
  if (owned.some((id) => productMatches(id, planId))) return true;
  const active = Object.values(info.entitlements.active).filter((e) => e.isActive);
  if (kind === 'coach')
    return active.some(
      (e) => e.identifier.includes('coach') || e.productIdentifier.includes('coach'),
    );
  if (kind === 'lifetime') {
    return active.some(
      (e) =>
        productMatches(e.productIdentifier, planId) || /founder|lifetime/.test(e.productIdentifier),
    );
  }
  // Monthly Pro: require the o1fc_pro entitlement or a matching product.
  if (active.some((e) => productMatches(e.productIdentifier, planId))) return true;
  return kind === 'monthly' ? hasProEntitlement(info) : active.length > 0;
}

/** Reads the paid plan straight from the store's customer record, with the store's own expiry. */
export function entitlementFromCustomerInfo(
  info: CustomerInfo | null | undefined,
  platform: StorePlatform,
): EntitlementInfo {
  if (!info) return freeEntitlement(platform);
  const active = Object.values(info.entitlements.active).filter((e) => e.isActive);
  // A Coach Pro subscription outranks a Founder Pass held by the same person, so the fee shown matches the server.
  const best =
    active.find((e) => planKind(e.productIdentifier) === 'coach') ??
    active.find((e) => e.expirationDate === null) ??
    active[0];
  if (best) {
    return {
      isActive: true,
      tierId: best.productIdentifier,
      tierName: PLAN_NAMES[planKind(best.productIdentifier)],
      platform,
      expiresAt: best.expirationDate,
      willRenew: best.willRenew,
    };
  }
  const lifetime = info.allPurchasedProductIdentifiers.find((id) => planKind(id) === 'lifetime');
  if (lifetime) {
    return {
      isActive: true,
      tierId: lifetime,
      tierName: PLAN_NAMES.lifetime,
      platform,
      expiresAt: null,
      willRenew: false,
    };
  }
  const subscription = info.activeSubscriptions[0];
  if (subscription) {
    return {
      isActive: true,
      tierId: subscription,
      tierName: PLAN_NAMES[planKind(subscription)],
      platform,
      expiresAt: info.allExpirationDates[subscription] ?? null,
      willRenew: true,
    };
  }
  return freeEntitlement(platform);
}

function isCancelledError(err: unknown): boolean {
  const e = (err ?? {}) as { code?: unknown; userCancelled?: unknown; message?: unknown };
  return (
    e.userCancelled === true || String(e.code) === '1' || /cancel/i.test(String(e.message ?? ''))
  );
}

function isEntitlementInfo(value: unknown): value is EntitlementInfo {
  const v = value as Partial<EntitlementInfo> | null;
  return Boolean(v) && typeof v?.isActive === 'boolean' && typeof v?.tierId === 'string';
}

export function readCachedEntitlement(): EntitlementInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!isEntitlementInfo(parsed)) return null;
    if (parsed.isActive && parsed.expiresAt && Date.parse(parsed.expiresAt) < Date.now())
      return null;
    return parsed;
  } catch {
    return null;
  }
}

function rememberEntitlement(info: EntitlementInfo): void {
  if (typeof window === 'undefined') return;
  try {
    if (!info.isActive) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STATUS_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    localStorage.setItem(
      STATUS_KEY,
      JSON.stringify({
        isActive: true,
        tierId: info.tierId,
        tierName: info.tierName,
        platform: info.platform,
        expirationDate: info.expiresAt,
        willRenew: info.willRenew,
      }),
    );
  } catch {
    /* storage full or blocked; the store stays the source of truth */
  }
}

const STORE_TIMEOUT_MS = 12_000;
/** How long a fetched product list is reused before the store is asked again. */
const CATALOG_TTL_MS = 5 * 60_000;
/** The store sheet stays open while the buyer confirms with a fingerprint or card, so this only catches a sheet that never answers. */
const PURCHASE_TIMEOUT_MS = 180_000;

function withStoreTimeout<T>(
  work: Promise<T>,
  message: string,
  timeoutMs = STORE_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function resolveAppUserId(preferred?: string): Promise<string | null> {
  if (preferred && preferred !== 'default-athlete' && preferred !== 'athlete-c1') return preferred;
  // The store only needs a stable id for the customer. When the server check is slow or the
  // phone is offline, the account already signed in on this device is just as good.
  return (await getAuthenticatedUserId()) ?? (await getCachedUserId());
}

/** Name of the store this phone buys from, for messages the athlete reads. */
function storeName(): string {
  try {
    return Capacitor.getPlatform() === 'ios' ? 'the App Store' : 'Google Play';
  } catch {
    return 'the store';
  }
}

/** Turns a RevenueCat "invalid key" failure into a message that names the key this build used. */
function explainStoreFailure(message: string): string {
  if (!/credential|invalid api key/i.test(message)) return message;
  const key = resolveNativeStoreKey();
  return `RevenueCat rejected the ${storeName()} key in this build (ends ...${key.slice(-4)}). Compare it with the key in RevenueCat, Project settings, API keys.`;
}

class RevenueCatManager {
  private ready: { userId: string; connected: Promise<boolean> } | null = null;
  private issue: string | null = null;
  private catalog: { userId: string; at: number; value: StoreCatalog } | null = null;
  private catalogRequest: Promise<StoreCatalog> | null = null;

  isNative = (): boolean => isNativeStorePlatform();

  /** Why the store last failed to connect or list products, in words the owner can act on. Null when it is working. */
  get lastIssue(): string | null {
    return this.issue;
  }

  /** Detaches the store customer on sign-out or account deletion so the next sign-in starts clean. */
  async logOut(): Promise<void> {
    this.ready = null;
    this.issue = null;
    this.catalog = null;
    this.catalogRequest = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STATUS_KEY);
    } catch {
      /* storage blocked */
    }
    if (!isNativeStorePlatform()) return;
    try {
      const { isConfigured } = await Purchases.isConfigured();
      if (isConfigured)
        await withStoreTimeout(Purchases.logOut(), 'Store sign-out did not answer.', 4_000);
    } catch {
      /* an anonymous store customer cannot log out; nothing to clear */
    }
  }

  private async connect(userId: string): Promise<boolean> {
    const apiKey = resolveNativeStoreKey();
    if (!apiKey) {
      console.warn('[RevenueCat] Native store key missing for', Capacitor.getPlatform());
      this.issue = 'This build has no RevenueCat key for this phone.';
      return false;
    }
    try {
      await withStoreTimeout(
        (async () => {
          const { isConfigured } = await Purchases.isConfigured();
          if (isConfigured) await Purchases.logIn({ appUserID: userId });
          else await Purchases.configure({ apiKey, appUserID: userId });
        })(),
        `${storeName()} billing did not answer.`,
      );
      this.issue = null;
      return true;
    } catch (e) {
      console.warn('[RevenueCat] Store connection failed:', e);
      this.issue = `RevenueCat could not connect: ${explainStoreFailure(errorMessage(e, 'no reason given'))}`;
      return false;
    }
  }

  /** Configures the store once per signed-in user; later calls reuse that connection. */
  async init(appUserId: string = ''): Promise<typeof Purchases | null> {
    if (!isNativeStorePlatform()) return null;
    const userId = await resolveAppUserId(appUserId);
    if (!userId) return null;
    if (!this.ready || this.ready.userId !== userId) {
      this.ready = { userId, connected: this.connect(userId) };
    }
    const attempt = this.ready;
    const connected = await attempt.connected;
    if (!connected && this.ready === attempt) this.ready = null;
    return connected ? Purchases : null;
  }

  /** The product list from the last successful fetch, while it is still fresh. Lets a paywall paint prices at once. */
  peekOfferings(): StoreCatalog | null {
    const hit = this.catalog;
    if (!hit || !this.ready || hit.userId !== this.ready.userId) return null;
    return Date.now() - hit.at < CATALOG_TTL_MS ? hit.value : null;
  }

  /**
   * Store products for the signed-in account. A fresh copy is reused and a request already in flight is shared,
   * so opening the paywall twice, or a purchase right after, does not ask the store again.
   */
  async getOfferings(appUserId?: string): Promise<StoreCatalog> {
    const cached = this.peekOfferings();
    if (cached && (!appUserId || appUserId === this.ready?.userId)) return cached;
    if (this.catalogRequest) return this.catalogRequest;
    const request = this.fetchOfferings(appUserId).finally(() => {
      if (this.catalogRequest === request) this.catalogRequest = null;
    });
    this.catalogRequest = request;
    return request;
  }

  private async fetchOfferings(appUserId?: string): Promise<StoreCatalog> {
    try {
      const client = await this.init(appUserId);
      if (!client) return { packages: [] };
      const packages = packagesFromOfferings(
        await withStoreTimeout(client.getOfferings(), 'Store products did not load.'),
      );
      this.issue = packages.length
        ? null
        : `${storeName()} returned no products. Check that the subscriptions are attached to the default offering in RevenueCat.`;
      const value = { packages };
      if (packages.length && this.ready) {
        this.catalog = { userId: this.ready.userId, at: Date.now(), value };
      }
      return value;
    } catch (err) {
      console.warn('[RevenueCat] Products unavailable:', err);
      this.issue = `${storeName()} products did not load: `;
      return { packages: [] };
    }
  }
  packageForPlan(
    catalog: StoreCatalog | null | undefined,
    planId: string,
  ): PurchasesPackage | null {
    return findPackageForPlan(catalog?.packages ?? [], planId);
  }

  async purchasePackage(
    planId: string = REVENUECAT_TIER_MONTHLY,
    athleteId: string = '',
  ): Promise<PurchaseResult> {
    try {
      const userId = await resolveAppUserId(athleteId);
      if (!userId) return { success: false, error: 'Sign in to subscribe.' };
      if (!isNativeStorePlatform()) {
        return {
          success: false,
          error: 'Subscribe in the iOS or Android app to complete checkout.',
        };
      }

      const client = await this.init(userId);
      if (!client) {
        return {
          success: false,
          error: `Billing is unavailable. ${this.issue ?? 'The store did not answer.'} Install the app from ${storeName()} to subscribe.`,
        };
      }

      const catalog = await this.getOfferings(userId);
      const pkg = findPackageForPlan(catalog.packages, planId);
      if (!pkg && catalog.packages.length === 0) {
        return {
          success: false,
          error: this.issue ?? 'Store products did not load. Check your connection and try again.',
        };
      }
      if (!pkg) {
        return { success: false, error: `This plan is not live in ${storeName()} yet.` };
      }

      const { customerInfo } = await withStoreTimeout(
        client.purchasePackage({ aPackage: pkg }),
        `${storeName()} did not confirm the purchase. If you were charged, tap Restore Purchases.`,
        PURCHASE_TIMEOUT_MS,
      );
      if (!ownsPlan(customerInfo, planId)) {
        return {
          success: false,
          error:
            'Purchase completed but the plan was not found on this account yet. Try Restore Purchases.',
        };
      }
      await this.recordPlan(entitlementFromCustomerInfo(customerInfo, currentPlatform()), userId);
      return { success: true };
    } catch (err: unknown) {
      if (isCancelledError(err)) return { success: false, error: 'Checkout cancelled.' };
      const message =
        err instanceof Error ? err.message : String((err as { message?: unknown })?.message ?? err);
      console.warn('[RevenueCat] Store billing error:', err);
      return { success: false, error: explainStoreFailure(message) || 'Store billing error.' };
    }
  }

  private async recordPlan(info: EntitlementInfo, _userId: string): Promise<void> {
    rememberEntitlement(info);
  }

  /** Asks the store first. Returns null only when the store could not be reached. */
  async verifyWithStore(userId: string = ''): Promise<EntitlementInfo | null> {
    try {
      const client = await this.init(userId);
      if (!client) return null;
      const { customerInfo } = await withStoreTimeout(
        client.getCustomerInfo(),
        'Store account did not load.',
      );
      const info = entitlementFromCustomerInfo(customerInfo, currentPlatform());
      await this.recordPlan(info, (await resolveAppUserId(userId)) || '');
      return info;
    } catch (err) {
      console.warn('[RevenueCat] Customer info unavailable:', err);
      return null;
    }
  }

  async getCustomerEntitlements(userId: string = ''): Promise<EntitlementInfo> {
    return (await this.verifyWithStore(userId)) ?? readCachedEntitlement() ?? freeEntitlement();
  }

  async restore(userId: string = ''): Promise<{ success: boolean; info: EntitlementInfo }> {
    try {
      const client = await this.init(userId);
      if (client) {
        const { customerInfo } = await client.restorePurchases();
        const info = entitlementFromCustomerInfo(customerInfo, currentPlatform());
        await this.recordPlan(info, (await resolveAppUserId(userId)) || '');
        return { success: info.isActive, info };
      }
    } catch (err) {
      console.warn('[RevenueCat] Restore failed:', err);
    }
    const info = readCachedEntitlement() ?? freeEntitlement();
    return { success: info.isActive, info };
  }
}

export const revenueCatService = new RevenueCatManager();
