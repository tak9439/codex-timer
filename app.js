const timerRoot = document.querySelector('.timer');
const display = document.getElementById('display');
const startStopBtn = document.getElementById('start-stop');
const resetBtn = document.getElementById('reset');
const lapBtn = document.getElementById('lap');
const lapsList = document.getElementById('laps');
const modeButtons = document.querySelectorAll('[data-mode-button]');
const countdownForm = document.getElementById('countdown-form');
const minutesInput = document.getElementById('countdown-minutes');
const secondsInput = document.getElementById('countdown-seconds');
const countdownStatus = document.getElementById('countdown-status');
const setCountdownBtn = document.getElementById('set-countdown');
const presetFiveBtn = document.getElementById('preset-five');

const TICK_MS = 50;

let mode = 'countdown';
let timerId = null;
let startTime = 0;
let elapsed = 0;

let countdownDuration = 0;
let countdownRemaining = 0;
let countdownEndTime = 0;

function format(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const centis = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
  return `${minutes}:${seconds}.${centis}`;
}

function setDisplay(ms) {
  display.textContent = format(Math.max(ms, 0));
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function updateModeButtons() {
  modeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.modeButton === mode);
  });
}

function switchMode(nextMode) {
  if (mode === nextMode) return;
  stopTimer();
  mode = nextMode;
  timerRoot.dataset.mode = nextMode;
  startStopBtn.textContent = 'Start';

  if (mode === 'stopwatch') {
    countdownInputsDisabled(false);
    lapBtn.disabled = true;
    setDisplay(elapsed);
    resetBtn.disabled = elapsed === 0;
  } else {
    lapBtn.disabled = true;
    countdownInputsDisabled(false);
    const ms = countdownRemaining || countdownDuration;
    setDisplay(ms);
    resetBtn.disabled = ms === 0;
    updateCountdownStatus();
  }

  updateModeButtons();
}

function tickStopwatch() {
  setDisplay(Date.now() - startTime + elapsed);
}

function handleStopwatchToggle() {
  const running = Boolean(timerId);

  if (!running) {
    startTime = Date.now();
    timerId = setInterval(tickStopwatch, TICK_MS);
    tickStopwatch();
    startStopBtn.textContent = 'Stop';
    resetBtn.disabled = true;
    lapBtn.disabled = false;
  } else {
    stopTimer();
    elapsed += Date.now() - startTime;
    setDisplay(elapsed);
    startStopBtn.textContent = 'Start';
    resetBtn.disabled = elapsed === 0;
    lapBtn.disabled = true;
  }
}

function resetStopwatch() {
  stopTimer();
  elapsed = 0;
  startTime = 0;
  setDisplay(0);
  lapsList.innerHTML = '';
  startStopBtn.textContent = 'Start';
  resetBtn.disabled = true;
  lapBtn.disabled = true;
}

function addLap() {
  const li = document.createElement('li');
  li.innerHTML = `<span>Lap ${lapsList.children.length + 1}</span><span>${display.textContent}</span>`;
  lapsList.prepend(li);
}

function countdownInputsDisabled(state) {
  minutesInput.disabled = state;
  secondsInput.disabled = state;
  setCountdownBtn.disabled = state;
  presetFiveBtn.disabled = state;
}

function clampSeconds(value) {
  return Math.min(Math.max(value, 0), 59);
}

function readCountdownInputs() {
  const minutes = Math.max(0, parseInt(minutesInput.value, 10) || 0);
  const secondsRaw = Math.max(0, parseInt(secondsInput.value, 10) || 0);
  const seconds = clampSeconds(secondsRaw);

  minutesInput.value = minutes;
  secondsInput.value = seconds;

  return (minutes * 60 + seconds) * 1000;
}

function setCountdownDuration(ms) {
  countdownDuration = ms;
  countdownRemaining = ms;
  updateCountdownStatus();

  if (mode === 'countdown' && !timerId) {
    setDisplay(ms);
    resetBtn.disabled = ms === 0;
  }
}

function updateCountdownStatus() {
  countdownStatus.textContent = countdownDuration
    ? `セット: ${format(countdownDuration)}`
    : '未設定';
}

function tickCountdown() {
  countdownRemaining = Math.max(0, countdownEndTime - Date.now());
  setDisplay(countdownRemaining);

  if (countdownRemaining === 0) {
    finishCountdown();
  }
}

function startCountdown() {
  countdownEndTime = Date.now() + countdownRemaining;
  timerId = setInterval(tickCountdown, TICK_MS);
  tickCountdown();
  countdownInputsDisabled(true);
}

function finishCountdown() {
  stopTimer();
  startStopBtn.textContent = 'Start';
  countdownInputsDisabled(false);
  countdownRemaining = 0;
  setDisplay(0);
  countdownStatus.textContent = countdownDuration
    ? `完了: ${format(countdownDuration)}`
    : '未設定';
  resetBtn.disabled = countdownDuration === 0;
}

function handleCountdownToggle() {
  const running = Boolean(timerId);

  if (!running) {
    if (!countdownRemaining) {
      const total = readCountdownInputs();
      if (!total) {
        countdownStatus.textContent = '1秒以上を設定してください';
        return;
      }
      setCountdownDuration(total);
    }
    startCountdown();
    startStopBtn.textContent = 'Stop';
    resetBtn.disabled = true;
  } else {
    stopTimer();
    countdownRemaining = Math.max(0, countdownEndTime - Date.now());
    setDisplay(countdownRemaining);
    startStopBtn.textContent = 'Start';
    countdownInputsDisabled(false);
    resetBtn.disabled = countdownRemaining === 0 && countdownDuration === 0;
  }
}

function resetCountdown() {
  stopTimer();
  countdownRemaining = countdownDuration;
  setDisplay(countdownRemaining);
  startStopBtn.textContent = 'Start';
  countdownInputsDisabled(false);
  resetBtn.disabled = countdownDuration === 0;
  updateCountdownStatus();
}

startStopBtn.addEventListener('click', () => {
  if (mode === 'stopwatch') {
    handleStopwatchToggle();
  } else {
    handleCountdownToggle();
  }
});

resetBtn.addEventListener('click', () => {
  if (mode === 'stopwatch') {
    resetStopwatch();
  } else {
    resetCountdown();
  }
});

lapBtn.addEventListener('click', () => {
  if (mode === 'stopwatch' && !lapBtn.disabled) {
    addLap();
  }
});

modeButtons.forEach((button) => {
  button.addEventListener('click', () => switchMode(button.dataset.modeButton));
});

countdownForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const total = readCountdownInputs();

  if (!total) {
    countdownStatus.textContent = '1秒以上を設定してください';
    return;
  }

  setCountdownDuration(total);
});

presetFiveBtn.addEventListener('click', () => {
  minutesInput.value = 5;
  secondsInput.value = 0;
  setCountdownDuration(5 * 60 * 1000);
});

timerRoot.dataset.mode = mode;
countdownInputsDisabled(false);
setDisplay(countdownDuration || 0);
lapBtn.disabled = true;
resetBtn.disabled = countdownDuration === 0;
updateModeButtons();
updateCountdownStatus();
