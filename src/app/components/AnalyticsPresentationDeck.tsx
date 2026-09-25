import { useEffect, useRef, useState } from 'react';
import Logo from '../../imports/Logo';
import type { PresentationBar, PresentationMeta, PresentationSlide } from '../lib/analyticsPresentation';
import '../styles/analytics-presentation.css';

interface AnalyticsPresentationDeckProps {
  slides: PresentationSlide[];
  meta: PresentationMeta;
}

function Reveal({
  delay = 0,
  children,
  className,
}: {
  delay?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-r="fade" style={{ ['--d' as string]: String(delay) }} className={className}>
      {children}
    </div>
  );
}

function BarTrack({ bar }: { bar: PresentationBar }) {
  const isPercentStack =
    !!bar.segments?.length &&
    Math.abs(bar.segments.reduce((sum, seg) => sum + seg.widthPct, 0) - 100) < 1;

  if (bar.segments?.length) {
    return (
      <div className="analytics-presentation__bartrack">
        {bar.segments.map((seg, i) => (
          <div
            key={i}
            className={`analytics-presentation__barfill analytics-presentation__barfill--${seg.variant}`}
            style={{
              width: isPercentStack
                ? `${seg.widthPct}%`
                : `${Math.max(seg.widthPct, seg.widthPct > 0 ? 8 : 0)}%`,
            }}
          >
            {seg.fillLabel}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="analytics-presentation__bartrack">
      <div
        className={`analytics-presentation__barfill analytics-presentation__barfill--${bar.variant}`}
        style={{
          width: bar.widthPct >= 99 ? '100%' : `${Math.max(bar.widthPct, bar.count > 0 ? 8 : 0)}%`,
        }}
      >
        {bar.fillLabel}
      </div>
    </div>
  );
}

function OrbCanvas({ share = 0.67 }: { share?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    let R = 0;

    const size = () => {
      const b = cv.getBoundingClientRect();
      W = Math.max(1, b.width);
      H = Math.max(1, b.height);
      cv.width = W * DPR;
      cv.height = H * DPR;
      R = Math.min(W, H) * 0.42;
    };
    size();

    const VIOLETA = [140, 89, 254];
    const AZUL = [89, 122, 255];
    const FADE = [23, 15, 42];
    const N = 1000;
    const pts: Array<{ x: number; y: number; z: number; clear: boolean }> = [];
    const GA = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = i * GA;
      pts.push({
        x: Math.cos(th) * r,
        y,
        z: Math.sin(th) * r,
        clear: i < N * share,
      });
    }

    let t = 0.6;
    let raf: number | null = null;
    let visible = true;

    const frame = () => {
      t += reduce ? 0 : 0.0035;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const cosY = Math.cos(t);
      const sinY = Math.sin(t);
      const tilt = 0.32;
      const cosX = Math.cos(tilt);
      const sinX = Math.sin(tilt);

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        const f = 2.9 / (2.9 + z2);
        const sx = cx + x1 * R * f;
        const sy = cy + y1 * R * f;
        const d = (z2 + 1) / 2;
        const a = 0.16 + 0.74 * Math.pow(d, 1.3);
        const base = p.clear ? (i % 2 === 0 ? VIOLETA : AZUL) : FADE;
        const baseAlpha = p.clear ? a : a * 0.35;
        ctx.fillStyle = `rgba(${base[0]},${base[1]},${base[2]},${baseAlpha.toFixed(3)})`;
        const s = (0.9 + 1.8 * d) * f;
        ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
      }

      raf = visible ? requestAnimationFrame(frame) : null;
    };

    const onResize = () => size();
    window.addEventListener('resize', onResize);

    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible && !raf) raf = requestAnimationFrame(frame);
        },
        { threshold: 0.02 },
      );
      observer.observe(cv);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [share]);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}

function SlideContent({ slide }: { slide: PresentationSlide }) {
  switch (slide.kind) {
    case 'cover':
      return (
        <div className="analytics-presentation__hero">
          <div>
            <p className="analytics-presentation__eyebrow">{slide.eyebrow}</p>
            <Reveal>
              <h1 className="analytics-presentation__h1">{slide.title}</h1>
            </Reveal>
            <Reveal delay={80}>
              <p className="analytics-presentation__lede" style={{ marginTop: 18 }}>
                {slide.lede}
              </p>
            </Reveal>
            <Reveal delay={160}>
              <div className="analytics-presentation__meta-row">
                <span>
                  <b>{slide.responseCount}</b> respuesta{slide.responseCount === 1 ? '' : 's'}
                </span>
                <span>
                  <b>{slide.questionCount}</b> pregunta{slide.questionCount === 1 ? '' : 's'}
                </span>
                <span>{slide.dateLabel}</span>
              </div>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <div className="analytics-presentation__hero-blob">
              <i aria-hidden="true" />
            </div>
          </Reveal>
        </div>
      );

    case 'kpi-summary':
      return (
        <>
          <p className="analytics-presentation__eyebrow">{slide.eyebrow}</p>
          <Reveal>
            <h2 className="analytics-presentation__h2">{slide.title}</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="analytics-presentation__kpis">
              {slide.kpis.map((kpi) => (
                <div key={kpi.label} className="analytics-presentation__kpi-card">
                  <div className="val">{kpi.value}</div>
                  <div className="lab">{kpi.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </>
      );

    case 'question-bars':
      return (
        <>
          <p className="analytics-presentation__eyebrow">{slide.eyebrow}</p>
          <Reveal>
            <h2 className="analytics-presentation__h2">
              {slide.title}
              {slide.flag ? <span className="analytics-presentation__flag">{slide.flag}</span> : null}
            </h2>
          </Reveal>
          <div className="analytics-presentation__question-body">
          {slide.bars.map((bar, i) => (
            <Reveal key={`${slide.id}-bar-${i}`} delay={80 + i * 60} className="analytics-presentation__qbar">
              {bar.label ? (
                <div className="qtext">
                  <span>{bar.label}</span>
                  <span className="analytics-presentation__muted">{`${Math.round(bar.pct)}%`}</span>
                </div>
              ) : null}
              <BarTrack bar={bar} />
            </Reveal>
          ))}
          </div>
        </>
      );

    case 'hero-stat':
      return (
        <div className="analytics-presentation__stat-hero">
          <Reveal className="analytics-presentation__orb-wrap">
            <OrbCanvas share={Math.min(0.95, Math.max(0.35, slide.pct / 100))} />
            <div className="analytics-presentation__orb-label">
              <span className="pct">{slide.pct}%</span>
              <span className="pct-lab">{slide.pctLabel}</span>
            </div>
          </Reveal>
          <div>
            <p className="analytics-presentation__eyebrow">{slide.eyebrow}</p>
            <Reveal>
              <h2 className="analytics-presentation__h2">{slide.title}</h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="analytics-presentation__lede" style={{ marginTop: 16 }}>
                {slide.lede}
              </p>
            </Reveal>
          </div>
        </div>
      );

    case 'word-chips':
      return (
        <>
          <p className="analytics-presentation__eyebrow">{slide.eyebrow}</p>
          <Reveal>
            <h2 className="analytics-presentation__h2">{slide.title}</h2>
          </Reveal>
          <div className="analytics-presentation__question-body">
          <Reveal delay={100}>
            <div className="analytics-presentation__wordrow">
              {slide.tags.map((tag) => (
                <span key={tag.word} className="analytics-presentation__word">
                  {tag.word} <b>×{tag.count}</b>
                </span>
              ))}
            </div>
          </Reveal>
          </div>
        </>
      );

    case 'quotes':
      return (
        <>
          <p className="analytics-presentation__eyebrow">{slide.eyebrow}</p>
          <Reveal>
            <h2 className="analytics-presentation__h2">{slide.title}</h2>
          </Reveal>
          <div className="analytics-presentation__question-body">
          <Reveal delay={100}>
            <div className="analytics-presentation__themes">
              {slide.quotes.map((quote, i) => (
                <div
                  key={i}
                  className={`analytics-presentation__theme${i % 2 === 1 ? ' analytics-presentation__theme--alt' : ''}`}
                >
                  <blockquote>&ldquo;{quote}&rdquo;</blockquote>
                </div>
              ))}
            </div>
          </Reveal>
          </div>
        </>
      );

    case 'empty':
      return (
        <>
          <Reveal>
            <h2 className="analytics-presentation__h2">{slide.title}</h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="analytics-presentation__lede" style={{ marginTop: 16 }}>
              {slide.message}
            </p>
          </Reveal>
        </>
      );

    case 'closing':
      return (
        <div className="analytics-presentation__closing">
          <p className="analytics-presentation__eyebrow">Gracias por revisar estos resultados</p>
          <Reveal>
            <h1 className="analytics-presentation__h1 analytics-presentation__grad-text">{slide.title}</h1>
          </Reveal>
          <Reveal delay={80}>
            <p className="analytics-presentation__lede">{slide.lede}</p>
          </Reveal>
          <Reveal delay={160}>
            <div className="analytics-presentation__footlinks">{slide.footnote}</div>
          </Reveal>
        </div>
      );

    default:
      return null;
  }
}

export function AnalyticsPresentationDeck({ slides, meta }: AnalyticsPresentationDeckProps) {
  const deckRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const slideEls = slideRefs.current.filter(Boolean) as HTMLElement[];

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            const idx = slideEls.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActiveIndex(idx);
          }
        });
      },
      { root: deck, threshold: 0.5 },
    );

    slideEls.forEach((el) => io.observe(el));

    const updateProgress = () => {
      const max = deck.scrollHeight - deck.clientHeight;
      setProgress(max > 0 ? (deck.scrollTop / max) * 100 : 0);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;

      const current = slideEls.findIndex((s) => {
        const rect = s.getBoundingClientRect();
        return Math.abs(rect.top) < window.innerHeight * 0.35;
      });
      const idx = current >= 0 ? current : 0;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        slideEls[Math.min(idx + 1, slideEls.length - 1)]?.scrollIntoView({
          behavior: reduce ? 'auto' : 'smooth',
        });
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        slideEls[Math.max(idx - 1, 0)]?.scrollIntoView({
          behavior: reduce ? 'auto' : 'smooth',
        });
      }
    };

    deck.addEventListener('scroll', updateProgress, { passive: true });
    document.addEventListener('keydown', onKeyDown);
    updateProgress();

    return () => {
      io.disconnect();
      deck.removeEventListener('scroll', updateProgress);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [slides.length]);

  const scrollToSlide = (index: number) => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    slideRefs.current[index]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div className="analytics-presentation">
      <div className="analytics-presentation__bg" aria-hidden="true" />
      <div className="analytics-presentation__progress" style={{ width: `${progress}%` }} />

      <header className="analytics-presentation__topbar">
        <div className="analytics-presentation__logo">
          <Logo />
        </div>
        <div className="analytics-presentation__stamp">{meta.stamp}</div>
      </header>

      <nav className="analytics-presentation__rail" aria-label="Navegación de slides">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            className={activeIndex === i ? 'is-on' : undefined}
            onClick={() => scrollToSlide(i)}
          >
            <span className="lbl">{slide.railLabel}</span>
            <span className="dot" />
          </button>
        ))}
      </nav>

      <main ref={deckRef} className="analytics-presentation__deck">
        {slides.map((slide, i) => (
          <section
            key={slide.id}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            className="analytics-presentation__slide"
            aria-label={slide.railLabel}
          >
            <div className="analytics-presentation__slide-inner">
              <SlideContent slide={slide} />
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
