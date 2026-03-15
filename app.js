// FILE: app.js

import {
  NOTE_LIST,
  generatePianoKeys,
  attachPianoNoteHandlers,
  clearSelectionFeedback,
  clearQuestionHighlight,
  resetRoundStates,
  setTargetKey,
  setTargetKeys,
  setWrongKey,
  setCorrectKey,
  setCompletedKey,
  lockCompletedKeys
} from './piano.js';

const NATURAL_NOTES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const SHARP_NOTES = ['C#', 'D#', 'F#', 'G#', 'A#'];
const PATTERNS = {
  major: [2, 2, 1, 2, 2, 2, 1],
  minor: [2, 1, 2, 2, 1, 2, 2]
};

const PATTERN_LABELS = {
  major: 'W W H W W W H',
  minor: 'W H W W H W W'
};

const LESSONS = [
  { id: 1, title: 'Musical Alphabet' },
  { id: 2, title: 'Find Notes on the Piano' },
  { id: 3, title: 'Sharps' },
  { id: 4, title: 'Half Steps' },
  { id: 5, title: 'Whole Steps' },
  { id: 6, title: 'Interval Patterns' },
  { id: 7, title: 'Scale Builder' }
];

const rootNoteEl = document.getElementById('rootNote');
const scaleTypeEl = document.getElementById('scaleType');
const buildScaleBtn = document.getElementById('buildScale');
const patternDisplayEl = document.getElementById('patternDisplay');
const scaleNotesEl = document.getElementById('scaleNotes');
const pianoContainerEl = document.getElementById('pianoContainer');
const startQuizBtn = document.getElementById('startQuiz');
const quizAreaEl = document.getElementById('quizArea');

const playerLevelEl = document.getElementById('playerLevel');
const playerStreakEl = document.getElementById('playerStreak');
const lessonProgressLabelEl = document.getElementById('lessonProgressLabel');
const lessonModeLabelEl = document.getElementById('lessonModeLabel');
const lessonProgressFillEl = document.getElementById('lessonProgressFill');
const challengePromptEl = document.getElementById('challengePrompt');
const persistentFeedbackEl = document.getElementById('persistentFeedback');
const feedbackBadgeEl = document.getElementById('feedbackBadge');
const lessonTitleEl = document.getElementById('lessonTitle');
const feedbackStripEl = persistentFeedbackEl?.closest('.feedback-strip');
const challengeCardEl = challengePromptEl?.closest('.challenge-card');
const restartRoundBtn = document.getElementById('restartRound');
const hintButtonEl = document.getElementById('hintButton');
const openLessonMapBtn = document.getElementById('openLessonMap');

const storageKey = 'scaleBuilderProgress';

let appState = {
  mode: 'lesson',
  playerLevel: 1,
  streak: 0,
  completedLessons: [],
  unlockedLessons: [1],
  score: 0
};

let targetScale = [];
let builderState = {
  active: false,
  expectedIndex: 0,
  userNotes: [],
  completed: false
};

let currentQuiz = null;
let currentLessonRound = null;

function loadProgress() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const saved = JSON.parse(raw);
    appState = {
      ...appState,
      ...saved,
      completedLessons: Array.isArray(saved.completedLessons) ? saved.completedLessons : [],
      unlockedLessons: Array.isArray(saved.unlockedLessons) && saved.unlockedLessons.length ? saved.unlockedLessons : [1]
    };
  } catch (error) {
    console.warn('Unable to load saved progress.', error);
  }
}

function saveProgress() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(appState));
  } catch (error) {
    console.warn('Unable to save progress.', error);
  }
}

function getScale(root, type) {
  const pattern = PATTERNS[type];
  const startIndex = NOTE_LIST.indexOf(root);

  if (startIndex === -1 || !pattern) return [];

  const scale = [root];
  let currentIndex = startIndex;

  for (let i = 0; i < pattern.length - 1; i += 1) {
    currentIndex = (currentIndex + pattern[i]) % NOTE_LIST.length;
    scale.push(NOTE_LIST[currentIndex]);
  }

  return scale;
}

function getScaleTypeLabel(type) {
  return type === 'major' ? 'Major' : 'Natural Minor';
}

function getStepLabel(stepIndex) {
  const pattern = PATTERNS[scaleTypeEl.value] || [];
  const value = pattern[stepIndex];
  return value === 2 ? 'whole step' : 'half step';
}

function getCurrentLesson() {
  return LESSONS.find(lesson => lesson.id === appState.playerLevel) || LESSONS[0];
}

function renderPattern(type) {
  patternDisplayEl.textContent = PATTERN_LABELS[type] || '';
}

function renderScaleNotes(scale, builtCount = 0) {
  scaleNotesEl.innerHTML = '';

  if (appState.mode === 'lesson' && currentLessonRound) {
    currentLessonRound.displayNotes.forEach((token, index) => {
      const noteEl = document.createElement('div');
      noteEl.className = 'note';
      noteEl.textContent = token;
      if (index < (currentLessonRound.completedCount || 0)) {
        noteEl.classList.add('note-complete');
      } else if (token === '___' || token === '•') {
        noteEl.classList.add('note-current');
      }
      scaleNotesEl.appendChild(noteEl);
    });
    return;
  }

  if (!scale.length) {
    scaleNotesEl.textContent = 'Start Lesson to begin from the very basics.';
    return;
  }

  scale.forEach((note, index) => {
    const noteEl = document.createElement('div');
    noteEl.className = 'note';

    if (builtCount > 0 && index < builtCount) {
      noteEl.textContent = note;
      noteEl.classList.add('note-complete');
    } else if (builderState.active && !builderState.completed) {
      noteEl.textContent = index === builtCount ? '___' : '•';
      noteEl.classList.add(index === builtCount ? 'note-current' : 'note-hidden');
    } else if (currentQuiz) {
      noteEl.textContent = currentQuiz.hiddenIndex === index ? '___' : note;
      if (currentQuiz.hiddenIndex === index) noteEl.classList.add('note-current');
    } else {
      noteEl.textContent = note;
    }

    scaleNotesEl.appendChild(noteEl);
  });
}

function applyPanelState(tone = 'neutral') {
  const tones = ['success-state', 'warning-state'];
  feedbackStripEl?.classList.remove(...tones);
  challengeCardEl?.classList.remove(...tones);

  if (tone === 'success') {
    feedbackStripEl?.classList.add('success-state');
    challengeCardEl?.classList.add('success-state');
  }

  if (tone === 'warning' || tone === 'wrong') {
    feedbackStripEl?.classList.add('warning-state');
    challengeCardEl?.classList.add('warning-state');
  }
}

function setFeedback(html, tone = 'neutral', badge = 'Waiting') {
  persistentFeedbackEl.innerHTML = html;
  feedbackBadgeEl.textContent = badge;
  feedbackBadgeEl.className = `feedback-badge ${tone}`;
  applyPanelState(tone);
}`;
}

function setQuizMessage(html, className = '') {
  quizAreaEl.innerHTML = `<div class="builder-feedback ${className}">${html}</div>`;
}

function updateHeaderStats() {
  playerLevelEl.textContent = String(appState.playerLevel);
  playerStreakEl.textContent = String(appState.streak);
}

function getProgressNumbers() {
  if (appState.mode === 'lesson' && currentLessonRound) {
    return {
      completed: currentLessonRound.progressCurrent,
      total: currentLessonRound.progressTotal
    };
  }

  const completed = builderState.active ? builderState.expectedIndex : targetScale.length ? targetScale.length : 0;
  const total = targetScale.length || 7;
  return { completed, total };
}

function updateLessonMeta() {
  const { completed, total } = getProgressNumbers();
  lessonProgressLabelEl.textContent = `Progress: ${completed} / ${total}`;

  const modeLabel = {
    lesson: 'Lesson Mode',
    build: 'Guided Build',
    quiz: 'Piano Quiz'
  };

  lessonModeLabelEl.textContent = `Mode: ${modeLabel[appState.mode] || 'Lesson Mode'}`;
  lessonProgressFillEl.style.width = `${Math.max(0, Math.min(100, (completed / Math.max(total, 1)) * 100))}%`;
  lessonTitleEl.textContent = getCurrentLesson().title;
}

function updateChallengePrompt(message) {
  challengePromptEl.innerHTML = message;
}

function pcToNote(pc) {
  return NOTE_LIST[((pc % 12) + 12) % 12];
}

function getAdjacentNote(note, stepSize) {
  const index = NOTE_LIST.indexOf(note);
  if (index === -1) return note;
  return NOTE_LIST[(index + stepSize + NOTE_LIST.length) % NOTE_LIST.length];
}

function setLessonRound(round) {
  currentLessonRound = round;
  resetRoundStates(pianoContainerEl, { keepScaleState: false });
  clearSelectionFeedback(pianoContainerEl);
  clearQuestionHighlight(pianoContainerEl);

  if (round.targetNotes?.length > 1) {
    setTargetKeys(pianoContainerEl, round.targetNotes);
  } else if (round.targetNotes?.[0]) {
    setTargetKey(pianoContainerEl, round.targetNotes[0]);
  }

  renderScaleNotes([]);
  updateChallengePrompt(round.prompt);
  setFeedback(round.feedback, 'prompt', 'Lesson');
  setQuizMessage(round.quizText || round.prompt, 'prompt');
  updateLessonMeta();
}

function completeLesson() {
  const currentId = appState.playerLevel;
  if (!appState.completedLessons.includes(currentId)) {
    appState.completedLessons.push(currentId);
  }
  const nextId = currentId + 1;
  if (nextId <= LESSONS.length && !appState.unlockedLessons.includes(nextId)) {
    appState.unlockedLessons.push(nextId);
  }
  if (nextId <= LESSONS.length) {
    appState.playerLevel = nextId;
  }
  appState.streak += 1;
  appState.score += 10;
  saveProgress();
  updateHeaderStats();
  updateLessonMeta();

  const nextLesson = LESSONS.find(item => item.id === appState.playerLevel);
  setFeedback(`Level complete! You earned a new lesson award. ${nextLesson ? `Next up: <strong>${nextLesson.title}</strong>.` : 'You completed all lessons.'}`, 'success', 'Unlocked');
  updateChallengePrompt(`Award earned. ${nextLesson ? `You unlocked <strong>${nextLesson.title}</strong>.` : 'You mastered the current learning path.'}`);
  setQuizMessage(`Great work. Your next lesson is now unlocked.`, 'correct');
  currentLessonRound = null;
}

function buildLessonRound() {
  const lessonId = appState.playerLevel;
  const lesson = getCurrentLesson();

  switch (lessonId) {
    case 1: {
      const target = NATURAL_NOTES[Math.floor(Math.random() * NATURAL_NOTES.length)];
      return {
        lessonId,
        type: 'single-note',
        prompt: `Lesson 1: The musical alphabet uses only <strong>A B C D E F G</strong>. Tap the letter <strong>${target}</strong>.`,
        feedback: `Find the piano key named <strong>${target}</strong>. You only need to know the alphabet here.`,
        quizText: `Tap the letter <strong>${target}</strong> on the piano.`,
        targetNotes: [target],
        displayNotes: NATURAL_NOTES,
        progressCurrent: 0,
        progressTotal: 1,
        successMessage: `Correct. <strong>${target}</strong> is part of the musical alphabet.`
      };
    }
    case 2: {
      const target = NATURAL_NOTES[Math.floor(Math.random() * NATURAL_NOTES.length)];
      return {
        lessonId,
        type: 'multi-note',
        prompt: `Lesson 2: The same letter appears in many places. Tap <strong>any ${target}</strong> on the piano.`,
        feedback: `The letter <strong>${target}</strong> repeats across octaves. Any matching ${target} key is correct.`,
        quizText: `Tap any <strong>${target}</strong> you can find.`,
        targetNotes: [target],
        displayNotes: [target, '•', target, '•', target],
        progressCurrent: 0,
        progressTotal: 1,
        successMessage: `Nice. You found <strong>${target}</strong> on the keyboard.`
      };
    }
    case 3: {
      const target = SHARP_NOTES[Math.floor(Math.random() * SHARP_NOTES.length)];
      const left = NOTE_LIST[(NOTE_LIST.indexOf(target) + 11) % 12];
      const right = NOTE_LIST[(NOTE_LIST.indexOf(target) + 1) % 12];
      return {
        lessonId,
        type: 'single-note',
        prompt: `Lesson 3: A sharp means one key higher. Tap <strong>${target}</strong>. It sits between <strong>${left}</strong> and <strong>${right}</strong>.`,
        feedback: `Look for the black key between <strong>${left}</strong> and <strong>${right}</strong>.`,
        quizText: `Tap <strong>${target}</strong>.`,
        targetNotes: [target],
        displayNotes: [left, target, right],
        progressCurrent: 0,
        progressTotal: 1,
        successMessage: `Correct. <strong>${target}</strong> is the sharp between ${left} and ${right}.`
      };
    }
    case 4: {
      const root = ['C', 'D', 'E', 'F', 'G', 'A'][Math.floor(Math.random() * 6)];
      const answer = getAdjacentNote(root, 1);
      return {
        lessonId,
        type: 'single-note',
        prompt: `Lesson 4: A half step means the very next key. From <strong>${root}</strong>, tap a <strong>half step up</strong>.`,
        feedback: `Start at <strong>${root}</strong>. Move to the next key with no key skipped.`,
        quizText: `From ${root}, tap the next key up.`,
        targetNotes: [answer],
        displayNotes: [root, '___'],
        progressCurrent: 0,
        progressTotal: 1,
        successMessage: `Yes. <strong>${answer}</strong> is a half step above ${root}.`
      };
    }
    case 5: {
      const root = ['C', 'D', 'F', 'G', 'A'][Math.floor(Math.random() * 5)];
      const answer = getAdjacentNote(root, 2);
      return {
        lessonId,
        type: 'single-note',
        prompt: `Lesson 5: A whole step is two half steps. From <strong>${root}</strong>, tap a <strong>whole step up</strong>.`,
        feedback: `Move up two piano keys from <strong>${root}</strong>.`,
        quizText: `From ${root}, tap a whole step up.`,
        targetNotes: [answer],
        displayNotes: [root, '•', '___'],
        progressCurrent: 0,
        progressTotal: 1,
        successMessage: `Correct. <strong>${answer}</strong> is a whole step above ${root}.`
      };
    }
    case 6: {
      const root = rootNoteEl.value;
      const pattern = PATTERNS[scaleTypeEl.value];
      const answer = getAdjacentNote(root, pattern[0]);
      return {
        lessonId,
        type: 'single-note',
        prompt: `Lesson 6: Patterns tell you how to move. For <strong>${root} ${getScaleTypeLabel(scaleTypeEl.value)}</strong>, the first move is a <strong>${pattern[0] === 2 ? 'whole step' : 'half step'}</strong>. Tap the next note.`,
        feedback: `Read the pattern and make the first move from <strong>${root}</strong>.`,
        quizText: `Pattern: ${PATTERN_LABELS[scaleTypeEl.value]}. Tap the first note after ${root}.`,
        targetNotes: [answer],
        displayNotes: [root, '___', '•'],
        progressCurrent: 0,
        progressTotal: 1,
        successMessage: `Nice. You followed the pattern correctly to <strong>${answer}</strong>.`
      };
    }
    default:
      return null;
  }
}

function startLessonMode() {
  appState.mode = 'lesson';
  builderState.active = false;
  builderState.completed = false;
  currentQuiz = null;
  targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
  renderPattern(scaleTypeEl.value);

  if (appState.playerLevel >= 7) {
    updateChallengePrompt('You unlocked Scale Builder. Press <strong>Build</strong> to construct a full scale or <strong>Quiz</strong> for a piano challenge.');
    setFeedback('All core lessons are unlocked. You can now use full scale building.', 'success', 'Ready');
    setQuizMessage('Lesson path complete. Build and Quiz are now your main game modes.', 'correct');
    currentLessonRound = null;
    updateLessonMeta();
    renderScaleNotes([]);
    resetRoundStates(pianoContainerEl, { keepScaleState: false });
    return;
  }

  setLessonRound(buildLessonRound());
}

function maybeRewardBuildCompletion() {
  if (!appState.completedLessons.includes(7) && builderState.completed) {
    appState.completedLessons.push(7);
    appState.score += 15;
    appState.streak += 1;
    saveProgress();
    updateHeaderStats();
  }
}

function renderBuildPrompt() {
  if (!targetScale.length) {
    updateChallengePrompt('Choose a root and scale type, then press <strong>Build</strong> to begin your guided lesson.');
    setFeedback('Tap Build to start. The app will guide you note-by-note on the piano.', 'neutral', 'Ready');
    setQuizMessage('Choose a root and scale type, then press <strong>Build</strong>.');
    updateLessonMeta();
    return;
  }

  if (builderState.completed) {
    const message = `Excellent! You built the <strong>${rootNoteEl.value} ${getScaleTypeLabel(scaleTypeEl.value)}</strong> scale: ${targetScale.join(' - ')}.`;
    updateChallengePrompt(message);
    setFeedback('Perfect build. Your scale is complete and every note is now revealed.', 'success', 'Complete');
    setQuizMessage(message, 'correct');
    resetRoundStates(pianoContainerEl, { keepScaleState: false });
    lockCompletedKeys(pianoContainerEl, targetScale);
    maybeRewardBuildCompletion();
    updateLessonMeta();
    return;
  }

  const expectedNote = targetScale[builderState.expectedIndex];
  const previousNote = builderState.expectedIndex === 0 ? null : targetScale[builderState.expectedIndex - 1];
  const stepWord = builderState.expectedIndex === 0
    ? 'Start on the root note.'
    : `From <strong>${previousNote}</strong>, move a <strong>${getStepLabel(builderState.expectedIndex - 1)}</strong>.`;

  const prompt = `<strong>${rootNoteEl.value} ${getScaleTypeLabel(scaleTypeEl.value)}</strong><br>${stepWord}<br>Tap note <strong>${builderState.expectedIndex + 1}</strong> on the piano.`;
  updateChallengePrompt(prompt);
  setFeedback(`Find <strong>${expectedNote}</strong>. Every correct tap reveals the next note of the scale.`, 'prompt', 'Your Turn');
  setQuizMessage(prompt, 'prompt');
  resetRoundStates(pianoContainerEl, { keepScaleState: false });
  lockCompletedKeys(pianoContainerEl, builderState.userNotes);
  setTargetKey(pianoContainerEl, expectedNote);
  updateLessonMeta();
}

function startBuildMode() {
  if (appState.playerLevel < 7 && !appState.completedLessons.includes(6)) {
    updateChallengePrompt('Scale Builder is locked until interval patterns are mastered.');
    setFeedback('Complete the lesson flow first: notes, sharps, half steps, whole steps, and patterns.', 'warning', 'Locked');
    setQuizMessage('Scale Builder is still locked. Use the lesson path to unlock it.', 'wrong');
    appState.mode = 'lesson';
    startLessonMode();
    return;
  }

  targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
  builderState = {
    active: true,
    expectedIndex: 0,
    userNotes: [],
    completed: false
  };
  currentQuiz = null;
  currentLessonRound = null;
  appState.mode = 'build';

  renderPattern(scaleTypeEl.value);
  resetRoundStates(pianoContainerEl, { keepScaleState: false });
  renderScaleNotes(targetScale, 0);
  renderBuildPrompt();
  saveProgress();
}

function getQuizQuestion() {
  if (!targetScale.length) return null;

  const hiddenIndex = Math.floor(Math.random() * targetScale.length);
  const answer = targetScale[hiddenIndex];
  const promptScale = [...targetScale];
  promptScale[hiddenIndex] = '___';

  return {
    hiddenIndex,
    answer,
    promptScale,
    root: rootNoteEl.value,
    typeLabel: scaleTypeEl.value === 'major' ? 'major' : 'natural minor'
  };
}

function renderQuizPrompt() {
  if (!targetScale.length) {
    setQuizMessage('Build a scale first, then start practicing.');
    updateChallengePrompt('Use Build first, then move into quiz mode.');
    setFeedback('Quiz mode needs an active scale. Start by building one.', 'neutral', 'Ready');
    updateLessonMeta();
    return;
  }

  if (!currentQuiz) {
    setQuizMessage('Press <strong>Quiz</strong> to hide one note from the scale.');
    updateLessonMeta();
    return;
  }

  const prompt = `Complete the <strong>${currentQuiz.root} ${currentQuiz.typeLabel}</strong> scale by tapping the missing note on the piano.`;
  setQuizMessage(`${prompt}<div class="quiz-scale">${currentQuiz.promptScale.join('  ')}</div>`, 'prompt');
  updateChallengePrompt(prompt);
  setFeedback(`Tap the missing note. The hidden note belongs where the blank appears in the scale.`, 'prompt', 'Quiz');
  resetRoundStates(pianoContainerEl, { keepScaleState: false });
  lockCompletedKeys(pianoContainerEl, currentQuiz.promptScale.filter(note => note !== '___'));
  setTargetKey(pianoContainerEl, currentQuiz.answer);
  renderScaleNotes(targetScale, targetScale.length);
  updateLessonMeta();
}

function startQuiz() {
  if (appState.playerLevel < 7 && !appState.completedLessons.includes(6)) {
    setFeedback('Quiz mode for scales unlocks after you master the lesson path.', 'warning', 'Locked');
    setQuizMessage('Keep progressing through the lesson flow to unlock piano scale quizzes.', 'wrong');
    startLessonMode();
    return;
  }

  if (!targetScale.length) {
    targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
  }

  builderState.active = false;
  builderState.completed = false;
  currentLessonRound = null;
  appState.mode = 'quiz';
  currentQuiz = getQuizQuestion();
  renderQuizPrompt();
  saveProgress();
}

function handleLessonTap(note) {
  if (!currentLessonRound) return;

  const valid = currentLessonRound.targetNotes.includes(note);
  clearSelectionFeedback(pianoContainerEl);

  if (valid) {
    setCorrectKey(pianoContainerEl, note);
    setCompletedKey(pianoContainerEl, note);
    currentLessonRound.progressCurrent = currentLessonRound.progressTotal;
    currentLessonRound.completedCount = currentLessonRound.displayNotes.length;
    appState.streak += 1;
    updateHeaderStats();
    renderScaleNotes([]);
    setFeedback(currentLessonRound.successMessage, 'success', 'Correct');
    updateChallengePrompt(`Nice work. ${currentLessonRound.successMessage}`);
    setQuizMessage('Lesson clear. Press Restart for another lesson round, or keep going to unlock the next award.', 'correct');

    if (!appState.completedLessons.includes(currentLessonRound.lessonId)) {
      completeLesson();
    } else {
      saveProgress();
    }
    return;
  }

  appState.streak = 0;
  updateHeaderStats();
  setWrongKey(pianoContainerEl, note);
  setFeedback(`Not quite. <strong>${note}</strong> is not the target for this lesson.`, 'wrong', 'Try Again');
  updateChallengePrompt(currentLessonRound.prompt);
  setQuizMessage(`Try again. ${currentLessonRound.feedback}`, 'wrong');
}

function completeQuizRound() {
  appState.streak += 1;
  appState.score += 5;
  saveProgress();
  updateHeaderStats();
}

function handleBuildTap(note) {
  const expectedNote = targetScale[builderState.expectedIndex];
  const isCorrect = note === expectedNote;

  clearSelectionFeedback(pianoContainerEl);

  if (isCorrect) {
    setCorrectKey(pianoContainerEl, note);
    setCompletedKey(pianoContainerEl, note);
    builderState.userNotes.push(note);
    builderState.expectedIndex += 1;
    appState.streak += 1;
    updateHeaderStats();

    if (builderState.expectedIndex >= targetScale.length) {
      builderState.completed = true;
      renderScaleNotes(targetScale, targetScale.length);
      renderBuildPrompt();
      saveProgress();
      return;
    }

    renderScaleNotes(targetScale, builderState.expectedIndex);
    renderBuildPrompt();
    saveProgress();
    return;
  }

  appState.streak = 0;
  updateHeaderStats();
  setWrongKey(pianoContainerEl, note);
  const previousNote = builderState.expectedIndex === 0 ? rootNoteEl.value : targetScale[builderState.expectedIndex - 1];
  const explanation = builderState.expectedIndex === 0 ? 'start on the root note first' : `move a ${getStepLabel(builderState.expectedIndex - 1)}`;
  updateChallengePrompt(`Not quite. You tapped <strong>${note}</strong>. Try again from <strong>${previousNote}</strong>.`);
  setFeedback(`Wrong note. After <strong>${previousNote}</strong>, you need to <strong>${explanation}</strong> to reach the next note.`, 'wrong', 'Try Again');
  setQuizMessage(`Not quite. The next correct note after <strong>${previousNote}</strong> should follow a <strong>${builderState.expectedIndex === 0 ? 'root start' : getStepLabel(builderState.expectedIndex - 1)}</strong>.`, 'wrong');
}

function handleQuizTap(note) {
  if (!currentQuiz) return;

  const isCorrect = note === currentQuiz.answer;
  clearSelectionFeedback(pianoContainerEl);

  if (isCorrect) {
    setCorrectKey(pianoContainerEl, note);
    setCompletedKey(pianoContainerEl, note);
    completeQuizRound();
    setFeedback(`Correct! <strong>${currentQuiz.answer}</strong> is the missing note in the scale.`, 'success', 'Correct');
    updateChallengePrompt(`Great job. You found the missing note: <strong>${currentQuiz.answer}</strong>. Press Quiz for another round.`);
    setQuizMessage(`Correct! <strong>${currentQuiz.answer}</strong> completes the ${currentQuiz.root} ${currentQuiz.typeLabel} scale.`, 'correct');
    currentQuiz = null;
    renderScaleNotes(targetScale, targetScale.length);
    updateLessonMeta();
    return;
  }

  appState.streak = 0;
  saveProgress();
  updateHeaderStats();
  setWrongKey(pianoContainerEl, note);
  setFeedback(`Not quite. <strong>${note}</strong> does not fit the blank. Look at the notes around the gap and try again.`, 'wrong', 'Wrong');
  updateChallengePrompt('Try again. The missing note is still hidden in the scale above.');
  setQuizMessage(`Not quite. <strong>${note}</strong> is not the missing note. Keep looking at the scale pattern and tap again.`, 'wrong');
}

function handlePianoSelection({ note }) {
  if (appState.mode === 'lesson') {
    handleLessonTap(note);
    return;
  }

  if (!targetScale.length) return;

  if (appState.mode === 'quiz') {
    handleQuizTap(note);
    return;
  }

  if (!builderState.active || builderState.completed) return;
  handleBuildTap(note);
}

function restartCurrentRound() {
  if (appState.mode === 'lesson') {
    startLessonMode();
    return;
  }
  if (appState.mode === 'quiz') {
    startQuiz();
    return;
  }
  startBuildMode();
}

function showHint() {
  if (appState.mode === 'lesson' && currentLessonRound) {
    setFeedback(`Hint: look for <strong>${currentLessonRound.targetNotes[0]}</strong> on the piano.`, 'prompt', 'Hint');
    return;
  }

  if (appState.mode === 'quiz' && currentQuiz) {
    setFeedback(`Hint: the missing note is <strong>${currentQuiz.answer}</strong>. Tap it on the piano.`, 'prompt', 'Hint');
    updateChallengePrompt(`Hint active. Find <strong>${currentQuiz.answer}</strong> on the keyboard.`);
    return;
  }

  if (builderState.active && !builderState.completed && targetScale.length) {
    const expectedNote = targetScale[builderState.expectedIndex];
    const stepText = builderState.expectedIndex === 0 ? 'Start on the root note.' : `Use a ${getStepLabel(builderState.expectedIndex - 1)} from the previous note.`;
    setFeedback(`Hint: the next note is <strong>${expectedNote}</strong>. ${stepText}`, 'prompt', 'Hint');
    updateChallengePrompt(`Hint active. Tap <strong>${expectedNote}</strong> on the piano.`);
    return;
  }

  setFeedback('No hint is active yet. Start a lesson, build, or quiz round first.', 'neutral', 'Hint');
}

function openLessonMap() {
  const lessonSummary = LESSONS.map(lesson => {
    const state = appState.completedLessons.includes(lesson.id)
      ? '⭐ Mastered'
      : appState.unlockedLessons.includes(lesson.id)
        ? '▶ Available'
        : '🔒 Locked';
    return `${lesson.id}. ${lesson.title} — ${state}`;
  }).join('<br>');

  setFeedback(`Lesson Map<br>${lessonSummary}`, 'prompt', 'Map');
  updateChallengePrompt('The lesson map shows what is unlocked, what is mastered, and what comes next.');
  setQuizMessage('Lesson map opened in the feedback area. A dedicated map screen can be added next.', 'prompt');
}

buildScaleBtn.addEventListener('click', startBuildMode);
startQuizBtn.addEventListener('click', startQuiz);
restartRoundBtn?.addEventListener('click', restartCurrentRound);
hintButtonEl?.addEventListener('click', showHint);
openLessonMapBtn?.addEventListener('click', openLessonMap);

scaleTypeEl.addEventListener('change', () => {
  renderPattern(scaleTypeEl.value);
  targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
  if (appState.mode === 'lesson') {
    startLessonMode();
    return;
  }
  if (appState.mode === 'quiz' && currentQuiz) {
    currentQuiz = getQuizQuestion();
    renderQuizPrompt();
  } else {
    renderScaleNotes(targetScale, builderState.active ? builderState.expectedIndex : 0);
    renderBuildPrompt();
  }
});

rootNoteEl.addEventListener('change', () => {
  targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
  if (appState.mode === 'lesson') {
    startLessonMode();
    return;
  }
  if (appState.mode === 'quiz' && currentQuiz) {
    currentQuiz = getQuizQuestion();
    renderQuizPrompt();
  } else {
    renderScaleNotes(targetScale, builderState.active ? builderState.expectedIndex : 0);
    renderBuildPrompt();
  }
});

loadProgress();
generatePianoKeys(pianoContainerEl, { octaveCount: 2, whiteKeyPixelWidth: 56 });
attachPianoNoteHandlers(pianoContainerEl, handlePianoSelection);
targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
renderPattern(scaleTypeEl.value);
updateHeaderStats();
updateLessonMeta();
startLessonMode();
