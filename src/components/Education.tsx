import { motion, useReducedMotion } from 'motion/react';
import { GraduationCap } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolio';

export function Education() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="education"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-wide text-purple-300">
            Academic Background
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Education
          </h2>
        </div>

        <div className="relative space-y-6">
          {PORTFOLIO_DATA.education.map((item) => (
            <article
              key={item.id}
              className="glass-card glass-card-hover relative overflow-hidden rounded-2xl p-6 sm:p-8"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-cyan-300 ring-1 ring-inset ring-cyan-400/25">
                    <GraduationCap className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">
                      {item.degree}
                    </h3>
                    <p className="mt-1.5 text-base font-medium text-slate-300">
                      {item.institution}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="inline-block text-sm font-medium text-cyan-300">
                    {item.status}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
