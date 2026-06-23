let digitLength = 3;
let answer = [];
let history = [];
let solved = false;

const modeTitle = document.querySelector('#modeTitle');
const attemptCount = document.querySelector('#attemptCount');
const digitDisplay = document.querySelector('#digitDisplay');
const guessForm = document.querySelector('#guessForm');
const guessInput = document.querySelector('#guessInput');
const message = document.querySelector('#message');
const keypad = document.querySelector('#keypad');
const modeButtons = [...document.querySelectorAll('.mode-btn')];
const newGameBtn = document.querySelector('#newGameBtn');
const revealBtn = document.querySelector('#revealBtn');
const answerText = document.querySelector('#answerText');
const historyList = document.querySelector('#historyList');

startGame();
renderKeypad();

modeButtons.forEach(button => {
  button.addEventListener('click', () => {
    digitLength = Number(button.dataset.length);
    modeButtons.forEach(item => item.classList.toggle('active', item === button));
    startGame();
  });
});

newGameBtn.addEventListener('click', startGame);
revealBtn.addEventListener('click', revealAnswer);
guessInput.addEventListener('input', handleTyping);
guessForm.addEventListener('submit', submitGuess);

function startGame() {
  answer = createAnswer(digitLength);
  history = [];
  solved = false;
  guessInput.value = '';
  guessInput.maxLength = digitLength;
  modeTitle.textContent = `${digitLength}자리 숫자야구`;
  answerText.textContent = '숨김';
  setMessage('서로 다른 숫자를 입력하세요.');
  renderDigitDisplay();
  renderHistory();
  guessInput.focus();
}

function createAnswer(length) {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const picked = [];

  while (picked.length < length) {
    const index = Math.floor(Math.random() * digits.length);
    const [digit] = digits.splice(index, 1);
    if (picked.length === 0 && digit === '0') {
      digits.push(digit);
      continue;
    }
    picked.push(digit);
  }

  return picked;
}

function handleTyping() {
  guessInput.value = guessInput.value.replace(/\D/g, '').slice(0, digitLength);
  renderDigitDisplay();
}

function submitGuess(event) {
  event.preventDefault();
  if (solved) {
    setMessage('새 게임을 시작해 주세요.', 'warn');
    return;
  }

  const guess = guessInput.value.trim();
  const validation = validateGuess(guess);
  if (!validation.ok) {
    setMessage(validation.message, 'warn');
    return;
  }

  const result = judgeGuess(guess.split(''));
  history.unshift({ guess, ...result });
  guessInput.value = '';
  renderDigitDisplay();
  renderHistory();

  if (result.strikes === digitLength) {
    solved = true;
    answerText.textContent = answer.join('');
    setMessage(`${history.length}번 만에 정답입니다.`, 'success');
    return;
  }

  setMessage(`${result.strikes}S ${result.balls}B 입니다.`);
}

function validateGuess(guess) {
  if (guess.length !== digitLength) {
    return { ok: false, message: `${digitLength}자리 숫자를 입력하세요.` };
  }
  if (!/^\d+$/.test(guess)) {
    return { ok: false, message: '숫자만 입력할 수 있습니다.' };
  }
  if (guess[0] === '0') {
    return { ok: false, message: '첫 자리에는 0을 사용할 수 없습니다.' };
  }
  if (new Set(guess).size !== guess.length) {
    return { ok: false, message: '같은 숫자는 한 번만 사용할 수 있습니다.' };
  }
  if (history.some(item => item.guess === guess)) {
    return { ok: false, message: '이미 시도한 숫자입니다.' };
  }
  return { ok: true };
}

function judgeGuess(guessDigits) {
  let strikes = 0;
  let balls = 0;

  guessDigits.forEach((digit, index) => {
    if (answer[index] === digit) {
      strikes += 1;
      return;
    }
    if (answer.includes(digit)) {
      balls += 1;
    }
  });

  return { strikes, balls };
}

function renderDigitDisplay() {
  const typed = guessInput.value.split('');
  digitDisplay.innerHTML = Array.from({ length: 4 }, (_, index) => {
    const isActiveSlot = index < digitLength;
    const value = isActiveSlot ? typed[index] : '';
    return `<div class="digit-box${value ? '' : ' empty'}" aria-hidden="true">${isActiveSlot ? (value || '·') : ''}</div>`;
  }).join('');
}

function renderKeypad() {
  const keys = ['1','2','3','4','5','6','7','8','9','0','⌫','지우기'];
  keypad.innerHTML = keys.map(key => `<button class="key-btn" type="button" data-key="${key}">${key}</button>`).join('');
  keypad.querySelectorAll('.key-btn').forEach(button => {
    button.addEventListener('click', () => pressKey(button.dataset.key));
  });
}

function pressKey(key) {
  if (key === '⌫') {
    guessInput.value = guessInput.value.slice(0, -1);
  } else if (key === '지우기') {
    guessInput.value = '';
  } else if (guessInput.value.length < digitLength && !guessInput.value.includes(key)) {
    guessInput.value += key;
  }
  renderDigitDisplay();
  guessInput.focus();
}

function renderHistory() {
  attemptCount.textContent = String(history.length);

  if (history.length === 0) {
    historyList.innerHTML = '<div class="empty-history">아직 기록이 없습니다.</div>';
    return;
  }

  historyList.innerHTML = history.map((item, index) => {
    const no = history.length - index;
    const result = item.strikes === 0 && item.balls === 0
      ? '<span class="result-chip out">OUT</span>'
      : `<span class="result-chip">${item.strikes}S</span><span class="result-chip ball">${item.balls}B</span>`;

    return `
      <div class="history-item">
        <span class="history-no">${no}</span>
        <span class="history-guess">${item.guess}</span>
        <span class="history-result">${result}</span>
      </div>
    `;
  }).join('');
}

function revealAnswer() {
  answerText.textContent = answer.join('');
  setMessage('정답을 표시했습니다.', 'warn');
}

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message${type ? ` ${type}` : ''}`;
}
