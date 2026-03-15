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
      <div className="page-shell">
        <section className="page-hero-card px-6 py-8 md:px-10 md:py-10">
          <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-rose-200/35 blur-3xl" />
          <div className="absolute right-0 top-8 h-48 w-48 rounded-full bg-amber-100/55 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-rose-100/55 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-rose-200 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                Contact
              </span>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl md:leading-[0.95]">
                  A calmer, cleaner way to reach the team.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
                  Whether you need help with your account, want to share product
                  feedback, or have a partnership idea, this page is designed to
                  get the right information to the right people quickly.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Reply window
                  </p>
                  <p className="mt-3 text-lg font-black text-slate-900">
                    1 business day
                  </p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Support lanes
                  </p>
                  <p className="mt-3 text-lg font-black text-slate-900">
                    {supportChannels.length} routes
                  </p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Best for
                  </p>
                  <p className="mt-3 text-lg font-black text-slate-900">
                    Support and feedback
                  </p>
                </div>
                <div className="page-stat-card rounded-[1.75rem] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Reviewed by
                  </p>
                  <p className="mt-3 text-lg font-black text-slate-900">
                    Real humans
                  </p>
                </div>
              </div>
            </div>

            <div className="page-dark-card rounded-[2.35rem] p-6 text-white">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-rose-300/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-amber-200/10 blur-3xl" />

              <div className="relative z-10 space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-200">
                    Best way to help us help you
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                    The clearest message gets the fastest route.
                  </h2>
                </div>

                <div className="space-y-3">
                  {messageChecklist.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[10px] font-black uppercase tracking-[0.18em] text-rose-100">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-7 text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-200">
                    Good subject lines
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {focusAreas.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            {supportChannels.map((channel, index) => (
              <article
                key={channel.label}
                className="page-glass-card rounded-[2.35rem] p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_38px_90px_-42px_rgba(190,24,93,0.42)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                    {channel.label}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
                    0{index + 1}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
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

            <article className="page-dashed-card rounded-[2rem] p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">
                What happens next
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.35rem] border border-white/60 bg-white/75 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Step one
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    Your note is routed to the right person.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-white/60 bg-white/75 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Step two
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    We reply with the next step or follow-up questions.
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div className="lg:sticky lg:top-28">
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
