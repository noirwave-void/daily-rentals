import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { SplitAction } from './SplitAction'
import { ProgressActionButton } from './ProgressActionButton'
import type { ActionHandler } from './ProgressActionButton'
import { SiteHeader } from './SiteHeader'

declare global {
  interface Window {
    gsap?: any
    ScrollSmoother?: any
    ScrollTrigger?: any
  }
}

type Stay = {
  id: number
  name: string
  place: string
  type: string
  beds: number
  guests: number
  price: number
  image: string
  alt: string
  position: string
  rating: string
  instant: boolean
}

const stays: Stay[] = [
  { id: 1, name: 'The Garden House', place: 'Asheville, North Carolina', type: 'Cottage', beds: 2, guests: 4, price: 142, image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1500&q=85', alt: 'Wood cabin tucked among tall trees', position: 'center 52%', rating: '4.94', instant: true },
  { id: 2, name: 'A Room by the Water', place: 'Portland, Maine', type: 'Apartment', beds: 1, guests: 2, price: 168, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1300&q=85', alt: 'Bright coastal home with a quiet garden', position: 'center 50%', rating: '4.88', instant: false },
  { id: 3, name: 'Maple House', place: 'Woodstock, New York', type: 'Home', beds: 3, guests: 6, price: 215, image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1500&q=85', alt: 'Warm timber home surrounded by green trees', position: 'center 52%', rating: '4.97', instant: true },
  { id: 4, name: 'Blue Ridge Cabin', place: 'Boone, North Carolina', type: 'Cabin', beds: 2, guests: 4, price: 156, image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=85', alt: 'Small cabin resting in a mountain landscape', position: 'center 50%', rating: '4.91', instant: false },
  { id: 5, name: 'Courtyard in Old Town', place: 'Savannah, Georgia', type: 'Apartment', beds: 1, guests: 2, price: 139, image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85', alt: 'Calm, sunlit living room with natural materials', position: 'center 50%', rating: '4.85', instant: true },
  { id: 6, name: 'Lakeside Morning', place: 'Lake Placid, New York', type: 'Home', beds: 3, guests: 6, price: 249, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1500&q=85', alt: 'Modern lakeside home beneath a clear sky', position: 'center 52%', rating: '4.96', instant: false },
]

const dateOptions = ['May 12', 'May 13', 'May 14', 'May 15', 'May 16', 'May 17', 'May 18', 'May 19', 'May 20']
const nightsBetween = (start: string, end: string) => Math.max(1, dateOptions.indexOf(end) - dateOptions.indexOf(start))

function App() {
  const [place, setPlace] = useState('Anywhere')
  const [start, setStart] = useState('May 12')
  const [end, setEnd] = useState('May 15')
  const [guests, setGuests] = useState(2)
  const [maxPrice, setMaxPrice] = useState(250)
  const [instantOnly, setInstantOnly] = useState(false)
  const [activePicker, setActivePicker] = useState('')
  const [selected, setSelected] = useState<Stay | null>(null)
  const [editingStay, setEditingStay] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState<number[]>([])
  const [notice, setNotice] = useState('')
  const [dateStep, setDateStep] = useState<'start' | 'end'>('start')
  const [count, setCount] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = window.matchMedia('(max-width: 760px)').matches
    const gsap = window.gsap
    const ScrollTrigger = window.ScrollTrigger
    const ScrollSmoother = window.ScrollSmoother
    if (reduce || small || !gsap || !ScrollTrigger || !ScrollSmoother) return
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother)
    const smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1, effects: true, normalizeScroll: true })
    const alignHashTarget = () => {
      const hash = window.location.hash
      const target = hash.startsWith('#') ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
      if (target) smoother.scrollTo(target, false, hash === '#footer' ? 'bottom bottom' : 'top top')
      ScrollTrigger.refresh()
    }
    const alignAfterLoad = () => window.requestAnimationFrame(alignHashTarget)
    window.addEventListener('hashchange', alignAfterLoad)
    if (document.readyState === 'complete') alignAfterLoad()
    else window.addEventListener('load', alignAfterLoad, { once: true })
    const reveals = gsap.utils.toArray('[data-reveal]') as HTMLElement[]
    reveals.forEach((element) => gsap.fromTo(element, { y: 22, autoAlpha: 0 }, {
      y: 0,
      autoAlpha: 1,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: element, start: 'top 86%', once: true },
    }))
    return () => {
      window.removeEventListener('load', alignAfterLoad)
      window.removeEventListener('hashchange', alignAfterLoad)
      smoother.kill()
      ScrollTrigger.getAll().forEach((trigger: { kill: () => void }) => trigger.kill())
    }
  }, [])

  const filtered = useMemo(() => stays.filter((stay) =>
    (place === 'Anywhere' || stay.place.includes(place)) && stay.guests >= guests && stay.price <= maxPrice && (!instantOnly || stay.instant),
  ), [place, guests, maxPrice, instantOnly])

  useEffect(() => {
    if (count > 0 && count % 2 === 0) window.ScrollTrigger?.refresh()
  }, [count])

  function openStay(stay: Stay) {
    window.history.pushState({ stay: stay.id }, '', `#stay-${stay.id}`)
    setSelected(stay)
    setNotice('')
  }

  function closeStay() {
    if (window.location.hash.startsWith('#stay-')) window.history.back()
    else setSelected(null)
  }

  useEffect(() => {
    const pop = () => {
      setSelected(null)
      setEditingStay(false)
      setAuthOpen(false)
      setCount((value) => value + 1)
    }
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])

  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (selected) closeStay()
      else setAuthOpen(false)
    }
    window.addEventListener('keydown', dismiss)
    return () => window.removeEventListener('keydown', dismiss)
  }, [selected])

  function pickDate(date: string) {
    if (dateStep === 'start') {
      setStart(date)
      if (dateOptions.indexOf(date) >= dateOptions.indexOf(end)) setEnd(dateOptions[Math.min(dateOptions.indexOf(date) + 1, dateOptions.length - 1)])
      setDateStep('end')
    } else {
      if (dateOptions.indexOf(date) > dateOptions.indexOf(start)) setEnd(date)
      else {
        setStart(date)
        setEnd(dateOptions[Math.min(dateOptions.indexOf(date) + 1, dateOptions.length - 1)])
      }
      setDateStep('start')
      setActivePicker('')
    }
  }

  const toggleSavedStay: ActionHandler = async (signal) => {
    if (!selected || signal.aborted) throw new DOMException('Save cancelled.', 'AbortError')
    const wasSaved = saved.includes(selected.id)
    const message = wasSaved ? 'Removed from saved stays.' : 'Saved for later.'
    setSaved((items) => wasSaved ? items.filter((id) => id !== selected.id) : [...items, selected.id])
    setNotice(message)
    return { status: 'success', message }
  }

  function submitSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthOpen(false)
    setNotice(`A sign-in link is ready for ${email}. Connect Supabase Auth to enable email delivery.`)
  }

  const searchStays: ActionHandler = async (signal) => {
    if (signal.aborted) throw new DOMException('Search cancelled.', 'AbortError')
    setActivePicker('')
    const smoother = window.ScrollSmoother?.get()
    if (smoother) smoother.scrollTo('#stays', true, 'top top')
    else document.querySelector('#stays')?.scrollIntoView({ behavior: 'smooth' })
    return { status: filtered.length ? 'success' : 'empty' }
  }

  const resultText = `${filtered.length} ${filtered.length === 1 ? 'stay' : 'stays'} for ${guests} ${guests === 1 ? 'guest' : 'guests'}`

  return <>
    <SiteHeader onSignIn={() => setAuthOpen(true)} />

    <div id="smooth-wrapper">
      <div id="smooth-content">
        <main id="top">
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-photos" aria-hidden="true">
              <img className="hero-photo hero-photo-a" data-speed="0.8" fetchPriority="high" src={stays[0].image} alt="" />
              <img className="hero-photo hero-photo-b" data-speed="1.08" src={stays[1].image} alt="" />
              <img className="hero-photo hero-photo-c" data-speed="0.92" src={stays[2].image} alt="" />
            </div>
            <div className="hero-scrim" />
            <div className="hero-inner">
              <h1 id="hero-title">Find room<br />to arrive</h1>
              <div className="hero-bottom">
                <p>Find a little room to settle in, wherever the day takes you.</p>
                <a className="button button-light" href="#stays">Explore stays <span aria-hidden="true">↘</span></a>
              </div>
            </div>
            <span className="hero-caption">A slower way to find your next place</span>
          </section>

          <section className="search-section" aria-label="Search stays">
            <div className="search-intro">
              <h2>Start with the<br />shape of your stay.</h2>
              <p>Choose a place, dates, and the people coming along. The list will follow.</p>
            </div>
            <div className="search-tools">
              <div className="search-fields">
                <div className="search-field picker-wrap">
                  <span className="field-label">Where</span>
                  <button className="field-value" aria-expanded={activePicker === 'place'} onClick={() => setActivePicker(activePicker === 'place' ? '' : 'place')}>{place}<span aria-hidden="true">⌄</span></button>
                  {activePicker === 'place' && <div className="picker" role="listbox" aria-label="Choose a destination">{['Anywhere', 'Asheville', 'Portland', 'Woodstock', 'Boone', 'Savannah', 'Lake Placid'].map((option) => <button role="option" aria-selected={place === option} key={option} onClick={() => { setPlace(option); setActivePicker('') }}>{option}</button>)}</div>}
                </div>
                <div className="search-field picker-wrap">
                  <span className="field-label">Dates</span>
                  <button className="field-value" aria-expanded={activePicker === 'dates'} onClick={() => setActivePicker(activePicker === 'dates' ? '' : 'dates')}>{start} – {end}<span aria-hidden="true">⌄</span></button>
                  {activePicker === 'dates' && <div className="picker date-picker"><p>Choose {dateStep === 'start' ? 'check-in' : 'check-out'}</p><div className="date-options">{dateOptions.map((date) => <button key={date} className={date === start || date === end ? 'is-selected' : ''} onClick={() => pickDate(date)}>{date}</button>)}</div></div>}
                </div>
                <div className="search-field picker-wrap guests-field">
                  <span className="field-label">Guests</span>
                  <button className="field-value" aria-expanded={activePicker === 'guests'} onClick={() => setActivePicker(activePicker === 'guests' ? '' : 'guests')}>{guests} {guests === 1 ? 'guest' : 'guests'}<span aria-hidden="true">⌄</span></button>
                  {activePicker === 'guests' && <div className="picker guest-picker"><p>Who is coming?</p><div className="counter"><span>Guests</span><div><button aria-label="Remove one guest" disabled={guests <= 1} onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button><b aria-live="polite">{guests}</b><button aria-label="Add one guest" disabled={guests >= 12} onClick={() => setGuests((value) => Math.min(12, value + 1))}>+</button></div></div><button className="button button-dark picker-done" onClick={() => setActivePicker('')}>Done</button></div>}
                </div>
                <ProgressActionButton
                  action="search"
                  onAction={searchStays}
                  disabled={!start || !end || start === end}
                  disabledReason="Choose valid check-in and check-out dates before searching."
                  idleLabel="Search stays"
                  loadingLabel="Updating sample results..."
                  successLabel="Sample results ready"
                  emptyLabel="No sample stays match"
                  errorLabel="Could not update results. Try again."
                  className="search-submit"
                />
              </div>
              <div className="filter-row">
                <label className="price-control">Maximum price <strong>${maxPrice} / night</strong><input type="range" min="100" max="250" step="5" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} /></label>
                <label className="instant-control"><input type="checkbox" checked={instantOnly} onChange={(event) => setInstantOnly(event.target.checked)} /> Instant Book</label>
              </div>
            </div>
          </section>

          <section className="stays-section" id="stays" aria-labelledby="stays-title">
            <div className="section-heading" data-reveal>
              <div><p className="result-count" aria-live="polite">{resultText} · {start} – {end}</p><h2 id="stays-title">Choose your<br />quiet corner.</h2></div>
              <p className="heading-aside">Clear nightly rates.<br />A little more room to arrive.</p>
            </div>
            {filtered.length ? <div className="stay-gallery">{filtered.map((stay, index) => <article className={`stay stay-${index % 4}`} key={stay.id} data-reveal>
              <button className="stay-image" onClick={() => openStay(stay)} aria-label={`View ${stay.name}`}>
                <img src={stay.image} alt={stay.alt} loading="lazy" width="1500" height="1000" style={{ objectPosition: stay.position }} data-speed={index % 2 ? '1.08' : '0.88'} />
                {stay.instant && <span className="stay-tag">Instant book</span>}
              </button>
              <div className="stay-copy">
                <button className="stay-name" onClick={() => openStay(stay)}>{stay.name}</button>
                <span className="stay-rating">{stay.rating} guest rating</span>
                <p>{stay.place} · {stay.type} · {stay.beds} {stay.beds === 1 ? 'bed' : 'beds'}</p>
                <div className="stay-price"><span><strong>${stay.price}</strong> per night</span><span>${stay.price * nightsBetween(start, end)} stay total</span></div>
              </div>
            </article>)}</div> : <div className="empty-results"><h3>No stays match just yet.</h3><p>Try a wider price range or a different guest count.</p><button className="text-link" onClick={() => { setPlace('Anywhere'); setGuests(2); setMaxPrice(250); setInstantOnly(false) }}>Clear search</button></div>}
            <p className="sample-note">Sample stays, locations and rates for this prototype. Confirm inventory before publishing.</p>
          </section>

          <section className="arrival-section" id="how-it-works" data-reveal>
            <div className="arrival-image"><img src={stays[4].image} alt="A quiet sunlit room with natural wood details" width="1400" height="1000" loading="lazy" data-speed="0.9" /></div>
            <div className="arrival-copy"><p className="arrival-label">A clearer arrival</p><h2>Know the details<br />before you go.</h2><p>Your dates, guest count, nightly rate, and service costs stay in view while you decide. No mystery math at the end.</p><a className="text-link" href="#stays">Browse the stays <span aria-hidden="true">↗</span></a></div>
          </section>

          <section className="ledger-section" data-reveal>
            <h2>Every stay,<br />one clear total.</h2>
            <div className="ledger">
              <p><span>Your dates</span><strong>{start} – {end} · {nightsBetween(start, end)} nights</strong></p>
              <p><span>Coming along</span><strong>{guests} {guests === 1 ? 'guest' : 'guests'}</strong></p>
              <p><span>Nightly price</span><strong>From ${filtered.length ? Math.min(...filtered.map((stay) => stay.price)) : 139}</strong></p>
              <a href="#stays" className="button button-dark">Find a stay</a>
            </div>
          </section>

          <footer className="site-footer" id="footer">
            <div className="footer-top"><a className="footer-wordmark" href="#top">Haven.</a><p>Room to arrive.<br />Space to stay awhile.</p><div className="footer-links"><a href="#stays">Find a stay</a><a href="#how-it-works">How it works</a><button onClick={() => setAuthOpen(true)}>Your account</button></div></div>
            <div className="footer-bottom"><span>Sample listing imagery from Unsplash. Replace with verified property photography before launch.</span><span>© 2026 Haven prototype</span></div>
          </footer>
        </main>
      </div>
    </div>

    {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeStay() }}>
      <section className="stay-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" aria-label="Close stay details" onClick={closeStay}>×</button>
        <img className="modal-image" src={selected.image} alt={selected.alt} width="1500" height="1000" />
        <div className="modal-copy"><p className="modal-place">{selected.place}</p><h2 id="modal-title">{selected.name}</h2><p>{selected.type} · {selected.beds} beds · Up to {selected.guests} guests · {selected.rating} guest rating</p>
          <div className="modal-details"><span>${selected.price} × {nightsBetween(start, end)} nights</span><strong>${selected.price * nightsBetween(start, end)}</strong></div>
          <div className="modal-details"><span>Cleaning and service</span><strong>$46</strong></div>
          <div className="modal-total"><span>Total before you confirm</span><strong>${selected.price * nightsBetween(start, end) + 46}</strong></div>
          <p className="modal-dates">{start} – {end} · {guests} {guests === 1 ? 'guest' : 'guests'}</p>
          <div className="stay-edit-row"><button onClick={() => { setEditingStay((value) => !value); setActivePicker('') }}>{editingStay ? 'Done changing stay' : 'Change dates or guests'}</button></div>
          {editingStay && <div className="stay-edit-controls"><div><span>Check in</span><select aria-label="Check-in date" value={start} onChange={(event) => { setStart(event.target.value); if (dateOptions.indexOf(event.target.value) >= dateOptions.indexOf(end)) setEnd(dateOptions[Math.min(dateOptions.indexOf(event.target.value) + 1, dateOptions.length - 1)]) }}>{dateOptions.slice(0, -1).map((date) => <option key={date}>{date}</option>)}</select></div><div><span>Check out</span><select aria-label="Check-out date" value={end} onChange={(event) => { if (dateOptions.indexOf(event.target.value) > dateOptions.indexOf(start)) setEnd(event.target.value) }}>{dateOptions.slice(dateOptions.indexOf(start) + 1).map((date) => <option key={date}>{date}</option>)}</select></div><div className="modal-guest-counter"><span>Guests</span><div><button aria-label="Remove one guest" disabled={guests <= 1} onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button><b aria-live="polite">{guests}</b><button aria-label="Add one guest" disabled={guests >= 12} onClick={() => setGuests((value) => Math.min(12, value + 1))}>+</button></div></div></div>}
          <ProgressActionButton
            action="save"
            onAction={toggleSavedStay}
            idleLabel={saved.includes(selected.id) ? 'Remove saved stay' : 'Save this stay'}
            loadingLabel={saved.includes(selected.id) ? 'Removing saved stay...' : 'Saving this stay...'}
            successLabel={saved.includes(selected.id) ? 'Saved for later' : 'Removed from saved stays'}
            className="save-stay-action"
          />
          <SplitAction mainAction={<ProgressActionButton
            action="reserve"
            idleLabel="Continue to confirmation"
            disabled
            disabledReason="Reservations are unavailable until a real booking service is connected. No booking will be created."
          />} actions={[{ label: 'Copy stay link', onSelect: () => { navigator.clipboard?.writeText(window.location.href); setNotice('Stay link copied.') } }]} />
          {notice && <p className="notice" role="status">{notice}</p>}
        </div>
      </section>
    </div>}

    {authOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false) }}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" aria-label="Close sign in" onClick={() => setAuthOpen(false)}>×</button><p className="modal-place">Your Haven account</p><h2 id="auth-title">Keep your stays close.</h2><p>Sign in to manage saved places and past bookings.</p><form onSubmit={submitSignIn}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><button className="button button-dark" type="submit">Continue with email</button></form><p className="prototype-note">Prototype sign-in only. Connect Supabase Auth to enable accounts and booking history.</p></section></div>}
  </>
}

export default App
