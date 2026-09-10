import { useEffect, useRef, useState } from 'react'
import { useShop } from '../../state/ShopContext'

/**
 * Postcode affordance on the PDP.
 *
 * Matches the reference: a red pin with either the current postcode or the
 * `Ihre PLZ` prompt, opening a small inline field. Entering a postcode simply
 * changes the estimate - there is no confirmation message, because before
 * purchase this is still an estimate and the customer may just be checking
 * another address.
 */
export function PostcodeControl() {
  const { postcode, setPostcode } = useShop()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(postcode ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = draft.trim()
    setPostcode(trimmed.length > 0 ? trimmed : null)
    setOpen(false)
  }

  if (!open) {
    return (
      <button type="button" className="postcode-control" onClick={() => setOpen(true)}>
        <PinIcon />
        {postcode ?? 'Ihre PLZ'}
      </button>
    )
  }

  return (
    <form className="postcode-control postcode-control--editing" onSubmit={submit}>
      <PinIcon />
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={submit}
        maxLength={5}
        inputMode="numeric"
        aria-label="Postleitzahl"
        placeholder="PLZ"
      />
      <button type="submit" className="postcode-control__apply">
        OK
      </button>
    </form>
  )
}

function PinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" fill="currentColor" />
    </svg>
  )
}
