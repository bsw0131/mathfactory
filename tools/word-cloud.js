const wordInput = document.querySelector('#wordInput');
const maxWordsInput = document.querySelector('#maxWords');
const shapeSelect = document.querySelector('#shapeSelect');
const paletteSelect = document.querySelector('#paletteSelect');
const backgroundSelect = document.querySelector('#backgroundSelect');
const ignoreNumbers = document.querySelector('#ignoreNumbers');
const mergeCase = document.querySelector('#mergeCase');
const generateBtn = document.querySelector('#generateBtn');
const sampleBtn = document.querySelector('#sampleBtn');
const clearBtn = document.querySelector('#clearBtn');
const downloadBtn = document.querySelector('#downloadBtn');
const copyImageBtn = document.querySelector('#copyImageBtn');
const canvas = document.querySelector('#wordCloudCanvas');
const summary = document.querySelector('#wordSummary');
const keywordList = document.querySelector('#keywordList');
const ctx = canvas.getContext('2d');

const sampleText = `협력 소통 배려 성장 성장 성장 질문 질문 탐구 탐구 수학 수학 수학 몰입
학급 회의에서 학생들은 협력과 소통이 중요하다고 답했습니다.
서로 배려하는 분위기, 질문하는 수업, 즐겁게 탐구하는 시간이 기억에 남았습니다.
성장 성장 질문 배려 소통 도전 도전 자신감 자신감 배움 배움 배움`;

const palettes = {
  school: ['#071a44', '#0c7563', '#11a37f', '#4658ff', '#00b8a9', '#ff7a3d'],
  bright: ['#4053ff', '#00a894', '#ff5c8a', '#ff9f1c', '#7c3aed', '#10203f'],
  mono: ['#071a44', '#10203f', '#263858', '#42506c', '#0c7563']
};

const stopWords = new Set([
  '그리고', '그러나', '하지만', '또는', '으로', '에서', '에게', '까지', '부터', '보다', '처럼',
  '대한', '있는', '없는', '했다', '합니다', '된다', '되어', '너무', '정말', '아주', '많이',
  'the', 'and', 'for', 'with', 'that', 'this', 'are', 'was', 'were', 'you', 'your', 'have', 'has'
]);

let hasCloud = false;

generateBtn.addEventListener('click', generateCloud);
sampleBtn.addEventListener('click', () => {
  wordInput.value = sampleText;
  generateCloud();
});
clearBtn.addEventListener('click', resetAll);
downloadBtn.addEventListener('click', downloadPng);
copyImageBtn.addEventListener('click', copyImage);

renderEmptyCanvas();

function generateCloud() {
  const words = getWordCounts();
  if (words.length === 0) {
    hasCloud = false;
    renderEmptyCanvas('표시할 단어가 없습니다. 두 글자 이상의 단어를 입력해 주세요.');
    summary.textContent = '단어를 찾지 못했습니다. 입력 내용을 확인해 주세요.';
    keywordList.innerHTML = '';
    downloadBtn.disabled = true;
    copyImageBtn.disabled = true;
    return;
  }

  const placedWords = drawCloud(words);
  renderKeywordList(words);
  const total = words.reduce((sum, item) => sum + item.count, 0);
  summary.textContent = placedWords.length === words.length
    ? `총 ${total}개 단어를 분석해 상위 ${words.length}개 단어를 모두 워드클라우드에 표시했습니다.`
    : `총 ${total}개 단어를 분석해 상위 ${words.length}개 중 ${placedWords.length}개 단어를 워드클라우드에 표시했습니다. 단어가 너무 많거나 길면 일부는 이미지 안에 들어가지 않을 수 있습니다.`;
  hasCloud = placedWords.length > 0;
  downloadBtn.disabled = !hasCloud;
  copyImageBtn.disabled = !hasCloud || !navigator.clipboard || typeof ClipboardItem === 'undefined';
}

function getWordCounts() {
  const maxWords = clamp(Number(maxWordsInput.value) || 100, 10, 100);
  maxWordsInput.value = maxWords;
  const tokens = wordInput.value
    .replace(/[.,!?;:()[\]{}"'“”‘’·…]/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean)
    .map(token => mergeCase.checked ? token.toLowerCase() : token)
    .map(token => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(token => token.length >= 2)
    .filter(token => !stopWords.has(token))
    .filter(token => !ignoreNumbers.checked || !/^\d+$/.test(token));

  const counts = new Map();
  tokens.forEach(token => counts.set(token, (counts.get(token) || 0) + 1));
  return [...counts.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, 'ko'))
    .slice(0, maxWords);
}

function drawCloud(words) {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = 1000;
  const cssHeight = shapeSelect.value === 'circle' ? 760 : 640;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const ranges = getFontRanges(words.length);
  let bestLayout = [];
  for (const range of ranges) {
    const layout = buildLayout(words, cssWidth, cssHeight, range.min, range.max);
    if (layout.length > bestLayout.length) bestLayout = layout;
    if (layout.length === words.length) break;
  }

  paintBackground(cssWidth, cssHeight);
  const colors = palettes[paletteSelect.value] || palettes.school;
  bestLayout.forEach((item, index) => {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.angle);
    ctx.font = `900 ${item.fontSize}px 'Noto Sans KR', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillText(item.text, 0, 0);
    ctx.restore();
  });

  return bestLayout.map(item => ({ text: item.text, count: item.count }));
}

function getFontRanges(count) {
  if (count <= 20) return [{ min: 18, max: 82 }, { min: 14, max: 64 }, { min: 11, max: 48 }];
  if (count <= 40) return [{ min: 14, max: 56 }, { min: 11, max: 44 }, { min: 9, max: 34 }];
  if (count <= 70) return [{ min: 11, max: 42 }, { min: 9, max: 34 }, { min: 8, max: 28 }];
  return [{ min: 9, max: 34 }, { min: 8, max: 28 }, { min: 7, max: 23 }];
}

function buildLayout(words, width, height, minFont, maxFont) {
  const max = words[0].count;
  const min = words[words.length - 1].count;
  const placed = [];

  words.forEach((word, index) => {
    const ratio = max === min ? .55 : (word.count - min) / (max - min);
    const baseFontSize = Math.round(minFont + ratio * (maxFont - minFont));
    const angles = getAngles(index);
    const minAllowed = Math.max(7, Math.floor(minFont * .72));

    for (let fontSize = baseFontSize; fontSize >= minAllowed; fontSize -= 2) {
      for (const angle of angles) {
        const placement = findPlacement(word.text, fontSize, angle, placed, width, height);
        if (!placement) continue;
        placed.push({ ...placement.box, x: placement.x, y: placement.y, angle, fontSize, text: word.text, count: word.count });
        return;
      }
    }
  });

  return placed;
}

function findPlacement(text, fontSize, angle, placed, width, height) {
  ctx.font = `900 ${fontSize}px 'Noto Sans KR', system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const rawW = metrics.width + 10;
  const rawH = fontSize * 1.14 + 8;
  const boxW = Math.abs(Math.cos(angle)) * rawW + Math.abs(Math.sin(angle)) * rawH;
  const boxH = Math.abs(Math.sin(angle)) * rawW + Math.abs(Math.cos(angle)) * rawH;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * .48;

  for (let step = 0; step < 3500; step += 1) {
    const theta = step * .37;
    const radius = 2.55 * Math.sqrt(step);
    const x = centerX + Math.cos(theta) * radius * xScale();
    const y = centerY + Math.sin(theta) * radius * yScale();
    const box = { left: x - boxW / 2, right: x + boxW / 2, top: y - boxH / 2, bottom: y + boxH / 2 };

    if (box.left < 14 || box.right > width - 14 || box.top < 14 || box.bottom > height - 14) continue;
    if (!insideShape(x, y, boxW, boxH, centerX, centerY, maxRadius, width, height)) continue;
    if (placed.some(item => intersects(box, item))) continue;
    return { x, y, box };
  }
  return null;
}

function insideShape(x, y, boxW, boxH, centerX, centerY, radius, width, height) {
  const shape = shapeSelect.value;
  if (shape === 'wide') return true;
  const rx = shape === 'circle' ? radius : width * .47;
  const ry = shape === 'circle' ? radius : height * .43;
  const safeRx = Math.max(1, rx - boxW / 2);
  const safeRy = Math.max(1, ry - boxH / 2);
  const value = ((x - centerX) ** 2) / (safeRx ** 2) + ((y - centerY) ** 2) / (safeRy ** 2);
  return value <= 1;
}

function getAngles(index) {
  if (index < 8) return [0, -Math.PI / 18, Math.PI / 18, -Math.PI / 2, Math.PI / 2];
  return [chooseAngle(index), 0, -Math.PI / 18, Math.PI / 18, -Math.PI / 2, Math.PI / 2];
}

function chooseAngle(index) {
  const angles = [0, 0, -Math.PI / 18, Math.PI / 18, -Math.PI / 12, Math.PI / 12, -Math.PI / 2, Math.PI / 2];
  return angles[index % angles.length];
}

function xScale() {
  return shapeSelect.value === 'wide' ? 1.38 : 1;
}

function yScale() {
  return shapeSelect.value === 'wide' ? .82 : 1;
}

function intersects(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function paintBackground(width, height) {
  const background = backgroundSelect.value;
  ctx.clearRect(0, 0, width, height);
  if (background === 'transparent') return;
  ctx.fillStyle = background === 'soft' ? '#effcf9' : '#ffffff';
  ctx.fillRect(0, 0, width, height);
}

function renderKeywordList(words) {
  keywordList.innerHTML = words.map(word => (
    `<span class="keyword-chip">${escapeHtml(word.text)} <b>${word.count}</b></span>`
  )).join('');
}

function renderEmptyCanvas(message = 'WORD CLOUD') {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 1000 * dpr;
  canvas.height = 640 * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  paintBackground(1000, 640);
  ctx.fillStyle = '#dfe6f2';
  ctx.font = `900 72px 'Noto Sans KR', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, 500, 320);
}

function resetAll() {
  wordInput.value = '';
  maxWordsInput.value = 100;
  shapeSelect.value = 'oval';
  paletteSelect.value = 'school';
  backgroundSelect.value = 'white';
  ignoreNumbers.checked = true;
  mergeCase.checked = true;
  hasCloud = false;
  renderEmptyCanvas();
  summary.textContent = '단어를 입력한 뒤 생성 버튼을 누르면 이미지가 표시됩니다.';
  keywordList.innerHTML = '';
  downloadBtn.disabled = true;
  copyImageBtn.disabled = true;
}

function downloadPng() {
  if (!hasCloud) return;
  const link = document.createElement('a');
  link.download = `word-cloud-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function copyImage() {
  if (!hasCloud || !navigator.clipboard || typeof ClipboardItem === 'undefined') return;
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    const oldText = copyImageBtn.textContent;
    copyImageBtn.textContent = '복사 완료';
    window.setTimeout(() => { copyImageBtn.textContent = oldText; }, 1300);
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
