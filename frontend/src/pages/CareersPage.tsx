import React, { useState } from 'react';
import RomanticLayout from '../components/RomanticLayout';
import RomanticButton from '../components/RomanticButton';
import ContactForm from '../components/ContactForm';

const CareersPage: React.FC = () => {
  const [showApply, setShowApply] = useState(false);

  return (
    <RomanticLayout>
      <div className="max-w-6xl mx-auto px-4 py-20 animate-fade-in">
        <div className="text-center mb-20 space-y-6">
          <div className="inline-block px-6 py-2 rounded-full bg-pink-100 text-pink-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-sm border border-pink-200/50">
            Join the Kingdom
          </div>
          <h1 className="text-7xl font-black text-gray-900 tracking-tight leading-[0.9]">
            Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600 italic">Future</span> <br/>
            of Love & Chess
          </h1>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto leading-relaxed font-medium italic">
            "Every move matters. Especially the one you make with your career."
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32 items-center">
          <div className="space-y-10 order-2 lg:order-1">
            <h2 className="text-4xl font-black text-gray-800 tracking-tight">Why Join ChessDate? 💖</h2>
            <div className="space-y-8">
              <p className="text-gray-500 text-lg leading-relaxed font-medium">
                At ChessDate, we believe that strategy and romance go hand in hand. 
                We're a fast-growing startup dedicated to creating meaningful connections through 
                the world's greatest game.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: '🌍', text: 'Remote-first culture' },
                  { icon: '🏆', text: 'Internal tournaments' },
                  { icon: '💎', text: 'Equity & Growth' },
                  { icon: '🚀', text: 'Global Impact' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-pink-100 shadow-sm group hover:border-pink-300 hover:bg-white transition-all duration-300">
                    <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{item.icon}</span>
                    <span className="text-sm font-black text-gray-700 uppercase tracking-widest">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="relative order-1 lg:order-2 group">
            <div className="absolute inset-0 bg-pink-400/20 blur-[100px] rounded-full group-hover:bg-pink-400/30 transition-all duration-1000" />
            <div className="relative bg-gradient-to-br from-pink-100 to-rose-100 rounded-[4rem] aspect-square flex flex-col items-center justify-center text-8xl shadow-2xl border-4 border-white rotate-3 group-hover:rotate-0 transition-transform duration-700 overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
               <span className="relative z-10 drop-shadow-2xl animate-float">♟️</span>
               <span className="relative z-10 drop-shadow-2xl mt-[-20px] scale-75 animate-pulse">❤️</span>
            </div>
          </div>
        </div>

        <div className="space-y-16 mb-32">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black text-gray-800 tracking-tight">Open Roles 🔍</h2>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Help us master the board</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Fullstack Developer', type: 'Full-time', dept: 'Engineering', color: 'bg-blue-50' },
              { title: 'UI/UX Designer', type: 'Full-time', dept: 'Product', color: 'bg-pink-50' },
              { title: 'Chess Engine Expert', type: 'Contract', dept: 'Engineering', color: 'bg-indigo-50' },
              { title: 'Community Manager', type: 'Full-time', dept: 'Marketing', color: 'bg-orange-50' },
              { title: 'Internship (AI/ML)', type: 'Seasonal', dept: 'Engineering', color: 'bg-green-50' },
              { title: 'Marketing Lead', type: 'Full-time', dept: 'Growth', color: 'bg-rose-50' }
            ].map((role, i) => (
              <div key={i} className="group relative bg-white p-8 rounded-[2.5rem] border border-pink-50 hover:border-pink-200 transition-all duration-500 hover:shadow-2xl shadow-xl overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 ${role.color} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-50`} />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-8">
                    <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em]">{role.dept}</span>
                    <h3 className="text-2xl font-black text-gray-800 mt-2 group-hover:text-pink-600 transition-colors leading-tight">{role.title}</h3>
                    <div className="inline-block mt-4 px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100">
                      {role.type}
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <RomanticButton variant="secondary" fullWidth onClick={() => setShowApply(true)} className="group-hover:bg-pink-500 group-hover:text-white transition-all">
                      Apply Now <span className="ml-2 transition-transform group-hover:translate-x-1">↗️</span>
                    </RomanticButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showApply && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl my-auto animate-slide-up">
              <button 
                onClick={() => setShowApply(false)}
                className="absolute -top-6 -right-6 z-[110] w-12 h-12 rounded-full bg-white shadow-2xl border-2 border-pink-50 flex items-center justify-center text-xl hover:scale-110 hover:rotate-90 transition-all duration-300"
              >
                ✕
              </button>
              <ContactForm initialSubject="Job Application" onSuccess={() => setTimeout(() => setShowApply(false), 2000)} />
            </div>
          </div>
        )}

        <div className="relative bg-gray-900 rounded-[4rem] p-16 text-center text-white overflow-hidden shadow-2xl group">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-5xl font-black tracking-tight leading-tight">Don't see a role <br/> for you?</h2>
            <p className="text-gray-400 text-lg font-medium italic">
              "Great talents don't wait for openings. They create opportunities." 
              Send us an open application, love.
            </p>
            <div className="pt-4">
              <RomanticButton onClick={() => setShowApply(true)} className="scale-125 hover:scale-150 transition-transform duration-500">
                Open Application ✨
              </RomanticButton>
            </div>
          </div>
        </div>
      </div>
    </RomanticLayout>
  );
};

export default CareersPage;
