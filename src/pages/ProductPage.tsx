import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StoreHeader } from '../components/layout/StoreHeader'
import { ProductPurchaseCard } from '../components/product/ProductPurchaseCard'
import { PRODUCTS, getProduct } from '../data/products'
import { getUpperFunnelPromise } from '../domain/deliveryFacade'
import { useShop } from '../state/ShopContext'
import { useNow } from '../state/DemoClockContext'

export function ProductPage() {
  const { productId } = useParams()
  const { postcode } = useShop()
  const now = useNow()

  const product = getProduct(productId ?? '')

  // Recalculated silently whenever postcode or context changes: before purchase
  // this is still an estimate, so a changed date needs no announcement.
  const promise = useMemo(
    () =>
      getUpperFunnelPromise({
        productIds: product ? [product.id] : [],
        postcode,
        now,
      }),
    [product, postcode, now],
  )

  if (!product) {
    return (
      <>
        <StoreHeader />
        <main className="retail-width" style={{ padding: '40px 16px 80px' }}>
          <h1>Produkt nicht gefunden</h1>
        </main>
      </>
    )
  }

  return (
    <>
      <StoreHeader />

      <main className="retail-width product-page">
        <nav className="product-page__crumbs sa-muted">
          <Link to="/product/voltaren">Startseite</Link> <span aria-hidden="true">›</span>{' '}
          <span>Arzneimittel</span>
        </nav>

        <div className="product-page__grid">
          <div className="product-page__gallery">
            <img src={product.image} alt={product.name} width={340} height={340} />
          </div>

          <div className="product-page__info">
            <h1 className="product-page__title">{product.name}</h1>
            <div className="product-page__meta sa-muted">
              {product.packSize}
              <br />
              PZN: {product.pzn}
            </div>
            <div className="product-page__rating" aria-label="Bewertung 4,7 von 5">
              <span className="product-page__stars" aria-hidden="true">
                ★★★★★
              </span>
              <span className="sa-muted">(203)</span>
            </div>
          </div>

          <aside className="product-page__buybox">
            <ProductPurchaseCard product={product} promise={promise} />
          </aside>
        </div>

        <section className="product-page__more">
          <h2>Weitere Produkte</h2>
          <div className="product-page__more-grid">
            {PRODUCTS.filter((item) => item.id !== product.id).map((item) => (
              <Link key={item.id} to={`/product/${item.id}`} className="mini-product">
                <img src={item.image} alt="" width={72} height={72} />
                <span className="mini-product__name">{item.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
