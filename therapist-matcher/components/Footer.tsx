export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-5">
        <p className="text-xs text-ink-soft leading-relaxed max-w-xl">
          TherapistMatch is a matching tool, not a crisis service. If you or someone you know is in crisis, please contact the{" "}
          <a href="tel:988" className="underline hover:text-ink transition-colors">988 Suicide and Crisis Lifeline</a>{" "}
          by calling or texting <strong>988</strong>.
        </p>
      </div>
    </footer>
  )
}
