# v1.2.0 — push checklist

Four files must go together. Three of them are attached; the fourth is a one-line
edit in your repo.

1. `index.html`  — contains the Manage categories button and the sheets
2. `app.js`      — contains the code behind them
3. `app.css`     — contains the styling
4. `sw.js`       — **edit line 4 yourself**:

```js
const CACHE = 'self-employed-budget-v1.2.0';
```

Then in Supabase → SQL Editor, run once:

```sql
alter table public.settings
  add column if not exists categories jsonb;
```

## Why the button did nothing before

You had the v1.1.1 `index.html`, which contains the button, together with the
v1.0.1 `app.js`, which has no code behind it. The button existed but nothing was
listening to it. These three files are one matching set — pushing only some of
them produces exactly that symptom.
