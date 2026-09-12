import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Moon, 
  Sun, 
  Laptop, 
  ChevronRight, 
  ExternalLink, 
  Download, 
  LogOut, 
  CreditCard, 
  Smartphone, 
  Sparkles, 
  Palette, 
  Trash2, 
  HelpCircle, 
  MapPin, 
  Share2, 
  X,
  AlertTriangle 
} from 'lucide-react';

interface ErrorBoundaryProps {
  onClose: () => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class SettingsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'An error occurred in settings.' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Settings caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Settings Unavailable</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                The settings dialog encountered a localized issue and was safely contained.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                this.props.onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-semibold transition-all cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark' | 'system';
  onSelectThemeMode?: (theme: 'light' | 'dark' | 'system') => void;
  onOpenGymNetwork?: () => void;
  onExportData?: () => void;
  onLogout?: () => void;
  onSaveProfileImage?: (url: string) => void;
  onSendFeedback?: () => void;
  onOpenPayPlan?: (tier?: string) => void;
  onOpenTravelPass?: () => void;
  onOpenWallpaperSettings?: () => void;
  onDeleteAccount?: () => void;
  onOpenReminders?: () => void;
  triggerToast?: (msg: string) => void;
}

export function SettingsContent({
  isOpen,
  onClose,
  theme = 'system',
  onSelectThemeMode,
  onOpenGymNetwork,
  onExportData,
  onLogout,
  onOpenPayPlan,
  onOpenTravelPass,
  onOpenWallpaperSettings,
  onDeleteAccount,
  onOpenReminders,
  triggerToast
}: SettingsProps) {
  if (!isOpen) return null;

  const isApple = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-screen">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center font-bold text-sm">
              O1
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Membership Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Membership & Billing
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-3.5 border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="min-h-12 px-1 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {isApple ? "Oblivion 1 Club Pass" : "Premium Athlete (Pro)"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {isApple 
                      ? "All Pro features & athletic intelligence active on iOS" 
                      : "Subscription active & fully unlocked"}
                  </p>
                </div>
                {onOpenPayPlan && (
                  <button
                    type="button"
                    onClick={() => onOpenPayPlan("premium")}
                    className="shrink-0 h-7 px-3 rounded-full bg-red-600 text-white text-xs font-semibold flex items-center justify-center hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    {isApple ? "Status" : "Manage"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Preferences
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl divide-y divide-zinc-200/60 dark:divide-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800/60">
              {/* Theme Toggle */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">Appearance</div>
                    <div className="text-xs text-zinc-500 capitalize">{theme} theme</div>
                  </div>
                </div>
                {onSelectThemeMode && (
                  <div className="flex items-center bg-zinc-200/60 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => onSelectThemeMode('light')}
                      className={`px-2.5 py-1 rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-zinc-700 shadow-xs font-semibold text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectThemeMode('dark')}
                      className={`px-2.5 py-1 rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-zinc-700 shadow-xs font-semibold text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectThemeMode('system')}
                      className={`px-2.5 py-1 rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-zinc-700 shadow-xs font-semibold text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                    >
                      Auto
                    </button>
                  </div>
                )}
              </div>

              {/* Reminders */}
              {onOpenReminders && (
                <button
                  type="button"
                  onClick={onOpenReminders}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">Training Reminders</div>
                      <div className="text-xs text-zinc-500">Notifications & schedule prompts</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              )}

              {/* Gym Network */}
              {onOpenGymNetwork && (
                <button
                  type="button"
                  onClick={onOpenGymNetwork}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">Partner Gym Network</div>
                      <div className="text-xs text-zinc-500">Affiliated facilities & guest check-in</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              )}

              {/* Travel Pass */}
              {onOpenTravelPass && (
                <button
                  type="button"
                  onClick={onOpenTravelPass}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">Global Travel Pass</div>
                      <div className="text-xs text-zinc-500">Access elite facilities worldwide</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              )}

              {/* Wallpaper Settings */}
              {onOpenWallpaperSettings && (
                <button
                  type="button"
                  onClick={onOpenWallpaperSettings}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">Dynamic Backgrounds</div>
                      <div className="text-xs text-zinc-500">Custom athletic wallpaper theme</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              )}
            </div>
          </div>

          {/* Data & Account */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Data & Privacy
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl divide-y divide-zinc-200/60 dark:divide-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800/60">
              {onExportData && (
                <button
                  type="button"
                  onClick={onExportData}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">Export Training Vault</div>
                      <div className="text-xs text-zinc-500">Download CSV/JSON activity records</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">Log Out</div>
                      <div className="text-xs text-zinc-500">Sign out of current device session</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              )}

              {onDeleteAccount && (
                <button
                  type="button"
                  onClick={onDeleteAccount}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-red-500/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-red-600">Delete Account</div>
                      <div className="text-xs text-zinc-400">Permanently delete athlete profile</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-xs text-zinc-400">
          <span>Oblivion 1 Fitness Club</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage(props: SettingsProps) {
  if (!props.isOpen) return null;
  return (
    <SettingsErrorBoundary onClose={props.onClose}>
      <SettingsContent {...props} />
    </SettingsErrorBoundary>
  );
}

export default SettingsPage;
