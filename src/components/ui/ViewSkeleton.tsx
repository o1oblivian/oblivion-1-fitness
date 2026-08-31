import React from 'react';

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-white/[0.04] border border-white/[0.06] overflow-hidden relative ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

export function ViewSkeleton() {
  return (
    <div className="w-full h-full p-4 space-y-4 animate-fadeIn">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Shimmer className="h-8 w-32" />
        <Shimmer className="h-8 w-8 rounded-full" />
      </div>
      {/* Hero card */}
      <Shimmer className="h-44 w-full" />
      {/* Content rows */}
      <div className="grid grid-cols-2 gap-3">
        <Shimmer className="h-24" />
        <Shimmer className="h-24" />
      </div>
      <Shimmer className="h-16 w-full" />
      <Shimmer className="h-16 w-full" />
      <Shimmer className="h-32 w-full" />
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="w-full p-4 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Shimmer className="h-6 w-40" />
        <Shimmer className="h-8 w-8 rounded-full" />
      </div>
      <Shimmer className="h-12 w-full" />
      <Shimmer className="h-12 w-full" />
      <Shimmer className="h-32 w-full" />
    </div>
  );
}
