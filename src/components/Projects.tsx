import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ExternalLink, GitBranch, LineChart, RotateCcw, X } from 'lucide-react';
import { PORTFOLIO_DATA, type ProjectItem } from '../data/portfolio';

interface Point {
  x: number;
  y: number;
}

const INITIAL_DEMO_POINTS: Point[] = [
  { x: 1.2, y: 2.1 },
  { x: 2.4, y: 2.9 },
  { x: 3.5, y: 4.2 },
  { x: 4.8, y: 4.7 },
  { x: 6.1, y: 6.0 },
  { x: 7.4, y: 6.9 },
  { x: 8.5, y: 7.8 },
];

function computeOrdinaryLeastSquares(points: Point[]) {
  if (points.length < 2) {
    return { m: 0, b: points[0]?.y ?? 0, mse: 0 };
  }
  const n = points.length;
  const meanX = points.reduce((acc, p) => acc + p.x, 0) / n;
  const meanY = points.reduce((acc, p) => acc + p.y, 0) / n;

  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) * (p.x - meanX);
  }
  const m = den === 0 ? 0 : num / den;
  const b = meanY - m * meanX;
  const mse =
    points.reduce((acc, p) => acc + Math.pow(p.y - (m * p.x + b), 2), 0) / n;
  return { m, b, mse };
}

export function Projects() {
  const shouldReduceMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [demoPoints, setDemoPoints] = useState<Point[]>(INITIAL_DEMO_POINTS);

  useEffect(() => {
    if (!selectedProject) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProject(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedProject]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(PORTFOLIO_DATA.projects.map((p) => p.category))
    );
    return unique.length > 1 ? ['All', ...unique] : [];
  }, []);

  const visibleProjects = useMemo(() => {
    if (activeCategory === 'All') return PORTFOLIO_DATA.projects;
    return PORTFOLIO_DATA.projects.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const ols = useMemo(() => computeOrdinaryLeastSquares(demoPoints), [demoPoints]);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 420;
    const relY = ((e.clientY - rect.top) / rect.height) * 240;

    // Map SVG viewBox [36..396] x [20..208] -> [0..10]
    const xVal = ((relX - 36) / 360) * 10;
    const yVal = ((208 - relY) / 188) * 10;

    if (xVal >= 0.2 && xVal <= 9.8 && yVal >= 0.2 && yVal <= 9.8) {
      setDemoPoints((prev) => [...prev, { x: xVal, y: yVal }]);
    }
  };

  const toSvgX = (x: number) => 36 + (x / 10) * 360;
  const toSvgY = (y: number) => 208 - (y / 10) * 188;

  return (
    <section
      id="projects"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-cyan-300">
              Featured Work
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              My Projects
            </h2>
          </div>

          {categories.length > 0 && (
            <div
              role="tablist"
              aria-label="Filter projects by category"
              className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/70 p-1"
            >
              {categories.map((cat) => {
                const selected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Expandable Grid */}
        <div
          className={`grid grid-cols-1 gap-8 ${
            visibleProjects.length > 1 ? 'md:grid-cols-2' : 'lg:grid-cols-12'
          }`}
        >
          {visibleProjects.map((project) => {
            const hasImageError = Boolean(imageErrors[project.id]);
            const hasGithubUrl = Boolean(
              project.githubUrl && project.githubUrl.trim().length > 0
            );
            const isSingleFeatured = visibleProjects.length === 1;

            return (
              <article
                key={project.id}
                className={`glass-card glass-card-hover overflow-hidden rounded-2xl ${
                  isSingleFeatured
                    ? 'lg:col-span-12 grid grid-cols-1 items-stretch lg:grid-cols-12'
                    : 'flex flex-col'
                }`}
              >
                {/* Project Visual */}
                <div
                  className={`relative overflow-hidden bg-[#060b1d] ${
                    isSingleFeatured
                      ? 'lg:col-span-6 aspect-video lg:aspect-auto lg:min-h-[300px]'
                      : 'aspect-video w-full'
                  }`}
                >
                  {!hasImageError ? (
                    <img
                      src={project.image}
                      alt={project.imageAlt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImageErrors((prev) => ({
                          ...prev,
                          [project.id]: true,
                        }))
                      }
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950/50 to-purple-950/50 p-6 text-center">
                      <LineChart
                        className="h-10 w-10 text-cyan-300"
                        aria-hidden="true"
                      />
                      <span className="mt-3 font-display text-sm font-medium text-slate-300">
                        {project.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Project Content */}
                <div
                  className={`flex flex-col justify-between p-6 sm:p-8 ${
                    isSingleFeatured ? 'lg:col-span-6' : 'flex-1'
                  }`}
                >
                  <div>
                    {/* Clean Unboxed Metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-cyan-300">
                      <span>{project.category}</span>
                      <span className="text-slate-600" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono text-slate-300">
                        {project.technologies.join(' · ')}
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {project.title}
                    </h3>

                    <p className="mt-4 text-base leading-relaxed text-slate-300">
                      {project.description}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-6">
                    {hasGithubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:from-blue-500 hover:to-indigo-500 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                      >
                        <GitBranch className="h-4 w-4" aria-hidden="true" />
                        <span>View on GitHub</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}

                    {project.interactiveDemo === 'linear-regression' && (
                      <button
                        type="button"
                        onClick={() => setSelectedProject(project)}
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/20 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                      >
                        <LineChart className="h-4 w-4" aria-hidden="true" />
                        <span>Interactive Model Sandbox</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </motion.div>

      {/* Interactive Linear Regression Sandbox Modal */}
      {selectedProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03050d]/80 p-4 backdrop-blur-md"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="glass-card relative w-full max-w-2xl overflow-hidden rounded-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <p className="text-xs font-medium text-cyan-300">
                  {selectedProject.category} · {selectedProject.technologies.join(' · ')}
                </p>
                <h3
                  id="project-modal-title"
                  className="mt-1 font-display text-xl font-bold text-white sm:text-2xl"
                >
                  {selectedProject.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Close modal"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 text-slate-300 transition-colors hover:border-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5">
              <p className="text-sm text-slate-300">
                Click anywhere inside the coordinate grid below to plot new data
                points and watch the ordinary least squares regression line
                recalculate <span className="font-mono text-cyan-300">y = mx + b</span>{' '}
                in real time.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#040712]/80 px-4 py-3 text-xs font-mono tabular-nums">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Slope (m): <strong className="text-cyan-300">{ols.m.toFixed(3)}</strong>
                  </span>
                  <span>
                    Intercept (b): <strong className="text-purple-300">{ols.b.toFixed(3)}</strong>
                  </span>
                  <span>
                    MSE: <strong className="text-blue-300">{ols.mse.toFixed(3)}</strong>
                  </span>
                  <span>
                    Points: <strong className="text-slate-200">{demoPoints.length}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setDemoPoints(INITIAL_DEMO_POINTS)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-sans font-medium text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  <span>Reset Points</span>
                </button>
              </div>

              <svg
                viewBox="0 0 420 240"
                onClick={handleCanvasClick}
                className="mt-4 w-full cursor-crosshair rounded-xl border border-slate-800/80 bg-[#040712]"
                role="img"
                aria-label="Interactive linear regression coordinate grid"
              >
                <defs>
                  <linearGradient id="modalLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>

                {[2, 4, 6, 8].map((val) => (
                  <g key={val}>
                    <line
                      x1="36"
                      y1={toSvgY(val)}
                      x2="396"
                      y2={toSvgY(val)}
                      stroke="rgba(148, 163, 184, 0.1)"
                    />
                    <line
                      x1={toSvgX(val)}
                      y1="20"
                      x2={toSvgX(val)}
                      y2="208"
                      stroke="rgba(148, 163, 184, 0.1)"
                    />
                  </g>
                ))}

                <line
                  x1="36"
                  y1="208"
                  x2="396"
                  y2="208"
                  stroke="rgba(148, 163, 184, 0.35)"
                  strokeWidth="1.2"
                />
                <line
                  x1="36"
                  y1="20"
                  x2="36"
                  y2="208"
                  stroke="rgba(148, 163, 184, 0.35)"
                  strokeWidth="1.2"
                />

                {demoPoints.length >= 2 && (
                  <line
                    x1={toSvgX(0)}
                    y1={toSvgY(ols.m * 0 + ols.b)}
                    x2={toSvgX(10)}
                    y2={toSvgY(ols.m * 10 + ols.b)}
                    stroke="url(#modalLineGrad)"
                    strokeWidth="2.5"
                  />
                )}

                {demoPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={toSvgX(pt.x)}
                    cy={toSvgY(pt.y)}
                    r="4.5"
                    fill="#38bdf8"
                    stroke="#040712"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
