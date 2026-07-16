export default function Navbar() {
  return (
    <header className="w-full bg-surface border-b border-line">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="font-display font-semibold text-xl text-ink tracking-tight">
          TherapistMatch
        </a>

        <nav className="flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-ink-soft hover:text-ink transition-colors">
            How it works
          </a>
          <a href="https://github.com/eptisamkassim/MentalHealthProj" target="_blank" rel="noopener noreferrer" className="text-sm text-ink-soft hover:text-ink transition-colors">
            GitHub
          </a>
          <a
            href="#get-matched"
            className="text-sm font-medium px-4 py-2 rounded-md bg-accent text-white hover:bg-accent-dark transition-colors"
          >
            Get matched
          </a>
        </nav>
      </div>
    </header>
  );
}
