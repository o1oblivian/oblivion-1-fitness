import React from 'react';

interface DeleteConfirmProps {
  /** Accessible name of the dialog, e.g. "Delete Food". */
  label: string;
  /** The question shown to the member. */
  children: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Inline "are you sure" bar used when removing a day's entry, lift or meal. */
export const DeleteConfirm: React.FC<DeleteConfirmProps> = ({
  label,
  children,
  onCancel,
  onConfirm,
}) => (
  <div
    role="alertdialog"
    aria-label={label}
    className="flex items-center gap-2 rounded-xl bg-o1-well border border-o1-crimson/40 pl-3 pr-1.5 py-1.5"
  >
    <p className="flex-1 min-w-0 text-o1-caption text-o1-text leading-snug">{children}</p>
    <button
      type="button"
      onClick={onCancel}
      className="h-8 px-3 rounded-full text-o1-caption text-o1-muted hover:text-o1-text cursor-pointer"
    >
      Cancel
    </button>
    <button
      type="button"
      onClick={onConfirm}
      className="h-8 px-3 rounded-full bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-o1-caption text-white cursor-pointer"
    >
      Delete
    </button>
  </div>
);
