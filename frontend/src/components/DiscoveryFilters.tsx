import React from 'react';
import type { PlayerFilters } from '../types/social';

interface DiscoveryFiltersProps {
  filters: PlayerFilters;
  onChange: (filters: PlayerFilters) => void;
}

const toggleOptions: Array<{
  key: keyof Pick<PlayerFilters, 'online' | 'followersOnly' | 'availableToMessage'>;
  label: string;
}> = [
  { key: 'online', label: 'Online now' },
  { key: 'followersOnly', label: 'Follows you' },
  { key: 'availableToMessage', label: 'Can message' },
];

const DiscoveryFilters: React.FC<DiscoveryFiltersProps> = ({ filters, onChange }) => {
  const updateField = <K extends keyof PlayerFilters>(key: K, value: PlayerFilters[K]) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="page-glass-card rounded-[2rem] p-4 md:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.1fr]">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Min elo
          </span>
          <input
            type="number"
            min="0"
            value={filters.minElo}
            onChange={(event) => updateField('minElo', event.target.value)}
            className="rounded-[1.2rem] border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-200/40"
            placeholder="900"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Max elo
          </span>
          <input
            type="number"
            min="0"
            value={filters.maxElo}
            onChange={(event) => updateField('maxElo', event.target.value)}
            className="rounded-[1.2rem] border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-200/40"
            placeholder="2200"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Country
          </span>
          <input
            type="text"
            value={filters.country}
            onChange={(event) => updateField('country', event.target.value)}
            className="rounded-[1.2rem] border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-200/40"
            placeholder="India"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {toggleOptions.map((option) => {
          const active = filters[option.key];

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => updateField(option.key, !active)}
              className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                active
                  ? 'border-rose-200 bg-rose-500 text-white shadow-[0_18px_36px_-24px_rgba(190,24,93,0.55)]'
                  : 'border-rose-100 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DiscoveryFilters;
