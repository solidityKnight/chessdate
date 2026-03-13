import React from 'react';

interface DistanceSelectorProps {
  value: number | string;
  onChange: (radius: number | string) => void;
  className?: string;
}

const DistanceSelector: React.FC<DistanceSelectorProps> = ({ value, onChange, className = '' }) => {
  const options = [
    { label: '5 km', value: 5 },
    { label: '50 km', value: 50 },
    { label: '100 km', value: 100 },
    { label: 'Global', value: 'Global' }
  ];

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">Matchmaking Radius</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onChange(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === option.value
                ? 'bg-pink-500 text-white'
                : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DistanceSelector;
