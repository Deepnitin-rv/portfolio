import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Copy, ExternalLink, Mail } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolio';

export function Contact() {
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [placeholderNote, setPlaceholderNote] = useState<string | null>(null);

  const hasLinkedIn = Boolean(PORTFOLIO_DATA.contact.linkedinUrl.trim());
  const hasGitHub = Boolean(PORTFOLIO_DATA.contact.githubUrl.trim());

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO_DATA.contact.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      id="contact"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card relative overflow-hidden rounded-2xl p-8 sm:p-12"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl"
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold tracking-wide text-cyan-300">
              Get in Touch
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {PORTFOLIO_DATA.contact.heading}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {PORTFOLIO_DATA.contact.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${PORTFOLIO_DATA.contact.email}`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/50 transition-all duration-150 hover:-translate-y-0.5 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>Email Me</span>
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                    <span>Email Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <span>{PORTFOLIO_DATA.contact.email}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Profile Link Placeholders (No invented URLs) */}
          <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-6 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            <p className="text-xs font-medium text-slate-400">
              Developer Profiles
            </p>

            {/* LinkedIn */}
            {hasLinkedIn ? (
              <a
                href={PORTFOLIO_DATA.contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white"
              >
                <span>LinkedIn</span>
                <ExternalLink className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setPlaceholderNote(
                    'LinkedIn profile placeholder — add your LinkedIn URL in src/data/portfolio.ts when ready.'
                  )
                }
                className="flex min-h-[48px] items-center justify-between rounded-xl border border-dashed border-slate-700/80 bg-slate-900/40 px-4 py-3 text-left text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <span>LinkedIn Profile</span>
                <span className="text-xs text-slate-400">Link Placeholder</span>
              </button>
            )}

            {/* GitHub */}
            {hasGitHub ? (
              <a
                href={PORTFOLIO_DATA.contact.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white"
              >
                <span>GitHub</span>
                <ExternalLink className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setPlaceholderNote(
                    'GitHub profile placeholder — add your GitHub URL in src/data/portfolio.ts when ready.'
                  )
                }
                className="flex min-h-[48px] items-center justify-between rounded-xl border border-dashed border-slate-700/80 bg-slate-900/40 px-4 py-3 text-left text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <span>GitHub Profile</span>
                <span className="text-xs text-slate-400">Link Placeholder</span>
              </button>
            )}

            {placeholderNote && (
              <p
                role="status"
                className="mt-1 text-xs leading-relaxed text-cyan-300"
              >
                {placeholderNote}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
