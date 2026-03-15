import React from 'react';
import RomanticLayout from '../components/RomanticLayout';
import ContactForm from '../components/ContactForm';

const supportChannels = [
  {
    label: 'Support inbox',
    title: 'Account issues, bugs, and feature questions',
    detail: 'support@chessdate.in',
    note: 'Best route for anything that needs a direct response.',
  },
  {
    label: 'Product feedback',
    title: 'Ideas from the community',
    detail: 'Send it through the form on this page',
    note: 'Context, screenshots, and reproduction steps help a lot.',
  },
  {
    label: 'Press and partnerships',
    title: 'Tell us what you are building or covering',
    detail: 'Use the same contact form and include your timeline',
    note: 'We can route it internally once we have the details.',
  },
];

const messageChecklist = [
  'What you were trying to do',
  'What happened instead',
  'The device or browser you used',
  'Links or screenshots if they help',
];

const focusAreas = [
  'Player support',
  'Feature feedback',
  'Partnership requests',
];

const ContactPage: React.FC = () => {
  return (
    <RomanticLayout>
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <section className="relative overflow-hidden rounded-[2.75rem] border border-rose-100/80 bg-white/78 px-6 py-8 shadow-[0_30px_100px_-45px_rgba(190,24,93,0.45)] backdrop-blur-xl md:px-10 md:py-10">
          <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-rose-200/35 blur-3xl" />
          <div className="absolute right-0 top-8 h-48 w-48 rounded-full bg-amber-100/55 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-rose-100/55 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-rose-200 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                Contact
              </span>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl md:leading-[0.95]">
                  A cleaner, calmer way to reach the team.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
                  Whether you need help with your account, want to share product
                  feedback, or have a partnership idea, this page is designed to
                  get the right information to the right people quickly.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.75rem] border border-rose-100/80 bg-white/70 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Reply window
                  </p>
                  <p className="mt-3 text-lg font-black text-slate-900">
                    1 business day
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-rose-100/80 bg-white/70 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Best for
                  </p>
                  <p className="mt-3 text-lg font-black text-slate-900">
                    Support and feedback
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-rose-100/80 bg-white/70 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Routing
                  </p>
                  <p className="mt-3 text-lg font-black text-slate-900">
                    Reviewed by humans
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2.25rem] border border-white/10 bg-slate-900 p-6 text-white shadow-[0_24px_80px_-45px_rgba(15,23,42,0.95)]">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-200">
                Best way to help us help you
              </p>
              <div className="mt-5 space-y-4">
                {messageChecklist.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-sm leading-7 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            {supportChannels.map((channel) => (
              <article
                key={channel.label}
                className="rounded-[2.5rem] border border-rose-100/50 bg-white/90 p-8 shadow-[0_40px_80px_-30px_rgba(190,24,93,0.3)] backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_50px_100px_-40px_rgba(190,24,93,0.4)] hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                    {channel.label}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                  {channel.title}
                </h2>
                <p className="mt-4 text-base font-semibold text-slate-700">
                  {channel.detail}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {channel.note}
                </p>
              </article>
            ))}

            <article className="rounded-[2rem] border border-dashed border-rose-200 bg-white/65 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                Common topics
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {focusAreas.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          </div>

          <div className="lg:sticky lg:top-8">
            <ContactForm
              badge="Support desk"
              title="Send a message"
              description="Account help, bug reports, product feedback, and partnership requests all start here."
              submitLabel="Send message"
            />
          </div>
        </section>
      </div>
    </RomanticLayout>
  );
};

export default ContactPage;
