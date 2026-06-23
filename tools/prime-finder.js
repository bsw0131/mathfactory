const TOTAL_NUMBERS = 30;
const ROUND_SECONDS = 20;

let numbers = [];
let selected = new Set();
let timeLeft = ROUND_SECONDS;
let timerId = null;
let playing = false;
let finished = false;

const numberGrid = document.querySelector('#numberGrid');
const timeLeftText = document.querySelector('#timeLeft');
const timerBox = document.querySelector('#timerBox');
const message = document.querySelector('#message');
const startBtn = document.querySelector('#startBtn');
const newRoundBtn = document.querySelector('#newRoundBtn');
const selectedCount = document.querySelector('#selectedCount');
const primeCount = document.querySelector('#primeCount');
const scoreText = document.querySelector('#scoreText');
const resultList = document.querySelector('#resultList');

startBtn.addEventListener('click', startRound);
newRoundBtn.addEventListener('click', newRound);

newRound();

function newRound() {
  stopTimer();
  numbers = createNumberSet();
  selected = new Set();
  timeLeft = ROUND_SECONDS;
  playing = false;
  finished = false;
  startBtn.textContent = '시작';
  setMessage('시작 버튼을 누르면 20초 타이머가 시작됩니다.');
  resultList.innerHTML = '<div class="empty-result">아직 결과가 없습니다.</div>';
  renderAll();
}

function startRound() {
  if (playing) return;
  if (finished) {
    newRound();
  }

  playing = true;
  finished = false;
  startBtn.textContent = '진행 중';
  setMessage('소수라고 생각하는 숫자를 누르세요.', 'success');
  renderNumbers();

  timerId = setInterval(() => {
    timeLeft -= 1;
    renderStats();
    if (timeLeft <= 0) finishRound();
  }, 1000);
}

function finishRound() {
  stopTimer();
  playing = false;
  finished = true;
  startBtn.textContent = '다시 하기';
  setMessage('시간 종료! 결과를 확인해 보세요.', 'warn');
  renderAll();
  renderResult();
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function createNumberSet() {
  const primePool = range(2, 97).filter(isPrime);
  const compositePool = range(4, 99).filter(number => !isPrime(number));
  shuffle(primePool);
  shuffle(compositePool);

  const primeTarget = randomInt(10, 14);
  const picked = [
    ...primePool.slice(0, primeTarget),
    ...compositePool.slice(0, TOTAL_NUMBERS - primeTarget)
  ];

  return shuffle(picked).map((value, index) => ({ id: `${value}-${index}`, value }));
}

function toggleNumber(item) {
  if (!playing || finished) return;
  if (selected.has(item.id)) {
    selected.delete(item.id);
  } else {
    selected.add(item.id);
  }
  renderAll();
}

function renderAll() {
  renderNumbers();
  renderStats();
}

function renderNumbers() {
  numberGrid.innerHTML = numbers.map(item => {
    const prime = isPrime(item.value);
    const isSelected = selected.has(item.id);
    const classes = ['number-btn'];

    if (finished && prime && isSelected) classes.push('correct');
    else if (finished && !prime && isSelected) classes.push('wrong');
    else if (finished && prime && !isSelected) classes.push('missed');
    else if (isSelected) classes.push('selected');

    return `<button class="${classes.join(' ')}" type="button" data-id="${item.id}" ${finished ? 'disabled' : ''}>${item.value}</button>`;
  }).join('');

  numberGrid.querySelectorAll('.number-btn').forEach(button => {
    const item = numbers.find(number => number.id === button.dataset.id);
    button.addEventListener('click', () => toggleNumber(item));
  });
}

function renderStats() {
  const primes = numbers.filter(item => isPrime(item.value));
  const correct = numbers.filter(item => selected.has(item.id) && isPrime(item.value));
  const wrong = numbers.filter(item => selected.has(item.id) && !isPrime(item.value));

  timeLeftText.textContent = String(timeLeft);
  timerBox.classList.toggle('warning', timeLeft <= 5);
  selectedCount.textContent = String(selected.size);
  primeCount.textContent = String(primes.length);
  scoreText.textContent = String(Math.max(0, correct.length - wrong.length));
}

function renderResult() {
  const primes = numbers.filter(item => isPrime(item.value));
  const correct = numbers.filter(item => selected.has(item.id) && isPrime(item.value));
  const wrong = numbers.filter(item => selected.has(item.id) && !isPrime(item.value));
  const missed = numbers.filter(item => !selected.has(item.id) && isPrime(item.value));

  resultList.innerHTML = `
    <div class="result-row">
      <strong>맞힌 소수 ${correct.length}개</strong>
      <div class="result-numbers">${formatNumbers(correct)}</div>
    </div>
    <div class="result-row">
      <strong>놓친 소수 ${missed.length}개</strong>
      <div class="result-numbers">${formatNumbers(missed)}</div>
    </div>
    <div class="result-row">
      <strong>잘못 고른 수 ${wrong.length}개</strong>
      <div class="result-numbers">${formatNumbers(wrong)}</div>
    </div>
    <div class="result-row">
      <strong>전체 소수</strong>
      <div class="result-numbers">${formatNumbers(primes)}</div>
    </div>
  `;
}

function formatNumbers(items) {
  if (items.length === 0) return '없음';
  return items.map(item => item.value).sort((a, b) => a - b).join(', ');
}

function isPrime(number) {
  if (number < 2) return false;
  if (number === 2) return true;
  if (number % 2 === 0) return false;
  for (let divisor = 3; divisor * divisor <= number; divisor += 2) {
    if (number % divisor === 0) return false;
  }
  return true;
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function shuffle(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  return array;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message${type ? ` ${type}` : ''}`;
}
