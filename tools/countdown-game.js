const LARGE_NUMBERS = [25, 50, 75, 100];

let numbers = [25, 8, 4, 3, 2, 1];
let target = 137;
let timeLimit = 60;
let timeLeft = 60;
let timerId = null;
let running = false;
let bestCache = null;

const targetText = document.querySelector('#targetText');
const targetBoard = document.querySelector('#targetBoard');
const numberRow = document.querySelector('#numberRow');
const expressionInput = document.querySelector('#expressionInput');
const message = document.querySelector('#message');
const timeLeftText = document.querySelector('#timeLeft');
const timerBox = document.querySelector('#timerBox');
const myResult = document.querySelector('#myResult');
const myDiff = document.querySelector('#myDiff');
const bestResult = document.querySelector('#bestResult');
const bestExpression = document.querySelector('#bestExpression');

const timeInput = document.querySelector('#timeInput');
const countInput = document.querySelector('#countInput');
const largeCountInput = document.querySelector('#largeCountInput');
const smallMaxInput = document.querySelector('#smallMaxInput');
const targetMinInput = document.querySelector('#targetMinInput');
const targetMaxInput = document.querySelector('#targetMaxInput');
const customNumbersInput = document.querySelector('#customNumbersInput');
const customTargetInput = document.querySelector('#customTargetInput');

const checkBtn = document.querySelector('#checkBtn');
const startBtn = document.querySelector('#startBtn');
const randomGameBtn = document.querySelector('#randomGameBtn');
const applyCustomBtn = document.querySelector('#applyCustomBtn');
const solveBtn = document.querySelector('#solveBtn');
const resetExpressionBtn = document.querySelector('#resetExpressionBtn');
const clearBtn = document.querySelector('#clearBtn');
const backspaceBtn = document.querySelector('#backspaceBtn');

checkBtn.addEventListener('click', checkExpression);
startBtn.addEventListener('click', toggleTimer);
randomGameBtn.addEventListener('click', createRandomGame);
applyCustomBtn.addEventListener('click', applyCustomGame);
solveBtn.addEventListener('click', showSolution);
resetExpressionBtn.addEventListener('click', resetExpression);
clearBtn.addEventListener('click', resetExpression);
backspaceBtn.addEventListener('click', () => {
  expressionInput.value = expressionInput.value.slice(0, -1);
  expressionInput.focus();
  renderUsedNumbers();
});

expressionInput.addEventListener('input', renderUsedNumbers);
expressionInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') checkExpression();
});

document.querySelectorAll('.operator-pad [data-token]').forEach(button => {
  button.addEventListener('click', () => addToken(button.dataset.token));
});

document.querySelectorAll('.preset-btn').forEach(button => {
  button.addEventListener('click', () => applyPreset(button.dataset.preset));
});

renderGame();

function applyPreset(preset) {
  document.querySelectorAll('.preset-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.preset === preset);
  });

  if (preset === 'classic') {
    numbers = [25, 8, 4, 3, 2, 1];
    target = 137;
    timeLimit = 60;
    timeInput.value = '60';
    countInput.value = '6';
    largeCountInput.value = '1';
    smallMaxInput.value = '10';
    targetMinInput.value = '100';
    targetMaxInput.value = '999';
  }

  if (preset === 'easy') {
    numbers = [10, 9, 8, 7, 6, 5];
    target = 100;
    timeLimit = 90;
    timeInput.value = '90';
    countInput.value = '6';
    largeCountInput.value = '0';
    smallMaxInput.value = '10';
    targetMinInput.value = '50';
    targetMaxInput.value = '200';
  }

  if (preset === 'hard') {
    numbers = [100, 75, 9, 8, 6, 3];
    target = 843;
    timeLimit = 45;
    timeInput.value = '45';
    countInput.value = '6';
    largeCountInput.value = '2';
    smallMaxInput.value = '10';
    targetMinInput.value = '500';
    targetMaxInput.value = '999';
  }

  customNumbersInput.value = numbers.join(', ');
  customTargetInput.value = String(target);
  resetRound('설정이 적용되었습니다. 바로 도전해 보세요.');
}

function applyCustomGame() {
  const parsedNumbers = customNumbersInput.value
    .split(/[,\s]+/)
    .map(value => Number(value.trim()))
    .filter(value => Number.isInteger(value) && value > 0);
  const parsedTarget = Number(customTargetInput.value);
  const parsedTime = clamp(Number(timeInput.value), 10, 300, 60);

  if (parsedNumbers.length < 2 || parsedNumbers.length > 8) {
    setMessage('직접 숫자는 2개 이상 8개 이하로 입력해 주세요.', 'warn');
    return;
  }

  if (!Number.isInteger(parsedTarget) || parsedTarget < 1) {
    setMessage('목표 수는 1 이상의 정수로 입력해 주세요.', 'warn');
    return;
  }

  numbers = parsedNumbers;
  target = parsedTarget;
  timeLimit = parsedTime;
  resetRound('직접 입력한 문제를 적용했습니다.', 'success');
}

function createRandomGame() {
  const count = clamp(Number(countInput.value), 4, 7, 6);
  const largeCount = clamp(Number(largeCountInput.value), 0, Math.min(4, count), 1);
  const smallMax = clamp(Number(smallMaxInput.value), 5, 20, 10);
  const minTarget = clamp(Number(targetMinInput.value), 10, 999, 100);
  const maxTarget = clamp(Number(targetMaxInput.value), minTarget, 999, 999);

  timeLimit = clamp(Number(timeInput.value), 10, 300, 60);
  numbers = createNumberSet(count, largeCount, smallMax);
  target = randomInt(minTarget, maxTarget);
  customNumbersInput.value = numbers.join(', ');
  customTargetInput.value = String(target);
  resetRound('랜덤 문제가 만들어졌습니다.', 'success');
}

function createNumberSet(count, largeCount, smallMax) {
  const largePool = shuffle([...LARGE_NUMBERS]).slice(0, largeCount);
  const smallPool = Array.from({ length: Math.max(30, count * 6) }, () => randomInt(1, smallMax));
  return shuffle([...largePool, ...smallPool.slice(0, count - largeCount)]);
}

function resetRound(text = '숫자 카드를 눌러 식을 만들거나 직접 입력하세요.', type = '') {
  stopTimer();
  timeLeft = timeLimit;
  running = false;
  bestCache = null;
  expressionInput.value = '';
  startBtn.textContent = '타이머 시작';
  myResult.textContent = '-';
  myDiff.textContent = '식을 입력하면 결과가 표시됩니다.';
  bestResult.textContent = '준비됨';
  bestExpression.textContent = '정답 보기를 누르면 예시 식을 보여줍니다.';
  setMessage(text, type);
  renderGame();
}

function renderGame() {
  targetText.textContent = String(target);
  targetBoard.textContent = String(target);
  timeLeftText.textContent = String(timeLeft);
  timerBox.classList.toggle('warning', timeLeft <= 10);
  numberRow.style.gridTemplateColumns = `repeat(${Math.min(numbers.length, 6)}, minmax(0, 1fr))`;
  numberRow.innerHTML = numbers.map((number, index) => `
    <button class="number-card" type="button" data-index="${index}" data-value="${number}">${number}</button>
  `).join('');

  numberRow.querySelectorAll('.number-card').forEach(button => {
    button.addEventListener('click', () => addToken(button.dataset.value));
  });

  renderUsedNumbers();
}

function addToken(token) {
  expressionInput.value += token;
  expressionInput.focus();
  renderUsedNumbers();
}

function resetExpression() {
  expressionInput.value = '';
  myResult.textContent = '-';
  myDiff.textContent = '식을 입력하면 결과가 표시됩니다.';
  setMessage('식을 다시 입력해 보세요.');
  renderUsedNumbers();
}

function checkExpression() {
  const expression = normalizeExpression(expressionInput.value);
  if (!expression) {
    setMessage('식을 먼저 입력해 주세요.', 'warn');
    return;
  }

  const validation = validateExpression(expression);
  if (!validation.ok) {
    setMessage(validation.message, 'warn');
    return;
  }

  const value = evaluateExpression(expression);
  if (!Number.isFinite(value)) {
    setMessage('계산할 수 없는 식입니다. 0으로 나누었는지 확인해 주세요.', 'warn');
    return;
  }

  const rounded = roundValue(value);
  const diff = roundValue(Math.abs(rounded - target));
  myResult.textContent = String(rounded);
  myDiff.textContent = diff === 0 ? '정확히 맞았습니다!' : `목표 수와의 차이: ${diff}`;
  setMessage(diff === 0 ? '완벽합니다. 목표 수를 정확히 만들었어요!' : `좋아요. 현재 결과는 ${rounded}, 차이는 ${diff}입니다.`, diff === 0 ? 'success' : '');
}

function normalizeExpression(expression) {
  return expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
}

function validateExpression(expression) {
  if (!/^[0-9+\-*/()]+$/.test(expression)) {
    return { ok: false, message: '숫자, 괄호, 사칙연산 기호만 사용할 수 있습니다.' };
  }

  if (expression.includes('**')) {
    return { ok: false, message: '거듭제곱은 사용할 수 없습니다. 사칙연산만 사용해 주세요.' };
  }

  const used = expression.match(/\d+/g)?.map(Number) || [];
  if (used.length === 0) return { ok: false, message: '숫자를 최소 1개 이상 사용해 주세요.' };

  const availableCounts = countValues(numbers);
  const usedCounts = countValues(used);
  for (const [value, count] of usedCounts.entries()) {
    if ((availableCounts.get(value) || 0) < count) {
      return { ok: false, message: `${value}은(는) 주어진 횟수보다 많이 사용할 수 없습니다.` };
    }
  }

  try {
    evaluateExpression(expression);
  } catch (error) {
    return { ok: false, message: '식의 괄호나 연산 순서를 확인해 주세요.' };
  }

  return { ok: true };
}

function evaluateExpression(expression) {
  return Function(`"use strict"; return (${expression});`)();
}

function renderUsedNumbers() {
  const used = normalizeExpression(expressionInput.value).match(/\d+/g)?.map(Number) || [];
  const usedByIndex = new Set();
  const remainingIndexes = new Map();

  numbers.forEach((value, index) => {
    if (!remainingIndexes.has(value)) remainingIndexes.set(value, []);
    remainingIndexes.get(value).push(index);
  });

  used.forEach(value => {
    const indexes = remainingIndexes.get(value);
    if (indexes?.length) usedByIndex.add(indexes.shift());
  });

  numberRow.querySelectorAll('.number-card').forEach(button => {
    button.classList.toggle('used', usedByIndex.has(Number(button.dataset.index)));
  });
}

function toggleTimer() {
  if (running) {
    stopTimer();
    setMessage('타이머를 잠시 멈췄습니다. 다시 누르면 이어서 진행됩니다.');
    return;
  }

  if (timeLeft <= 0) timeLeft = timeLimit;
  running = true;
  startBtn.textContent = '일시정지';
  setMessage('시간이 흐르고 있습니다. 목표 수에 최대한 가까운 식을 만들어 보세요.', 'success');
  timerId = setInterval(() => {
    timeLeft -= 1;
    timeLeftText.textContent = String(timeLeft);
    timerBox.classList.toggle('warning', timeLeft <= 10);
    if (timeLeft <= 0) {
      stopTimer();
      setMessage('시간 종료! 만든 식을 확인해 보세요.', 'warn');
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
  running = false;
  startBtn.textContent = '타이머 시작';
}

function showSolution() {
  bestResult.textContent = '계산 중';
  bestExpression.textContent = '가능한 식을 찾고 있습니다.';
  window.setTimeout(() => {
    bestCache = bestCache || solveCountdown(numbers, target);
    bestResult.textContent = `${bestCache.value} (차이 ${bestCache.diff})`;
    bestExpression.textContent = bestCache.expression || '가능한 식을 찾지 못했습니다.';
  }, 20);
}

function solveCountdown(sourceNumbers, goal) {
  let best = { value: sourceNumbers[0], expression: String(sourceNumbers[0]), diff: Math.abs(sourceNumbers[0] - goal) };
  const seen = new Set();
  const initial = sourceNumbers.map((value, index) => ({ value, expression: String(value), key: `${value}:${index}` }));

  search(initial);
  return { ...best, value: roundValue(best.value), diff: roundValue(best.diff) };

  function search(items) {
    items.forEach(item => updateBest(item));
    if (best.diff === 0 || items.length < 2) return;

    const stateKey = items.map(item => roundValue(item.value)).sort((a, b) => a - b).join('|');
    if (seen.has(stateKey)) return;
    seen.add(stateKey);

    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const rest = items.filter((_, index) => index !== i && index !== j);
        const nextItems = combine(items[i], items[j]);
        for (const next of nextItems) {
          if (!Number.isFinite(next.value)) continue;
          if (Math.abs(next.value) > 100000) continue;
          search([...rest, next]);
          if (best.diff === 0) return;
        }
      }
    }
  }

  function updateBest(item) {
    const diff = Math.abs(item.value - goal);
    if (diff < best.diff || (diff === best.diff && item.expression.length < best.expression.length)) {
      best = { value: item.value, expression: item.expression, diff };
    }
  }
}

function combine(a, b) {
  const results = [
    { value: a.value + b.value, expression: `(${a.expression}+${b.expression})` },
    { value: a.value * b.value, expression: `(${a.expression}×${b.expression})` },
    { value: a.value - b.value, expression: `(${a.expression}-${b.expression})` },
    { value: b.value - a.value, expression: `(${b.expression}-${a.expression})` }
  ];

  if (b.value !== 0) results.push({ value: a.value / b.value, expression: `(${a.expression}÷${b.expression})` });
  if (a.value !== 0) results.push({ value: b.value / a.value, expression: `(${b.expression}÷${a.expression})` });
  return results;
}

function countValues(values) {
  const map = new Map();
  values.forEach(value => map.set(value, (map.get(value) || 0) + 1));
  return map;
}

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  return array;
}

function roundValue(value) {
  return Number.isInteger(value) ? value : Number(value.toFixed(3));
}

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message${type ? ` ${type}` : ''}`;
}