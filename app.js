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

const rootNoteEl = document.getElementById('rootNote');
const scaleTypeEl = document.getElementById('scaleType');
const buildScaleBtn = document.getElementById('buildScale');
const patternDisplayEl = document.getElementById('patternDisplay');
const scaleNotesEl = document.getElementById('scaleNotes');
const pianoContainerEl = document.getElementById('pianoContainer');
const startQuizBtn = document.getElementById('startQuiz');
const quizAreaEl = document.getElementById('quizArea');

let targetScale = [];
let builderState = {
  active: false,
  expectedIndex: 0,
  userNotes: [],
  completed: false
};

let currentQuiz = null;

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
    scaleNotesEl.textContent = 'Choose a root and press Build Scale to begin.';
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
    } else {
      noteEl.textContent = note;
    }

    scaleNotesEl.appendChild(noteEl);
  });
}

function setQuizMessage(html, className = '') {
  quizAreaEl.innerHTML = `<div class="builder-feedback ${className}">${html}</div>`;
}

function renderBuildPrompt() {
  if (!targetScale.length) {
    setQuizMessage('Choose a root and scale type, then press <strong>Build Scale</strong>.');
    return;
  }

  if (builderState.completed) {
    setQuizMessage(
      `Excellent! You built the <strong>${rootNoteEl.value} ${getScaleTypeLabel(scaleTypeEl.value)}</strong> scale: ${targetScale.join(' - ')}.`,
      'correct'
    );
    clearQuestionHighlight(pianoContainerEl);
    return;
  }

  const expectedNote = targetScale[builderState.expectedIndex];
  const previousNote = builderState.expectedIndex === 0 ? null : targetScale[builderState.expectedIndex - 1];
  const stepWord = builderState.expectedIndex === 0
    ? 'Start on the root note.'
    : `From ${previousNote}, move a <strong>${getStepLabel(builderState.expectedIndex - 1)}</strong>.`;

  setQuizMessage(
    `<strong>${rootNoteEl.value} ${getScaleTypeLabel(scaleTypeEl.value)}</strong><br>${stepWord}<br>Click the piano key for note <strong>${builderState.expectedIndex + 1}</strong> of the scale.`,
    'prompt'
  );

  highlightQuestionNote(pianoContainerEl, expectedNote);
}

function getStepLabel(stepIndex) {
  const pattern = PATTERNS[scaleTypeEl.value] || [];
  const value = pattern[stepIndex];
  return value === 2 ? 'whole step' : 'half step';
}

function startBuildMode() {
  targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
  builderState = {
    active: true,
    expectedIndex: 0,
    userNotes: [],
    completed: false
  };
  currentQuiz = null;

  renderPattern(scaleTypeEl.value);
  clearSelectionFeedback(pianoContainerEl);
  renderScaleNotes(targetScale, 0);
  renderBuildPrompt();
}

function handlePianoSelection({ note }) {
  if (!builderState.active || builderState.completed || !targetScale.length) return;

  const expectedNote = targetScale[builderState.expectedIndex];
  const isCorrect = note === expectedNote;

  clearSelectionFeedback(pianoContainerEl);
  markSelectedKey(pianoContainerEl, note, isCorrect);

  if (isCorrect) {
    builderState.userNotes.push(note);
    builderState.expectedIndex += 1;

    if (builderState.expectedIndex >= targetScale.length) {
      builderState.completed = true;
      renderScaleNotes(targetScale, targetScale.length);
      renderBuildPrompt();
      return;
    }

    renderScaleNotes(targetScale, builderState.expectedIndex);
    renderBuildPrompt();
    return;
  }

  const previousNote = builderState.expectedIndex === 0 ? rootNoteEl.value : targetScale[builderState.expectedIndex - 1];
  setQuizMessage(
    `Not quite. You clicked <strong>${note}</strong>. The next correct note after <strong>${previousNote}</strong> should follow a <strong>${builderState.expectedIndex === 0 ? 'root start' : getStepLabel(builderState.expectedIndex - 1)}</strong>. Try again.`,
    'wrong'
  );
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
    return;
  }

  if (!currentQuiz) {
    setQuizMessage('Press <strong>Start Quiz</strong> to hide one note from the scale.');
    return;
  }

  quizAreaEl.innerHTML = '';

  const title = document.createElement('p');
  title.innerHTML = `Complete the <strong>${currentQuiz.root} ${currentQuiz.typeLabel}</strong> scale:`;

  const prompt = document.createElement('div');
  prompt.className = 'quiz-scale';
  prompt.textContent = currentQuiz.promptScale.join('  ');

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'quizAnswer';
  input.placeholder = 'Type the missing note';
  input.autocomplete = 'off';
  input.spellcheck = false;

  const controls = document.createElement('div');
  controls.className = 'quiz-controls';

  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Check Answer';
  submitBtn.addEventListener('click', checkQuizAnswer);

  const revealBtn = document.createElement('button');
  revealBtn.textContent = 'Reveal';
  revealBtn.addEventListener('click', revealQuizAnswer);

  const feedback = document.createElement('div');
  feedback.id = 'quizFeedback';
  feedback.className = 'quiz-feedback';

  controls.appendChild(submitBtn);
  controls.appendChild(revealBtn);

  quizAreaEl.appendChild(title);
  quizAreaEl.appendChild(prompt);
  quizAreaEl.appendChild(input);
  quizAreaEl.appendChild(controls);
  quizAreaEl.appendChild(feedback);

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      checkQuizAnswer();
    }
  });

  input.focus();
}

function startQuiz() {
  if (!targetScale.length) {
    targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
  }

  builderState.active = false;
  builderState.completed = false;
  clearQuestionHighlight(pianoContainerEl);
  clearSelectionFeedback(pianoContainerEl);
  renderScaleNotes(targetScale, targetScale.length);
  currentQuiz = getQuizQuestion();
  renderQuizPrompt();
}

function checkQuizAnswer() {
  if (!currentQuiz) return;

  const input = document.getElementById('quizAnswer');
  const feedback = document.getElementById('quizFeedback');
  if (!input || !feedback) return;

  const userAnswer = input.value.trim().toUpperCase();
  const correctAnswer = currentQuiz.answer.toUpperCase();

  if (userAnswer === correctAnswer) {
    feedback.textContent = `Correct! The missing note is ${currentQuiz.answer}.`;
    feedback.className = 'quiz-feedback correct';
  } else {
    feedback.textContent = 'Not quite. Try again.';
    feedback.className = 'quiz-feedback wrong';
  }
}

function revealQuizAnswer() {
  if (!currentQuiz) return;

  const feedback = document.getElementById('quizFeedback');
  if (!feedback) return;

  feedback.textContent = `Answer: ${currentQuiz.answer}`;
  feedback.className = 'quiz-feedback';
}

buildScaleBtn.addEventListener('click', startBuildMode);
startQuizBtn.addEventListener('click', startQuiz);
scaleTypeEl.addEventListener('change', () => {
  renderPattern(scaleTypeEl.value);
  if (!builderState.active) {
    targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
    renderScaleNotes(targetScale, 0);
  }
});
rootNoteEl.addEventListener('change', () => {
  if (!builderState.active) {
    targetScale = getScale(rootNoteEl.value, scaleTypeEl.value);
    renderScaleNotes(targetScale, 0);
  }
});

generatePianoKeys(pianoContainerEl, { octaveCount: 2 });
attachPianoNoteHandlers(pianoContainerEl, handlePianoSelection);
renderPattern(scaleTypeEl.value);
renderScaleNotes([]);
renderBuildPrompt();
