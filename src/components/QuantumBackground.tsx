const QuantumBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Deep Space Gradient */}
      <div className="absolute inset-0 bg-radial from-[#1a1a40] via-[#050510] to-black" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4cc9f010_1px,transparent_1px),linear-gradient(to_bottom,#4cc9f010_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Orbital Rings - Visual representations of quantum probability fields */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[40rem] md:h-[40rem] border border-quantum-purple/20 rounded-full animate-spin-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] md:w-[35rem] md:h-[35rem] border border-quantum-cyan/20 rounded-full animate-spin-reverse-slow" />
      
      {/* Floating Particles (Simulated) */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-quantum-cyan rounded-full blur-[2px] animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-quantum-magenta rounded-full blur-[4px] animate-pulse-glow [animation-delay:700ms]" />
      <div className="absolute top-1/2 right-10 w-1 h-1 bg-white rounded-full blur-[1px] animate-float" />
    </div>
  );
};

export default QuantumBackground;