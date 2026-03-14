
import React, { useState } from 'react';
import api from '../services/apiService';
import RomanticButton from './RomanticButton';

interface ContactFormProps {
  initialSubject?: string;
  onSuccess?: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ initialSubject = '', onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: initialSubject,
    message: ''
  });

  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<{
    type: 'success' | 'error',
    message: string
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await api.post('/contact', formData);

      setStatus({
        type: 'success',
        message: response.data.message
      });

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

      if (onSuccess) onSuccess();

    } catch (err: any) {

      let message = 'Failed to send message. Please try again.';

      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        message = err.response.data.errors[0].msg;
      } 
      else if (err.response?.data?.message) {
        message = err.response.data.message;
      }

      setStatus({
        type: 'error',
        message
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-pink-100 p-10 relative overflow-hidden group">

      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-100/30 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

      <div className="relative z-10">

        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
            💌
          </div>

          <h2 className="text-3xl font-black text-gray-900 tracking-tight text-center">
            Send us a <span className="text-pink-500 italic">Love Note</span>
          </h2>

          <p className="text-gray-400 text-sm mt-2 font-medium italic text-center">
            We'll get back to you faster than a scholar's mate.
          </p>
        </div>

        {status && (
          <div className={`mb-8 p-5 rounded-2xl text-sm font-black tracking-tight flex items-center gap-3 animate-bounce ${
            status.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            <span className="text-xl">
              {status.type === 'success' ? '✅' : '❌'}
            </span>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-2">
              <label className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] ml-2">
                Your Name
              </label>

              <input
                type="text"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-4 rounded-2xl bg-pink-50/30 border-2 border-transparent focus:border-pink-500 focus:bg-white focus:ring-8 focus:ring-pink-500/5 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 placeholder:font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] ml-2">
                Email Address
              </label>

              <input
                type="email"
                required
                placeholder="john@example.com"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-4 rounded-2xl bg-pink-50/30 border-2 border-transparent focus:border-pink-500 focus:bg-white focus:ring-8 focus:ring-pink-500/5 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 placeholder:font-medium"
              />
            </div>

          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] ml-2">
              Subject
            </label>

            <input
              type="text"
              required
              placeholder="What's on your mind?"
              value={formData.subject}
              onChange={e =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full p-4 rounded-2xl bg-pink-50/30 border-2 border-transparent focus:border-pink-500 focus:bg-white focus:ring-8 focus:ring-pink-500/5 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 placeholder:font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] ml-2">
              Message
            </label>

            <textarea
              required
              rows={5}
              placeholder="Tell us more about your grand strategy..."
              value={formData.message}
              onChange={e =>
                setFormData({ ...formData, message: e.target.value })
              }
              className="w-full p-4 rounded-2xl bg-pink-50/30 border-2 border-transparent focus:border-pink-500 focus:bg-white focus:ring-8 focus:ring-pink-500/5 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 placeholder:font-medium resize-none"
            />
          </div>

          <div className="pt-4">

            <RomanticButton fullWidth disabled={loading}>

              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending Message...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Send Message</span>
                  <span className="text-lg">✨</span>
                </div>
              )}

            </RomanticButton>

          </div>

        </form>

      </div>
    </div>
  );
};

export default ContactForm;

