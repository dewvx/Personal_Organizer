import React from 'react';

export const EntryCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-200" />
          <div className="w-20 h-5 rounded-full bg-slate-200" />
        </div>
        <div className="w-16 h-5 rounded-full bg-slate-200" />
      </div>
      <div className="w-3/4 h-5 rounded bg-slate-200" />
      <div className="w-1/2 h-4 rounded bg-slate-100" />
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="w-24 h-4 rounded bg-slate-100" />
        <div className="w-14 h-4 rounded bg-slate-100" />
      </div>
    </div>
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm animate-pulse flex items-center justify-between">
      <div className="space-y-2">
        <div className="w-20 h-4 rounded bg-slate-200" />
        <div className="w-14 h-7 rounded bg-slate-300" />
      </div>
      <div className="w-12 h-12 rounded-2xl bg-slate-100" />
    </div>
  );
};
