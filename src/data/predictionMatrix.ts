import type { PredictionQuery, RawDeliveryPrediction } from '../domain/types'
import { PRODUCTS } from './products'
import { POSTCODES } from './postcodes'

/**
 * MOCK MODEL OUTPUT.
 *
 * These are fabricated demo values standing in for a real delivery prediction
 * service. They are not Redcare data and carry no claim about real carrier
 * performance.
 *
 * The fixtures are generated from explicit per-lane profiles rather than typed
 * row by row, so the realism rules from the approved design stay verifiable:
 *
 *  1. carrier is a model input, so DHL and Hermes raw values normally differ;
 *  2. most of those differences round to the same customer-facing window;
 *  3. only a few deliberately chosen combinations cross a rounding boundary;
 *  4. visible standard-carrier differences never exceed one business day;
 *  5. pickup is not hard-coded as universally faster than home delivery.
 *
 * `src/data/predictionMatrix.test.ts` enforces all of the above.
 */

type Lane = {
  /** Base q10/q90 for DHL home on this lane. */
  dhlHome: [number, number]
  /** Hermes home offset applied to q10/q90. Small, and usually rounding-neutral. */
  hermesHomeOffset: [number, number]
  /** Pickup offset applied to the corresponding home values, per provider. */
  dhlPickupOffset: [number, number]
  hermesPickupOffset: [number, number]
  confidence: number
  calibration: number
  supportN: number
}

/**
 * Per-postcode lane profiles.
 *
 * Distance from the Sevenum-area demo origin broadly drives the base values:
 * the western/central lanes are fastest, the north is mixed, the east is mixed
 * to longer, and the south is slowest.
 */
const LANES: Record<string, Lane> = {
  // Köln - nearby western lane, predominantly fast.
  '50667': {
    dhlHome: [0.62, 1.58],
    hermesHomeOffset: [0.09, 0.14],
    dhlPickupOffset: [0.05, 0.12],
    hermesPickupOffset: [0.04, 0.1],
    confidence: 0.96,
    calibration: 0.012,
    supportN: 5400,
  },
  // Frankfurt - western-central lane, fast.
  '60311': {
    dhlHome: [0.71, 1.66],
    hermesHomeOffset: [0.08, 0.17],
    dhlPickupOffset: [0.06, 0.14],
    hermesPickupOffset: [0.05, 0.09],
    confidence: 0.95,
    calibration: 0.015,
    supportN: 4100,
  },
  // Hamburg - northern lane, mixed 1-2 / 2-3 behaviour.
  // Base values sit clear of the 2.0 boundary so the Hermes offset stays
  // rounding-neutral: both carriers show 2-2 business days here.
  '22083': {
    dhlHome: [1.08, 1.62],
    hermesHomeOffset: [0.07, 0.19],
    dhlPickupOffset: [-0.04, -0.09],
    hermesPickupOffset: [0.03, 0.11],
    confidence: 0.94,
    calibration: 0.018,
    supportN: 3300,
  },
  // Berlin - eastern lane, mixed and sometimes longer.
  '10115': {
    dhlHome: [1.24, 2.41],
    hermesHomeOffset: [0.11, 0.24],
    dhlPickupOffset: [0.07, 0.16],
    hermesPickupOffset: [0.06, 0.13],
    confidence: 0.93,
    calibration: 0.021,
    supportN: 2600,
  },
  // München - southern lane, slower.
  // Base values sit clear of the 3.0 boundary so the Hermes and pickup offsets
  // stay rounding-neutral: this lane reads 2-3 business days for both carriers.
  '80331': {
    dhlHome: [1.64, 2.52],
    hermesHomeOffset: [0.1, 0.18],
    dhlPickupOffset: [0.06, 0.12],
    hermesPickupOffset: [0.05, 0.1],
    confidence: 0.92,
    calibration: 0.023,
    supportN: 1900,
  },
}

/**
 * Small per-product adjustments so different products on the same lane are not
 * numerically identical. Kept well below a rounding step for most lanes.
 */
const PRODUCT_ADJUSTMENT: Record<string, [number, number]> = {
  voltaren: [0, 0],
  'vitamin-d3': [0.03, 0.05],
  fenistil: [-0.02, 0.03],
  ibu: [0.04, 0.07],
}

/**
 * Deliberate exceptions that make specific documented demo scenarios work.
 * Every entry here is referenced by the reviewer scenario guide.
 */
type Override = Partial<
  Pick<
    RawDeliveryPrediction,
    | 'q10BusinessDays'
    | 'q90BusinessDays'
    | 'confidenceScore'
    | 'calibrationError'
    | 'supportN'
  >
>

const key = (q: PredictionQuery) => `${q.productId}|${q.postcode}|${q.method}|${q.provider}`

const OVERRIDES: Record<string, Override> = {
  // --- Visible carrier difference (Berlin / Fenistil, home) -----------------
  // The one standard-home combination where DHL and Hermes round differently:
  // DHL 2-3 business days, Hermes 2-4. Exactly one business day apart, and the
  // reviewer scenario guide points here to show a visible carrier difference.
  'fenistil|10115|home|hermes': { q10BusinessDays: 1.28, q90BusinessDays: 3.12 },

  // --- Low support (München / Ibu, home) -----------------------------------
  // Thin historical support on this lane: the model still returns a value, but
  // it is not safe to expose, so the customer sees the broad fallback and is
  // never told why. Both carriers fail so PDP falls back rather than widening.
  'ibu|80331|home|dhl': { supportN: 180 },
  'ibu|80331|home|hermes': { supportN: 210 },
  'ibu|80331|pickup|dhl': { supportN: 190 },
  'ibu|80331|pickup|hermes': { supportN: 205 },

  // --- Low confidence (München / Fenistil, Hermes home) --------------------
  // Only one carrier is unsafe. This is the PDP envelope case: the Hermes
  // fallback participates, so the upper funnel does not promise more than the
  // available standard options can support.
  'fenistil|80331|home|hermes': { confidenceScore: 0.81 },

  // --- Poor calibration (Berlin / Vitamin D3, Hermes home) -----------------
  // Confidence and support are fine but the interval coverage is off, so the
  // result is still not exposed. Demonstrates that the gates are independent.
  'vitamin-d3|10115|home|hermes': { calibrationError: 0.062 },
}

const round2 = (value: number) => Math.round(value * 100) / 100

function buildPrediction(query: PredictionQuery): RawDeliveryPrediction {
  const lane = LANES[query.postcode]
  const adjustment = PRODUCT_ADJUSTMENT[query.productId] ?? [0, 0]

  const providerOffset =
    query.provider === 'hermes' ? lane.hermesHomeOffset : ([0, 0] as [number, number])

  const methodOffset =
    query.method === 'pickup'
      ? query.provider === 'dhl'
        ? lane.dhlPickupOffset
        : lane.hermesPickupOffset
      : ([0, 0] as [number, number])

  const q10 = round2(lane.dhlHome[0] + providerOffset[0] + methodOffset[0] + adjustment[0])
  const q90 = round2(lane.dhlHome[1] + providerOffset[1] + methodOffset[1] + adjustment[1])

  const base: RawDeliveryPrediction = {
    productId: query.productId,
    postcode: query.postcode,
    method: query.method,
    provider: query.provider,
    q10BusinessDays: q10,
    q50BusinessDays: round2((q10 + q90) / 2),
    q90BusinessDays: q90,
    meanBusinessDays: round2((q10 + q90) / 2 + 0.04),
    confidenceScore: lane.confidence,
    calibrationError: lane.calibration,
    supportN: lane.supportN,
    modelVersion: 'demo-v1',
  }

  const override = OVERRIDES[key(query)]
  if (!override) return base

  const merged = { ...base, ...override }
  // Keep quantiles coherent after an override touches the bounds.
  merged.q50BusinessDays = round2((merged.q10BusinessDays + merged.q90BusinessDays) / 2)
  merged.meanBusinessDays = round2(merged.q50BusinessDays + 0.04)
  return merged
}

function buildMatrix(): RawDeliveryPrediction[] {
  const rows: RawDeliveryPrediction[] = []
  for (const product of PRODUCTS) {
    // The model simply has no coverage for the external-fulfilment product.
    if (!product.modelEligible) continue
    for (const area of POSTCODES) {
      for (const method of ['home', 'pickup'] as const) {
        for (const provider of ['dhl', 'hermes'] as const) {
          rows.push(
            buildPrediction({
              productId: product.id,
              postcode: area.postcode,
              method,
              provider,
            }),
          )
        }
      }
    }
  }
  return rows
}

export const PREDICTION_MATRIX: RawDeliveryPrediction[] = buildMatrix()

export function findPrediction(query: PredictionQuery): RawDeliveryPrediction | undefined {
  return PREDICTION_MATRIX.find(
    (row) =>
      row.productId === query.productId &&
      row.postcode === query.postcode &&
      row.method === query.method &&
      row.provider === query.provider,
  )
}
