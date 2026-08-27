## [1.1.1] — 2026-08-14

### Changed
- **Any category can now be deleted, including ones with entries against them.**
  v1.1.0 blocked this, which was too strict — the problem was never the deletion,
  only what happens to the entries.
- Deleting a category that has entries opens a **"where should these go?"** step
  listing every other category in that group, with the entry count and total
  value so the choice is informed. Pick one and the entries move across, are
  queued to sync, and the category is removed.
- A category with no entries deletes immediately, with no extra step.
- Hiding remains available for anyone who wants a category off the entry screen
  but kept in their history exactly as recorded.

### Notes
- The user picks the destination rather than the app defaulting to "Other".
  Quietly sweeping a month of fuel costs into a miscellaneous bucket is the kind
  of thing that is only noticed at tax time.
- No money can be lost in the move: entries change category, never amount, and
  the period totals are unchanged.
