// FILE: piano.js

export const NOTE_LIST = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_TO_PC = new Map(NOTE_LIST.map((note, index) => [note, index]));

const TRANSIENT_STATE_CLASSES = [
  'questionNote',
  'selectedCorrect',
  'selectedWrong',
  'completedKey',
  'targetKey',
  'multiTarget'
];

const PERSISTENT_STATE_CLASSES = [
  'shaded',
  'inScale'
];

function getAllKeys(pianoKeyboard) {
  if (!pianoKeyboard) return [];
  return [...pianoKeyboard.querySelectorAll('.pianoKey')];
}

function clearClasses(keys, classNames) {
  keys.forEach(key => {
    key.classList.remove(...classNames);
  });
}

function normalizeNotes(notes) {
  if (!Array.isArray(notes)) return new Set();
  return new Set(notes.filter(Boolean));
}

export function generatePianoKeys(pianoKeyboard, options = {}) {
  if (!pianoKeyboard) return;

  const { fullRange = false, octaveCount = 2, whiteKeyPixelWidth = null } = options;

  pianoKeyboard.innerHTML = '';
  pianoKeyboard.style.width = '';
  pianoKeyboard.style.minWidth = '';
  pianoKeyboard.style.position = 'relative';

  if (fullRange) {
    const startMidi = 21;
    const endMidi = 108;
    const isBlackPitchClass = new Set([1, 3, 6, 8, 10]);

    let whiteKeyCount = 0;
    for (let midi = startMidi; midi <= endMidi; midi += 1) {
      const pitchClass = ((midi % 12) + 12) % 12;
      if (!isBlackPitchClass.has(pitchClass)) whiteKeyCount += 1;
    }

    const whiteKeyWidth = 100 / whiteKeyCount;
    let whiteKeyIndex = 0;

    for (let midi = startMidi; midi <= endMidi; midi += 1) {
      const pitchClass = ((midi % 12) + 12) % 12;
      const noteName = NOTE_LIST[pitchClass];
      const octave = Math.floor(midi / 12) - 1;
      const isBlack = isBlackPitchClass.has(pitchClass);

      if (!isBlack) {
        const leftPosition = whiteKeyIndex * whiteKeyWidth;
        const whiteKey = document.createElement('button');
        whiteKey.type = 'button';
        whiteKey.className = 'pianoKey white';
        whiteKey.dataset.note = noteName;
        whiteKey.dataset.octave = String(octave);
        whiteKey.style.position = 'absolute';
        whiteKey.style.left = `${leftPosition}%`;
        whiteKey.style.width = `${whiteKeyWidth}%`;
        whiteKey.style.height = '100%';
        whiteKey.style.top = '0';
        whiteKey.title = `${noteName}${octave}`;
        whiteKey.setAttribute('aria-label', `${noteName}${octave}`);
        pianoKeyboard.appendChild(whiteKey);
        whiteKeyIndex += 1;
      } else {
        const blackLeft = (whiteKeyIndex - 1) * whiteKeyWidth + whiteKeyWidth * 0.75;
        const blackKey = document.createElement('button');
        blackKey.type = 'button';
        blackKey.className = 'pianoKey black';
        blackKey.dataset.note = noteName;
        blackKey.dataset.octave = String(octave);
        blackKey.style.position = 'absolute';
        blackKey.style.left = `${blackLeft}%`;
        blackKey.style.width = `${whiteKeyWidth * 0.5}%`;
        blackKey.style.height = '60%';
        blackKey.style.top = '0';
        blackKey.title = `${noteName}${octave}`;
        blackKey.setAttribute('aria-label', `${noteName}${octave}`);
        pianoKeyboard.appendChild(blackKey);
      }
    }

    return;
  }

  const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const hasBlackAfter = [true, true, false, true, true, true, false];
  const whiteKeyCount = whiteNotes.length * octaveCount;
  const whiteKeyWidth = 100 / whiteKeyCount;

  if (whiteKeyPixelWidth) {
    const keyboardWidthPx = whiteKeyCount * whiteKeyPixelWidth;
    pianoKeyboard.style.width = `${keyboardWidthPx}px`;
    pianoKeyboard.style.minWidth = `${keyboardWidthPx}px`;
  }

  let whiteKeyIndex = 0;

  for (let octave = 0; octave < octaveCount; octave += 1) {
    for (let i = 0; i < whiteNotes.length; i += 1) {
      const noteName = whiteNotes[i];
      const leftPosition = whiteKeyIndex * whiteKeyWidth;

      const whiteKey = document.createElement('button');
      whiteKey.type = 'button';
      whiteKey.className = 'pianoKey white';
      whiteKey.dataset.note = noteName;
      whiteKey.dataset.octave = String(octave);
      whiteKey.style.position = 'absolute';
      whiteKey.style.left = `${leftPosition}%`;
      whiteKey.style.width = `${whiteKeyWidth}%`;
      whiteKey.style.height = '100%';
      whiteKey.style.top = '0';
      whiteKey.title = `${noteName}${octave}`;
      whiteKey.setAttribute('aria-label', `${noteName}${octave}`);
      pianoKeyboard.appendChild(whiteKey);

      if (hasBlackAfter[i]) {
        const blackKey = document.createElement('button');
        blackKey.type = 'button';
        blackKey.className = 'pianoKey black';
        const whiteNotePC = NOTE_TO_PC.get(noteName);
        const blackNotePC = (whiteNotePC + 1) % 12;
        const blackNoteName = NOTE_LIST[blackNotePC];
        blackKey.dataset.note = blackNoteName;
        blackKey.dataset.octave = String(octave);
        blackKey.style.position = 'absolute';
        blackKey.style.left = `${leftPosition + whiteKeyWidth * 0.75}%`;
        blackKey.style.width = `${whiteKeyWidth * 0.5}%`;
        blackKey.style.height = '60%';
        blackKey.style.top = '0';
        blackKey.title = `${blackNoteName}${octave}`;
        blackKey.setAttribute('aria-label', `${blackNoteName}${octave}`);
        pianoKeyboard.appendChild(blackKey);
      }

      whiteKeyIndex += 1;
    }
  }
}

export function updatePianoVisualization(pianoKeyboard, rootKey, scaleType, SCALE_TYPES, pcToNote) {
  if (!pianoKeyboard || !rootKey || !scaleType || !SCALE_TYPES || typeof pcToNote !== 'function') {
    return;
  }

  const scale = SCALE_TYPES[scaleType];
  if (!scale) return;

  const rootPC = NOTE_TO_PC.get(rootKey);
  if (rootPC === undefined) return;

  const scaleNotes = new Set();
  const noteDegrees = new Map();

  scale.forEach((offset, index) => {
    const notePitchClass = (rootPC + offset) % 12;
    const noteName = pcToNote(notePitchClass);
    scaleNotes.add(noteName);
    noteDegrees.set(noteName, String(index + 1));
  });

  const keys = getAllKeys(pianoKeyboard);
  keys.forEach(key => {
    const note = key.dataset.note;
    key.classList.remove(...PERSISTENT_STATE_CLASSES, ...TRANSIENT_STATE_CLASSES);
    key.dataset.scaleLabel = '';
    key.dataset.degree = '';

    if (scaleNotes.has(note)) {
      key.classList.add('inScale');
      key.dataset.scaleLabel = note;
      key.dataset.degree = noteDegrees.get(note) || '';
    } else {
      key.classList.add('shaded');
    }
  });
}

export function resetRoundStates(pianoKeyboard, options = {}) {
  const { keepScaleState = true } = options;
  const keys = getAllKeys(pianoKeyboard);
  clearClasses(keys, TRANSIENT_STATE_CLASSES);

  if (!keepScaleState) {
    clearClasses(keys, PERSISTENT_STATE_CLASSES);
    keys.forEach(key => {
      key.dataset.scaleLabel = '';
      key.dataset.degree = '';
    });
  }
}

export function highlightQuestionNote(pianoKeyboard, questionNote) {
  if (!pianoKeyboard || !questionNote) return;
  const keys = getAllKeys(pianoKeyboard);
  keys.forEach(key => {
    key.classList.remove('questionNote', 'targetKey');
    if (key.dataset.note === questionNote) {
      key.classList.add('questionNote', 'targetKey');
    }
  });
}

export function setTargetKey(pianoKeyboard, noteName) {
  if (!pianoKeyboard || !noteName) return;
  const keys = getAllKeys(pianoKeyboard);
  keys.forEach(key => {
    key.classList.remove('targetKey');
    if (key.dataset.note === noteName) {
      key.classList.add('targetKey');
    }
  });
}

export function setTargetKeys(pianoKeyboard, noteNames = []) {
  if (!pianoKeyboard) return;
  const targets = normalizeNotes(noteNames);
  const keys = getAllKeys(pianoKeyboard);
  keys.forEach(key => {
    key.classList.remove('multiTarget', 'targetKey');
    if (targets.has(key.dataset.note)) {
      key.classList.add('multiTarget', 'targetKey');
    }
  });
}

export function clearQuestionHighlight(pianoKeyboard) {
  if (!pianoKeyboard) return;
  const keys = getAllKeys(pianoKeyboard);
  keys.forEach(key => {
    key.classList.remove('questionNote', 'targetKey', 'multiTarget');
  });
}

export function clearSelectionFeedback(pianoKeyboard) {
  if (!pianoKeyboard) return;
  const keys = getAllKeys(pianoKeyboard);
  keys.forEach(key => {
    key.classList.remove('selectedCorrect', 'selectedWrong');
  });
}

export function markSelectedKey(pianoKeyboard, noteName, isCorrect) {
  if (!pianoKeyboard || !noteName) return;
  const keys = getAllKeys(pianoKeyboard);
  keys.forEach(key => {
    if (key.dataset.note === noteName) {
      key.classList.remove('selectedCorrect', 'selectedWrong');
      key.classList.add(isCorrect ? 'selectedCorrect' : 'selectedWrong');
    }
  });
}

export function setWrongKey(pianoKeyboard, noteName) {
  if (!pianoKeyboard || !noteName) return;
  markSelectedKey(pianoKeyboard, noteName, false);
}

export function setCorrectKey(pianoKeyboard, noteName) {
  if (!pianoKeyboard || !noteName) return;
  markSelectedKey(pianoKeyboard, noteName, true);
}

export function setCompletedKey(pianoKeyboard, noteName) {
  if (!pianoKeyboard || !noteName) return;
  const keys = getAllKeys(pianoKeyboard);
  keys.forEach(key => {
    if (key.dataset.note === noteName) {
      key.classList.add('completedKey');
      key.classList.remove('selectedWrong');
    }
  });
}

export function lockCompletedKeys(pianoKeyboard, noteNames = []) {
  if (!pianoKeyboard) return;
  const completed = normalizeNotes(noteNames);
  const keys = getAllKeys(pianoKeyboard);
  keys.forEach(key => {
    key.classList.remove('completedKey');
    if (completed.has(key.dataset.note)) {
      key.classList.add('completedKey');
    }
  });
}

export function attachPianoNoteHandlers(pianoKeyboard, onNoteSelect) {
  if (!pianoKeyboard || typeof onNoteSelect !== 'function') return;

  pianoKeyboard.addEventListener('click', event => {
    const key = event.target.closest('.pianoKey');
    if (!key || !pianoKeyboard.contains(key)) return;

    onNoteSelect({
      note: key.dataset.note,
      octave: key.dataset.octave,
      element: key
    });
  });
}
