/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BackgroundMesh } from './components/BackgroundMesh';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Education } from './components/Education';
import { Skills } from './components/Skills';
import { Projects } from './components/Projects';
import { PythonLab } from './components/PythonLab';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';

export default function App() {
  return (
    <div className="relative min-h-screen text-slate-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <BackgroundMesh />
      <Navbar />

      <main id="main-content">
        <Hero />
        <About />
        <Education />
        <Skills />
        <Projects />
        <PythonLab />
        <Contact />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
