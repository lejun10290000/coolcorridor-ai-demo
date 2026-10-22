import { lazy, Suspense, useEffect, useState } from 'react'
import type { LandingChapter, LandingQuality } from './world'
import './landing.css'
import './landing-refinements.css'

const CinematicTownshipScene = lazy(async () => ({ default: (await import('./CinematicTownshipScene')).CinematicTownshipScene }))

const chapters = [
  { number: '01', title: 'The future township', kicker: 'A living, greener place', marker: 'Township vision', detail: 'Original fictional concept world' },
  { number: '02', title: 'The shaded journey', kicker: 'Everyday comfort, considered', marker: 'A more human journey', detail: 'Illustrative walkway, not navigation' },
  { number: '03', title: 'Intelligent planning', kicker: 'Evidence into action', marker: 'Planning intelligence', detail: 'Conceptual route and shade cues' },
] as const

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

function ModePortal({ mode, onEnter }: { mode: 'resident' | 'developer'; onEnter: () => void }) {
  const resident = mode === 'resident'
  return <button type="button" className={`mode-portal mode-portal--${mode}`} onClick={onEnter} aria-label={`Enter ${resident ? 'Resident' : 'Developer'} Mode`}>
    <span className="portal-art" aria-hidden="true" />
    <span className="portal-veil" aria-hidden="true" />
    <span className="portal-shine" aria-hidden="true" />
    <span className="portal-copy">
      <span className="portal-top"><span className="portal-symbol" aria-hidden="true">{resident ? '↗' : '✦'}</span><span>{resident ? 'FOR EVERYDAY JOURNEYS' : 'FOR BETTER DECISIONS'}</span></span>
      <span className="portal-title">{resident ? 'Resident Mode' : 'Developer Mode'} <span className="portal-arrow" aria-hidden="true">↗</span></span>
      <span className="portal-description">{resident ? 'Find more comfortable routes, inspect evidence and report walkway issues.' : 'Explore evidence, analyse priorities, optimise budgets and simulate interventions.'}</span>
      <span className="portal-bottom"><span>{resident ? 'Compare routes  ·  View evidence  ·  Report issues' : 'Evidence  ·  Budget  ·  Scenario'}</span><span className="portal-enter">Enter mode <span aria-hidden="true">→</span></span></span>
    </span>
  </button>
}

export function LandingHero({ onEnter }: { onEnter: (mode: 'resident' | 'developer') => void }) {
  const reducedMotion = useReducedMotion()
  const [chapter, setChapter] = useState<LandingChapter>(0)
  const [paused, setPaused] = useState(reducedMotion)
  const [orbitTourToken, setOrbitTourToken] = useState(0)
  const [quality, setQuality] = useState<LandingQuality>(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 840px)').matches ? 'balanced' : 'high')
  useEffect(() => { if (reducedMotion) setPaused(true) }, [reducedMotion])
  const selectChapter = (value: LandingChapter) => setChapter(value)
  const startOrbitTour = () => {
    setPaused(false)
    setOrbitTourToken(value => value + 1)
  }

  return <main className={`cinematic-home ${paused ? 'is-paused' : ''}`}>
    <div className="world-layer">
      <Suspense fallback={<div className="scene-loading">Preparing the future township…</div>}><CinematicTownshipScene key={quality === 'fallback' ? 'fallback' : 'webgl'} chapter={chapter} paused={paused} quality={quality} orbitTourToken={orbitTourToken} onUnavailable={() => setQuality('fallback')} /></Suspense>
      <div className="world-grade" />
      <div className="world-vignette" />
    </div>

    <header className="cinematic-header">
      <div className="brand-mark" aria-label="CoolCorridor AI"><span className="brand-icon" aria-hidden="true">◈</span><span>CoolCorridor <b>AI</b><small>TOWNSHIP OF TOMORROW · HACKATHON CONCEPT</small></span></div>
      <div className="header-meta"><span>UTM KUALA LUMPUR PILOT</span><span className="header-dot" /><span>PHASE 0B DEMO</span></div>
    </header>

    <div className="hero-copy">
      <div className="hero-eyebrow"><span className="eyebrow-line" /> A BETTER WAY THROUGH THE DAY</div>
      <h1>CoolCorridor <em>AI</em></h1>
      <p className="hero-tagline">Smarter Shade.<br />Cooler Journeys.<br /><span>Greener Townships.</span></p>
      <p className="hero-description">AI-assisted pedestrian shade intelligence for more comfortable, liveable communities.</p>
      <div className="hero-credentials"><span>◉ &nbsp; UTM KL pilot</span><span>✳ &nbsp; Concept visualisation</span></div>
    </div>

    <div className="landing-context">
    <div className="scene-note"><div className="chapter-nav" aria-label="Cinematic chapters">{chapters.map((item, index) => <button key={item.number} type="button" className={chapter === index ? 'active' : ''} onClick={() => selectChapter(index as LandingChapter)} aria-pressed={chapter === index}><span>{item.number}</span> {item.title}</button>)}</div><div className="scene-note-copy" aria-live="polite"><span className="scene-note__eyebrow">{chapters[chapter].number} / 03 · {chapters[chapter].kicker}</span><strong>{chapters[chapter].marker}</strong><small>{chapters[chapter].detail}</small></div></div>
    <div className="route-callout"><span className="route-callout__line" aria-hidden="true"/><span><b>Main Gate → Klinik UTM</b><small>Pilot journey · route verification pending</small><small className="concept-legend"><span className="legend-title">Concept colours</span><span className="legend-item"><i className="cue-shaded"/>shaded</span><span className="legend-item"><i className="cue-mixed"/>mixed</span><span className="legend-item"><i className="cue-exposed"/>exposed</span><span className="legend-item"><i className="cue-unknown"/>unknown</span></small></span></div>

    </div>

    <section className="portal-section" aria-label="Choose a demo mode">
      <div className="portal-section__heading"><span>EXPLORE THE PROTOTYPE</span><span>Two ways to see a cooler future <i aria-hidden="true">↘</i></span></div>
      <div className="portal-grid"><ModePortal mode="resident" onEnter={() => onEnter('resident')} /><ModePortal mode="developer" onEnter={() => onEnter('developer')} /></div>
    </section>

    <footer className="cinematic-footer">
      <div className="motion-controls">
        <span className="orbit-hint">{quality === 'fallback' ? 'STATIC PREVIEW · 3D UNAVAILABLE' : 'DRAG WORLD TO ORBIT 360°'}</span>
        <button type="button" className="orbit-tour" onClick={startOrbitTour} disabled={quality === 'fallback' || reducedMotion} aria-label="Play a ten-second 360-degree camera orbit">↻ 360° tour</button>
        <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? 'Play cinematic motion' : 'Pause cinematic motion'}>{paused ? '▶ Play' : 'Ⅱ Pause'}</button>
        <label className="quality-control">Quality <select value={quality} onChange={event => setQuality(event.target.value as LandingQuality)} aria-label="Visual quality"><option value="high">High</option><option value="balanced">Balanced</option><option value="fallback">Fallback</option></select></label>
      </div>
      <div className="honesty-note">Fictional 3D township concept · No verified campus route or shade data shown here</div>
    </footer>
  </main>
}
