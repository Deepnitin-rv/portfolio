import { PORTFOLIO_DATA } from '../data/portfolio';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/70 bg-[#040712]/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
        <p>
          &copy; {new Date().getFullYear()} {PORTFOLIO_DATA.profile.name}
        </p>
        <p className="text-slate-500">
          {PORTFOLIO_DATA.profile.subtitle}
        </p>
      </div>
    </footer>
  );
}
