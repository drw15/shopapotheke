import type { PickupLocation } from '../domain/checkout/types'

/**
 * MOCK pickup locations, one small set per demo postcode.
 *
 * Names and addresses are fictional. There is no parcel-shop lookup service
 * behind this and no map SDK; the modal's map panel is a static visual.
 */
const BY_POSTCODE: Record<string, PickupLocation[]> = {
  '50667': [
    {
      id: 'koeln-1',
      provider: 'hermes',
      kind: 'paketshop',
      name: 'Kiosk am Dom',
      street: 'Domstr. 14',
      postcode: '50667',
      city: 'Köln',
      distanceMetres: 240,
    },
    {
      id: 'koeln-2',
      provider: 'dhl',
      kind: 'packstation',
      name: 'Packstation 118',
      street: 'Gürzenichstr. 3',
      postcode: '50667',
      city: 'Köln',
      distanceMetres: 410,
    },
    {
      id: 'koeln-3',
      provider: 'dhl',
      kind: 'partner-apotheke',
      name: 'Rathaus-Apotheke',
      street: 'Hohe Str. 88',
      postcode: '50667',
      city: 'Köln',
      distanceMetres: 620,
    },
  ],
  '60311': [
    {
      id: 'ffm-1',
      provider: 'dhl',
      kind: 'packstation',
      name: 'Packstation 204',
      street: 'Zeil 42',
      postcode: '60311',
      city: 'Frankfurt am Main',
      distanceMetres: 180,
    },
    {
      id: 'ffm-2',
      provider: 'hermes',
      kind: 'paketshop',
      name: 'Schreibwaren Weber',
      street: 'Töngesgasse 19',
      postcode: '60311',
      city: 'Frankfurt am Main',
      distanceMetres: 350,
    },
  ],
  '22083': [
    {
      id: 'hh-1',
      provider: 'hermes',
      kind: 'paketshop',
      name: 'Waescherei Kinne',
      street: 'Beethovenstr. 22',
      postcode: '22083',
      city: 'Hamburg',
      distanceMetres: 67,
    },
    {
      id: 'hh-2',
      provider: 'dhl',
      kind: 'paketshop',
      name: 'Tabakwaren Beethi',
      street: 'Beethovenstr. 20',
      postcode: '22083',
      city: 'Hamburg',
      distanceMetres: 68,
    },
    {
      id: 'hh-3',
      provider: 'dhl',
      kind: 'packstation',
      name: 'Packstation 131',
      street: 'Mozartstr. 39',
      postcode: '22083',
      city: 'Hamburg',
      distanceMetres: 236,
    },
  ],
  '10115': [
    {
      id: 'berlin-1',
      provider: 'dhl',
      kind: 'packstation',
      name: 'Packstation 312',
      street: 'Invalidenstr. 112',
      postcode: '10115',
      city: 'Berlin',
      distanceMetres: 210,
    },
    {
      id: 'berlin-2',
      provider: 'hermes',
      kind: 'paketshop',
      name: 'Spätkauf Brunnenstr.',
      street: 'Brunnenstr. 7',
      postcode: '10115',
      city: 'Berlin',
      distanceMetres: 480,
    },
  ],
  '80331': [
    {
      id: 'muc-1',
      provider: 'hermes',
      kind: 'paketshop',
      name: 'Kiosk Sendlinger Tor',
      street: 'Sendlinger Str. 44',
      postcode: '80331',
      city: 'München',
      distanceMetres: 300,
    },
    {
      id: 'muc-2',
      provider: 'dhl',
      kind: 'partner-apotheke',
      name: 'Stadt-Apotheke',
      street: 'Rindermarkt 6',
      postcode: '80331',
      city: 'München',
      distanceMetres: 540,
    },
  ],
}

export function getPickupLocations(postcode: string | null): PickupLocation[] {
  if (!postcode) return []
  return BY_POSTCODE[postcode] ?? []
}

export function findPickupLocation(id: string): PickupLocation | undefined {
  return Object.values(BY_POSTCODE)
    .flat()
    .find((location) => location.id === id)
}
