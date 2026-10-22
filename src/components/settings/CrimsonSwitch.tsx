import React from 'react';

interface CrimsonSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  /** Read aloud by screen readers; switches have no visible text of their own. */
  label?: string;
}

export const CrimsonSwitch: React.FC<CrimsonSwitchProps> = ({
  checked,
  onChange,
  id,
  disabled = false,
  label,
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
        checked ? 'bg-o1-crimson' : 'bg-o1-edge'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};
