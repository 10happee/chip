const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const roll = document.getElementById('piano-roll');
const tempoInput = document.getElementById('tempo');
const instrumentSelect = document.getElementById('instrument');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');

const steps = 32;
const pitches = 16;
const cellSize = 32;

let isPlaying = false;
let intervalId = null;
let currentStep = 0;

const notes = []; // { pitch, startStep, duration }

function createRoll() {
  roll.style.position = 'relative';
  for (let row = 0; row < pitches; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.style.position = 'absolute';
    rowDiv.style.top = `${row * cellSize}px`;
    rowDiv.style.left = '0';
    rowDiv.style.height = `${cellSize - 1}px`;
    rowDiv.style.width = `${steps * cellSize}px`;
    rowDiv.style.borderBottom = '1px solid #333';

    for (let col = 0; col < steps; col++) {
      const cell = document.createElement('div');
      cell.classList.add('absolute');
      cell.style.top = '0';
      cell.style.left = `${col * cellSize}px`;
      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener('click', () => toggleNote(row, col));
      rowDiv.appendChild(cell);
    }

    roll.appendChild(rowDiv);
  }
}

function toggleNote(pitch, step) {
  const existing = notes.find(n => n.pitch === pitch && step >= n.startStep && step < n.startStep + n.duration);
  if (existing) {
    notes.splice(notes.indexOf(existing), 1);
  } else {
    notes.push({ pitch, startStep: step, duration: 1 });
  }
  renderNotes();
}

function renderNotes() {
  // Remove all existing note divs
  [...roll.querySelectorAll('.note')].forEach(el => el.remove());

  for (let note of notes) {
    const noteDiv = document.createElement('div');
    noteDiv.classList.add('note');
    noteDiv.style.top = `${note.pitch * cellSize}px`;
    noteDiv.style.left = `${note.startStep * cellSize}px`;
    noteDiv.style.width = `${note.duration * cellSize}px`;

    const resizeHandle = document.createElement('div');
    resizeHandle.classList.add('note-resize');
    noteDiv.appendChild(resizeHandle);

    let isDragging = false;
    let startX = 0;

    resizeHandle.onmousedown = e => {
      e.stopPropagation();
      isDragging = true;
      startX = e.clientX;
      document.onmousemove = e2 => {
        if (!isDragging) return;
        const dx = Math.floor((e2.clientX - startX) / cellSize);
        note.duration = Math.max(1, note.duration + dx);
        renderNotes();
        startX = e2.clientX;
      };
      document.onmouseup = () => {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };

    roll.appendChild(noteDiv);
  }
}

function playNote(pitch, waveType) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  if (waveType === 'custom') {
    const real = new Float32Array([0, 1, 0.5]);
    const imag = new Float32Array([0, 0, 0.5]);
    osc.setPeriodicWave(audioCtx.createPeriodicWave(real, imag));
  } else {
    osc.type = waveType;
  }

  const frequency = 440 * Math.pow(2, (pitch - 8) / 12); // middle C around 8
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

function playSequence() {
  const bpm = parseInt(tempoInput.value);
  const interval = (60 / bpm) * 1000 / 4;

  intervalId = setInterval(() => {
    for (let note of notes) {
      if (note.startStep === currentStep) {
        playNote(note.pitch, instrumentSelect.value);
      }
    }

    currentStep = (currentStep + 1) % steps;
  }, interval);
}

playBtn.onclick = () => {
  if (!isPlaying) {
    isPlaying = true;
    audioCtx.resume();
    playSequence();
  }
};

stopBtn.onclick = () => {
  isPlaying = false;
  clearInterval(intervalId);
  currentStep = 0;
};

createRoll();
