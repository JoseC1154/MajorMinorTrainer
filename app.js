// FILE: app.js

import {
  NOTE_LIST,
  generatePianoKeys,
  attachPianoNoteHandlers,
  clearSelectionFeedback,
  markSelectedKey,
  highlightQuestionNote,
  clearQuestionHighlight
} from './piano.js';

const PATTERNS = {
  major: [2, 2, 1, 2, 2, 2, 1],
  minor: [2, 1, 2, 2, 1, 2, 2]
};

const PATTERN_LABELS = {
  major: 'W W H W W W H',
  minor: 'W H W W H W W'
};

const LESSONS = [
  { id: 1, title: 'Musical Alphabet', unlocked: true },
  { id: 2, title: 'Find Notes on the Piano', unlocked: false },
  { id: 3, title: 'Sharps', unlocked: false },
  { id: 4, title: 'Half Steps', unlocked: false },
  { id: 5, title: 'Whole Steps', unlocked: false },
  { id: 6, title: 'Interval Patterns', unlocked: false },
  { id: 7, title: 'Scale Builder', unlocked: false }
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
const restartRoundBtn = document.getElementById('restartRound');
const hintButtonEl = document.getElementById('hintButton');
const openLessonMapBtn = document.getElementById('openLessonMap');

const storageKey = 'scaleBuilderProgress';

let appState = {
  mode: 'build',
  playerLevel: 1,
  streak: 0,
  completedLessons: [1],
  unlockedLessons: [1, 2],
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

function loadProgress() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const saved = JSON.parse(raw);
    appState = {
      ...appState,
      ...saved,
      completedLessons: Array.isArray(saved.completedLessons) ? saved.completedLessons : appState.completedLessons,
      unlockedLessons: Array.isArray(saved.unlockedLessons) ? saved.unlockedLessons : appState.unlockedLessons
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

function renderPattern(type) {
  patternDisplayEl.textContent = PATTERN_LABELS[type] || '';
}

function renderScaleNotes(scale, builtCount = 0) {
  scaleNotesEl.innerHTML = '';

  if (!scale.length) {
    scaleNotesEl.textContent = 'Choose a root and press Build to begin.';
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
      if (currentQuiz.hiddenIndex === index) {
        noteEl.classList.add('note-current');
      }
    } else {
      noteEl.textContent = note;
    }

    scaleNotesEl.appendChild(noteEl);
  });
}

function setFeedback(html, tone = 'neutral', badge = 'Waiting') {
  persistentFeedbackEl.innerHTML = html;
  feedbackBadgeEl.textContent = badge;
  feedbackBadgeEl.className = `feedback-badge ${tone}`;
}

function setQuizMessage(html, className = '') {
  quizAreaEl.innerHTML = `<div class="builder-feedback ${className}">${html}</div>`;
}

function updateHeaderStats() {
  playerLevelEl.textContent = String(appState.playerLevel);
  playerStreakEl.textContent = String(appState.streak);
}

function updateLessonMeta() {
  const completed = builderState.active ? builderState.expectedIndex : targetScale.length ? targetScale.length : 0;
  const total = targetScale.length || 7;
  lessonProgressLabelEl.textContent = `Progress: ${completed} / ${total}`;
  lessonModeLabelEl.textContent = `Mode: ${appState.mode === 'quiz' ? 'Piano Quiz' : 'Guided Build'}`;
  lessonProgressFillEl.style.width = `${Math.max(0, Math.min(100, (completed / total) * 100))}%`;

  const currentLesson = LESSONS.find(lesson => lesson.id === appState.playerLevel);
  lessonTitleEl.textContent = currentLesson ? currentLesson.title : 'Scale Builder Training';
}

function updateChallengePrompt(message) {
  challengePromptEl.innerHTML = message;
}

function getStepLabel(stepIndex) {
  const pattern = PATTERNS[scaleTypeEl.value] || [];
  const value = pattern[stepIndex];
  return value === 2 ? 'whole step' : 'half step';
}

function unlockNextLevel() {
  if (appState.playerLevel >= 7) return;
  const nextLevel = appState.playerLevel + 1;
  if (!appState.unlockedLessons.includes(nextLevel)) {
    appState.unlockedLessons.push(nextLevel);
  }
  appState.playerLevel = nextLevel;
  saveProgress();
  updateHeaderStats();
  updateLessonMeta();
  setFeedback(`Level complete! You unlocked <strong>${LESSONS[nextLevel - 1].title}</strong>.`, 'success', 'Unlocked');
}

function maybeRewardBuildCompletion() {
  if (!appState.completedLessons.includes(7) && builderState.completed) {
    appState.completedLessons.push(7);
    appState.score += 10;
    appState.streak += 1;
    if (appState.playerLevel < 7) {
      appState.playerLevel = 7;
    }
    saveProgress();
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
    clearQuestionHighlight(pianoContainerEl);
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
  highlightQuestionNote(pianoContainerEl, expectedNote);
  updateLessonMeta();
}

function startBuildMode() {
  if (!appState.unlockedLessons.includes(7) && appState.playerLevel < 6) {
    updateChallengePrompt('Scale Builder is locked until the player understands interval patterns.');
    setFeedback('Complete earlier lessons before full scale building unlocks. For now, you can still explore this prototype.', 'warning', 'Locked');
  }

  targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
  builderState = {
    active: true,
    expectedIndex: 0,
    userNotes: [],
    completed: false
  };
  currentQuiz = null;
  appState.mode = 'build';

  renderPattern(scaleTypeEl.value);
  clearSelectionFeedback(pianoContainerEl);
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
  highlightQuestionNote(pianoContainerEl, currentQuiz.answer);
  renderScaleNotes(targetScale, targetScale.length);
  updateLessonMeta();
}

function startQuiz() {
  if (!targetScale.length) {
    targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
  }

  builderState.active = false;
  builderState.completed = false;
  appState.mode = 'quiz';
  clearQuestionHighlight(pianoContainerEl);
  clearSelectionFeedback(pianoContainerEl);
  currentQuiz = getQuizQuestion();
  renderQuizPrompt();
  saveProgress();
}

function completeQuizRound() {
  appState.streak += 1;
  appState.score += 5;
  if (appState.playerLevel < 7 && appState.streak >= 3) {
    unlockNextLevel();
  } else {
    saveProgress();
    updateHeaderStats();
  }
}

function handleBuildTap(note) {
  const expectedNote = targetScale[builderState.expectedIndex];
  const isCorrect = note === expectedNote;

  clearSelectionFeedback(pianoContainerEl);
  markSelectedKey(pianoContainerEl, note, isCorrect);

  if (isCorrect) {
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
  const previousNote = builderState.expectedIndex === 0 ? rootNoteEl.value : targetScale[builderState.expectedIndex - 1];
  const explanation = builderState.expectedIndex === 0 ? 'start on the root note first' : `move a ${getStepLabel(builderState.expectedIndex - 1)}`;
  updateChallengePrompt(`Not quite. You tapped <strong>${note}</strong>. Try again from <strong>${previousNote}</strong>.`);
  setFeedback(`Wrong note. After <strong>${previousNote}</strong>, you need to <strong>${explanation}</strong> to reach the next note.`, 'wrong', 'Try Again');
  setQuizMessage(
    `Not quite. You clicked <strong>${note}</strong>. The next correct note after <strong>${previousNote}</strong> should follow a <strong>${builderState.expectedIndex === 0 ? 'root start' : getStepLabel(builderState.expectedIndex - 1)}</strong>. Try again.`,
    'wrong'
  );
}

function handleQuizTap(note) {
  if (!currentQuiz) return;

  const isCorrect = note === currentQuiz.answer;
  clearSelectionFeedback(pianoContainerEl);
  markSelectedKey(pianoContainerEl, note, isCorrect);

  if (isCorrect) {
    completeQuizRound();
    setFeedback(`Correct! <strong>${currentQuiz.answer}</strong> is the missing note in the scale.`, 'success', 'Correct');
    updateChallengePrompt(`Great job. You found the missing note: <strong>${currentQuiz.answer}</strong>. Press Quiz for another round.`);
    setQuizMessage(`Correct! <strong>${currentQuiz.answer}</strong> completes the ${currentQuiz.root} ${currentQuiz.typeLabel} scale.`, 'correct');
    clearQuestionHighlight(pianoContainerEl);
    currentQuiz = null;
    renderScaleNotes(targetScale, targetScale.length);
    updateLessonMeta();
    return;
  }

  appState.streak = 0;
  saveProgress();
  updateHeaderStats();
  setFeedback(`Not quite. <strong>${note}</strong> does not fit the blank. Listen to the pattern and try again.`, 'wrong', 'Wrong');
  updateChallengePrompt(`Try again. The missing note is still hidden in the scale above.`);
  setQuizMessage(`Not quite. <strong>${note}</strong> is not the missing note. Keep looking at the scale pattern and tap again.`, 'wrong');
}

function handlePianoSelection({ note }) {
  if (!targetScale.length) return;

  if (appState.mode === 'quiz') {
    handleQuizTap(note);
    return;
  }

  if (!builderState.active || builderState.completed) return;
  handleBuildTap(note);
}

function restartCurrentRound() {
  if (appState.mode === 'quiz') {
    startQuiz();
    return;
  }
  startBuildMode();
}

function showHint() {
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

  setFeedback('No hint is active yet. Start a build or quiz round first.', 'neutral', 'Hint');
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
renderScaleNotes([]);
updateHeaderStats();
updateLessonMeta();
updateChallengePrompt('Choose a root and press Build to begin your guided lesson.');
setFeedback('Welcome to Scale Builder. The app should guide every tap with live feedback.', 'neutral', 'Ready');
setQuizMessage('Use Build for guided learning or Quiz for piano-only challenges.');
