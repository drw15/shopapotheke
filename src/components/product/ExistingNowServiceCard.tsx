import { useShop } from '../../state/ShopContext'

/**
 * NOW! - the existing expedited service, preserved unchanged.
 *
 * NOW! is deliberately outside the new standard prediction model. We do not
 * have enough information about its real eligibility, delivery, pickup or
 * cutoff mechanics to redesign it responsibly, so it stays here as an
 * unchanged existing element for page fidelity only. It is not wired to the
 * prediction engine and is not an interactive demo scenario.
 */
export function ExistingNowServiceCard() {
  const { postcode } = useShop()

  return (
    <div className="now-card">
      <span className="now-card__clock" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <path
            d="M12 6.4V12l3.4 2.2"
            stroke="var(--sa-white)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <div className="now-card__body">
        {postcode ? (
          <>
            <strong>Lieferung heute mit Now! möglich</strong>
            <span className="sa-muted">
              Bestellen Sie innerhalb <strong>02:14:37</strong>.
            </span>
          </>
        ) : (
          <>
            <strong>Now!-Produkt heute erhalten</strong>
            <span className="sa-muted">Lieferung oder Abholung heute oder morgen prüfen.</span>
          </>
        )}
      </div>
    </div>
  )
}
