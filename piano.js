// FILE: piano.js

export const NOTE_LIST = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_TO_PC = new Map(NOTE_LIST.map((note, index) => [note, index]));

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

  const keys = pianoKeyboard.querySelectorAll('.pianoKey');
  keys.forEach(key => {
    const note = key.dataset.note;
    key.classList.remove('shaded', 'inScale', 'questionNote', 'selectedCorrect', 'selectedWrong');
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

export function highlightQuestionNote(pianoKeyboard, questionNote) {
  if (!pianoKeyboard || !questionNote) return;
  const keys = pianoKeyboard.querySelectorAll('.pianoKey');
  keys.forEach(key => {
    key.classList.remove('questionNote');
    if (key.dataset.note === questionNote) {
      key.classList.add('questionNote');
    }
  });
}

export function clearQuestionHighlight(pianoKeyboard) {
  if (!pianoKeyboard) return;
  const keys = pianoKeyboard.querySelectorAll('.pianoKey');
  keys.forEach(key => {
    key.classList.remove('questionNote');
  });
}

export function clearSelectionFeedback(pianoKeyboard) {
  if (!pianoKeyboard) return;
  const keys = pianoKeyboard.querySelectorAll('.pianoKey');
  keys.forEach(key => {
    key.classList.remove('selectedCorrect', 'selectedWrong');
  });
}

export function markSelectedKey(pianoKeyboard, noteName, isCorrect) {
  if (!pianoKeyboard || !noteName) return;
  const keys = pianoKeyboard.querySelectorAll('.pianoKey');
  keys.forEach(key => {
    if (key.dataset.note === noteName) {
      key.classList.remove('selectedCorrect', 'selectedWrong');
      key.classList.add(isCorrect ? 'selectedCorrect' : 'selectedWrong');
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
