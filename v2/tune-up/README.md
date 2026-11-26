# Sleep Fit Tune-Up

A phone game for the team. Players meet one sleeper at a time and say what that sleeper's bed should be:
softer, firmer or the same. The pooled answers fill the `team_weight` and `team_notes` columns of the
Sleep Fit rule table.

- `index.html` is the whole game in one file. It is generated; do not edit it by hand.
- `setup.sql` creates the shared database (one table and one save function) in Supabase.
- `src/` holds the readable source: `tune-up.src.html` (styles and markup), `game.js` (logic),
  `how.html` (the info page) and `build.py` (embeds the rule table and the logo, writes `index.html`).

## How the data flows

1. Each phone creates a private random key on first visit and keeps it in the browser.
2. Answers are saved through the `save_votes` function, which only updates that phone's own row.
3. Every phone reads the whole `votes` table every few seconds. That drives the adaptive question
   picker, the leaderboard and the answered / validated bars.
4. The Team page downloads Excel or CSV with the rule table's 14 columns and stable `rule_id`s.

## Connecting the database

`index.html` contains one line near the top: `window.TB_CONFIG = {"url": "", "key": ""}`.
With both empty the game runs in practice mode and saves nothing. Fill in the Supabase project URL
and the publishable ("anon") key, which is designed to be public. Never put the secret
`service_role` key in this file.

## Scoring, in short

- A rule is **validated** at three or more answers with 60% or more the same. Three or more without a
  majority is **split**, and the game keeps asking.
- Team weight = the average of all answers in feel steps (one step is Medium to Plush), converted to
  the rule table's unit. Proposed rules average to the 0 to 3 strength scale.
- Points: 10 per answer, 15 for the first answer on a rule, 12 for the second or third, 2 for a note.
