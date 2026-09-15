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
appear on most weekday afternoons, not only in the weekend-crossing case the
design uses to motivate it. The alternative considered was to suppress the hint
unless missing the cutoff costs more than one calendar day, so that it would
appear rarely and read as more remarkable when it did.

**Why the literal rule wins.** The hint is not an urgency device; it is the
condition under which the displayed date is true. The message is simply *order
now and you get this window; order after 19:00 and you get the next one* - for
example 1-2 days before the cutoff and 2-3 days after it. If the promise reads
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
depends on the calendar — the weekend-crossing cutoff case in particular — can
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

## 4. Every shipment has a delivery window, including a fallback one

**Decision.** `Lieferung in 1–3 Werktagen` is a delivery window, not the
absence of one. It resolves to real calendar dates from the same dispatch day
and business calendar as a precise promise, and a fallback shipment is compared
against other shipments on those dates.

**Context.** An earlier implementation refused to compare a precise shipment
against a fallback one, on the reasoning that there was "no date on one side"
to rank. That was wrong. The broad promise is a commitment Redcare already
makes today; it has a latest date like any other, and the customer experiences
it as a window. Treating it as unknown made the system behave as if a fallback
shipment had no arrival date at all.

The bug had a visible consequence: the canonical split basket from the approved
design (Voltaren + Vagisan) could never show a material split, because the
second shipment was always a fallback and therefore always deemed
incomparable. The split silently never appeared.

**Effect of the correction.** The canonical basket now behaves as the design
intended. In Köln, Frankfurt and Hamburg the Sevenum shipment arrives
materially earlier than the fallback window and the split is revealed; in
Berlin and München both land together and the basket stays simple.

**Where the customer-facing wording is unchanged.** Resolving the dates is an
internal capability. The customer still reads `Lieferung in 1–3 Werktagen`,
because that is the honest wording when the model could not be trusted to be
more specific. The dates exist so the system can reason about the shipment -
compare it, decide whether a split is worth showing, freeze it at confirmation.

**Production validation.** Confirm that the broad promise really is 1-3 working
days from the same dispatch logic, rather than a looser commitment with
different internal handling.

---

## 5. `bepanthen` stays, but as a clearer demo rather than a necessary one

**Decision.** The sixth product remains in the catalogue.

**Context.** It was originally added because the canonical split basket appeared
unable to show a split. That turned out to be the bug in decision 4, not a gap
in the fixtures - Voltaren + Vagisan works once a fallback is compared properly.

**Why keep it.** It demonstrates a split where **both** shipments show concrete
dates, which reads more clearly than comparing a date against a broad window,
and it separates two ideas that are otherwise entangled in one product:

- Vagisan: the model has no coverage, so the customer sees the broad promise;
- Bepanthen: predictable, but ships separately.

Both baskets are listed in the scenario guide so a reviewer can see either.

**Production validation.** Real fulfilment grouping and cross-location lead
times would come from the OMS and the prediction service, not a fixture.

---

## 6. The cutoff is a plain statement about today's order, not a comparison

**Decision.** The cutoff means one thing: **order now and you get the earlier
window; order after 19:00 and you get the later one.** For example 1-2 days
before the cutoff, 2-3 days after it.

It is a property of the order the customer is placing right now. It is not a
device for comparing parcels, and it plays no part in deciding whether a split
is worth showing.

**Context.** An earlier implementation added a second materiality clause that
tried to reason about which shipments were "cutoff-sensitive" relative to each
other. That over-complicated a simple idea, and produced odd behaviour - a
basket where every shipment shared the same cutoff was briefly treated as
though the cutoff distinguished them.

The materiality rule is now a single question: does one shipment's latest
promised date land at least one delivery day before another's? The cutoff is
shown per shipment wherever crossing it would change that shipment's own dates,
which is the same rule the PDP and checkout use.

**Why this framing is the right one.** The cutoff exists to tell the customer
what today's decision costs. Missing it moves the dispatch day out by one
working day, and the delivery days are counted from there. When that extra day
falls before a weekend the customer feels three calendar days rather than one.
That is worth saying plainly. Anything beyond that is machinery the customer did
not ask for.

**Production validation.** Confirm the real customer-facing cutoff with Last
Mile and Operations, and measure the funnel effect with Business.

---

## 7. The cutoff shifts the dispatch day, and Friday is not the case to show

**Decision.** The cutoff is described as moving **day 0** - the dispatch day -
rather than as adding a day to the delivery. Before 19:00 the order ships today;
after 19:00 it ships the next working day, and the modelled delivery days are
counted from whichever day that is.

**Context.** The reviewer guide previously motivated the cutoff with a Friday
example, claiming that ordering by Friday 19:00 avoided waiting until Monday.
That is wrong, and the prototype's own output contradicted it: in Köln a Friday
order delivers `Mo., 14. - Di., 15. September` whether the cutoff is made or
missed. The weekend absorbs the difference at the near end, so making a Friday
cutoff does not buy an earlier arrival.

The engine was correct throughout; only the documentation was wrong. The
walkthrough was inviting reviewers to set their clock to Friday and observe an
effect that does not happen there.

**The case that does show it.** A **Wednesday** order in Köln (1-2 Werktage):
before the cutoff `Do., 10. - Fr., 11. September`, after it `Fr., 11. - Mo., 14.
September`. The extra dispatch day lands on Thursday, pushing the latest date
across the weekend - one business day, three calendar days to the customer.

**But the crossing day is a property of the lane, not a fixed weekday.** Missing
the cutoff always costs one working day; that day is only felt as three when it
pushes the latest date past a Friday, and a slower lane reaches that point
earlier in the week. Köln and Frankfurt (1-2) and Hamburg (2) cross on
Wednesday; Berlin and München (2-3) cross on Tuesday. Naming a single weekday
for the whole demo would repeat the Friday mistake in a smaller way - a reviewer
checking Berlin on Wednesday would see an ordinary one-day shift and conclude
the weekend case does not exist. The reviewer guide therefore gives the crossing
day per postcode rather than one weekday for all of them.

**Why the day-0 framing is better.** Describing the cutoff as "one more day of
delivery" invites exactly the Friday error, because it suggests the whole window
slides uniformly. Describing it as a shift of the dispatch day makes the weekend
behaviour fall out automatically: the shift lands on a working day, and the
count runs from there.

**Production validation.** Confirm the real dispatch and handover behaviour with
Last Mile and Operations, including whether weekend dispatch exists at all. If
it does, the weekend-crossing case changes shape but the day-0 rule holds.
