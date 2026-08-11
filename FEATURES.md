# SE Budget — v1.0

**Income and expense tracking for self-employed drivers, couriers and trades.**

Log what you earn and what it costs you, and see the one number that actually
matters: what you keep.

Web app at **sebudget.com** — installs to your home screen, works offline, syncs
across every device you sign in on.

---

## The idea

Most budgeting apps are built for salaried people with one predictable pay cheque.
Self-employed money works differently: it arrives in small amounts all day, and it
leaves in two very different directions.

SE Budget keeps those directions separate:

| | |
|---|---|
| **Gross income** | Everything you took in |
| **− Business expenses** | Fuel, repairs, insurance, tolls, licence |
| **= Net income** | What the business made — your taxable figure |
| **− Personal & home** | Rent, food, bills, family |
| **= Disposable income** | What is genuinely yours |

Every screen in the app is a view of that chain over a different period.

---

## Adding entries

Five ways in, because the fastest one changes depending on whether you are at a
rank, at home, or catching up on a week you let slide.

### 1. The keypad

Tap **+**, choose Income, Business expense or Home expense, tap the amount, pick a
source and payment method, save. Whole euros only — no cents to fumble.

Quick amount keys (+5, +10, +20, +50) and a **00** key make round numbers fast.

### 2. Quick add

Four one-tap buttons on the home screen — **Add income**, **Fuel**, **Repairs**,
**Home cost** — that open the entry sheet already set to the right type and
category.

### 3. Repeat chips

Your recent entries appear as chips at the top of the entry sheet. One tap fills
the amount, category and payment method from the last time you logged the same
thing.

### 4. Voice

Tap the microphone in the header, or in the New entry sheet. Speak naturally:

> "add twenty euro income"
> "thirty five fuel"
> "spent twelve fifty on parking"
> "forty euro free now app payout"
> "yesterday twenty euro toll"

The app understands spoken numbers, every category with the words people actually
use for them — *petrol* and *diesel* both mean Fuel, *Tesco* and *Lidl* both mean
Groceries — payment methods, and *"yesterday"* for a backdated entry.

**Nothing is saved from speech alone.** Every result goes to a confirmation card
showing amount, category, type, payment and date, with **Save**, **Change
something first**, or **Cancel**.

### 5. Batch — a list or a statement

The same box takes a whole block of text at once. Type it, dictate it, write it
somewhere else and paste it in, or paste a bank or card statement straight from
your online banking.

**A written list:**

```
add twenty euro in income and fifteen euro fuel
add ten euro in groceries as home expense
thirty five uber
```

→ four entries, correctly typed and categorised.

**A pasted card statement:**

```
09/08/2026  CIRCLE K DUBLIN 12   45.20   →  €45  Business  Fuel
08/08/2026  TESCO STORES 4021    62.35   →  €62  Home      Groceries
07/08/2026  APCOA PARKING         4.50   →  €5   Business  Parking
06/08/2026  VODAFONE IE          35.00   →  €35  Business  Phone
05/08/2026  EFLOW M50 TOLL        3.20   →  €3   Business  Tolls
```

A date at the start and an amount at the end is recognised as a transaction, and
the merchant in between is matched against around forty Irish merchants. Entries
keep the **statement's own date**, not today's.

**Everything goes through a review list first.** Each proposed entry shows its
type, category, amount and date. Tap the type to cycle Income → Business → Home,
tap the tick to leave one out. Anything the app could not categorise is flagged
so it is obvious what needs a second look.

### Backdating

Every entry can be dated. The entry sheet opens with **Today** and **Yesterday**
as one-tap chips, plus a calendar for anything older. The fare you forgot on
Tuesday still lands in Tuesday's totals.

---

## The home screen

**Today's target** — a progress ring and bar showing what you have earned against
your daily target, with the amount still to go. Switch to Week or Month and the
whole screen follows.

**Three cards** — Gross income, Business costs, Net income. They read as one sum
you can check on sight.

**Breakdown donut** — income split into business costs, personal costs and what
is left, with each amount and its share. The centre shows your **disposable
income** for the period.

**This week** — seven bars with the amount printed above each day. Amber for
today, green for days that beat the target, grey for days that missed. The dashed
line is your daily target.

**Pull down to sync** at any time.

---

## Entries

The full history, grouped by day with a net figure per day, filterable by
**All / Income / Business / Home**.

**Swipe any entry left** to reveal Edit and Delete. A plain tap does nothing on
purpose — entries get brushed constantly in a moving car, and a pop-up every time
would be worse than useless.

---

## Reports

**Day, Week, Month and Year**, with the full chain from gross income down to
disposable income, each line sized against total income so the proportions are
visible at a glance.

Underneath: where the income came from, what the business costs were, and what
the household spent — each ranked and shown as a percentage.

**Browse any period.** Arrows step back and forward, or tap the period name to
open a date picker and jump straight to last March. "Back to now" returns.

### Exports

- **CSV** — every entry in the period with date, time, type, category, payment
  method and amount, plus the five summary figures at the foot. Opens cleanly in
  Excel and Numbers.
- **PDF summary** — the period's figures plus a month-by-month table for the
  year: gross, business, net, personal, disposable, with a year-to-date total.
- **Send to accountant** — the same PDF, straight into the share sheet and on to
  Mail as a real attachment.

---

## Accounts and sync

Sign up with **email and password** or **Continue with Google**. Name, email,
password — nothing else is asked for.

**Local-first.** Every change is written to the phone first and the app never
waits for the network, so a fare logged in a tunnel saves instantly and uploads
when signal returns. Unsynced changes survive closing the app.

Sign in on a second device and everything is there. Change phone, lose a phone,
delete and reinstall — the data is in your account, not on the handset.

Anything logged before you make an account is claimed on first sign-in rather
than lost.

---

## Settings

- **Install** — add to your home screen, with a step-by-step guide on iPhone
- **Targets** — daily, weekly and monthly
- **Appearance** — night or day theme
- **Reset all data** — behind a typed confirmation, because there is no undo
- **App version**

---

## Works offline

Once opened, the app runs with no signal: logging, editing, reports and totals
all work from the copy on your phone. Syncing resumes on its own.

Updates install themselves — no store, no waiting for review.

---

## Privacy

Your entries belong to your account and nothing else can read them: the database
enforces that itself, not the app. Analytics, if enabled, asks permission first
and never sees your figures.

---

## Known limits

Worth knowing rather than discovering:

- **Voice on iPhone.** Apple does not allow a home screen web app to open the
  microphone. The app uses the keyboard's own dictation instead — tap the box,
  tap the 🎤 key, speak. Same result, no permission needed. In Safari the
  microphone button works directly.
- **Voice needs signal.** Dictation is processed by Apple and Google, not on the
  phone. The keypad still works in a tunnel.
- **Statement categories are a best guess.** Unrecognised merchants default to a
  business expense and are flagged. Check them — miscategorising personal
  spending as business is not a mistake worth making.
- **Whole euros.** Amounts round when entered, half rounding down: 19.50 becomes
  19, 19.60 becomes 20. Cents added noise without changing any decision.

---

## What is next

- Weekly summary emailed on Sunday night
- Tax set-aside estimate on the yearly report
- Custom categories, so a plumber can have *Callout* instead of *Airport run*
- Receipt photos attached to entries

---

*SE Budget is a record-keeping tool. It is not accounting software and not a
substitute for professional advice.*
