import React, { useEffect, useState } from 'react';
import api from '../services/apiService';
import RomanticButton from './RomanticButton';

interface ContactFormProps {
  initialSubject?: string;
  onSuccess?: () => void;
  badge?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
}

const fieldClassName =
  'w-full rounded-[1.25rem] border border-rose-100 bg-white/70 px-5 py-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-400/10 focus:shadow-[0_0_20px_rgba(244,114,182,0.1)]';

const ContactForm: React.FC<ContactFormProps> = ({
  initialSubject = '',
  onSuccess,
  badge = 'Contact',
  title = 'Start a conversation',
  description = 'Share a few details and we will get your message to the right person.',
  submitLabel = 'Send message',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: initialSubject,
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      subject: initialSubject,
    }));
  }, [initialSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await api.post('/contact', formData);

      setStatus({
        type: 'success',
        message: response.data.message,
      });

      setFormData({
        name: '',
        email: '',
        subject: initialSubject,
        message: '',
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      let message = 'Failed to send message. Please try again.';

      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        message = err.response.data.errors[0].msg;
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }

      setStatus({
        type: 'error',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-rose-100/80 bg-white/88 p-6 shadow-[0_28px_90px_-45px_rgba(190,24,93,0.55)] backdrop-blur-xl md:p-8">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-rose-100/80 via-amber-50/60 to-transparent" />
      <div className="absolute -right-10 top-10 h-32 w-32 rounded-full bg-rose-200/30 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-amber-100/50 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-3">
            <span className="inline-flex rounded-full border border-rose-200 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
              {badge}
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-[2rem]">
              {title}
            </h2>
            <p className="text-sm leading-7 text-slate-500 md:text-base">
              {description}
            </p>
          </div>

          <div className="grid min-w-full gap-3 rounded-[1.75rem] border border-rose-100/80 bg-white/70 p-4 text-left shadow-sm sm:grid-cols-2 lg:min-w-[290px]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Reply window
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Usually within 1 business day
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Best for
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Support, feedback, hiring, and partnerships
              </p>
            </div>
          </div>
        </div>

        {status && (
          <div
            className={`mb-6 rounded-[1.5rem] border px-5 py-4 text-sm font-semibold ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                Your name
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={fieldClassName}
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={fieldClassName}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
              Subject
            </label>
            <input
              type="text"
              required
              placeholder="What can we help with?"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className={fieldClassName}
            />
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
              Message
            </label>
            <textarea
              required
              rows={6}
              placeholder="Share the context, what you expected, and any links or screenshots that help."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className={`${fieldClassName} min-h-[160px] resize-none`}
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-rose-100/80 pt-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Please avoid sharing passwords or sensitive payment details in this
              form.
            </p>

            <RomanticButton
              type="submit"
              disabled={loading}
              className="w-full sm:min-w-[220px]"
            >
              {loading ? 'Sending...' : submitLabel}
            </RomanticButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
