import React from 'react';
import RomanticLayout from '../components/RomanticLayout';
import ContactForm from '../components/ContactForm';

const ContactPage: React.FC = () => {
  return (
    <RomanticLayout>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">We'd Love to Hear From You 💖</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Whether you have a question about our features, need help with your account, 
            or just want to share some feedback, we're here for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          <div className="md:col-span-1 space-y-8 pt-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-2xl flex-shrink-0">
                📍
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Our Location</h3>
                <p className="text-sm text-gray-500">Global Chess Headquarters<br />Virtual Love City</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-2xl flex-shrink-0">
                💌
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Direct Email</h3>
                <p className="text-sm text-gray-500">support@chessdate.in</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-2xl flex-shrink-0">
                🕊️
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Follow Us</h3>
                <p className="text-sm text-gray-500">@ChessDateOfficial</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </RomanticLayout>
  );
};

export default ContactPage;
