import { motion, useReducedMotion } from 'motion/react';
import { PORTFOLIO_DATA } from '../data/portfolio';

export function About() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="about"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-wide text-cyan-300">
            Profile
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {PORTFOLIO_DATA.profile.aboutHeading}
          </h2>
        </div>

        <div className="glass-card relative overflow-hidden rounded-2xl p-6 sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl"
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              <p className="text-base leading-relaxed text-slate-200 sm:text-lg sm:leading-relaxed">
                {PORTFOLIO_DATA.profile.aboutContent}
              </p>
            </div>

            <div className="flex flex-col justify-between gap-6 border-t border-slate-800/80 pt-6 lg:col-span-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Current Focus
                </p>
                <p className="mt-1 font-display text-base font-semibold text-white">
                  Artificial Intelligence &amp; Machine Learning
                </p>
              </div>

              <div className="border-t border-slate-800/70 pt-5">
                <p className="text-xs font-medium text-slate-400">
                  Academic Track
                </p>
                <p className="mt-1 font-display text-base font-semibold text-white">
                  B.Tech CSE (AI &amp; ML) · Jain University
                </p>
              </div>

              <div className="border-t border-slate-800/70 pt-5">
                <p className="text-xs font-medium text-slate-400">
                  Core Languages
                </p>
                <p className="mt-1 font-mono text-sm text-cyan-300">
                  Python · C · C++ · Java
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
