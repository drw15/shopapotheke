import type { PostcodeArea } from '../domain/types'

/**
 * Supported demo postcodes.
 *
 * MOCK DATA. Any other postcode is treated as unsupported and falls back to
 * the broad promise. The `state` value drives state-specific German public
 * holiday handling in the business calendar.
 */
export const POSTCODES: PostcodeArea[] = [
  { postcode: '50667', city: 'Köln', state: 'NW' },
  { postcode: '60311', city: 'Frankfurt am Main', state: 'HE' },
  { postcode: '22083', city: 'Hamburg', state: 'HH' },
  { postcode: '10115', city: 'Berlin', state: 'BE' },
  { postcode: '80331', city: 'München', state: 'BY' },
]

export function getPostcodeArea(postcode: string): PostcodeArea | undefined {
  return POSTCODES.find((area) => area.postcode === postcode.trim())
}

export function isSupportedPostcode(postcode: string): boolean {
  return getPostcodeArea(postcode) !== undefined
}
