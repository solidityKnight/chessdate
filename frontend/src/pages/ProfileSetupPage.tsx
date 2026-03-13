import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/apiService';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import DistanceSelector from '../components/DistanceSelector';

const ProfileSetupPage: React.FC = () => {
  const { user, setUser } = useGameStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    age: '',
    bio: '',
    interests: [] as string[],
    city: '',
    country: '',
    latitude: null as number | null,
    longitude: null as number | null,
    preferredMatchDistance: 100,
    learnMode: true,
    profilePhoto: ''
  });

  const interestsOptions = ['Chess', 'Reading', 'Music', 'Travel', 'Sports', 'Art', 'Coding', 'Cooking', 'Movies', 'Gaming'];

  useEffect(() => {
    if (user?.displayName) {
      // If profile already set up, redirect to play
      navigate('/play');
    }
  }, [user, navigate]);

  const handleLocationDetect = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        // You could also reverse geocode here if you had an API key
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleToggleInterest = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== interest)
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.put('/user/profile', formData);
      setUser(response.data.user);
      navigate('/play');
    } catch (err) {
      console.error('Failed to setup profile', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RomanticLayout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile 💖</h1>
            <p className="text-gray-500">Let's find your perfect chess match.</p>
            
            <div className="flex justify-center mt-6 gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-2 w-12 rounded-full transition-colors ${step >= s ? 'bg-pink-500' : 'bg-pink-100'}`} />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Basic Info</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input 
                  type="text"
                  className="w-full p-3 rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="How should we call you?"
                  value={formData.displayName}
                  onChange={e => setFormData({...formData, displayName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input 
                    type="number"
                    className="w-full p-3 rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo URL</label>
                  <input 
                    type="text"
                    className="w-full p-3 rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="https://..."
                    value={formData.profilePhoto}
                    onChange={e => setFormData({...formData, profilePhoto: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea 
                  className="w-full p-3 rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                />
              </div>
              <RomanticButton fullWidth onClick={() => setStep(2)}>Next Step</RomanticButton>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Location & Distance</h2>
              <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100">
                <p className="text-sm text-pink-700 mb-4">We use your location to find nearby players.</p>
                <RomanticButton variant="secondary" fullWidth onClick={handleLocationDetect}>
                  📍 Detect My Location
                </RomanticButton>
                {formData.latitude && (
                  <p className="text-xs text-green-600 mt-2 text-center font-medium">✓ Location detected!</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input 
                    type="text"
                    className="w-full p-3 rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input 
                    type="text"
                    className="w-full p-3 rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                  />
                </div>
              </div>
              <DistanceSelector 
                value={formData.preferredMatchDistance} 
                onChange={val => setFormData({...formData, preferredMatchDistance: val === 'Global' ? Infinity : Number(val)})}
              />
              <div className="flex items-center gap-3 bg-pink-50 p-4 rounded-2xl border border-pink-100">
                <div 
                  onClick={() => setFormData({...formData, learnMode: !formData.learnMode})}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative ${formData.learnMode ? 'bg-pink-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.learnMode ? 'left-7' : 'left-1'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Learn While Dating Mode</span>
                  <span className="text-xs text-gray-500">Get helpful chess tips while you play!</span>
                </div>
              </div>
              <div className="flex gap-3">
                <RomanticButton variant="secondary" onClick={() => setStep(1)}>Back</RomanticButton>
                <RomanticButton fullWidth onClick={() => setStep(3)}>Next Step</RomanticButton>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Interests</h2>
              <p className="text-sm text-gray-500">Select what you love to talk about.</p>
              <div className="flex flex-wrap gap-2">
                {interestsOptions.map(interest => (
                  <button
                    key={interest}
                    onClick={() => handleToggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.interests.includes(interest)
                        ? 'bg-pink-500 text-white'
                        : 'bg-pink-50 text-pink-700 border border-pink-100'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-10">
                <RomanticButton variant="secondary" onClick={() => setStep(2)}>Back</RomanticButton>
                <RomanticButton fullWidth onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Saving...' : 'Finish Setup ✨'}
                </RomanticButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </RomanticLayout>
  );
};

export default ProfileSetupPage;
