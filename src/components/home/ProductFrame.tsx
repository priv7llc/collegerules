interface ProductFrameProps {
  src: string;
  alt: string;
  className?: string;
}

export const ProductFrame = ({ src, alt, className = '' }: ProductFrameProps) => (
  <div
    className={`group rounded-2xl border border-ink/10 bg-white shadow-[0_18px_50px_-20px_rgba(16,42,67,0.35)] overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_-20px_rgba(16,42,67,0.45)] ${className}`}
  >
    <div className="flex items-center gap-1.5 border-b border-ink/10 bg-offwhite px-3 py-2">
      <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
      <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
      <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
    </div>
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.015]"
    />
  </div>
);
