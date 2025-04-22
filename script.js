const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

let isPlaying = false;
let currentStep = 0;
let intervalId;

const steps = 16;
const tempoInput = document.getElementById('tempo');
const instrumentSelect = document.getElementById('instrument');

const grid = document.getElementById('grid');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');

const notes = Array(steps).fill(false);

function createGrid() {
  for (let i = 0; i < steps; i++) {
    const btn = document.createElement('button');
    btn.className = 'w-8 h-8 border rounded bg-gray-700 hover:bg-gray-600';
    btn.dataset.index = i;
    btn.onclick = () => {
      notes[i] = !notes[i];
      btn.classList.toggle('bg-yellow-400', notes[i]);
      btn.classList.toggle('bg-gray-700', !notes[i]);
    };
    grid.appendChild(btn);
  }
}

function playNote(waveType) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  if (waveType === 'custom') {
    const real = new Float32Array([0, 1, 0.5]);
    const imag = new Float32Array([0, 0, 0.5]);
    osc.setPeriodicWave(audioCtx.createPeriodicWave(real, imag));
  } else {
    osc.type = waveType;
  }

  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

function playSequence() {
  const bpm = parseInt(tempoInput.value);
  const interval = (60 / bpm) * 1000;

  intervalId = setInterval(() => {
    if (notes[currentStep]) {
      playNote(instrumentSelect.value);
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

createGrid();
