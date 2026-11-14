import { motion, useReducedMotion } from 'motion/react';
import { Globe2 } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolio';
import { LanguageIcon } from './LanguageIcons';

export function Skills() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="skills"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      {/* Technical Skills */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-wide text-cyan-300">
            Programming Languages
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Technical Skills
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PORTFOLIO_DATA.skills.map((skill, idx) => (
            <motion.div
              key={skill.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.4,
                delay: idx * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="glass-card glass-card-hover flex flex-col justify-between rounded-2xl p-6"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/90 ring-1 ring-inset ring-slate-700/70">
                    <LanguageIcon id={skill.id} className="h-7 w-7" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {skill.category}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-xl font-semibold text-white">
                  {skill.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {skill.focus}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Spoken Languages */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mt-16 border-t border-slate-800/70 pt-14"
      >
        <div className="mb-6 flex items-center gap-3">
          <Globe2 className="h-5 w-5 text-purple-300" aria-hidden="true" />
          <h3 className="font-display text-2xl font-bold tracking-tight text-white">
            Languages
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PORTFOLIO_DATA.languages.map((lang) => (
            <div
              key={lang.id}
              className="glass-card glass-card-hover flex items-center justify-between rounded-2xl px-6 py-5"
            >
              <span className="font-display text-lg font-semibold text-white">
                {lang.name}
              </span>
              <span className="text-sm font-medium text-cyan-300/90">
                {lang.scriptLabel}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
