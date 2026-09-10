import type { Provider } from '../../domain/types'

/** DHL and Hermes only. No other carrier appears in the reference checkout. */
export function ProviderBadge({ provider }: { provider: Provider }) {
  return (
    <span className={`provider-badge provider-badge--${provider}`} aria-hidden="true">
      {provider === 'dhl' ? 'DHL' : 'H'}
    </span>
  )
}
