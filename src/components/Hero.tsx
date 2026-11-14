import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Mail, RotateCcw } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolio';

const SAMPLE_POINTS = [
  { x: 1, y: 1.9 },
  { x: 2, y: 2.6 },
  { x: 3, y: 3.7 },
  { x: 4, y: 4.1 },
  { x: 5, y: 5.3 },
  { x: 6, y: 5.9 },
  { x: 7, y: 6.8 },
  { x: 8, y: 7.4 },
];

const PYTHON_LINES = [
  'def fit_linear_regression(x, y, lr=0.02, epochs=120):',
  '    m, b = 0.0, 0.0',
  '    n = len(x)',
  '    for _ in range(epochs):',
  '        y_pred = [m * xi + b for xi in x]',
  '        dm = (-2 / n) * sum(xi * (yi - yp) for xi, yi, yp in zip(x, y, y_pred))',
  '        db = (-2 / n) * sum(yi - yp for yi, yp in zip(y, y_pred))',
  '        m -= lr * dm',
  '        b -= lr * db',
  '    return m, b',
];

export function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState<number>(shouldReduceMotion ? 36 : 0);
  const [activeLine, setActiveLine] = useState<number>(4);

  // Animate gradient descent convergence on mount/replay
  useEffect(() => {
    if (shouldReduceMotion) {
      setStep(36);
      return;
    }
    if (step >= 36) return;

    const timer = window.setTimeout(() => {
      setStep((prev) => prev + 1);
      setActiveLine((prev) => (prev >= 8 ? 4 : prev + 1));
    }, 55);

    return () => window.clearTimeout(timer);
  }, [step, shouldReduceMotion]);

  // Compute interpolated regression parameters smoothly converging toward OLS fit (m ~ 0.79, b ~ 1.15)
  const progress = Math.min(1, step / 36);
  const eased = 1 - Math.pow(1 - progress, 3);
  const slope = 0.79 * eased;
  const intercept = 1.15 * eased;

  // Mean squared error for current parameters
  const mse =
    SAMPLE_POINTS.reduce((acc, pt) => {
      const pred = slope * pt.x + intercept;
      return acc + Math.pow(pt.y - pred, 2);
    }, 0) / SAMPLE_POINTS.length;

  // SVG coordinate helpers (domain x: [0..9], y: [0..9])
  const toSvgX = (x: number) => 28 + (x / 9) * 264;
  const toSvgY = (y: number) => 152 - (y / 9) * 132;

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:px-8 lg:pt-24 lg:pb-28"
    >
      <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Primary Intro & CTAs */}
        <div className="flex flex-col justify-center lg:col-span-6">
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm font-semibold tracking-wide text-cyan-300 sm:text-base"
          >
            {PORTFOLIO_DATA.profile.subtitle}
          </motion.p>

          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-balance font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
          >
            Hi, I&apos;m{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Deepnitin R V
            </span>
          </motion.h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            {PORTFOLIO_DATA.profile.heroDescription}
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              onClick={() => handleScrollTo('projects')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/50 transition-all duration-150 hover:-translate-y-0.5 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <span>Explore My Work</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => handleScrollTo('contact')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur-md transition-all duration-150 hover:-translate-y-0.5 hover:border-cyan-400/50 hover:bg-slate-800/70 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Mail className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              <span>Contact Me</span>
            </button>
          </motion.div>
        </div>

        {/* Right Column: Interactive Animated Coding & ML Visual */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex lg:col-span-6"
        >
          <div className="glass-card relative flex w-full flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6">
            {/* Subtle top gradient hairline */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
            />

            {/* Header Bar */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium text-slate-300">
                  linear_regression.py
                </span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-cyan-300/90">
                  Gradient Descent
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Replay Fit</span>
              </button>
            </div>

            {/* Code Editor Preview */}
            <div className="mt-4 overflow-x-auto rounded-xl bg-[#040712]/90 p-3.5 font-mono text-[11px] leading-relaxed text-slate-300 sm:text-xs">
              {PYTHON_LINES.map((line, index) => {
                const isHighlighted = step < 36 && activeLine === index;
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 rounded px-1.5 py-0.5 transition-colors duration-150 ${
                      isHighlighted ? 'bg-blue-500/15 text-cyan-200' : ''
                    }`}
                  >
                    <span className="w-4 select-none text-right text-slate-600 tabular-nums">
                      {index + 1}
                    </span>
                    <span className="whitespace-pre">{line}</span>
                  </div>
                );
              })}
            </div>

            {/* Live Regression Line Convergence Plot */}
            <div className="mt-4 border-t border-slate-800/80 pt-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span className="font-medium text-slate-200">
                  Model Fit Visualization
                </span>
                <div className="flex items-center gap-3 font-mono tabular-nums">
                  <span>
                    m = <span className="text-cyan-300">{slope.toFixed(2)}</span>
                  </span>
                  <span>
                    b = <span className="text-purple-300">{intercept.toFixed(2)}</span>
                  </span>
                  <span>
                    MSE = <span className="text-blue-300">{mse.toFixed(2)}</span>
                  </span>
                </div>
              </div>

              <svg
                viewBox="0 0 310 170"
                className="h-40 w-full rounded-xl bg-[#040712]/80"
                role="img"
                aria-label="Animated scatter plot showing a linear regression line fitting data points"
              >
                <defs>
                  <linearGradient id="heroLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>

                {/* Subtle grid lines */}
                {[2, 4, 6, 8].map((val) => (
                  <g key={val}>
                    <line
                      x1={28}
                      y1={toSvgY(val)}
                      x2={292}
                      y2={toSvgY(val)}
                      stroke="rgba(148, 163, 184, 0.1)"
                      strokeWidth="1"
                    />
                    <line
                      x1={toSvgX(val)}
                      y1={20}
                      x2={toSvgX(val)}
                      y2={152}
                      stroke="rgba(148, 163, 184, 0.1)"
                      strokeWidth="1"
                    />
                  </g>
                ))}

                {/* Axes */}
                <line
                  x1="28"
                  y1="152"
                  x2="292"
                  y2="152"
                  stroke="rgba(148, 163, 184, 0.3)"
                  strokeWidth="1.2"
                />
                <line
                  x1="28"
                  y1="20"
                  x2="28"
                  y2="152"
                  stroke="rgba(148, 163, 184, 0.3)"
                  strokeWidth="1.2"
                />

                {/* Residuals */}
                {SAMPLE_POINTS.map((pt, i) => {
                  const predY = slope * pt.x + intercept;
                  return (
                    <line
                      key={`res-${i}`}
                      x1={toSvgX(pt.x)}
                      y1={toSvgY(pt.y)}
                      x2={toSvgX(pt.x)}
                      y2={toSvgY(predY)}
                      stroke="rgba(168, 85, 247, 0.35)"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Regression Line */}
                <line
                  x1={toSvgX(0.4)}
                  y1={toSvgY(slope * 0.4 + intercept)}
                  x2={toSvgX(8.6)}
                  y2={toSvgY(slope * 8.6 + intercept)}
                  stroke="url(#heroLineGrad)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                {SAMPLE_POINTS.map((pt, i) => (
                  <circle
                    key={`pt-${i}`}
                    cx={toSvgX(pt.x)}
                    cy={toSvgY(pt.y)}
                    r="4"
                    fill="#38bdf8"
                    stroke="#050814"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
