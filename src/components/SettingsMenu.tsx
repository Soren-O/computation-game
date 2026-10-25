import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Bug, Copy, FileText, MessageSquare, Monitor, RotateCcw } from 'lucide-react';
import { useGame } from '../state/GameContext';
import { APP_VERSION } from '../config';

interface SettingsMenuProps {
  onReturn: () => void;
}

type TabId = 'SETTINGS' | 'BUG' | 'FEEDBACK' | 'PATCH';

// --- UI primitives ---

const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div>
    <h3 className="text-3xl font-orbitron text-white mb-2">{title}</h3>
    <p className="text-quantum-cyan/70 font-rajdhani text-lg">{subtitle}</p>
  </div>
);

const Section = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="bg-black/20 border border-white/5 rounded-lg p-6">
    <h4 className="text-quantum-purple font-orbitron text-sm tracking-wider uppercase mb-6 flex items-center gap-2">
      <div className="w-2 h-2 bg-quantum-purple rounded-full" />
      {title}
    </h4>
    <div className="space-y-4">{children}</div>
  </div>
);

const ToggleRow = ({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-4 p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/15 text-left transition-colors"
  >
    <span>
      <span className="block font-rajdhani text-gray-200 text-lg">{label}</span>
      <span className="block font-rajdhani text-gray-500 text-sm">{hint}</span>
    </span>
    <span className={`shrink-0 w-12 h-6 rounded-full relative transition-colors ${checked ? 'bg-quantum-magenta' : 'bg-gray-700'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-7' : 'left-1'}`} />
    </span>
  </button>
);

const ActionButton = ({ label, icon, onClick, variant = 'primary' }: { label: string; icon: ReactNode; onClick: () => void; variant?: 'primary' | 'danger' }) => {
  const colors =
    variant === 'primary'
      ? 'bg-quantum-cyan/10 border-quantum-cyan text-quantum-cyan hover:bg-quantum-cyan/20'
      : 'bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500/20';
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded border ${colors} font-orbitron tracking-wider transition-all hover:scale-105 active:scale-95`}>
      {icon}
      <span>{label}</span>
    </button>
  );
};

const PatchItem = ({ version, date, children, current }: { version: string; date: string; children?: ReactNode; current?: boolean }) => (
  <div className={`border-l-2 pl-6 relative ${current ? 'border-quantum-cyan' : 'border-gray-700'}`}>
    <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${current ? 'bg-quantum-cyan animate-pulse' : 'bg-gray-700'}`} />
    <div className="flex items-baseline gap-3 mb-2">
      <span className={`font-orbitron font-bold text-lg ${current ? 'text-white' : 'text-gray-500'}`}>{version}</span>
      <span className="font-rajdhani text-sm text-gray-500">{date}</span>
      {current && <span className="text-[10px] bg-quantum-cyan/20 text-quantum-cyan px-2 py-0.5 rounded border border-quantum-cyan/30 font-orbitron">LATEST</span>}
    </div>
    <div className="text-sm">{children}</div>
  </div>
);

const SidebarItem = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-300 group relative overflow-hidden ${
      active ? 'bg-quantum-cyan/10 text-quantum-cyan border border-quantum-cyan/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-quantum-cyan" />}
    <span className={active ? 'text-quantum-cyan' : 'group-hover:text-quantum-purple transition-colors'}>{icon}</span>
    <span className="font-orbitron text-sm tracking-wider uppercase">{label}</span>
  </button>
);

// --- Panels ---

const SettingsPanel = () => {
  const { settings, updateSettings, completedLevels, resetProgress } = useGame();
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    if (!confirmingReset) return;
    const id = setTimeout(() => setConfirmingReset(false), 4000);
    return () => clearTimeout(id);
  }, [confirmingReset]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
      <Header title="Configuration" subtitle="Adjust neural link parameters. Changes are saved on this device." />

      <Section title="Accessibility">
        <ToggleRow
          label="Reduce Motion"
          hint="Stops background animations and screen transitions."
          checked={settings.reduceMotion}
          onChange={reduceMotion => updateSettings({ reduceMotion })}
        />
      </Section>

      <Section title="Campaign">
        <ToggleRow
          label="Developer Override"
          hint="Unlock every available module regardless of campaign progress."
          checked={settings.developerMode}
          onChange={developerMode => updateSettings({ developerMode })}
        />
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
          <span>
            <span className="block font-rajdhani text-gray-200 text-lg">Campaign Progress</span>
            <span className="block font-rajdhani text-gray-500 text-sm">
              {completedLevels.length} module{completedLevels.length === 1 ? '' : 's'} completed.
            </span>
          </span>
          <ActionButton
            label={confirmingReset ? 'Click again to confirm' : 'Reset Progress'}
            icon={<RotateCcw size={18} />}
            variant="danger"
            onClick={() => {
              if (confirmingReset) {
                resetProgress();
                setConfirmingReset(false);
              } else {
                setConfirmingReset(true);
              }
            }}
          />
        </div>
      </Section>
    </div>
  );
};

/** There's no feedback server yet, so reports are copied to the clipboard for the player to send on. */
const ReportPanel = ({ kind }: { kind: 'BUG' | 'FEEDBACK' }) => {
  const [category, setCategory] = useState('General Feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const copyReport = async () => {
    if (!message.trim()) {
      setStatus('Write a description first.');
      return;
    }
    const lines = [
      kind === 'BUG' ? `Bug report: ${subject || '(no subject)'}` : `Feedback (${category})`,
      '',
      message.trim(),
      '',
      `Version: ${APP_VERSION}`,
      `Browser: ${navigator.userAgent}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setStatus('Copied to clipboard. No feedback server is connected yet, so paste it wherever you track issues.');
    } catch {
      setStatus('Could not access the clipboard. Select the text above and copy it manually.');
    }
  };

  const focusColor = kind === 'BUG' ? 'focus:border-quantum-magenta' : 'focus:border-quantum-cyan';

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-right-4 fade-in duration-300">
      {kind === 'BUG' ? (
        <Header title="Report Anomaly" subtitle="Detected a glitch in the matrix? Write up a log for analysis." />
      ) : (
        <Header title="Neural Feedback" subtitle="Help us optimize the simulation. Your thoughts are valuable data." />
      )}
      <div className="flex-1 flex flex-col gap-4 mt-6 min-h-64">
        {kind === 'BUG' ? (
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject / Error Code"
            className={`bg-black/30 border border-white/10 rounded p-4 text-white font-rajdhani ${focusColor} focus:outline-none transition-colors`}
          />
        ) : (
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className={`bg-black/30 border border-white/10 rounded p-4 text-gray-300 font-rajdhani ${focusColor} focus:outline-none`}
          >
            <option>General Feedback</option>
            <option>Feature Request</option>
            <option>Balance Issue</option>
          </select>
        )}
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={kind === 'BUG' ? 'Describe the sequence of events leading to the anomaly...' : 'Enter your message...'}
          className={`flex-1 bg-black/30 border border-white/10 rounded p-4 text-white font-rajdhani ${focusColor} focus:outline-none resize-none transition-colors`}
        />
        <div className="flex flex-wrap items-center justify-end gap-4">
          {status && <p role="status" className="mr-auto text-sm text-gray-400 font-rajdhani">{status}</p>}
          <ActionButton label="Copy Report" icon={<Copy size={18} />} variant={kind === 'BUG' ? 'danger' : 'primary'} onClick={copyReport} />
        </div>
      </div>
    </div>
  );
};

const PatchNotesPanel = () => (
  <div className="animate-in slide-in-from-right-4 fade-in duration-300">
    <Header title="System Updates" subtitle="Changelog of recent quantum stability patches." />
    <div className="mt-6 space-y-6">
      <PatchItem version={`v${APP_VERSION}`} date="2026-10-24" current>
        <ul className="list-disc list-inside space-y-2 text-gray-400 font-rajdhani">
          <li>Campaign progress and settings now persist between sessions.</li>
          <li>Sandbox mode is online: free play with every gate and an adjustable timeline.</li>
          <li>Fixed puzzles skipping ahead and the simulation running at different speeds on different displays.</li>
          <li>Fixed the -|0⟩ challenge, which could not be solved within its slots.</li>
          <li>Run results, a live state readout and tap-to-place gates for touch screens.</li>
          <li>Archive entries for the P-Z, S and P-Y gates; encrypted entries now unlock through the campaign.</li>
        </ul>
      </PatchItem>
      <PatchItem version="v2.5.0" date="2024-10-24">
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

// --- Main component ---

const SettingsMenu = ({ onReturn }: SettingsMenuProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('SETTINGS');

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 p-4 md:p-8">
      <div className="w-full max-w-6xl h-full md:h-[85vh] bg-[#050510]/90 border border-quantum-purple/30 rounded-xl shadow-[0_0_50px_rgba(123,44,191,0.15)] flex flex-col md:flex-row overflow-hidden relative">
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-quantum-cyan/30 rounded-tl-xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-quantum-magenta/30 rounded-br-xl pointer-events-none" />

        <div className="w-full md:w-72 shrink-0 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-col p-4 md:p-6">
          <div className="mb-4 md:mb-8 flex items-center justify-between md:block">
            <div>
              <h2 className="text-2xl font-orbitron font-bold text-white tracking-widest">SYSTEM</h2>
              <div className="h-1 w-12 bg-quantum-magenta mt-2" />
            </div>
            <button onClick={onReturn} className="md:hidden flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft size={18} className="text-quantum-cyan" />
              <span className="font-rajdhani font-bold uppercase tracking-wider">Return</span>
            </button>
          </div>

          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible md:flex-1">
            <SidebarItem active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} icon={<Monitor size={20} />} label="Adjust Settings" />
            <SidebarItem active={activeTab === 'BUG'} onClick={() => setActiveTab('BUG')} icon={<Bug size={20} />} label="Report Bug" />
            <SidebarItem active={activeTab === 'FEEDBACK'} onClick={() => setActiveTab('FEEDBACK')} icon={<MessageSquare size={20} />} label="Send Feedback" />
            <SidebarItem active={activeTab === 'PATCH'} onClick={() => setActiveTab('PATCH')} icon={<FileText size={20} />} label="Patch Notes" />
          </nav>

          <button
            onClick={onReturn}
            className="hidden md:flex mt-auto items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all group border border-transparent hover:border-white/10"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform text-quantum-cyan" />
            <span className="font-rajdhani font-bold uppercase tracking-wider">Return</span>
          </button>
        </div>

        <div className="flex-1 bg-linear-to-br from-transparent to-quantum-purple/5 p-6 md:p-12 overflow-y-auto">
          {activeTab === 'SETTINGS' && <SettingsPanel />}
          {activeTab === 'BUG' && <ReportPanel key="bug" kind="BUG" />}
          {activeTab === 'FEEDBACK' && <ReportPanel key="feedback" kind="FEEDBACK" />}
          {activeTab === 'PATCH' && <PatchNotesPanel />}
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
