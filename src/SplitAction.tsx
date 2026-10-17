import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'

type SplitActionProps = {
  label?: string
  onPrimary?: () => void
  mainAction?: ReactNode
  actions: { label: string; onSelect: () => void }[]
}

export function SplitAction({ label, onPrimary, mainAction, actions }: SplitActionProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const items = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        root.current?.querySelector<HTMLButtonElement>('.split-toggle')?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', key)
    items.current[active]?.focus()
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', key)
    }
  }, [open, active])

  function moveFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      const next = (active + direction + actions.length) % actions.length
      setActive(next)
      items.current[next]?.focus()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const next = event.key === 'Home' ? 0 : actions.length - 1
      setActive(next)
      items.current[next]?.focus()
    }
  }

  return <div className="split-action" ref={root} onKeyDown={moveFocus}>
    {mainAction ?? <button className="button button-dark split-main" type="button" onClick={onPrimary} disabled={!onPrimary}>{label}</button>}
    <button className="button button-dark split-toggle" type="button" aria-label="More stay actions" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>⌄</button>
    {open && <div className="split-menu" role="menu">{actions.map((action, index) => <button
      key={action.label}
      ref={(element) => { items.current[index] = element }}
      role="menuitem"
      tabIndex={active === index ? 0 : -1}
      onFocus={() => setActive(index)}
      onClick={() => { action.onSelect(); setOpen(false) }}
    >{action.label}</button>)}</div>}
  </div>
}
