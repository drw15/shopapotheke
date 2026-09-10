/** Trust row and footer links, as in the checkout references. */
export function CheckoutTrustRow() {
  return (
    <>
      <div className="sa-trust-row">
        {['Schnelle Lieferung', 'Sicherer Einkauf', 'Geschützte Daten', 'TÜV-zertifiziert'].map(
          (item) => (
            <span key={item}>
              <CheckIcon />
              {item}
            </span>
          ),
        )}
      </div>

      <div className="sa-footer">
        <span>Sitz der Apotheke: Shop-Apotheke B.V., Erik de Rodeweg 11-13, NL - 5975 WD</span>
        <a href="#datenschutz">Datenschutz &amp; Sicherheit</a>
        <a href="#agb">AGB</a>
        <a href="#impressum">Impressum</a>
      </div>
    </>
  )
}

function CheckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 12.5 5 5L20 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
