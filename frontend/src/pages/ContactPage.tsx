import React from 'react';
import RomanticLayout from '../components/RomanticLayout';
import ContactForm from '../components/ContactForm';

const ContactPage: React.FC = () => {
  return (
    <RomanticLayout>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
        `}
      </style>
      
      <div className="max-w-4xl mx-auto px-4 py-16 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        </div>

        {/* Header section with animation */}
        <div className="text-center mb-12 animate-fadeInUp">
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-6 leading-tight">
            We'd Love to Hear From You
            <span className="inline-block ml-2 animate-heartbeat" style={{ animation: 'heartbeat 1.5s ease-in-out infinite' }}>💖</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Whether you have a question about our features, need help with your account, 
            or just want to share some feedback, <span className="text-pink-500 font-semibold">we're here for you</span>.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-purple-300 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start relative">
          {/* Contact info cards */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-pink-100 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  📍
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 text-lg">Our Location</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Global Chess Headquarters<br />
                    <span className="text-pink-500">Virtual Love City</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-pink-100 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  💌
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 text-lg">Direct Email</h3>
                  <a href="mailto:support@chessdate.in" className="text-sm text-gray-500 hover:text-pink-500 transition-colors duration-300 block group-hover:underline">
                    support@chessdate.in
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-pink-100 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-start gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md animate-float">
                  🕊️
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 text-lg">Follow Us</h3>
                  <p className="text-sm text-gray-500 hover:text-pink-500 transition-colors duration-300 cursor-pointer">
                    @ChessDateOfficial
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative element */}
            <div className="hidden md:block relative h-32">
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-pink-400 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Contact form container */}
          <div className="md:col-span-2 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 border border-pink-100 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300"></div>
              <div className="p-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>

        {/* Additional floating hearts */}
        <div className="absolute bottom-10 left-10 opacity-20 pointer-events-none animate-float" style={{ animationDelay: '0.5s' }}>
          <span className="text-4xl">❤️</span>
        </div>
        <div className="absolute top-20 right-20 opacity-20 pointer-events-none animate-float" style={{ animationDelay: '1s' }}>
          <span className="text-3xl">💕</span>
        </div>
        <div className="absolute bottom-20 right-1/4 opacity-20 pointer-events-none animate-float" style={{ animationDelay: '1.5s' }}>
          <span className="text-2xl">💗</span>
        </div>
      </div>

      <style>
        {`
          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out forwards;
          }
          
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          
          .animate-heartbeat {
            animation: heartbeat 1.5s ease-in-out infinite;
          }
          
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          
          .hover\\:shadow-3xl:hover {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
          
          /* Smooth scrolling for the whole page */
          * {
            scroll-behavior: smooth;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #fce4ec;
          }
          
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #f9a8d4, #c084fc);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #f472b6, #a855f7);
          }
        `}
      </style>
    </RomanticLayout>
  );
};

export default ContactPage;
