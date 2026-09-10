import { Link } from 'react-router-dom'
import { ShopApothekeWordmark } from '../brand/ShopApothekeWordmark'
import { useShop } from '../../state/ShopContext'

const CATEGORIES = [
  'Arzneimittel',
  'Familie',
  'Beauty & Pflege',
  'Sanitätshaus',
  'Angebote',
  'RedPoints',
]

/**
 * Retail header: white main row plus the peach category navigation, as in the
 * basket reference. Search and account are static; they exist for fidelity,
 * not as prototype features.
 */
export function StoreHeader() {
  const { basket } = useShop()
  const itemCount = basket.reduce((total, line) => total + line.quantity, 0)

  return (
    <header className="store-header">
      <div className="retail-width store-header__main">
        <Link to="/product/voltaren" className="store-header__brand">
          <ShopApothekeWordmark size={27} />
        </Link>

        <div className="store-header__search">
          <input placeholder="Finden Sie Ihr Produkt" aria-label="Produktsuche" readOnly />
          <button type="button" className="store-header__search-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
              <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Suchen
          </button>
        </div>

        <div className="store-header__actions">
          <span className="store-header__action">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.7" />
              <path d="M5 20c.7-3.6 3.6-5.6 7-5.6s6.3 2 7 5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            Anmelden
          </span>

          <span className="store-header__action">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2.4" stroke="currentColor" strokeWidth="1.7" />
              <path d="M8 12h4M10 10v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            E-Rezept
          </span>

          <Link to="/basket" className="store-header__action">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 8h12l-1 12H7L6 8Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path d="M9.5 8V6.6a2.5 2.5 0 0 1 5 0V8" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            {itemCount > 0 && <span className="store-header__badge">{itemCount}</span>}
            Warenkorb
          </Link>
        </div>
      </div>

      <nav className="store-header__nav">
        <div className="retail-width store-header__nav-inner">
          <span className="store-header__categories">
            <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
              <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="2" />
            </svg>
            Kategorien
          </span>
          {CATEGORIES.map((category) => (
            <a key={category} href="#category">
              {category}
            </a>
          ))}
        </div>
      </nav>
    </header>
  )
}
