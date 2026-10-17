import { Fragment, useEffect, useRef, useState } from 'react'

type SiteHeaderProps = {
  onSignIn: () => void
  onShowSaved: () => void
  savedCount: number
}

export function SiteHeader({ onSignIn, onShowSaved, savedCount }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const mobileNav = useRef<HTMLElement>(null)
  const firstMenuLink = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    let frame = 0
    const updateScrollState = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24)
        frame = 0
      })
    }

    window.addEventListener('scroll', updateScrollState, { passive: true })
    updateScrollState()
    return () => {
      window.removeEventListener('scroll', updateScrollState)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstMenuLink.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButton.current?.focus()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = mobileNav.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
  }

  function signIn() {
    closeMenu()
    menuButton.current?.focus()
    onSignIn()
  }

  function showSaved() {
    closeMenu()
    menuButton.current?.focus()
    onShowSaved()
  }

  return <Fragment>
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <a className="wordmark" href="#top" aria-label="Haven home" onClick={closeMenu}>Haven<span>.</span></a>
      <nav className="desktop-nav" aria-label="Main navigation">
        <a href="#stays">Find a stay</a>
        <a href="#how-it-works">How it works</a>
        <a href="#footer">Help</a>
      </nav>
      <button className="saved-shortcut" type="button" aria-label={`Saved stays, ${savedCount} saved`} onClick={showSaved}>Saved <span>{savedCount}</span></button>
      <button className="signin" type="button" onClick={signIn}>Sign in</button>
      <button
        ref={menuButton}
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className={`menu-icon${menuOpen ? ' is-open' : ''}`} aria-hidden="true"><i /><i /><i /></span>
      </button>
      <nav ref={mobileNav} id="mobile-navigation" className={`mobile-nav${menuOpen ? ' is-open' : ''}`} aria-label="Mobile navigation" aria-hidden={!menuOpen}>
        <a ref={firstMenuLink} href="#stays" tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>Find a stay</a>
        <a href="#how-it-works" tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>How it works</a>
        <a href="#footer" tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>Help</a>
        <button type="button" tabIndex={menuOpen ? 0 : -1} onClick={showSaved}>Saved stays ({savedCount})</button>
        <button type="button" tabIndex={menuOpen ? 0 : -1} onClick={signIn}>Sign in</button>
      </nav>
    </header>
    {menuOpen && <button className="mobile-backdrop" type="button" aria-label="Close navigation menu" onClick={closeMenu} />}
  </Fragment>
}
