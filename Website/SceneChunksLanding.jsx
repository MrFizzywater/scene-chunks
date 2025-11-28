import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  LayoutTemplate, 
  Users, 
  HardDrive, 
  Github, 
  Download, 
  Menu, 
  X, 
  ChevronRight,
  Film,
  Scissors,
  Monitor,
  Coffee
} from 'lucide-react';

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-zinc-950/90 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-1.5 rounded-md">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Scene Chunks</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-zinc-400 hover:text-purple-400 transition-colors text-sm font-medium">Features</a>
          <a href="#how-it-works" className="text-zinc-400 hover:text-purple-400 transition-colors text-sm font-medium">Workflow</a>
          <a href="#roadmap" className="text-zinc-400 hover:text-purple-400 transition-colors text-sm font-medium">Roadmap</a>
          <a 
            href="https://github.com/MrFizzywater/scene-chunks" 
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all text-sm font-medium"
          >
            <Github className="w-4 h-4" />
            <span>Star on GitHub</span>
          </a>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-zinc-900 border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
          <a href="#features" className="text-zinc-400 hover:text-purple-400" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#how-it-works" className="text-zinc-400 hover:text-purple-400" onClick={() => setMobileMenuOpen(false)}>Workflow</a>
          <a href="#roadmap" className="text-zinc-400 hover:text-purple-400" onClick={() => setMobileMenuOpen(false)}>Roadmap</a>
          <a href="#" className="text-purple-400 font-medium">View on GitHub</a>
        </div>
      )}
    </nav>
  );
};

const AppMockup = () => {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-12 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden select-none group hover:border-purple-500/30 transition-colors duration-500">
      {/* Window Header */}
      <div className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 gap-4 justify-between">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 group-hover:bg-red-500 transition-colors"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500 transition-colors"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 group-hover:bg-green-500 transition-colors"></div>
        </div>
        <div className="text-xs text-zinc-500 font-mono">Scene Chunks - v0.1.0 (Dev)</div>
        <div className="w-10"></div>
      </div>

      {/* App Body */}
      <div className="flex h-[500px]">
        {/* Sidebar: Scenes */}
        <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col p-3 gap-2 hidden sm:flex">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Scenes</div>
          
          {[
            { id: 92, slug: "EXT. DOWNTOWN ASPEN", time: "DAY", active: false },
            { id: 93, slug: "INT. HEARSE", time: "NIGHT", active: false },
            { id: 94, slug: "EXT. HEARSE", time: "NIGHT", active: false },
            { id: 95, slug: "EXT. DOWNTOWN ASPEN", time: "NIGHT", active: true },
            { id: 96, slug: "INT. ELEGANT HOTEL", time: "NIGHT", active: false },
          ].map((scene) => (
            <div 
              key={scene.id} 
              className={`p-3 rounded border text-left transition-all ${scene.active ? 'bg-purple-900/20 border-purple-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
            >
              <div className={`text-[10px] font-bold mb-1 ${scene.active ? 'text-purple-400' : 'text-zinc-500'}`}>{scene.id}. {scene.slug} - {scene.time}</div>
              <div className="flex gap-1">
                <div className="w-4 h-4 bg-zinc-800 rounded text-[8px] flex items-center justify-center text-zinc-500">T</div>
                <div className="w-4 h-4 bg-zinc-800 rounded text-[8px] flex items-center justify-center text-zinc-500">C</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Editor */}
        <div className="flex-1 bg-zinc-925 relative overflow-hidden flex flex-col items-center pt-8">
          {/* Paper */}
          <div className="w-[90%] max-w-2xl bg-[#fdfbf7] h-full shadow-lg rounded-t-sm p-12 text-zinc-900 font-courier text-sm leading-relaxed opacity-95">
            <div className="uppercase font-bold mb-6">EXT. DOWNTOWN ASPEN - NIGHT</div>
            
            <p className="mb-6">
              Harry and Lloyd are hurrying down the sidewalk, clutching the briefcase. The city is lit up with millions of tiny lights, like a fantasy winter wonderland.
            </p>

            <div className="flex justify-center w-full mb-0">
              <div className="w-64 text-center uppercase">Lloyd</div>
            </div>
            <div className="flex justify-center w-full mb-6">
              <div className="w-80 text-center text-xs">(add parenthetical)</div>
            </div>
            <div className="flex justify-center w-full mb-6">
              <div className="w-80 text-center">
                Okay, here's the plan: We borrow a few bucks -- just a small loan -- from the briefcase, and we check into a cheap motel.
              </div>
            </div>

            <div className="flex justify-center w-full mb-0">
              <div className="w-64 text-center uppercase">Harry</div>
            </div>
             <div className="flex justify-center w-full mb-6">
              <div className="w-80 text-center">
                Sounds good.
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Metadata */}
        <div className="w-72 bg-zinc-950 border-l border-zinc-800 p-4 hidden lg:block">
          <div className="mb-6">
             <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Structure Beat</div>
             <div className="bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-400 text-sm flex items-center justify-between">
                <span>Bad Guys Close In</span>
                <ChevronRight className="w-4 h-4" />
             </div>
             <div className="mt-2 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-[61%]"></div>
             </div>
             <div className="text-[10px] text-zinc-600 mt-1">Scene starts at 61%</div>
          </div>

          <div className="mb-6">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Characters</div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300">LLOYD</span>
              <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300">HARRY</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Status</div>
             <div className="bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-400 text-sm flex items-center justify-between">
                <span>Draft</span>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Timeline */}
      <div className="h-12 bg-zinc-950 border-t border-zinc-800 flex items-center px-2 relative overflow-hidden">
         <div className="absolute bottom-0 left-0 h-1 bg-red-500 w-12"></div>
         <div className="absolute bottom-0 left-12 h-1 bg-zinc-800 w-24"></div>
         <div className="absolute bottom-0 left-36 h-1 bg-red-500 w-1"></div>
         <div className="absolute bottom-0 left-[61%] h-1 bg-blue-500 w-24 animate-pulse"></div>
         
         <div className="flex w-full justify-between text-[10px] text-zinc-600 px-4 font-mono uppercase">
            <span>Setup</span>
            <span>Inciting Incident</span>
            <span>Promise of the Premise</span>
            <span>Midpoint</span>
            <span className="text-blue-500 font-bold">Bad Guys Close In</span>
            <span>Finale</span>
         </div>
      </div>
    </div>
  );
};

const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-zinc-950 to-zinc-950 -z-10"></div>
      
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Active Development Prototype
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          Stop writing into the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">void.</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          **Scene Chunks** is for screenwriters who think in beats, blocks, and visual pieces instead of one endless wall of text.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-lg font-bold transition-all hover:scale-105 shadow-lg shadow-purple-900/20">
            <Download className="w-5 h-5" />
            Download for Windows
          </button>
          <button className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white px-8 py-4 rounded-lg font-medium transition-all">
            <Github className="w-5 h-5" />
            View Source Code
          </button>
        </div>
        <p className="mt-4 text-xs text-zinc-600">
          Requires installation. Mac & Linux builds coming soon.
        </p>
      </div>

      <AppMockup />
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-zinc-900/50 border border-white/5 hover:border-purple-500/30 p-8 rounded-2xl transition-all hover:-translate-y-1 group">
    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600/20 group-hover:text-purple-400 transition-colors text-zinc-400">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-zinc-400 leading-relaxed">
      {description}
    </p>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: Layers,
      title: "Chunk-Based Writing",
      description: "Write scenes in small, modular components. Reorder and restructure sequences instantly without breaking the flow of your entire script."
    },
    {
      icon: LayoutTemplate,
      title: "Structure Aware",
      description: "Map your chunks to proven structure templates (3-Act, Pilot, etc). See exactly where your beats land on the story timeline."
    },
    {
      icon: Users,
      title: "Character & Crew Tracking",
      description: "Dedicated panels to track who is in the scene and what props are needed. Perfect for transitioning from writing to pre-production."
    },
    {
      icon: HardDrive,
      title: "Local-First JSON",
      description: "Your data lives on your machine. Projects are saved as readable .scenechunks.json files. No cloud subscriptions, no lock-in."
    },
    {
      icon: Monitor,
      title: "Web + Desktop",
      description: "Built with Next.js and Electron. Run it locally in your browser for quick edits, or use the standalone desktop app for deep work."
    },
    {
      icon: Film,
      title: "Visual Organization",
      description: "Stop scrolling through 120 pages to find that one beat. Visual navigation allows you to see the shape of your story at a glance."
    }
  ];

  return (
    <section id="features" className="py-24 bg-zinc-950 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Built for the <span className="text-purple-400">architect</span> writer.</h2>
          <p className="text-zinc-400 max-w-2xl">Most screenwriting software mimics a typewriter. Scene Chunks mimics a whiteboard.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </div>
    </section>
  );
};

const TechStack = () => {
  return (
    <section className="py-20 border-y border-white/5 bg-zinc-900/30">
       <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-8">Powered by modern tech</h3>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center gap-2 text-xl font-bold text-white"><div className="w-8 h-8 bg-white rounded-full text-black flex items-center justify-center">N</div> Next.js</div>
             <div className="flex items-center gap-2 text-xl font-bold text-[#61DAFB]"><div className="w-8 h-8 border-2 border-[#61DAFB] rounded-full flex items-center justify-center text-xs">⚛</div> React</div>
             <div className="flex items-center gap-2 text-xl font-bold text-[#38BDF8]">Tailwind CSS</div>
             <div className="flex items-center gap-2 text-xl font-bold text-[#9FEAF9]">Electron</div>
          </div>
       </div>
    </section>
  );
};

const Roadmap = () => {
  return (
    <section id="roadmap" className="py-24 bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Roadmap</h2>
          <p className="text-zinc-400">This is a passion project in active development. Here is what's coming next.</p>
        </div>

        <div className="space-y-4">
          {[
            { text: "More structure templates (Pilots, Shorts, TV)", done: false },
            { text: "Better structure visualization & timeline zooming", done: false },
            { text: "Standard Screenplay PDF Export", done: false },
            { text: "Shot list & scheduling mode", done: false },
            { text: "Autosave & Multi-project support", done: false }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${item.done ? 'bg-green-500 border-green-500' : 'border-zinc-700'}`}>
                {item.done && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </div>
              <span className={`text-lg ${item.done ? 'text-white line-through decoration-zinc-600' : 'text-zinc-300'}`}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-zinc-950 border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <Scissors className="w-5 h-5 text-white" />
          <span className="font-bold text-white">Scene Chunks</span>
        </div>
        
        <div className="text-zinc-500 text-sm text-center md:text-right">
          <p className="mb-2">Made with <Scissors className="w-3 h-3 inline mx-1"/> and too much <Coffee className="w-3 h-3 inline mx-1"/>.</p>
          <p>&copy; {new Date().getFullYear()} Scene Chunks. MIT License.</p>
        </div>
      </div>
    </footer>
  );
};

const App = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500/30">
      <Navbar />
      <Hero />
      <TechStack />
      <Features />
      <Roadmap />
      <Footer />
    </div>
  );
};

export default App;