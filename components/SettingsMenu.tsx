import { useState, FC, ReactNode } from 'react';
import { 
  Monitor, 
  Bug, 
  MessageSquare, 
  FileText, 
  ArrowLeft, 
  ShieldAlert,
  Send
} from 'lucide-react';

interface SettingsMenuProps {
  onReturn: () => void;
}

type TabId = 'SETTINGS' | 'BUG' | 'FEEDBACK' | 'PATCH';

// --- UI Primitives (Defined first to avoid TDZ and type inference issues) ---

const Header = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div>
    <h3 className="text-3xl font-orbitron text-white mb-2">{title}</h3>
    <p className="text-quantum-cyan/70 font-rajdhani text-lg">{subtitle}</p>
  </div>
);

const Section = ({ title, children }: { title: string, children?: ReactNode }) => (
  <div className="bg-black/20 border border-white/5 rounded-lg p-6">
    <h4 className="text-quantum-purple font-orbitron text-sm tracking-wider uppercase mb-6 flex items-center gap-2">
      <div className="w-2 h-2 bg-quantum-purple rounded-full" />
      {title}
    </h4>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const Slider = ({ label, defaultValue }: { label: string, defaultValue: number }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-gray-300 font-rajdhani text-sm">
      <span>{label}</span>
      <span>{defaultValue}%</span>
    </div>
    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
      <div className="h-full bg-quantum-cyan w-[80%]" style={{ width: `${defaultValue}%` }} />
    </div>
  </div>
);

const OptionBox = ({ label, active }: { label: string, active?: boolean }) => (
  <button className={`p-3 rounded border font-orbitron text-xs tracking-widest transition-all ${
    active 
      ? 'bg-quantum-cyan/20 border-quantum-cyan text-white shadow-[0_0_10px_rgba(76,201,240,0.3)]' 
      : 'bg-black/30 border-white/10 text-gray-500 hover:border-white/30'
  }`}>
    {label}
  </button>
);

const Toggle = ({ active }: { active?: boolean }) => (
  <div className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-quantum-magenta' : 'bg-gray-700'}`}>
    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-7' : 'left-1'}`} />
  </div>
);

const ActionButton = ({ label, icon, variant = 'primary' }: { label: string, icon: ReactNode, variant?: 'primary' | 'danger' }) => {
  const colors = variant === 'primary' 
    ? 'bg-quantum-cyan/10 border-quantum-cyan text-quantum-cyan hover:bg-quantum-cyan/20' 
    : 'bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500/20';
    
  return (
    <button className={`flex items-center gap-2 px-6 py-3 rounded border ${colors} font-orbitron tracking-wider transition-all hover:scale-105 active:scale-95`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

const PatchItem = ({ version, date, children, current }: { version: string, date: string, children?: ReactNode, current?: boolean }) => (
  <div className={`border-l-2 pl-6 relative ${current ? 'border-quantum-cyan' : 'border-gray-700'}`}>
    <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${current ? 'bg-quantum-cyan animate-pulse' : 'bg-gray-700'}`} />
    <div className="flex items-baseline gap-3 mb-2">
      <span className={`font-orbitron font-bold text-lg ${current ? 'text-white' : 'text-gray-500'}`}>{version}</span>
      <span className="font-rajdhani text-sm text-gray-500">{date}</span>
      {current && <span className="text-[10px] bg-quantum-cyan/20 text-quantum-cyan px-2 py-0.5 rounded border border-quantum-cyan/30 font-orbitron">LATEST</span>}
    </div>
    <div className="text-sm">
      {children}
    </div>
  </div>
);

// --- Helper Components & Panels ---

const SidebarItem: FC<{ active: boolean; onClick: () => void; icon: ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-300 group relative overflow-hidden ${
      active 
        ? 'bg-quantum-cyan/10 text-quantum-cyan border border-quantum-cyan/30' 
        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-quantum-cyan" />}
    <span className={active ? 'text-quantum-cyan' : 'group-hover:text-quantum-purple transition-colors'}>{icon}</span>
    <span className="font-orbitron text-sm tracking-wider uppercase">{label}</span>
  </button>
);

const SettingsPanel = () => (
  <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
    <Header title="Configuration" subtitle="Adjust neural link parameters and audiovisual synthesis." />
    
    <Section title="Audio Interface">
      <Slider label="Master Volume" defaultValue={80} />
      <Slider label="Music Frequency" defaultValue={60} />
      <Slider label="SFX Resonance" defaultValue={90} />
    </Section>

    <Section title="Visual Processing">
      <div className="grid grid-cols-3 gap-4">
        <OptionBox label="Low" />
        <OptionBox label="Medium" active />
        <OptionBox label="High" />
      </div>
      <div className="mt-4 flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
        <span className="font-rajdhani text-gray-300">Color Blind Mode</span>
        <Toggle />
      </div>
      <div className="mt-2 flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
        <span className="font-rajdhani text-gray-300">Motion Blur</span>
        <Toggle active />
      </div>
    </Section>
  </div>
);

const BugReportPanel = () => (
  <div className="h-full flex flex-col animate-in slide-in-from-right-4 fade-in duration-300">
    <Header title="Report Anomaly" subtitle="Detected a glitch in the matrix? Submit a log for analysis." />
    <div className="flex-1 flex flex-col gap-4 mt-6">
      <input type="text" placeholder="Subject / Error Code" className="bg-black/30 border border-white/10 rounded p-4 text-white font-rajdhani focus:border-quantum-magenta focus:outline-none transition-colors" />
      <textarea placeholder="Describe the sequence of events leading to the anomaly..." className="flex-1 bg-black/30 border border-white/10 rounded p-4 text-white font-rajdhani focus:border-quantum-magenta focus:outline-none resize-none transition-colors" />
      <div className="flex justify-end">
        <ActionButton label="Transmit Log" icon={<ShieldAlert size={18} />} variant="danger" />
      </div>
    </div>
  </div>
);

const FeedbackPanel = () => (
  <div className="h-full flex flex-col animate-in slide-in-from-right-4 fade-in duration-300">
    <Header title="Neural Feedback" subtitle="Help us optimize the simulation. Your thoughts are valuable data." />
    <div className="flex-1 flex flex-col gap-4 mt-6">
      <div className="grid grid-cols-2 gap-4">
         <select className="bg-black/30 border border-white/10 rounded p-4 text-gray-300 font-rajdhani focus:border-quantum-cyan focus:outline-none">
            <option>General Feedback</option>
            <option>Feature Request</option>
            <option>Balance Issue</option>
         </select>
         <input type="email" placeholder="Comm Link (Email - Optional)" className="bg-black/30 border border-white/10 rounded p-4 text-white font-rajdhani focus:border-quantum-cyan focus:outline-none" />
      </div>
      <textarea placeholder="Enter your message..." className="flex-1 bg-black/30 border border-white/10 rounded p-4 text-white font-rajdhani focus:border-quantum-cyan focus:outline-none resize-none" />
      <div className="flex justify-end">
        <ActionButton label="Send Feedback" icon={<Send size={18} />} />
      </div>
    </div>
  </div>
);

const PatchNotesPanel = () => (
  <div className="animate-in slide-in-from-right-4 fade-in duration-300">
    <Header title="System Updates" subtitle="Changelog of recent quantum stability patches." />
    <div className="mt-6 space-y-6">
      <PatchItem version="v2.5.0" date="2024-10-24" current>
        <ul className="list-disc list-inside space-y-2 text-gray-400 font-rajdhani">
          <li>Implemented new Settings Interface module.</li>
          <li>Optimized particle rendering for quantum background.</li>
          <li>Fixed a critical bug where qubits would decohere unexpectedly.</li>
          <li>Added 'Archives' placeholder for future lore expansion.</li>
        </ul>
      </PatchItem>
      <PatchItem version="v2.4.2" date="2024-10-15">
        <ul className="list-disc list-inside space-y-2 text-gray-400 font-rajdhani">
          <li>Enhanced CSS animations for menu transitions.</li>
          <li>Gemini AI integration for dynamic fact generation.</li>
        </ul>
      </PatchItem>
      <PatchItem version="v1.0.0" date="2024-09-01">
        <ul className="list-disc list-inside space-y-2 text-gray-400 font-rajdhani">
          <li>Initial System Launch.</li>
        </ul>
      </PatchItem>
    </div>
  </div>
);

// --- Main Component ---

const SettingsMenu: FC<SettingsMenuProps> = ({ onReturn }) => {
  const [activeTab, setActiveTab] = useState<TabId>('SETTINGS');

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 p-4 md:p-8">
      <div className="w-full max-w-6xl h-[85vh] bg-[#050510]/90 border border-quantum-purple/30 rounded-xl shadow-[0_0_50px_rgba(123,44,191,0.15)] flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-quantum-cyan/30 rounded-tl-xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-quantum-magenta/30 rounded-br-xl pointer-events-none" />

        {/* Sidebar */}
        <div className="w-full md:w-72 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-col p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-orbitron font-bold text-white tracking-widest">SYSTEM</h2>
            <div className="h-1 w-12 bg-quantum-magenta mt-2" />
          </div>

          <nav className="flex-1 flex flex-col gap-2">
            <SidebarItem 
              active={activeTab === 'SETTINGS'} 
              onClick={() => setActiveTab('SETTINGS')} 
              icon={<Monitor size={20} />} 
              label="Adjust Settings" 
            />
            <SidebarItem 
              active={activeTab === 'BUG'} 
              onClick={() => setActiveTab('BUG')} 
              icon={<Bug size={20} />} 
              label="Report Bug" 
            />
            <SidebarItem 
              active={activeTab === 'FEEDBACK'} 
              onClick={() => setActiveTab('FEEDBACK')} 
              icon={<MessageSquare size={20} />} 
              label="Send Feedback" 
            />
            <SidebarItem 
              active={activeTab === 'PATCH'} 
              onClick={() => setActiveTab('PATCH')} 
              icon={<FileText size={20} />} 
              label="Patch Notes" 
            />
          </nav>

          <button 
            onClick={onReturn}
            className="mt-8 md:mt-auto flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all group border border-transparent hover:border-white/10"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform text-quantum-cyan" />
            <span className="font-rajdhani font-bold uppercase tracking-wider">Return</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gradient-to-br from-transparent to-quantum-purple/5 p-8 md:p-12 overflow-y-auto">
          {activeTab === 'SETTINGS' && <SettingsPanel />}
          {activeTab === 'BUG' && <BugReportPanel />}
          {activeTab === 'FEEDBACK' && <FeedbackPanel />}
          {activeTab === 'PATCH' && <PatchNotesPanel />}
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;