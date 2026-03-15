<!-- FILE: README.md -->

https://josec1154.github.io/MajorMinorTrainer/

# Scale Builder Improvement Plan

## Vision

Scale Builder should feel like a **mobile-first music game** where the user learns by **doing**, not by reading static answers. The piano should be the main input device, every tap should produce immediate feedback, and the screen should stay clear and focused even on a small phone.

---

## Current Problems

### 1. Mobile layout is too desktop-like

The current interface stacks several large sections one after another, which makes the screen feel long and crowded on phones.

### 2. The piano is not the center of the experience

The piano exists, but the learning flow is still partly text-driven instead of feeling like a playable tool.

### 3. Quiz mode breaks the interaction style

The build mode uses the piano, but the quiz still relies on typed input. That creates two different experiences instead of one consistent game loop.

### 4. Feedback is not constant enough

The app should always tell the user what just happened:

* correct
* wrong
* why it was wrong
* what step comes next
* how far they are from finishing

### 5. The app does not yet feel game-like

There is not enough sense of progress, reward, pacing, challenge, or momentum.

---

## Product Goal

Create a **mobile-first PWA game** that teaches users how to build major and minor scales by tapping piano notes and receiving instant visual guidance, correction, and encouragement.

---

## Core Design Rules

### Rule 1: Piano-first interaction

The piano should be the primary way the user answers in both:

* build mode
* quiz mode
* challenge mode

### Rule 2: Feedback on every action

Every tap should trigger feedback immediately.

Examples:

* “Correct — that is the 3rd of C major.”
* “Not quite — after D in C major, the next note should be E because the pattern needs a whole step.”
* “Great job — 4 of 7 notes complete.”

### Rule 3: One focused task per screen

On mobile, the user should not be looking at too many panels at once.

### Rule 4: Progress should be visible

The user should always know:

* what mode they are in
* what note they are trying to find
* how many notes are complete
* whether they are improving

### Rule 5: Small-screen first

Design for a phone first, then let desktop expand gracefully.

---

## Proposed App Structure

## Main mobile screen layout

### Top bar

Compact header only:

* app name
* streak or score
* settings/menu icon

### Learning card

A compact card that shows only the current challenge:

* root note
* scale type
* current step instruction
* progress indicator

Example:

* Root: G
* Type: Major
* Task: “Tap note 4”
* Hint: “From B, move a half step.”

### Piano area

This becomes the main interactive zone.

Requirements:

* pinned visually near the bottom half of the screen
* horizontally scrollable if needed
* large enough touch targets
* clear white/black key contrast
* active states easy to see in bright light and dark mode

### Feedback strip

A persistent feedback strip above the piano:

* correct = green glow / short success message
* wrong = red glow / short explanation
* next = yellow or blue prompt

This should update after every tap.

### Bottom controls

Only a few buttons visible at once:

* Build
* Quiz
* Restart
* Hint

Do not keep too many controls on screen.

---

## Game Modes

## 1. Guided Build Mode

Purpose: teach step-by-step scale construction.

### Flow

1. User chooses root and scale type.
2. App starts at note 1.
3. User taps the next correct note on the piano.
4. App responds immediately.
5. Correct notes lock in visually.
6. App guides the user to the next note.
7. Completion produces celebration feedback.

### Feedback behavior

For correct answer:

* flash correct key
* add note to visible scale row
* update progress
* explain degree and interval

Example:
“Correct. E is note 3 in C major.”

For wrong answer:

* flash selected key red
* keep progress unchanged
* explain why it is wrong
* keep expected note active

Example:
“Not quite. After D, the pattern needs a whole step, so the next note is E.”

### Visual states needed

* completed notes
* current target note
* wrong tapped note
* locked-in notes
* progress count

---

## 2. Piano Quiz Mode

Purpose: quiz the user without typed input.

### Flow

1. App hides one or more notes from a scale.
2. User answers by tapping the piano.
3. App checks instantly.
4. Feedback appears immediately.
5. New round begins quickly.

### Types of quiz rounds

#### A. Missing note quiz

Example:
“C D E ___ G A B”
User taps F on the piano.

#### B. Degree quiz

Example:
“Tap the 6th note of A minor.”
User taps F.

#### C. Interval step quiz

Example:
“From G, tap a whole step up.”

#### D. Build from memory quiz

Example:
“Build D major with no hints.”

### Why this matters

This keeps the interaction style consistent. The user should not switch from piano tapping to typing.

---

## 3. Game Challenge Mode

Purpose: add replay value and excitement.

### Possible versions

* timed challenge
* survival mode with hearts
* streak mode
* random root challenge
* major/minor mixed mode
* speed builder

### Example loop

* round starts
* user gets prompt
* user taps piano
* immediate result
* next round loads quickly
* streak increases

### Reward ideas

* streak counter
* stars per round
* best score
* daily challenge
* badge for perfect scale

---

## Mobile UX Plan

## Layout changes

### A. Collapse large sections into cards

Instead of showing many full sections stacked vertically, use:

* one active challenge card
* one compact progress card
* piano zone
* one feedback strip

### B. Reduce vertical height waste

The current layout uses too much padding and several full-height blocks.

Improvements:

* tighter spacing
* smaller headings on mobile
* fewer duplicate labels
* avoid large empty gaps

### C. Sticky feedback and controls

Important parts should stay near the thumb zone.

Recommended:

* sticky feedback strip
* sticky bottom action row
* piano in main touch zone

### D. Horizontal scroll where needed

For phones, the piano can scroll horizontally rather than shrinking too much.

### E. Larger touch targets

All interactive elements should be easy to tap with one thumb.

Recommended minimums:

* buttons about 44px tall or more
* piano keys large enough for touch accuracy

---

## Visual Feedback Plan

## Piano key states

Each piano key should support these states:

* default
* in-scale
* current target
* tapped correct
* tapped wrong
* disabled
* completed/locked

## Feedback language style

Keep messages short, clear, and encouraging.

### Correct examples

* “Correct.”
* “Nice. That is the 5th.”
* “Yes — whole step to A.”
* “Great build. Only 2 notes left.”

### Wrong examples

* “Try again.”
* “Close, but that would skip the half step.”
* “Not this one. The next note should be F.”

### Completion examples

* “Scale complete.”
* “Perfect round.”
* “You built G major.”

## Animation plan

Use small animations only:

* quick success pulse
* quick error shake
* progress fill animation
* light celebration at completion

Keep animations fast so the app still feels light.

---

## Sound Feedback Plan

Optional, but powerful.

### Add very light sounds

* soft success click
* soft wrong buzz
* completion chime

### Rules

* default on but muteable
* very short sounds only
* no heavy audio assets

---

## Learning System Plan

The app must **teach from zero knowledge**. We cannot assume the user knows note names, scales, intervals, or even what sharps are. The only assumption is that the user understands the alphabet.

The learning system must therefore be **progressive and gated**. Each level unlocks only after the user demonstrates mastery of the previous concept.

Each new level should feel like **earning an achievement**.

---

# Progressive Learning Path

The learning system should follow a strict progression:

1. Musical alphabet
2. Piano note recognition
3. Sharps and adjacent notes
4. Half steps
5. Whole steps
6. Interval patterns
7. Scale construction

Users cannot build scales until they reach the final stages.

---

## Lesson Map System (Duolingo‑style progression)

The curriculum should appear as a **visual learning path** instead of a menu of features. Users progress node‑by‑node and unlock the next concept only after mastering the previous one.

Example learning path:

Alphabet → Piano Notes → Sharps → Half Steps → Whole Steps → Patterns → Scales

### Node States

Each lesson node has a visible state:

* 🔒 **Locked** – cannot start yet
* ▶ **Available** – ready to play
* ⭐ **Mastered** – concept learned

### Node Design

Each node contains:

* lesson title
* short description
* mastery progress
* reward badge

Example:

```
Alphabet
Learn A–G note names
⭐ Mastered
```

### Locked Node Behavior

Locked lessons appear dimmed and show the requirement.

Example message:

"Master Whole Steps to unlock Interval Patterns."

### Lesson Structure

Each node contains **3–6 micro‑lessons** that gradually increase difficulty.

Example node: Half Steps

1. Identify half steps
2. Half step up
3. Half step down
4. Mixed challenge

### Completion Flow

When a node is mastered:

1. celebration animation plays
2. badge unlock appears
3. next node becomes available
4. the lesson path scrolls to the new node

### Mastery Criteria

Example mastery rule:

```
accuracy ≥ 90%
streak ≥ 5
```

### Why the Lesson Map Matters

Without a map the app feels like a tool. With a map it becomes a **journey**, where users clearly see:

* what they learned
* what comes next
* how far they’ve progressed

---

# Level Progression Design

To enforce learning, the app must include a **progression gate system**. The user cannot manually skip levels. Each level unlocks only when the app detects mastery of the current concept.

### Progression Engine Rules

1. A user starts at **Level 1 (Musical Alphabet)**.
2. The system tracks performance metrics for each lesson.
3. When mastery criteria are met, the next level unlocks.
4. The UI celebrates the unlock with an animation and badge.
5. Only unlocked lessons appear in the lesson map.

### Performance Metrics

The engine should track:

* accuracy percentage
* time to answer
* number of mistakes
* streak of correct answers

Example mastery requirement:

```
accuracy ≥ 90%
AND
streak ≥ 5
```

### Level Map UI

The app should visually display a **learning path map** similar to language learning apps.

Example path:

Alphabet → Piano Notes → Sharps → Half Steps → Whole Steps → Patterns → Scales

Locked levels appear faded until unlocked.

### Lesson Completion Feedback

When a lesson is mastered:

* screen celebration animation
* badge unlocked
* short success sound
* progress bar increases

Example message:

"Level Complete — You unlocked Half Steps!"

### Preventing Scale Building Too Early

The **Build Scale mode remains locked** until Level 6 is mastered.

Attempting to access it earlier should show a message:

"Complete the Interval Pattern lesson to unlock Scale Builder."

This ensures the user understands:

letters → notes → sharps → intervals → patterns → scales

before being asked to construct scales.

## Level 1 — The Musical Alphabet

Goal: Learn the 7 natural note names.

Concepts introduced:

* A B C D E F G
* Alphabet repeats in cycles

Game loop:

* App highlights a piano key
* Prompt: "Tap the letter C"
* User taps a key
* Immediate feedback

Unlock condition:

* 10 correct answers
* Recognition accuracy > 90%

Reward:

* "Alphabet Master" badge

---

## Level 2 — Finding Notes on the Piano

Goal: Learn where letters appear on the keyboard.

Concepts introduced:

* Keys repeat across octaves
* Same letter appears many times

Game loop:

* Prompt: "Tap every E you see"
* Multiple correct keys exist

Unlock condition:

* Correctly identify multiple notes across octaves

Reward:

* "Keyboard Explorer" badge

---

## Level 3 — Sharps

Goal: Understand that some notes live between letters.

Concepts introduced:

* Black keys
* Sharp (#) means one step higher

Examples taught:

* C# lives between C and D
* F# lives between F and G

Game loop:

* Prompt: "Tap C#"

Unlock condition:

* Recognize sharps consistently

Reward:

* "Sharp Spotter" badge

---

## Level 4 — Half Steps

Goal: Understand the smallest movement on the piano.

Concept introduced:

* A half step = the very next key

Examples:

* E to F
* C to C#

Game loop:

* Prompt: "From C, tap a half step up"

Unlock condition:

* Correct interval recognition

Reward:

* "Half‑Step Hero" badge

---

## Level 5 — Whole Steps

Goal: Understand two-key jumps.

Concept introduced:

* Whole step = two half steps

Examples:

* C to D
* F to G

Game loop:

* Prompt: "From G, tap a whole step"

Unlock condition:

* Correct whole‑step recognition

Reward:

* "Whole‑Step Walker" badge

---

## Level 6 — Interval Patterns

Goal: Introduce scale formulas.

Concepts introduced:

Major scale pattern:
W W H W W W H

Minor scale pattern:
W H W W H W W

Game loop:

* Prompt: "From C move a whole step"
* User taps next note

Unlock condition:

* Complete pattern exercises

Reward:

* "Pattern Apprentice" badge

---

## Level 7 — Building Scales

Goal: Construct full scales.

Game loop:

1. Root note shown
2. Pattern applied step‑by‑step
3. User taps notes on piano
4. App gives feedback

Example:
Build C Major

Steps:
C → D → E → F → G → A → B

Unlock condition:

* Build scales with minimal mistakes

Reward:

* "Scale Builder" badge

---

# Mastery System

Each level should measure:

* accuracy
* speed
* mistake rate
* streak

Progress unlocks when mastery threshold is met.

Example rule:

Accuracy > 90%
AND
3 successful rounds

---

# Game Feel and Rewards

Each level completion should feel like an achievement.

Visual rewards:

* badge unlock
* celebration animation
* sound effect

Progress tracking:

* stars per level
* mastery badge
* completion progress bar

---

# Why This Matters

Without this progression, beginners will feel overwhelmed.

With this progression, the app becomes:

* a structured music course
* a game
* a training tool

Users move from **letters → notes → intervals → scales** naturally.

---

## Data and State Plan

## Main state buckets the app should track

* selected root
* selected scale type
* target scale notes
* current mode
* expected note index
* user selections
* streak
* score
* mistakes count
* hint level
* quiz round type
* whether round is complete

## Why this matters

Right now behavior is split between sections. A cleaner state model will make the app easier to extend and debug.

---

## Technical Refactor Plan

## File responsibilities

### index.html

Should become a cleaner mobile shell.

Add or improve:

* compact top bar
* active challenge card
* feedback strip
* piano container
* bottom game controls
* fewer stacked blocks

### styles.css

Should become mobile-first.

Add or improve:

* tighter spacing on mobile
* sticky bottom controls
* compact card system
* thumb-friendly buttons
* piano scroll behavior
* animation states
* better contrast for feedback colors

### app.js

Should become the main game controller.

It should manage:

* mode switching
* round generation
* progress tracking
* feedback updates
* scoring and streaks
* saving lightweight progress

### piano.js

Should become a dedicated interaction engine.

It should manage:

* piano rendering
* piano click handling
* visual key states
* reset of key states between rounds
* helper methods for current target / correct / wrong / completed

---

## Recommended New Interaction Model

## One engine, multiple modes

Instead of having separate disconnected logic for build and quiz, use one common round engine.

Each round should define:

* mode
* prompt text
* expected answers
* current progress
* feedback rules
* completion rules

### Example round object

* mode: guided-build
* root: C
* scaleType: major
* targetScale: C D E F G A B
* expectedIndex: 2
* expectedNote: E
* progress: 2/7

This will make the app easier to grow into a real game.

---

## Immediate Improvement Roadmap

## Phase 1: Fix the core interaction

1. Make quiz mode piano-only.
2. Add constant feedback after every tap.
3. Keep the expected note visible in a compact prompt card.
4. Make correct notes lock in visually.
5. Improve wrong-answer explanation.

## Phase 2: Make it mobile-first

1. Reduce vertical stacking.
2. Create sticky feedback strip.
3. Create sticky bottom controls.
4. Improve piano sizing and scroll behavior.
5. Make top section compact.

## Phase 3: Add game feel

1. Add score.
2. Add streaks.
3. Add hearts or lives.
4. Add quick round transitions.
5. Add celebration feedback.

## Phase 4: Add learning depth

1. Add flats.
2. Add enharmonic explanation.
3. Add multiple hint levels.
4. Add progressive difficulty.
5. Add challenge packs.

## Phase 5: Add polish

1. Save progress with localStorage.
2. Add install prompt guidance.
3. Improve icon set and splash feel.
4. Add optional sound effects.
5. Tune animations and pacing.

---

## Specific Next Patches I Recommend

## Patch 1: index.html

Restructure the page into:

* compact top bar
* challenge card
* feedback strip
* piano zone
* bottom controls

## Patch 2: styles.css

Convert to mobile-first layout with:

* reduced padding
* sticky control zone
* sticky feedback
* improved piano touch sizing
* scroll-safe piano layout

## Patch 3: app.js

Replace text-input quiz flow with piano-based quiz rounds.

## Patch 4: piano.js

Add support for richer state transitions:

* setTargetKey
* setCorrectKey
* setWrongKey
* lockCompletedKey
* resetRoundStates

---

## Success Criteria

The app is improved when:

* it feels comfortable on a phone
* the piano is the main way to answer
* every tap gives instant feedback
* quiz mode uses piano instead of typing
* the user can understand what to do without confusion
* the interface feels playful, fast, and rewarding

---

## Final Direction

The best version of this app is not just a scale viewer.

It should become a **compact mobile music game** where the user:

* sees one clear task
* taps the piano
* gets instant feedback
* completes the scale
* improves through repetition
* enjoys the process

That is the direction we should build toward next.
