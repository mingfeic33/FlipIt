# FlipIt 😈

https://flipit-flipit.vercel.app/ [https://flipit-flipit.vercel.app/]

**Your computer, bewitched for 30 seconds.**

FlipIt is a browser prank game. You start with a short warm-up of normal computer tasks. Then a gremlin takes over and flips your controls for 30 seconds while you try to keep going. Afterwards you get a dignity score, a sped-up replay of your cursor, and a list of every trick the gremlin pulled on you.

It's plain HTML, CSS and JavaScript, with no build step and no dependencies.

---

## Features

### Two modes
| Mode | Tasks |
|---|---|
| **Everyday** | Drag a file into a folder, close an update pop-up, set a volume slider, type a password, tick "I'm not a robot" |
| **Classic** | Color-word trick, type a word, hit the target, dodge a fake prize pop-up |

Every round starts with **3 normal warm-up tasks**, followed by **30 seconds of flipped chaos**.

### The gremlin agent
The gremlin checks on you every few seconds and acts through a set of tools:

| Tool | Effect |
|---|---|
| `apply_flip` | Inverted mouse, mirror world, scrambled keys, or runaway buttons |
| `spawn_popup` | A fake system pop-up that blocks clicks until you close it |
| `move_target` | Teleports the current task to new spots |
| `shrink_target` | Shrinks the task to 65% |
| `change_goal` | Changes the goal mid-task (new volume target, different correct button, +1 tap, moved folder) |
| `ghost_cursors` | Decoy cursors that wander around the play area |
| `roll_bowling_ball` | Randomly doubles or halves your score |
| `say` | Roasts you |

Built-in fairness rules: a cooldown on each tool, once-per-task limits, at most 2 tricks per turn, and no moving things while you're dragging. The 30-second timer and the Esc key always win.

### Keyboard toys (work anytime)
- **A–Z**: a random silly sound
- **Space**: a bowling ball rolls up and doubles (×2) or halves (÷2) your score
- **Any other key**: a cute animal pops up on screen
- **Esc**: panic, which ends the round immediately

### Also included
- Pickable target faces, plus an **Upload** button for your own photo
- Generated background music: a music box during the warm-up that plays backwards and wobbles once things flip, and speeds up in the last 5 seconds
- A sparkle swirl that follows your cursor, including the flipped one
- Cursor replay, a list of the gremlin's moves, a copyable brag message, and a best score saved in the browser

---

## Run it locally

Option 1: double-click `index.html`.

Option 2: serve the folder, which is closest to how GitHub Pages runs it:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a new repo on GitHub, for example `flipit`.
2. Push this folder:
   ```bash
   git init
   git add .
   git commit -m "FlipIt: first release"
   git branch -M main
   git remote add origin https://github.com/<your-username>/flipit.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**, set **Source** to *Deploy from a branch*, and pick **Branch** `main` with folder `/ (root)`. Then save.
4. After a minute the game is live at `https://<your-username>.github.io/flipit/`.

---

## About the AI

The AI gremlin (🤖 in the move list) uses Claude through the `sample` capability that's available when FlipIt runs as a **Claude artifact**.

On GitHub Pages or localhost that capability doesn't exist, so FlipIt **automatically switches to the rule-based gremlin** (⚙️). It uses the same tools and fairness rules, chosen by simple heuristics. Everything else works the same.

To get the AI gremlin on your own site, you need a small backend that holds your API key. **Never put an API key in front-end code.** In `js/game.js`, the two places to swap are:
- `askAI(prompt)`: the opening flip and the end-of-round verdict, which return JSON
- `agentTurn()`: the tool-calling gremlin loop. The tool definitions in `gremlinTools()` are already in a standard name/description/schema/execute format.

---

## Project structure

```
flipit/
├── index.html            # page layout: start screen, game screen, results screen
├── css/style.css         # fantasy theme
├── js/game.js            # all game logic
└── assets/targets/       # pickable target photos
```

### Map of `js/game.js`

| Section | What's there |
|---|---|
| Settings | Mode choice, target picker, photo upload, best score |
| Audio | Silly sound effects and background music, all generated with the Web Audio API (no audio files) |
| Keyboard toys | Animals, bowling ball |
| Challenges | Every task: `stroop`, `type`, `prize`, `target`, `drag`, `update`, `volume`, `password`, `captcha` |
| Fake cursor | Inverted/mirrored pointer, clicks, drags, runaway buttons |
| Gremlin agent | Tools, game state, AI prompt, rule-based backup |
| Round flow | Warm-up, then countdown, then flipped phase, then results |
| Results | Dignity score, replay, move list, share text |

### Customizing
- **Target photos**: replace the images in `assets/targets/` and edit the `PICS` list at the top of `game.js`.
- **Round length / warm-up count**: `ROUND` and `WARMUPS` constants.
- **New task**: add a function to `CHALLENGES` and put its name in `POOLS.everyday` or `POOLS.classic`. Set `S.info` (what the gremlin sees) and optionally `S.changeGoal` (lets the gremlin use `change_goal` on it).
- **New gremlin power**: add an entry to the list returned by `gremlinTools()`.

---

## Privacy note
The images in `assets/targets/` are photos of real people. If this repo is public, make sure everyone pictured is okay with that. If not, swap in your own images or use the built-in **Rune** target.

## License
MIT. See [LICENSE](LICENSE).
