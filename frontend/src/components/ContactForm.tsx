import React, { useState } from 'react';
import axios from 'axios';
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
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await axios.post('/api/contact', formData);
      setStatus({ type: 'success', message: response.data.message });
      setFormData({ name: '', email: '', subject: '', message: '' });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send message. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Send us a Love Note 💌</h2>
      
      {status && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
          status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Your Name</label>
          <input 
            type="text" 
            required
            className="w-full p-3.5 rounded-2xl border border-pink-100 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
            placeholder="John Doe"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Email Address</label>
          <input 
            type="email" 
            required
            className="w-full p-3.5 rounded-2xl border border-pink-100 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
            placeholder="john@example.com"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Subject</label>
          <input 
            type="text" 
            required
            className="w-full p-3.5 rounded-2xl border border-pink-100 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
            placeholder="What's on your mind?"
            value={formData.subject}
            onChange={e => setFormData({...formData, subject: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Message</label>
          <textarea 
            required
            rows={5}
            className="w-full p-3.5 rounded-2xl border border-pink-100 focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none"
            placeholder="Tell us more..."
            value={formData.message}
            onChange={e => setFormData({...formData, message: e.target.value})}
          />
        </div>

        <div className="pt-2">
          <RomanticButton fullWidth disabled={loading}>
            {loading ? 'Sending Message...' : 'Send Message ✨'}
          </RomanticButton>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
