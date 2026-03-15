// FILE: app.js

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
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

let currentScale = [];
let currentQuiz = null;

function getScale(root, type) {
  const pattern = PATTERNS[type];
  const startIndex = NOTES.indexOf(root);

  if (startIndex === -1) return [];

  const scale = [root];
  let currentIndex = startIndex;

  for (let i = 0; i < pattern.length - 1; i++) {
    currentIndex = (currentIndex + pattern[i]) % NOTES.length;
    scale.push(NOTES[currentIndex]);
  }

  return scale;
}

function renderPattern(type) {
  patternDisplayEl.textContent = PATTERN_LABELS[type] || '';
}

function renderScaleNotes(scale) {
  scaleNotesEl.innerHTML = '';

  if (!scale.length) {
    scaleNotesEl.textContent = 'No scale to display yet.';
    return;
  }

  scale.forEach(note => {
    const noteEl = document.createElement('div');
    noteEl.className = 'note';
    noteEl.textContent = note;
    scaleNotesEl.appendChild(noteEl);
  });
}

function createPiano() {
  pianoContainerEl.innerHTML = '';

  WHITE_NOTES.forEach(note => {
    const whiteKey = document.createElement('div');
    whiteKey.className = 'white-key';
    whiteKey.dataset.note = note;
    whiteKey.title = note;

    if (note === 'C') addBlackKey(whiteKey, 'C#');
    if (note === 'D') addBlackKey(whiteKey, 'D#');
    if (note === 'F') addBlackKey(whiteKey, 'F#');
    if (note === 'G') addBlackKey(whiteKey, 'G#');
    if (note === 'A') addBlackKey(whiteKey, 'A#');

    pianoContainerEl.appendChild(whiteKey);
  });
}

function addBlackKey(parentKey, noteName) {
  const blackKey = document.createElement('div');
  blackKey.className = 'black-key';
  blackKey.dataset.note = noteName;
  blackKey.title = noteName;
  parentKey.appendChild(blackKey);
}

function highlightScaleOnPiano(scale) {
  const allKeys = pianoContainerEl.querySelectorAll('.white-key, .black-key');

  allKeys.forEach(key => {
    key.classList.remove('key-active');
  });

  allKeys.forEach(key => {
    const keyNote = key.dataset.note;
    if (scale.includes(keyNote)) {
      key.classList.add('key-active');
    }
  });
}

function buildCurrentScale() {
  const root = rootNoteEl.value;
  const type = scaleTypeEl.value;

  currentScale = getScale(root, type);
  renderPattern(type);
  renderScaleNotes(currentScale);
  highlightScaleOnPiano(currentScale);
  renderQuizPrompt();
}

function getQuizQuestion() {
  if (!currentScale.length) return null;

  const typeLabel = scaleTypeEl.value === 'major' ? 'major' : 'natural minor';
  const hiddenIndex = Math.floor(Math.random() * currentScale.length);
  const answer = currentScale[hiddenIndex];
  const promptScale = [...currentScale];
  promptScale[hiddenIndex] = '___';

  return {
    hiddenIndex,
    answer,
    promptScale,
    root: rootNoteEl.value,
    typeLabel
  };
}

function renderQuizPrompt() {
  if (!currentScale.length) {
    quizAreaEl.innerHTML = '<p>Build a scale first, then start practicing.</p>';
    return;
  }

  if (!currentQuiz) {
    quizAreaEl.innerHTML = '<p>Press <strong>Start Quiz</strong> to hide one note from the scale.</p>';
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
  if (!currentScale.length) {
    buildCurrentScale();
  }

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
    feedback.textContent = `Not quite. Try again.`;
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

buildScaleBtn.addEventListener('click', buildCurrentScale);
startQuizBtn.addEventListener('click', startQuiz);
scaleTypeEl.addEventListener('change', () => {
  renderPattern(scaleTypeEl.value);
});

createPiano();
renderPattern(scaleTypeEl.value);
renderScaleNotes([]);
quizAreaEl.innerHTML = '<p>Build a scale first, then start practicing.</p>';
