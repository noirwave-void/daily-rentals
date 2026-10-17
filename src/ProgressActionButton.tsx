import { useEffect, useRef, useState } from 'react'

export type BookingAction = 'search' | 'check' | 'reserve' | 'confirm' | 'save'
export type ActionResult = { status: 'success' | 'empty'; message?: string }
export type ActionHandler = (signal: AbortSignal) => Promise<ActionResult>

type ProgressActionButtonProps = {
  action: BookingAction
  onAction?: ActionHandler
  disabled?: boolean
  disabledReason?: string
  idleLabel?: string
  loadingLabel?: string
  successLabel?: string
  emptyLabel?: string
  errorLabel?: string
  className?: string
}

type ActionState = 'idle' | 'loading' | 'success' | 'empty' | 'error'

const defaults: Record<BookingAction, { idle: string; loading: string; success: string; empty: string; error: string }> = {
  search: { idle: 'Search availability', loading: 'Finding available options...', success: 'Results found', empty: 'No availability found', error: 'Search failed. Try again.' },
  check: { idle: 'Check availability', loading: 'Checking availability...', success: 'Details checked', empty: 'No availability found', error: 'Could not check availability. Retry.' },
  reserve: { idle: 'Reserve now', loading: 'Creating reservation...', success: 'Reservation created', empty: 'No availability found', error: 'Reservation not created. Retry.' },
  confirm: { idle: 'Confirm booking', loading: 'Confirming booking...', success: 'Booking confirmed', empty: 'No availability found', error: 'Booking not confirmed. Retry.' },
  save: { idle: 'Save this stay', loading: 'Saving this stay...', success: 'Saved for later', empty: 'Stay not saved', error: 'Could not save this stay. Retry.' },
}

export function ProgressActionButton({
  action,
  onAction,
  disabled = false,
  disabledReason,
  idleLabel,
  loadingLabel,
  successLabel,
  emptyLabel,
  errorLabel,
  className = '',
}: ProgressActionButtonProps) {
  const [state, setState] = useState<ActionState>('idle')
  const [message, setMessage] = useState('')
  const controller = useRef<AbortController | null>(null)
  const mounted = useRef(false)
  const labels = defaults[action]
  const blocked = disabled || !onAction
  const helperId = `progress-action-help-${action}`

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      controller.current?.abort()
    }
  }, [])

  async function runAction() {
    if (blocked || !onAction || state === 'loading') return
    const request = new AbortController()
    controller.current?.abort()
    controller.current = request
    setState('loading')
    setMessage('')

    try {
      const result = await onAction(request.signal)
      if (!mounted.current || request.signal.aborted) return
      setState(result.status)
      setMessage(result.message ?? '')
    } catch (error) {
      if (!mounted.current || request.signal.aborted) return
      setState('error')
      setMessage(error instanceof Error && error.message ? error.message : 'Please try again.')
    } finally {
      if (controller.current === request) controller.current = null
    }
  }

  const label = state === 'loading' ? loadingLabel ?? labels.loading
    : state === 'success' ? successLabel ?? labels.success
      : state === 'empty' ? emptyLabel ?? labels.empty
        : state === 'error' ? errorLabel ?? labels.error
          : idleLabel ?? labels.idle
  const statusMessage = state === 'error' ? message || errorLabel || labels.error : state === 'idle' ? '' : message || label

  return <div className={`progress-action${className ? ` ${className}` : ''}`}>
    <button
      type="button"
      className="button button-dark progress-action-button"
      data-action-state={state}
      disabled={blocked || state === 'loading'}
      aria-busy={state === 'loading'}
      aria-describedby={blocked ? helperId : undefined}
      onClick={runAction}
    >
      <span>{label}</span>
      {state === 'loading' && <span className="progress-track" aria-hidden="true"><span /></span>}
    </button>
    {blocked
      ? <span className="progress-action-note" id={helperId}>{disabledReason ?? 'This action is not connected yet.'}</span>
      : <>
        <span className="progress-action-status" role="status" aria-live="polite">{statusMessage}</span>
        {state === 'error' && <span className="progress-action-error">{statusMessage}</span>}
      </>}
  </div>
}
