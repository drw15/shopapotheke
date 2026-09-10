import { getPostcodeArea } from './postcodes'

/**
 * Destination postcode -> German federal state, used for state-specific public
 * holidays. Falls back to a national-only view for unsupported postcodes,
 * which is safe because those already resolve to the broad promise anyway.
 */
export function getStateForPostcode(postcode: string): string | undefined {
  return getPostcodeArea(postcode)?.state
}
