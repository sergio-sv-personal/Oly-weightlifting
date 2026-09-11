# Open items

Running list of things owed or outstanding, so they survive a cleared conversation.
Last updated 9 Sep 2026.

## The energy question — answered

**"Are we eating more than necessary?" No.** The 9 Sep RENPHO export closed the gap
that made this unanswerable. Over the 15 closed days, 25 Aug – 8 Sep:

- **Mean intake 2,842 kcal/day** against Seb's 2,846 target — within 4 kcal.
- **Rolling-7 weight 80.83 → 79.59 kg**, a fall of 1.24 kg across the window
  (−0.61 kg/week by least squares).
- Body fat 27.0% → 26.5%; fat mass 21.91 → 21.20 kg.

But the window is not one trend, it is two:

| | Intake | Weight slope |
|---|---|---|
| 25 Aug – 1 Sep | 2,745 kcal/day | **−1.07 kg/week** |
| 2 – 8 Sep | 2,953 kcal/day | **+0.60 kg/week** |

208 kcal/day cannot physiologically account for a 1.67 kg/week swing (it is worth
about 0.19). **Most of that reversal is glycogen and the water bound to it** —
carbs went 313 → 351 g/day over the same period, and every gram of stored glycogen
carries roughly 3 g of water. The early drop was partly the same effect running the
other way.

**Reading it straight:** interpolating for a flat trend puts break-even near
**2,880 kcal/day**. Seb's 2,846 looks close to right, possibly a shade under.
**Do not add calories yet** — the loss has already stopped. Reassess after another
fortnight of clean data, ideally with fewer outlier days (5 Sep was 3,685 and
6 Sep 3,330; the other five days of that week averaged 2,772).

Caveat on the body-composition split: the scale attributes ~0.7 kg of the loss to
fat and ~0.5 kg to lean mass. Bioimpedance cannot actually separate those — the
readings track hydration more than tissue. Don't act on the lean figure.

## Nutrition

- **Ledger**: 16 days logged, 25 Aug – 9 Sep. **9 Sep is still open** (lunch in, dinner
  and night stack outstanding).
- Rolling 7 as of 8 Sep close: 2,953 kcal / P187 / C351 / F80 against 2,846 / 160 / 371 / 80.
- **Reply to Seb** still owed — see `docs/nutrition/2026-09-04-seb-macro-targets.md`.
  Note that the "2,846 may be short" argument is now **superseded** by the weight data.
- **Fat solved**: 69 → 80 g/day, via 40g peanut butter in the morning smoothie (~20g)
  plus a deliberate fat source at an evening meal (half avocado, 20ml garlic aioli,
  or butter in scrambled eggs).
- **Protein**: 202 → 187. The lever is powder, not food — smoothie WPI + protein water
  + post-training WPI is 69g before any meal. One protein water a day, and skip the
  post-training WPI when dinner is within an hour.
- **Pre-training, settled**: bagel + banana + pouch = 84g carbs, 3.4g fat. Run at
  Seb's full 80g load on 6, 8 and 9 Sep with no GI issues.
- **Food4Fitness meals arrive Fri 11 Sep.** Thu 10 Sep still needs improvising from
  what's left: tuna, bagels, bananas, rice, frozen veg. Eggs and mince are gone.

## Training log — the remaining gap

Classes logged so far in the catch-up: **19 Aug** (EMOM 28) and **28 Aug**
(power intervals). Still missing:

| Date | Session | Status |
|---|---|---|
| Tue 18 Aug | Wk2 Day 1 | nothing logged |
| Thu 20 Aug | Wk2 Day 2 | nothing logged |
| Fri 21, Sat 22, Sun 23 Aug | classes | nothing logged |
| Sun 23 Aug | Wk2 Day 3 | nothing logged |
| Tue 25 Aug | Wk3 Day 1 | food logged, training not |
| Thu 27 Aug | Wk3 Day 2 | food logged, training not |
| Sun 30 Aug | Double: Day 3 + class | movements known, need weights and score |
| Tue 1, Wed 2, Thu 3, Fri 4, Sat 5 Sep | sessions + classes | nothing logged |
| Sun 6 Sep | Oly Day 3 (am) | nothing logged |
| Tue 8 Sep | Day 1 (pm) | nothing logged |
| Wed 9 Sep | 6am class | nothing logged |

Screenshots are enough for classes. Oly days need weights and sets per exercise.
Rough recall beats a blank week.

Known detail not yet in `videos.json`: **Sun 30 Aug** — front squats cut to 3×5 of the
prescribed 5×5 and RDLs dropped, because the 8:30 class (28-min EMOM: double-unders as
singles, KB swings, box jump-overs, echo bike) came straight after Day 3.

**Open question on the 28 Aug entry.** It was logged there because it ran on 40g of
carbs and 28 Aug is the oldest unlogged 6am class that fits. Sergio described it as
"the first class I got with carbs in", which is the note already on **26 Aug**. If the
26 Aug entry is the misdated one, the two sessions should swap.

## Data refreshes

- **RENPHO weight** — current through **9 Sep** (`src/weightDays.json`, 307 readings).
- **Cycle 3 spreadsheet** — `src/program.json` only holds week 1. The first upload was
  Intune-encrypted (MSMAMARPCRYPT) and unreadable; needs a fresh export from Google
  Sheets (File → Download → .xlsx). **This is now the priority refresh** — without it
  the Coach summary shows a block that ended weeks ago.
- **Whoop** — current through 31 Aug (`src/whoopDays.json`, 123 days from 1 May).
  Refresh from a new `my_whoop_data_*.zip`. Would also corroborate the energy maths
  above, since strain is the missing term.

## Health

- **Infected chin wound (active).** Cut on a box around 31 Aug; infected as of
  10 Sep and it cost him the Thursday Oly session. Ten days is long enough that it
  needs a doctor if it hasn't been seen. **Tell Seb** — it explains a missed session
  and may affect the next few.
- **Left knee ITB** — flagged as "getting worse and worse" in the cycle 2 check-in,
  before the deload. Never followed up. Still unanswered: how is it now?

## Maxes

- Deadlift and bench in `src/maxes.json` are estimates (`est: true`). Replace with real
  numbers whenever they get tested.

## Scheduling

- **Saturday classes**: Sergio did the 8:30am on Sat 5 Sep, which Seb had programmed as
  a rest day — six sessions in a week planned for five. Fine once; if it becomes
  standard, tell Seb, because it changes the calorie maths rather than just the label.
- **Evening classes cost more.** The 19 Aug 6:30pm class is logged as feeling heavy,
  and it ran unfuelled. The classes rated well are all the fuelled ones.
