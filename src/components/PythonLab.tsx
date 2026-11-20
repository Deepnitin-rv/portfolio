import { useState, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, Play, RotateCcw, Terminal, Trash2 } from 'lucide-react';
import { runPythonCode, type PythonRunResult } from '../utils/pythonInterpreter';

interface PythonPreset {
  id: string;
  label: string;
  filename: string;
  code: string;
}

const PYTHON_PRESETS: PythonPreset[] = [
  {
    id: 'linear-regression',
    label: 'Linear Regression',
    filename: 'ols_regression.py',
    code: `# Ordinary Least Squares regression from scratch
x = [1, 2, 3, 4, 5, 6]
y = [2.1, 2.9, 4.2, 4.8, 6.0, 6.9]

n = len(x)
mean_x = sum(x) / n
mean_y = sum(y) / n

num = sum([(xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y)])
den = sum([(xi - mean_x) ** 2 for xi in x])

slope = num / den
intercept = mean_y - slope * mean_x

print(f"Slope (m):     {slope:.3f}")
print(f"Intercept (b): {intercept:.3f}")
print(f"Prediction at x=8: {slope * 8 + intercept:.3f}")`,
  },
  {
    id: 'gradient-descent',
    label: 'Gradient Descent',
    filename: 'gradient_descent.py',
    code: `# Iterative gradient descent optimization
x = [1, 2, 3, 4, 5]
y = [2.0, 4.1, 5.9, 8.2, 9.8]

m, b = 0.0, 0.0
lr = 0.02
n = len(x)

for epoch in range(1, 101):
    preds = [m * xi + b for xi in x]
    dm = (-2 / n) * sum([xi * (yi - yp) for xi, yi, yp in zip(x, y, preds)])
    db = (-2 / n) * sum([yi - yp for yi, yp in zip(y, preds)])
    m -= lr * dm
    b -= lr * db
    if epoch == 1 or epoch % 25 == 0:
        mse = sum([(yi - (m * xi + b)) ** 2 for xi, yi in zip(x, y)]) / n
        print(f"Epoch {epoch} -> m={m:.3f}, b={b:.3f}, MSE={mse:.4f}")`,
  },
  {
    id: 'fibonacci',
    label: 'Fibonacci',
    filename: 'fibonacci.py',
    code: `# Recursive & iterative Fibonacci sequence
def fibonacci_list(count):
    seq = [0, 1]
    for _ in range(2, count):
        seq.append(seq[-1] + seq[-2])
    return seq[:count]

nums = fibonacci_list(10)
evens = [n for n in nums if n % 2 == 0]

print("Sequence:", nums)
print("Even terms:", evens)
print("Sum of first 10:", sum(nums))`,
  },
  {
    id: 'stats',
    label: 'Vector Stats',
    filename: 'vector_stats.py',
    code: `import math

scores = [78, 85, 92, 88, 95, 81, 90]
mean = sum(scores) / len(scores)
variance = sum([(s - mean) ** 2 for s in scores]) / len(scores)
std_dev = math.sqrt(variance)

print(f"Samples: {len(scores)}")
print(f"Sorted:  {sorted(scores)}")
print(f"Mean:    {mean:.2f}")
print(f"Std Dev: {std_dev:.2f}")
print(f"Range:   {min(scores)} - {max(scores)}")`,
  },
];

export function PythonLab() {
  const shouldReduceMotion = useReducedMotion();
  const [activePresetId, setActivePresetId] = useState<string>(PYTHON_PRESETS[0].id);
  const [code, setCode] = useState<string>(PYTHON_PRESETS[0].code);
  const [result, setResult] = useState<PythonRunResult>(() =>
    runPythonCode(PYTHON_PRESETS[0].code)
  );

  const activePreset =
    PYTHON_PRESETS.find((p) => p.id === activePresetId) ?? PYTHON_PRESETS[0];
  const lineCount = code.split('\n').length;

  const handleSelectPreset = (preset: PythonPreset) => {
    setActivePresetId(preset.id);
    setCode(preset.code);
    setResult(runPythonCode(preset.code));
  };

  const handleRun = () => {
    setResult(runPythonCode(code));
  };

  const handleReset = () => {
    setCode(activePreset.code);
    setResult(runPythonCode(activePreset.code));
  };

  const handleClearOutput = () => {
    setResult({ output: [], error: null, durationMs: 0 });
  };

  const handleEditorKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = code.slice(0, start) + '    ' + code.slice(end);
      setCode(updated);
      window.requestAnimationFrame(() => {
        target.selectionStart = start + 4;
        target.selectionEnd = start + 4;
      });
    }
  };

  return (
    <section
      id="python-lab"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Section Header + Preset Switcher */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-cyan-300">
              Interactive Python
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Python Playground
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Edit and run Python algorithms directly in the browser without leaving the page.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Choose Python preset example"
            className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/70 p-1"
          >
            {PYTHON_PRESETS.map((preset) => {
              const selected = preset.id === activePresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => handleSelectPreset(preset)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    selected
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Single-Elevation Workspace Card */}
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Code Editor Pane */}
            <div className="flex flex-col lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-5 py-3.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-medium text-slate-200">
                    {activePreset.filename}
                  </span>
                  <span className="text-slate-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-slate-400">Python</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRun}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition-all duration-150 hover:from-blue-500 hover:to-indigo-500 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    <span>Run Code</span>
                  </button>
                </div>
              </div>

              <div className="relative flex flex-1 bg-[#040712]/80 font-mono text-xs leading-6 sm:text-[13px]">
                {/* Line Numbers Gutter */}
                <div
                  aria-hidden="true"
                  className="select-none border-r border-slate-800/70 px-3 py-4 text-right text-slate-600 tabular-nums"
                >
                  {Array.from({ length: lineCount }, (_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleEditorKeyDown}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  aria-label="Python code editor"
                  rows={15}
                  className="min-h-[320px] w-full resize-y bg-transparent p-4 text-slate-100 placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Output Console Pane */}
            <div className="flex flex-col border-t border-slate-800/80 lg:col-span-5 lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-5 py-3.5">
                <div className="flex items-center gap-2 text-xs">
                  <Terminal className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                  <span className="font-medium text-slate-200">Output</span>
                  {result.durationMs > 0 && (
                    <>
                      <span className="text-slate-600" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {result.durationMs.toFixed(1)} ms
                      </span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleClearOutput}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Clear</span>
                </button>
              </div>

              <div
                aria-live="polite"
                className="flex-1 overflow-auto bg-[#03050e]/90 p-5 font-mono text-xs leading-6 text-slate-200 sm:text-[13px]"
              >
                {result.output.length === 0 && !result.error && (
                  <p className="text-slate-500">
                    Press Run Code or Ctrl+Enter to execute Python.
                  </p>
                )}

                {result.output.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap break-words text-cyan-100">
                    {line}
                  </div>
                ))}

                {result.error && (
                  <div
                    role="alert"
                    className="mt-2 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-rose-200"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                      aria-hidden="true"
                    />
                    <span className="break-words">{result.error}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/80 px-5 py-3 text-xs text-slate-400">
                Supports functions, loops, comprehensions, f-strings, and{' '}
                <span className="font-mono text-slate-300">math</span> · Ctrl+Enter to run
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
