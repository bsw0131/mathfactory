let prizeDoor = 0;
let selectedDoor = null;
let openedDoor = null;
let finalDoor = null;
let phase = 'choose';
let round = 1;
let totalPlays = 0;
let totalWins = 0;

const doorRow = document.querySelector('#doorRow');
const roundTitle = document.querySelector('#roundTitle');
const roundCount = document.querySelector('#roundCount');
const message = document.querySelector('#message');
const stayBtn = document.querySelector('#stayBtn');
const switchBtn = document.querySelector('#switchBtn');
const newRoundBtn = document.querySelector('#newRoundBtn');
const resetPlayBtn = document.querySelector('#resetPlayBtn');
const playTotal = document.querySelector('#playTotal');
const playWins = document.querySelector('#playWins');
const playRate = document.querySelector('#playRate');
const simButtons = [...document.querySelectorAll('[data-sim]')];
const customCount = document.querySelector('#customCount');
const customSimBtn = document.querySelector('#customSimBtn');
const simResult = document.querySelector('#simResult');

newRound();

stayBtn.addEventListener('click', () => finishRound(false));
switchBtn.addEventListener('click', () => finishRound(true));
newRoundBtn.addEventListener('click', newRound);
resetPlayBtn.addEventListener('click', resetPlayStats);
simButtons.forEach(button => {
  button.addEventListener('click', () => runSimulation(Number(button.dataset.sim)));
});
customSimBtn.addEventListener('click', () => {
  const count = Math.max(10, Math.min(100000, Number(customCount.value) || 500));
  customCount.value = String(count);
  runSimulation(count);
});

function newRound() {
  prizeDoor = randomDoor();
  selectedDoor = null;
  openedDoor = null;
  finalDoor = null;
  phase = 'choose';
  roundCount.textContent = String(round);
  roundTitle.textContent = '문 하나를 선택하세요';
  stayBtn.disabled = true;
  switchBtn.disabled = true;
  setMessage('상품이 숨겨진 문을 맞혀 보세요.');
  renderDoors();
}

function chooseDoor(index) {
  if (phase !== 'choose') return;
  selectedDoor = index;
  openedDoor = chooseHostDoor();
  phase = 'decide';
  roundTitle.textContent = '유지할까요, 바꿀까요?';
  stayBtn.disabled = false;
  switchBtn.disabled = false;
  setMessage(`${index + 1}번 문을 골랐습니다. 사회자가 ${openedDoor + 1}번 문을 열었습니다.`);
  renderDoors();
}

function finishRound(shouldSwitch) {
  if (phase !== 'decide') return;
  finalDoor = shouldSwitch ? [0, 1, 2].find(index => index !== selectedDoor && index !== openedDoor) : selectedDoor;
  const win = finalDoor === prizeDoor;
  phase = 'finished';
  totalPlays += 1;
  if (win) totalWins += 1;
  round += 1;
  stayBtn.disabled = true;
  switchBtn.disabled = true;
  roundTitle.textContent = win ? '성공!' : '아쉬워요';
  setMessage(`${shouldSwitch ? '문을 바꿔서' : '처음 선택을 유지해서'} ${win ? '상품을 찾았습니다.' : '상품을 놓쳤습니다.'}`, win ? 'success' : 'warn');
  renderDoors();
  renderPlayStats();
}

function chooseHostDoor() {
  const candidates = [0, 1, 2].filter(index => index !== selectedDoor && index !== prizeDoor);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function renderDoors() {
  doorRow.innerHTML = [0, 1, 2].map(index => {
    const classes = ['door-btn'];
    const opened = index === openedDoor;
    const final = phase === 'finished' && index === finalDoor;
    const prize = phase === 'finished' && index === prizeDoor;
    let face = '?';

    if (index === selectedDoor && phase !== 'finished') classes.push('selected');
    if (opened) classes.push('opened');
    if (final && finalDoor === prizeDoor) classes.push('final-win');
    if (final && finalDoor !== prizeDoor) classes.push('final-lose');
    if (phase === 'finished' && prize) face = '★';
    else if (opened || (phase === 'finished' && !prize)) face = '×';

    return `
      <button class="${classes.join(' ')}" type="button" data-door="${index}" ${phase === 'choose' ? '' : 'disabled'}>
        <span class="door-number">${index + 1}번 문</span>
        <span class="door-face">${face}</span>
      </button>
    `;
  }).join('');

  doorRow.querySelectorAll('.door-btn').forEach(button => {
    button.addEventListener('click', () => chooseDoor(Number(button.dataset.door)));
  });
}

function renderPlayStats() {
  playTotal.textContent = String(totalPlays);
  playWins.textContent = String(totalWins);
  playRate.textContent = totalPlays ? `${Math.round((totalWins / totalPlays) * 100)}%` : '0%';
}

function resetPlayStats() {
  totalPlays = 0;
  totalWins = 0;
  round = 1;
  renderPlayStats();
  newRound();
}

function runSimulation(count) {
  const stay = simulateStrategy(count, false);
  const change = simulateStrategy(count, true);
  simResult.innerHTML = `
    <div class="sim-grid">
      ${renderSimCard('처음 선택 유지', stay, count)}
      ${renderSimCard('다른 문으로 변경', change, count)}
    </div>
  `;
}

function renderSimCard(title, wins, count) {
  const rate = (wins / count) * 100;
  return `
    <div class="sim-card">
      <h4>${title}</h4>
      <strong>${rate.toFixed(1)}%</strong>
      <span>${count.toLocaleString()}번 중 ${wins.toLocaleString()}번 성공</span>
      <div class="bar-track"><div class="bar-fill" style="width:${rate}%"></div></div>
    </div>
  `;
}

function simulateStrategy(count, shouldSwitch) {
  let wins = 0;
  for (let i = 0; i < count; i += 1) {
    const prize = randomDoor();
    const firstPick = randomDoor();
    const hostOptions = [0, 1, 2].filter(index => index !== firstPick && index !== prize);
    const hostOpen = hostOptions[Math.floor(Math.random() * hostOptions.length)];
    const finalPick = shouldSwitch
      ? [0, 1, 2].find(index => index !== firstPick && index !== hostOpen)
      : firstPick;
    if (finalPick === prize) wins += 1;
  }
  return wins;
}

function randomDoor() {
  return Math.floor(Math.random() * 3);
}

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message${type ? ` ${type}` : ''}`;
}
