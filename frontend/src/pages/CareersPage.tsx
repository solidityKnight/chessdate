import React, { useState } from 'react';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import ContactForm from '../components/ContactForm';

const CareersPage: React.FC = () => {
  const [showApply, setShowApply] = useState(false);

  return (
    <RomanticLayout>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">Build the Future of Love & Chess 🏆</h1>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            Join the ChessDate team and help us build the world's most strategic dating platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Why Work at ChessDate? 💖</h2>
            <p className="text-gray-600 leading-relaxed">
              At ChessDate, we believe that strategy and romance go hand in hand. 
              We're a fast-growing startup dedicated to creating meaningful connections through 
              the world's greatest game.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-700">
                <span className="text-pink-500 text-xl">✓</span> Remote-first culture
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <span className="text-pink-500 text-xl">✓</span> Weekly internal chess tournaments
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <span className="text-pink-500 text-xl">✓</span> Competitive compensation and equity
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <span className="text-pink-500 text-xl">✓</span> Opportunity to impact millions of lives
              </li>
            </ul>
          </div>
          <div className="bg-pink-100 rounded-[3rem] aspect-square flex items-center justify-center text-8xl shadow-inner rotate-3">
            ♟️❤️
          </div>
        </div>

        <div className="space-y-12 mb-20">
          <h2 className="text-3xl font-bold text-gray-800 text-center">Open Roles 🔍</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Fullstack Developer', type: 'Full-time', dept: 'Engineering' },
              { title: 'UI/UX Designer', type: 'Full-time', dept: 'Product' },
              { title: 'Chess Engine Expert', type: 'Contract', dept: 'Engineering' },
              { title: 'Community Manager', type: 'Full-time', dept: 'Marketing' },
              { title: 'Internship (AI/ML)', type: 'Seasonal', dept: 'Engineering' },
              { title: 'Marketing Lead', type: 'Full-time', dept: 'Growth' }
            ].map((role, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-pink-50 hover:border-pink-200 transition-all hover:shadow-lg shadow-sm group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-pink-600 transition-colors">{role.title}</h3>
                    <p className="text-sm text-gray-500">{role.dept} • {role.type}</p>
                  </div>
                  <span className="text-2xl opacity-40 group-hover:opacity-100 transition-opacity">↗️</span>
                </div>
                <RomanticButton variant="secondary" onClick={() => setShowApply(true)}>Apply Now</RomanticButton>
              </div>
            ))}
          </div>
        </div>

        {showApply && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-2xl py-8">
              <button 
                onClick={() => setShowApply(false)}
                className="absolute right-4 top-12 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-xl hover:scale-110 transition-transform"
              >
                ✕
              </button>
              <ContactForm initialSubject="Job Application" onSuccess={() => setTimeout(() => setShowApply(false), 2000)} />
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-[3rem] p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Don't see a role for you?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            We're always looking for talented individuals who love chess and romance. 
            Send us an open application!
          </p>
          <RomanticButton onClick={() => setShowApply(true)}>Open Application</RomanticButton>
        </div>
      </div>
    </RomanticLayout>
  );
};

export default CareersPage;
