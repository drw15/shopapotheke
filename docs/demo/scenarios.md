# Try these scenarios

Exact combinations you can reproduce yourself. No hidden control panel: every
state below is reached through ordinary shopping.

The prototype reads **your device clock**. Dates shown are whatever Redcare
would promise right now, so the scenarios that depend on the calendar are
listed with the system time that produces them.

---

## 1. The promise becomes precise (PDP)

| Step | What to do |
|---|---|
| 1 | Open `/product/voltaren` |
| 2 | Note the delivery line: **Lieferung in 1–3 Werktagen** |
| 3 | Click **Ihre PLZ**, enter `50667`, confirm |

The same line becomes a concrete date window. No new card appeared, nothing
else on the page changed.

Enter `80331` instead and it becomes a later window. Enter both in turn: the
estimate simply changes, with no "delivery time updated" message, because
before purchase this is still an estimate.

## 2. Precision disappears when it is not trusted

| Combination | What happens | Why |
|---|---|---|
| `ibu` + `80331` | Falls back to 1–3 Werktagen | Too little historical support on that lane |
| `fenistil` + `80331` | Falls back | DHL is safe but Hermes fails the confidence gate, and an unsafe carrier widens the whole upper-funnel promise |
| `vitamin-d3` + `10115` | Falls back | Hermes calibration is outside tolerance |
| `vagisan` + anywhere | Falls back | The model has no coverage for this product |
| any product + `99999` | Falls back | Unsupported postcode |

In every case the customer sees the same ordinary sentence and is never told
that a model declined to commit. Compare with `docs/demo/prediction-matrix.md`
to see what the model actually returned.

## 3. Carrier differences usually round away — but not always

Both cases live on the `Versand` step, after choosing home delivery.

| Combination | DHL | Hermes | Point |
|---|---|---|---|
| `voltaren` + `22083` | same date | same date | The raw values differ; the customer-facing promise does not |
| `fenistil` + `10115` | 2–3 days | 2–4 days | The one modelled combination where the difference is real enough to show |

The UI states both windows and stops there. There is no "fastest" badge and no
recommendation: the customer decides.

## 4. The basket reveals a split only when it helps

Add **Voltaren** and **Vagisan** to the basket, then change the postcode.

| Postcode | Basket shows |
|---|---|
| `50667`, `60311`, `22083` | **Ihre Bestellung kommt in 2 Lieferungen**, with each shipment's items and dates |
| `10115`, `80331` | One overall delivery window; no split |

Same two products, same two shipments behind the scenes. The basket reveals the
split only where one parcel genuinely arrives earlier.

Note what is being compared here. Vagisan has no model coverage, so its
shipment shows `Lieferung in 1–3 Werktagen` — but that is still a delivery
window with a latest date, so the two shipments can be ranked honestly.

Swap Vagisan for **Bepanthen** to see the same rule with two concrete date
windows instead of one date and one broad promise.

## 5. Split checkout with a per-shipment change

| Step | What to do |
|---|---|
| 1 | Basket with **Voltaren + Bepanthen**, postcode `22083` |
| 2 | **Zur Kasse** → **Weiter zum Versand** |
| 3 | Both shipments appear on the same step, both inherited to `Musterstraße 11` |
| 4 | On **Lieferung 1 von 2**, click **Lieferart ändern** |
| 5 | Choose **An einen Abholort**, then **Abholstation übernehmen** |

Shipment 1 now goes to a pickup station; shipment 2 is untouched at home.
Redcare split the order, so the customer is not made to configure both parcels.

## 6. The estimate becomes a promise

Complete checkout through **Zahlung** and **Prüfen**, then
**Zahlungspflichtig bestellen**.

The confirmation shows **Zugesagte Lieferung** per shipment, carrying exactly
the date the checkout step showed. From this point the promise is frozen.

## 7. Tracking: on time, delayed, split, delivered

Four prebuilt orders at `/orders`:

| Order | State | What it demonstrates |
|---|---|---|
| `#100421` | On time | ETA still inside the promise; ordinary tracking, no exception banner |
| `#100422` | **Delayed** | ETA has moved past the promise |
| `#100423` | Split | One parcel delivered, one still in transit, tracked independently |
| `#100424` | Delivered | Normal completed lifecycle |

Open **`/orders/100422`**. It leads with **Ihre Lieferung verspätet sich**,
gives **Neuer Liefertermin** prominently, and keeps **Ursprünglich angekündigt**
visible underneath. The original promise is never overwritten — that is what
makes the delay honest and promise accuracy measurable.

## 8. Proactive delay email

From the delayed order, follow the preview link, or open
**`/email-preview/100422`**.

The dates in the email are identical to the tracking page because both read the
same order state. There is no separate email fixture. No mail is sent.

This is the WISMO answer: if Redcare already knows the promise is broken, the
customer hears it before they go looking.

---

## Calendar-dependent behaviour

Change your device or browser clock to see these.

| Set your clock to | What you see |
|---|---|
| A weekday before 19:00 | **Bei Bestellung bis 19:00** under the promise — ordering later moves the date |
| The same weekday after 19:00 | The hint disappears and the promise has moved out by a day |
| **Friday** before 19:00 | The cutoff now costs three calendar days: order by 19:00 or wait until Monday |
| Saturday or Sunday | Promises start from Monday; no promise ever lands on a weekend |
| 24 December, or a state holiday such as Fronleichnam (4 June 2026) in `80331`/`50667` | The holiday is skipped; the same date in `22083`/`10115` is an ordinary working day |

### What the cutoff actually says

Order now and you get the earlier window; order after 19:00 and you get the next
one. Nothing more complicated than that. Köln + Voltaren, for example:

| You order | You get |
|---|---|
| Thursday 18:30 | Fr., 11. – Mo., 14. September |
| Thursday 19:30 | Mo., 14. – Di., 15. September |
| **Friday 18:30** | **Mo., 14. – Di., 15. September** |
| **Friday 19:30** | **Di., 15. – Mi., 16. September** |

The hint appears whenever crossing 19:00 would change those dates — because
hiding it would show a date the customer can no longer get. Friday is where it
matters most: one business day, but three calendar days to the customer.
