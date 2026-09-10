# Product decisions taken during implementation

Decisions made while building the prototype that are not already settled in
`docs/PRD.md` or the approved design, or that resolve an ambiguity in them.

Each entry records what was decided, why, what was rejected, and what would
need validating in production.

---

## 1. The cutoff hint appears whenever crossing the cutoff changes the date

**Decision.** `Bei Bestellung bis 19:00` is shown whenever ordering after 19:00
would move the displayed delivery date — the literal rule from the approved
design — rather than only when the shift is unusually large.

**Context.** During implementation it became clear that this makes the hint
appear on most weekday afternoons, not only in the Friday-to-Monday case the
design uses to motivate it. The alternative considered was to suppress the hint
unless missing the cutoff costs more than one calendar day, so that it would
appear rarely and read as more remarkable when it did.

**Why the literal rule wins.** The hint is not an urgency device; it is the
condition under which the displayed date is true. If the promise reads
`Fr., 11. September` at 18:30 and ordering at 19:01 would actually deliver on
Monday, then hiding the cutoff shows the customer a date they can no longer
get. That is the overpromising this whole concept exists to avoid. A frequent
hint is a consequence of the information being genuinely load-bearing, not
evidence that it is decorative.

The design's warning against artificial urgency is still respected: the hint
states a service fact and nothing more. There is no countdown, no scarcity
language, and no styling that inflates it beyond the plain line in the
reference screenshots.

**Rejected.** Materiality-gated display (only when the shift exceeds one
calendar day). It would have produced a rarer, more dramatic hint at the cost
of showing dates that are no longer achievable — trading trust for restraint,
in a prototype whose entire argument is that trust comes first.

**Still true.** Where crossing the cutoff does *not* change the displayed date,
the hint stays hidden. That case is unchanged and still suppressed.

**Production validation.** Measure the funnel effect of the hint's frequency
with Business, and confirm the real customer-facing cutoff with Last Mile and
Operations. If the true cutoff differs by lane or carrier, the rule holds but
the threshold becomes an input rather than a constant.

---

## 2. Weekend days are not consumed by the business-day count

**Decision.** Counting one delivery day from a Saturday reaches Monday, not
Tuesday.

**Why.** A business-day count measures working days spent fulfilling the order.
A customer ordering on Saturday has not spent a business day waiting through
the weekend, so the weekend must not absorb part of the promise. The dispatch
day is resolved first, then whole delivery days are counted from it.

**Production validation.** Confirm against real dispatch behaviour for weekend
orders, which may differ from this simplification.

---

## 3. The demo reads the viewer's real device clock

**Decision.** All dates derive from the browser clock at render time, in
`Europe/Berlin`. There is no pinned demo date and no hidden clock control.

**Why.** The prototype should behave like the shop. A reviewer exploring it
unattended sees the promise Redcare would make right now, and any scenario that
depends on the calendar — the Friday-to-Monday cutoff case in particular — can
be reproduced by changing the device or browser clock. The reviewer guide
documents which system times produce which behaviour.

The cutoff and the dispatch day are always evaluated in Berlin wall-clock time,
so a reviewer in another timezone still sees Redcare's promise rather than one
shifted by their own location.

**Rejected.** Pinning the clock to a fixed date so that every documented
scenario reproduces forever. It would have made the walkthrough more
repeatable, but at the cost of a prototype that visibly is not behaving like a
real shop, and it would have made the live cutoff impossible to demonstrate
honestly.

**Consequence.** Demo tracking orders are generated relative to the current
date rather than fixed to calendar dates, so they never go stale.

---

## 4. A second external-fulfilment product carries the split demonstration

**Decision.** The demo catalogue gains `bepanthen`: a sixth product in the
fictional external fulfilment group that **does** have model coverage. Vagisan
stays external and stays outside the model.

**Context.** The approved design names Voltaren + Vitamin D3 + Vagisan as the
canonical split basket. Building the basket revealed that this basket can never
show a material split. Vagisan was the only product that caused a split, and it
is also the only product with no model coverage, so the second shipment always
resolved to the broad fallback. With no date on one side there is nothing to
compare, and the materiality rule correctly refused to claim that one shipment
arrives earlier - so the split silently never appeared.

**Why a second product.** The prototype needs to demonstrate two different
ideas that had been accidentally entangled in one fixture:

- *fallback* - the model cannot predict this product at all;
- *split* - this product ships separately from the rest of the order.

Vagisan now demonstrates the first cleanly on its own product page. Bepanthen
demonstrates the second, with both shipments carrying real dates so the earlier
one is genuinely earlier.

**Rejected.** Ranking a precise promise against a fallback by treating the
fallback as its worst case. It would have needed no new fixture, but the
comparison would rest on a value the exposure gates had just rejected - telling
the customer one parcel arrives sooner on the strength of a number we do not
trust.

**Consequence.** The external product's offset is tuned so the split is
material on some lanes and not on others. Köln, Frankfurt and Hamburg reveal
the split; Berlin and München round to identical windows and keep one simple
promise. The same two products therefore demonstrate both halves of the rule
depending only on the postcode.

**Production validation.** Real fulfilment grouping and cross-location lead
times would come from the OMS and the prediction service, not from a fixture.

---

## 5. A shared cutoff does not by itself make a split material

**Decision.** The cutoff clause of the materiality rule fires only when the
cutoff distinguishes the shipments - some are cutoff-sensitive and others are
not. When every shipment shares the same cutoff and the same window, the basket
keeps one simple promise.

**Why.** The rule exists so the customer can act on a difference. If both
parcels arrive in the same window and both are affected by the same cutoff,
splitting the display shows two identical rows and adds complexity without
adding information. The original reading fired on every basket where a cutoff
was visible, which would have made the split effectively permanent.

**Production validation.** Worth confirming with usability testing that
customers read the split as useful rather than as a warning.
