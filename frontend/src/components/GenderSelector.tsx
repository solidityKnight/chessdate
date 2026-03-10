import React from 'react';
import { useMatchmaking } from '../hooks/useMatchmaking';

const GenderSelector: React.FC = () => {
  const { selectGender, selectedGender, isInQueue } = useMatchmaking();

  const handleGenderSelect = (gender: 'male' | 'female') => {
    if (!isInQueue) {
      selectGender(gender);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-bold text-center mb-4">Choose Your Gender</h2>

      <div className="flex space-x-4">
        <button
          onClick={() => handleGenderSelect('male')}
          disabled={isInQueue}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
            selectedGender === 'male'
              ? 'bg-blue-600 text-white shadow-lg transform scale-105'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } ${isInQueue ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
        >
          ♂ Male
        </button>

        <button
          onClick={() => handleGenderSelect('female')}
          disabled={isInQueue}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
            selectedGender === 'female'
              ? 'bg-pink-600 text-white shadow-lg transform scale-105'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } ${isInQueue ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
        >
          ♀ Female
        </button>
      </div>

      {selectedGender && !isInQueue && (
        <p className="text-center text-gray-400">
          Selected: <span className="font-semibold text-white">{selectedGender}</span>
        </p>
      )}
    </div>
  );
};

export default GenderSelector;