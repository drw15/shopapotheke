import { StoreHeader } from '../components/layout/StoreHeader'

/** Temporary stand-in for journey routes not yet implemented. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <StoreHeader />
      <main className="retail-width" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <h1>{title}</h1>
      </main>
    </>
  )
}
