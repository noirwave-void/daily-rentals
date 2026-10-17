import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
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
  instant: boolean
  amenities: string[]
}

type SortMode = 'recommended' | 'price-low' | 'price-high' | 'capacity' | 'location'

// taste-skill-ignore: zero padding is required to serialize valid ISO dates.
const toISODate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const addDays = (date: Date, days: number) => { const next = new Date(date); next.setDate(next.getDate() + days); return next }
const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const nightsBetween = (start: string, end: string) => Math.max(1, Math.round((new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86400000))

function StayDatePicker({ id, start, end, step, onPick, onStep, onDone }: { id: string; start: string; end: string; step: 'start' | 'end'; onPick: (date: string) => void; onStep: (step: 'start' | 'end') => void; onDone: () => void }) {
  const [month, setMonth] = useState(() => { const date = new Date(); date.setDate(1); return date })
  const today = toISODate(new Date())
  const firstOfCurrentMonth = new Date(); firstOfCurrentMonth.setDate(1)
  const currentMonthKey = toISODate(firstOfCurrentMonth)
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const title = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
  return <div className="picker date-picker" data-ui="date-picker" id={id} role="group" aria-label="Choose check-in and check-out dates">
    <p className="calendar-step">{step === 'start' ? 'Choose check-in' : 'Choose check-out'}</p>
    <div className="calendar-head"><button aria-label="Previous month" disabled={toISODate(month) <= currentMonthKey} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><strong>{title}</strong><button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div>
    <div className="calendar-grid calendar-weekdays" aria-hidden="true">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}</div>
    <div className="calendar-grid">{cells.map((day, index) => {
      if (!day) return <span className="calendar-blank" key={`blank-${index}`} />
      const date = toISODate(new Date(month.getFullYear(), month.getMonth(), day))
      const selected = date === start || date === end
      const inRange = date > start && date < end
      return <button type="button" key={date} className={`${selected ? 'is-selected' : ''}${inRange ? ' is-in-range' : ''}`} disabled={date < today} aria-label={new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} aria-pressed={selected} onClick={() => onPick(date)}>{day}</button>
    })}</div>
    <div className="calendar-selection"><span>Check-in <strong>{formatDate(start)}</strong></span><span>Check-out <strong>{formatDate(end)}</strong></span></div>
    <button className="button button-dark picker-done" onClick={onDone}>Done</button>
  </div>
}

const stays: Stay[] = [
  { id: 1, name: 'The Garden House', place: 'Asheville, North Carolina', type: 'Cottage', beds: 2, guests: 4, price: 142, image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1500&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 52%', instant: true, amenities: ['Kitchen', 'Garden', 'Wi-Fi'] },
  { id: 2, name: 'A Room by the Water', place: 'Portland, Maine', type: 'Apartment', beds: 1, guests: 2, price: 168, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1300&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 50%', instant: false, amenities: ['Kitchen', 'Water view', 'Heating'] },
  { id: 3, name: 'Maple House', place: 'Woodstock, New York', type: 'Home', beds: 3, guests: 6, price: 215, image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1500&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 52%', instant: true, amenities: ['Workspace', 'Fireplace', 'Parking'] },
  { id: 4, name: 'Blue Ridge Cabin', place: 'Boone, North Carolina', type: 'Cabin', beds: 2, guests: 4, price: 156, image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 50%', instant: false, amenities: ['Mountain view', 'Fireplace', 'Wi-Fi'] },
  { id: 5, name: 'Courtyard in Old Town', place: 'Savannah, Georgia', type: 'Apartment', beds: 1, guests: 2, price: 139, image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 50%', instant: true, amenities: ['Courtyard', 'Kitchen', 'Wi-Fi'] },
  { id: 6, name: 'Lakeside Morning', place: 'Lake Placid, New York', type: 'Home', beds: 3, guests: 6, price: 249, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1500&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 52%', instant: false, amenities: ['Lake access', 'Deck', 'Parking'] },
  { id: 7, name: 'Fern Hollow Cottage', place: 'Asheville, North Carolina', type: 'Cottage', beds: 2, guests: 4, price: 176, image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 50%', instant: false, amenities: ['Kitchen', 'Porch', 'Wi-Fi'] },
  { id: 8, name: 'The Lookout at Sunset', place: 'Asheville, North Carolina', type: 'Home', beds: 3, guests: 6, price: 228, image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1500&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 52%', instant: true, amenities: ['Mountain view', 'Deck', 'Kitchen'] },
  { id: 9, name: 'Harborlight Flat', place: 'Portland, Maine', type: 'Apartment', beds: 1, guests: 2, price: 151, image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1300&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 50%', instant: true, amenities: ['Kitchen', 'Water view', 'Heating'] },
  { id: 10, name: 'Pine & Salt House', place: 'Portland, Maine', type: 'Home', beds: 2, guests: 4, price: 194, image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 52%', instant: false, amenities: ['Workspace', 'Kitchen', 'Parking'] },
  { id: 11, name: 'The Woodstock A-Frame', place: 'Woodstock, New York', type: 'Cabin', beds: 2, guests: 4, price: 187, image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 50%', instant: true, amenities: ['Fireplace', 'Forest view', 'Deck'] },
  { id: 12, name: 'Hemlock House', place: 'Woodstock, New York', type: 'Home', beds: 3, guests: 6, price: 239, image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 52%', instant: false, amenities: ['Fireplace', 'Kitchen', 'Parking'] },
  { id: 13, name: 'Ridgepath Retreat', place: 'Boone, North Carolina', type: 'Cabin', beds: 2, guests: 4, price: 163, image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1300&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 50%', instant: true, amenities: ['Mountain view', 'Fireplace', 'Wi-Fi'] },
  { id: 14, name: 'Laurel & Stone', place: 'Boone, North Carolina', type: 'Cottage', beds: 1, guests: 2, price: 128, image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1300&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 48%', instant: false, amenities: ['Kitchen', 'Garden', 'Heating'] },
  { id: 15, name: 'Garden Gate Studio', place: 'Savannah, Georgia', type: 'Apartment', beds: 1, guests: 2, price: 146, image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1300&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 52%', instant: false, amenities: ['Courtyard', 'Kitchen', 'Wi-Fi'] },
  { id: 16, name: 'The Long Weekend House', place: 'Lake Placid, New York', type: 'Home', beds: 2, guests: 4, price: 219, image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=85', alt: 'Sample rental-home photography for the prototype', position: 'center 50%', instant: true, amenities: ['Lake access', 'Deck', 'Fireplace'] },
]

const savedStaysStorageKey = 'haven-saved-stays'

function App() {
  const initialCheckIn = addDays(new Date(), 7)
  const [place, setPlace] = useState('Anywhere')
  const [start, setStart] = useState(toISODate(initialCheckIn))
  const [end, setEnd] = useState(toISODate(addDays(initialCheckIn, 3)))
  const [guests, setGuests] = useState(2)
  const [maxPrice, setMaxPrice] = useState(250)
  const [instantOnly, setInstantOnly] = useState(false)
  const [activePicker, setActivePicker] = useState('')
  const [selected, setSelected] = useState<Stay | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState<number[]>(() => {
    try {
      const stored: unknown = JSON.parse(window.localStorage.getItem(savedStaysStorageKey) ?? '[]')
      return Array.isArray(stored) ? stored.filter((id): id is number => typeof id === 'number' && stays.some((stay) => stay.id === id)) : []
    } catch { return [] }
  })
  const [savedOpen, setSavedOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [dateStep, setDateStep] = useState<'start' | 'end'>('start')
  const [count, setCount] = useState(0)
  const [sortMode, setSortMode] = useState<SortMode>('recommended')
  const searchRoot = useRef<HTMLDivElement>(null)
  const pickerTrigger = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLElement>(null)

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
  ).sort((a, b) => sortMode === 'price-low' ? a.price - b.price : sortMode === 'price-high' ? b.price - a.price : sortMode === 'capacity' ? b.guests - a.guests : sortMode === 'location' ? a.place.localeCompare(b.place) : a.id - b.id), [place, guests, maxPrice, instantOnly, sortMode])

  useEffect(() => {
    if (count > 0 && count % 2 === 0) window.ScrollTrigger?.refresh()
  }, [count])

  useEffect(() => {
    document.title = selected ? `${selected.name} · Haven` : 'Haven — Stays that feel like yours'
    window.requestAnimationFrame(() => window.ScrollTrigger?.refresh())
  }, [selected])

  function openStay(stay: Stay) {
    window.history.pushState({ stay: stay.id }, '', `#stay-${stay.id}`)
    setSelected(stay)
    setNotice('')
  }

  function closeStay() {
    if (window.location.hash.startsWith('#stay-') && window.history.state?.stay) window.history.back()
    else {
      window.history.replaceState({}, '', '#stays')
      setSelected(null)
    }
  }

  useEffect(() => {
    const pop = () => {
      const match = window.location.hash.match(/^#stay-(\d+)$/)
      setSelected(match ? stays.find((stay) => stay.id === Number(match[1])) ?? null : null)
      setAuthOpen(false)
      setCount((value) => value + 1)
    }
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])

  useEffect(() => {
    const match = window.location.hash.match(/^#stay-(\d+)$/)
    if (match) setSelected(stays.find((stay) => stay.id === Number(match[1])) ?? null)
  }, [])

  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (selected) closeStay()
      else if (authOpen) setAuthOpen(false)
      else if (savedOpen) setSavedOpen(false)
      else if (activePicker) { setActivePicker(''); pickerTrigger.current?.focus() }
    }
    window.addEventListener('keydown', dismiss)
    return () => window.removeEventListener('keydown', dismiss)
  }, [selected, authOpen, savedOpen, activePicker])

  useEffect(() => {
    const closeOnOutsidePress = (event: MouseEvent) => {
      if (activePicker && searchRoot.current && !searchRoot.current.contains(event.target as Node)) setActivePicker('')
    }
    document.addEventListener('mousedown', closeOnOutsidePress)
    return () => document.removeEventListener('mousedown', closeOnOutsidePress)
  }, [activePicker])

  useEffect(() => {
    if (!authOpen && !savedOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const previousFocus = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]') ?? [])
    focusable()[0]?.focus()
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus() }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus() }
    }
    document.addEventListener('keydown', trapFocus)
    return () => { document.removeEventListener('keydown', trapFocus); document.body.style.overflow = previousOverflow; previousFocus?.focus() }
  }, [authOpen, savedOpen])

  useEffect(() => {
    try { window.localStorage.setItem(savedStaysStorageKey, JSON.stringify(saved)) }
    catch { setNotice('Saved stays could not be stored in this browser.') }
  }, [saved])

  function pickDate(date: string) {
    if (dateStep === 'start') {
      setStart(date)
      if (date >= end) setEnd(toISODate(addDays(new Date(`${date}T12:00:00`), 1)))
      setDateStep('end')
    } else {
      if (date > start) setEnd(date)
      else {
        setStart(date)
        setEnd(toISODate(addDays(new Date(`${date}T12:00:00`), 1)))
      }
      setDateStep('start')
      closePicker()
    }
  }

  function resetSearch() {
    setPlace('Anywhere'); setGuests(2); setMaxPrice(250); setInstantOnly(false); setSortMode('recommended')
  }

  function clearPlace() { setPlace('Anywhere') }

  function closePicker() {
    setActivePicker('')
    window.requestAnimationFrame(() => pickerTrigger.current?.focus())
  }

  const toggleSavedStay: ActionHandler = async (signal) => {
    if (!selected || signal.aborted) throw new DOMException('Save cancelled.', 'AbortError')
    const wasSaved = saved.includes(selected.id)
    const message = wasSaved ? 'Removed from this preview.' : 'Saved in this preview only.'
    setSaved((items) => wasSaved ? items.filter((id) => id !== selected.id) : [...items, selected.id])
    setNotice(message)
    return { status: 'success', message }
  }

  function submitSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthOpen(false)
    setNotice(`Sign-in is not connected yet. No email was sent to ${email}.`)
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
    <SiteHeader onSignIn={() => setAuthOpen(true)} onShowSaved={() => setSavedOpen(true)} savedCount={saved.length} />

    <div id="smooth-wrapper">
      <div id="smooth-content">
        <main id="top">
          {!selected && <>
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
            <div className="search-tools" ref={searchRoot}>
              <div className="search-fields">
              <div className="search-field picker-wrap">
                  <span className="field-label">Where</span>
                  <button className="field-value" aria-controls="destination-options" aria-expanded={activePicker === 'place'} onClick={(event) => { pickerTrigger.current = event.currentTarget; setActivePicker(activePicker === 'place' ? '' : 'place') }}>{place}<span aria-hidden="true">⌄</span></button>
                  {activePicker === 'place' && <div className="picker" data-ui="destination-picker" id="destination-options" role="group" aria-label="Choose a destination">{['Anywhere', 'Asheville', 'Portland', 'Woodstock', 'Boone', 'Savannah', 'Lake Placid'].map((option) => <button key={option} aria-pressed={place === option} onClick={() => { setPlace(option); closePicker() }}>{option}</button>)}</div>}
                </div>
                <div className="search-field picker-wrap">
                  <span className="field-label">Dates</span>
                  <button className="field-value" aria-controls="date-picker" aria-expanded={activePicker === 'dates'} onClick={(event) => { pickerTrigger.current = event.currentTarget; setDateStep('start'); setActivePicker(activePicker === 'dates' ? '' : 'dates') }}>{formatDate(start)} – {formatDate(end)}<span aria-hidden="true">⌄</span></button>
                  {activePicker === 'dates' && <StayDatePicker id="date-picker" start={start} end={end} step={dateStep} onPick={pickDate} onStep={setDateStep} onDone={closePicker} />}
                </div>
                <div className="search-field picker-wrap guests-field">
                  <span className="field-label">Guests</span>
                  <button className="field-value" aria-controls="guest-picker" aria-expanded={activePicker === 'guests'} onClick={(event) => { pickerTrigger.current = event.currentTarget; setActivePicker(activePicker === 'guests' ? '' : 'guests') }}>{guests} {guests === 1 ? 'guest' : 'guests'}<span aria-hidden="true">⌄</span></button>
                  {activePicker === 'guests' && <div className="picker guest-picker" data-ui="guest-picker" id="guest-picker" role="group" aria-label="Choose guest count"><p>Who is coming?</p><div className="counter"><span>Guests</span><div><button aria-label="Remove one guest" disabled={guests <= 1} onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button><b aria-live="polite">{guests}</b><button aria-label="Add one guest" disabled={guests >= 12} onClick={() => setGuests((value) => Math.min(12, value + 1))}>+</button></div></div><button className="button button-dark picker-done" onClick={closePicker}>Done</button></div>}
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
              <div><p className="result-count" aria-live="polite">{resultText} · {formatDate(start)} – {formatDate(end)} · {nightsBetween(start, end)} nights</p><h2 id="stays-title">Choose your<br />quiet corner.</h2></div>
              <div className="listing-controls"><label>Sort by<select aria-label="Sort stays" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="capacity">Guest capacity</option><option value="location">Location A–Z</option></select></label></div>
            </div>
            <p className="inventory-note" role="note">Prototype inventory: names, locations, rates, amenities, booking options, and photos are examples, not verified listings.</p>
            <div className="active-filters" aria-label="Active filters">
              {place !== 'Anywhere' && <button onClick={clearPlace}>Place: {place} <span aria-hidden="true">×</span></button>}
              {guests !== 2 && <button onClick={() => setGuests(2)}>{guests} guests <span aria-hidden="true">×</span></button>}
              {maxPrice !== 250 && <button onClick={() => setMaxPrice(250)}>Up to ${maxPrice}/night <span aria-hidden="true">×</span></button>}
              {instantOnly && <button onClick={() => setInstantOnly(false)}>Instant Book <span aria-hidden="true">×</span></button>}
              {(place !== 'Anywhere' || guests !== 2 || maxPrice !== 250 || instantOnly) && <button className="clear-filters" onClick={resetSearch}>Clear all</button>}
            </div>
            {filtered.length ? <div className="stay-gallery">{filtered.map((stay, index) => <article className={`stay stay-${index % 4}`} key={stay.id} data-reveal>
              <button className="stay-image" onClick={() => openStay(stay)} aria-label={`View ${stay.name}`}>
                <img src={stay.image} alt={stay.alt} loading="lazy" width="1500" height="1000" style={{ objectPosition: stay.position }} data-speed={index % 2 ? '1.08' : '0.88'} />
              </button>
              <div className="stay-copy">
                <button className="stay-name" onClick={() => openStay(stay)}>{stay.name}</button>
                <p>{stay.place} · {stay.type} · {stay.beds} {stay.beds === 1 ? 'bed' : 'beds'} · Up to {stay.guests} guests</p>
                {stay.instant && <p className="stay-availability">Instant booking available · sample</p>}
                <p className="stay-amenities"><span>Example amenities:</span> {stay.amenities.join(' · ')}</p>
                <div className="stay-price"><span><strong>${stay.price}</strong> per night</span><span>${stay.price * nightsBetween(start, end)} stay total</span></div>
              </div>
            </article>)}</div> : <div className="empty-results" role="status" aria-live="polite"><h3>No stays match those filters.</h3><p>Try loosening one or more choices to see the sample inventory.</p><div className="empty-filter-suggestions">{place !== 'Anywhere' && <button className="text-link" onClick={clearPlace}>Search anywhere</button>}{guests > 2 && <button className="text-link" onClick={() => setGuests(2)}>Show places for 2 guests</button>}{maxPrice < 250 && <button className="text-link" onClick={() => setMaxPrice(250)}>Raise price limit to $250</button>}{instantOnly && <button className="text-link" onClick={() => setInstantOnly(false)}>Include non-Instant Book stays</button>}<button className="text-link" onClick={resetSearch}>Clear all filters</button></div></div>}
            <p className="sample-note">Sample stays, locations and rates for this prototype. Confirm inventory before publishing.</p>
          </section>

          <section className="arrival-section" id="how-it-works" data-reveal>
            <div className="arrival-image"><img src={stays[4].image} alt="A quiet sunlit room with natural wood details" width="1400" height="1000" loading="lazy" data-speed="0.9" /></div>
            <div className="arrival-copy"><p className="arrival-label">A clearer arrival</p><h2>Know the details<br />before you go.</h2><p>Your dates, guest count, nightly rate, and service costs stay in view while you decide. No mystery math at the end.</p><a className="text-link" href="#stays">Browse the stays <span aria-hidden="true">↗</span></a></div>
          </section>

          <section className="ledger-section" data-reveal>
            <h2>Every stay,<br />one clear total.</h2>
            <div className="ledger">
              <p><span>Your dates</span><strong>{formatDate(start)} – {formatDate(end)} · {nightsBetween(start, end)} nights</strong></p>
              <p><span>Coming along</span><strong>{guests} {guests === 1 ? 'guest' : 'guests'}</strong></p>
              <p><span>Nightly price</span><strong>From ${filtered.length ? Math.min(...filtered.map((stay) => stay.price)) : 139}</strong></p>
              <a href="#stays" className="button button-dark">Find a stay</a>
            </div>
          </section>

          <footer className="site-footer" id="footer">
            <div className="footer-top"><a className="footer-wordmark" href="#top">Haven.</a><p>Room to arrive.<br />Space to stay awhile.</p><div className="footer-links"><a href="#stays">Find a stay</a><a href="#how-it-works">How it works</a><button onClick={() => setAuthOpen(true)}>Your account</button></div></div>
            <div className="footer-bottom"><span>Sample listing imagery from Unsplash. Replace with verified property photography before launch.</span><span>© 2026 Haven prototype</span></div>
          </footer>
          </>}
          {selected && <StayDetails stay={selected} start={start} end={end} guests={guests} setStart={setStart} setEnd={setEnd} setGuests={setGuests} onBack={closeStay} onSave={toggleSavedStay} saved={saved.includes(selected.id)} notice={notice} />}
        </main>
      </div>
    </div>

    {notice && !selected && !authOpen && !savedOpen && <div className="global-notice" role="status" aria-live="polite">{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}
    {savedOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSavedOpen(false) }}><section ref={dialogRef} className="saved-modal" role="dialog" aria-modal="true" aria-labelledby="saved-title"><button className="modal-close" aria-label="Close saved stays" onClick={() => setSavedOpen(false)}>×</button><p className="modal-place">Your shortlist · stored in this browser</p><h2 id="saved-title">Saved stays</h2>{saved.length ? <div className="saved-list">{stays.filter((stay) => saved.includes(stay.id)).map((stay) => <article className="saved-item" key={stay.id}><img src={stay.image} alt={stay.alt} /><div><h3>{stay.name}</h3><p>{stay.place} · {stay.type} · Up to {stay.guests} guests</p><p><strong>${stay.price}</strong> per night</p><div className="saved-item-actions"><button className="text-link" onClick={() => { setSavedOpen(false); openStay(stay) }}>View stay</button><button className="text-link" onClick={() => setSaved((items) => items.filter((id) => id !== stay.id))}>Remove</button></div></div></article>)}</div> : <div className="saved-empty"><h3>Nothing saved yet.</h3><p>Open a stay and choose “Save this stay” to keep it here.</p><button className="button button-dark" onClick={() => setSavedOpen(false)}>Explore stays</button></div>}<p className="prototype-note">Saved items are kept on this device only. Sign-in and account sync are not connected yet.</p></section></div>}
    {authOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false) }}><section ref={dialogRef} className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" aria-label="Close sign in" onClick={() => setAuthOpen(false)}>×</button><p className="modal-place">Your Haven account</p><h2 id="auth-title">Keep your stays close.</h2><p>Sign in to manage saved places and past bookings.</p><form onSubmit={submitSignIn}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><button className="button button-dark" type="submit">Continue with email</button></form><p className="prototype-note">Prototype sign-in only. Connect Supabase Auth to enable accounts and booking history.</p></section></div>}
  </>
}

export default App

function StayDetails({ stay, start, end, guests, setStart, setEnd, setGuests, onBack, onSave, saved, notice }: {
  stay: Stay; start: string; end: string; guests: number; setStart: (value: string) => void; setEnd: (value: string) => void;
  setGuests: (value: number | ((current: number) => number)) => void; onBack: () => void; onSave: ActionHandler; saved: boolean; notice: string
}) {
  const [copyStatus, setCopyStatus] = useState('')
  const nights = nightsBetween(start, end)
  const subtotal = stay.price * nights
  const service = 46
  const today = toISODate(new Date())
  return <section className="stay-detail-page" aria-labelledby="detail-title">
    <div className="detail-nav"><button className="text-link" onClick={onBack}>← Back to stays</button><div className="detail-share-wrap"><button className="detail-share" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCopyStatus('Stay link copied.') } catch { setCopyStatus('Copy the page address from your browser to share this sample stay.') } }}>{copyStatus ? 'Copied' : 'Copy link'}</button>{copyStatus && <span role="status" aria-live="polite">{copyStatus}</span>}</div></div>
    <div className="detail-heading"><div><p className="detail-location">{stay.place}</p><h1 id="detail-title">{stay.name}</h1></div><p>{stay.type} · {stay.beds} {stay.beds === 1 ? 'bed' : 'beds'} · Up to {stay.guests} guests</p></div>
    <div className="detail-photo"><img src={stay.image} alt={stay.alt} width="1500" height="1000" /><span>Sample listing image · replace with verified property photography</span></div>
    <div className="detail-layout">
      <div className="detail-content">
        <section><h2>A little space to settle in.</h2><p>This {stay.type.toLowerCase()} in {stay.place} is sample listing content for the Haven prototype. Confirm every property description with its host before publishing.</p><p className="detail-rating">Up to {stay.guests} guests · {stay.instant ? 'Instant Book preview' : 'Request-to-book preview'}</p></section>
        <section className="detail-amenities"><h2>What this stay offers</h2><p>Illustrative amenities for layout preview; not verified for this property.</p><ul>{stay.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul></section>
        <section><h2>House rules & cancellation</h2><div className="rule-row"><strong>Check-in and check-out</strong><span>Times to be confirmed by the host</span></div><div className="rule-row"><strong>House rules</strong><span>Quiet hours, occupancy, and pet policy to be confirmed</span></div><div className="rule-row"><strong>Cancellation</strong><span>Policy not yet provided</span></div></section>
      </div>
      <aside className="detail-booking" aria-label="Stay price estimate">
        <p className="detail-price"><strong>${stay.price}</strong> / night</p><p className="detail-booking-note">Estimate only · availability is not checked</p>
        <label>Check-in<input type="date" min={today} value={start} onChange={(event) => { setStart(event.target.value); if (event.target.value >= end) setEnd(toISODate(addDays(new Date(`${event.target.value}T12:00:00`), 1))) }} /></label>
        <label>Check-out<input type="date" min={toISODate(addDays(new Date(`${start}T12:00:00`), 1))} value={end} onChange={(event) => { if (event.target.value > start) setEnd(event.target.value) }} /></label>
        <div className="detail-guest-control"><span>Guests</span><div><button aria-label="Remove one guest" disabled={guests <= 1} onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button><strong aria-live="polite">{guests}</strong><button aria-label="Add one guest" disabled={guests >= stay.guests} onClick={() => setGuests((value) => Math.min(stay.guests, value + 1))}>+</button></div></div>
        <div className="detail-total"><span>${stay.price} × {nights} nights</span><strong>${subtotal}</strong></div><div className="detail-total"><span>Sample cleaning and service</span><strong>${service}</strong></div><div className="detail-total detail-grand-total"><span>Estimated total</span><strong>${subtotal + service}</strong></div>
        <ProgressActionButton action="save" onAction={onSave} idleLabel={saved ? 'Remove saved stay' : 'Save this stay'} loadingLabel={saved ? 'Removing saved stay…' : 'Saving this stay…'} successLabel={saved ? 'Saved for later' : 'Removed from saved stays'} className="save-stay-action" />
        <button className="button button-dark detail-reserve" type="button" disabled title="Booking is not connected">Booking unavailable</button>
        <p className="prototype-note">No reservation or payment is created. Connect verified availability and booking services before launch.</p>
        {notice && <p className="notice" role="status">{notice}</p>}
      </aside>
    </div>
  </section>
}
