const templateConfigs = [
  {
    id: 'circle',
    name: '원형 도안',
    guide: 'circle',
    defaultCount: 64,
    minCount: 16,
    maxCount: 160,
    threadRatio: .27,
    center: true,
    makePoints: count => makeCirclePoints(count, 360, 360, 284)
  },
  {
    id: 'grid',
    name: '격자 도안',
    guide: 'grid',
    defaultCount: 92,
    minCount: 24,
    maxCount: 180,
    threadRatio: .13,
    center: false,
    makePoints: count => makeGridPoints(count)
  },
  {
    id: 'heart',
    name: '하트 도안',
    guide: 'polyline',
    defaultCount: 72,
    minCount: 24,
    maxCount: 160,
    threadRatio: .32,
    center: true,
    makePoints: count => makeHeartPoints(count)
  },
  {
    id: 'star',
    name: '별 도안',
    guide: 'polyline',
    defaultCount: 60,
    minCount: 20,
    maxCount: 150,
    threadRatio: .40,
    center: true,
    makePoints: count => makeStarPoints(count)
  },
  {
    id: 'spiral',
    name: '나선형 도안',
    guide: 'polyline',
    defaultCount: 78,
    minCount: 24,
    maxCount: 180,
    threadRatio: .10,
    center: true,
    makePoints: count => makeSpiralPoints(count)
  }
];

const pointCounts = Object.fromEntries(
  templateConfigs.map(template => [template.id, template.defaultCount])
);

let selectedConfig = templateConfigs[0];
let selectedTemplate = buildTemplate(selectedConfig);

const templateList = document.querySelector('#templateList');
const artBoard = document.querySelector('#artBoard');
const templateTitle = document.querySelector('#templateTitle');
const templateMeta = document.querySelector('#templateMeta');
const pointCountInput = document.querySelector('#pointCountInput');
const pointCountRange = document.querySelector('#pointCountRange');
const applyPointCountBtn = document.querySelector('#applyPointCountBtn');
const resetPointCountBtn = document.querySelector('#resetPointCountBtn');
const pointCountHelp = document.querySelector('#pointCountHelp');
const showGuide = document.querySelector('#showGuide');
const showThreads = document.querySelector('#showThreads');
const showNumbers = document.querySelector('#showNumbers');
const showCenter = document.querySelector('#showCenter');
const downloadSvgBtn = document.querySelector('#downloadSvgBtn');
const printBtn = document.querySelector('#printBtn');

renderTemplateButtons();
syncPointControls();
renderSelectedTemplate();

[showGuide, showThreads, showNumbers, showCenter].forEach(input => {
  input.addEventListener('change', renderSelectedTemplate);
});

pointCountInput.addEventListener('input', () => {
  const count = Number(pointCountInput.value);
  if (Number.isFinite(count)) {
    pointCountRange.value = String(clampCount(count, selectedConfig));
  }
});
pointCountInput.addEventListener('change', applyPointCount);
pointCountRange.addEventListener('input', () => {
  pointCountInput.value = pointCountRange.value;
  applyPointCount();
});
applyPointCountBtn.addEventListener('click', applyPointCount);
resetPointCountBtn.addEventListener('click', resetPointCount);
downloadSvgBtn.addEventListener('click', downloadSvg);
printBtn.addEventListener('click', () => window.print());

function renderTemplateButtons() {
  templateList.innerHTML = templateConfigs.map(config => {
    const template = buildTemplate(config);
    return `
      <button class="template-card${config.id === selectedConfig.id ? ' active' : ''}" type="button" data-template-id="${config.id}">
        <span class="template-thumb" aria-hidden="true">${createSvg(template, { thumbnail: true })}</span>
        <span>
          <span class="template-name">${config.name}</span>
          <span class="template-detail">${template.points.length}점 · ${difficultyLabel(template.points.length, config)}</span>
        </span>
      </button>
    `;
  }).join('');

  templateList.querySelectorAll('.template-card').forEach(button => {
    button.addEventListener('click', () => {
      selectedConfig = templateConfigs.find(template => template.id === button.dataset.templateId);
      selectedTemplate = buildTemplate(selectedConfig);
      renderTemplateButtons();
      syncPointControls();
      renderSelectedTemplate();
    });
  });
}

function renderSelectedTemplate() {
  selectedTemplate = buildTemplate(selectedConfig);
  templateTitle.textContent = selectedTemplate.name;
  artBoard.innerHTML = createSvg(selectedTemplate, getOptions());
  templateMeta.innerHTML = `
    <div class="meta-chip"><strong>${selectedTemplate.points.length}</strong><span>점 개수</span></div>
    <div class="meta-chip"><strong>${selectedTemplate.threadSkip}</strong><span>연결 간격</span></div>
    <div class="meta-chip"><strong>${difficultyLabel(selectedTemplate.points.length, selectedConfig)}</strong><span>난이도</span></div>
  `;
}

function syncPointControls() {
  const count = pointCounts[selectedConfig.id];
  pointCountInput.min = String(selectedConfig.minCount);
  pointCountInput.max = String(selectedConfig.maxCount);
  pointCountInput.value = String(count);
  pointCountRange.min = String(selectedConfig.minCount);
  pointCountRange.max = String(selectedConfig.maxCount);
  pointCountRange.value = String(count);
  pointCountHelp.textContent = `${selectedConfig.minCount}점부터 ${selectedConfig.maxCount}점까지 조절할 수 있습니다. 현재 ${count}점입니다.`;
}

function applyPointCount() {
  const nextCount = clampCount(Number(pointCountInput.value), selectedConfig);
  pointCounts[selectedConfig.id] = nextCount;
  pointCountInput.value = String(nextCount);
  pointCountRange.value = String(nextCount);
  pointCountHelp.textContent = `${selectedConfig.name}을 ${nextCount}점으로 다시 그렸습니다.`;
  renderTemplateButtons();
  renderSelectedTemplate();
}

function resetPointCount() {
  pointCounts[selectedConfig.id] = selectedConfig.defaultCount;
  syncPointControls();
  renderTemplateButtons();
  renderSelectedTemplate();
}

function buildTemplate(config) {
  const count = clampCount(pointCounts[config.id], config);
  const points = config.makePoints(count);
  return {
    id: config.id,
    name: config.name,
    guide: config.guide,
    points,
    threadSkip: getThreadSkip(points.length, config.threadRatio),
    center: config.center
  };
}

function getOptions() {
  return {
    guide: showGuide.checked,
    threads: showThreads.checked,
    numbers: showNumbers.checked,
    center: showCenter.checked
  };
}

function createSvg(template, options = {}) {
  const thumbnail = Boolean(options.thumbnail);
  const showGuideLine = thumbnail || options.guide;
  const showThreadLines = !thumbnail && options.threads;
  const showNumberLabels = !thumbnail && options.numbers;
  const showCenterDot = !thumbnail && options.center && template.center;
  const dotRadius = thumbnail ? 7 : 4.4;
  const pointStroke = thumbnail ? 2 : 1.6;
  const viewBox = '0 0 720 720';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${template.name}">
      <rect width="720" height="720" fill="#fff"/>
      ${showGuideLine ? renderGuide(template, thumbnail) : ''}
      ${showThreadLines ? renderThreads(template) : ''}
      ${showCenterDot ? '<circle cx="360" cy="360" r="4.8" fill="#e60012" stroke="#071a44" stroke-width="1.8"/>' : ''}
      ${renderPoints(template.points, dotRadius, pointStroke)}
      ${showNumberLabels ? renderNumbers(template.points) : ''}
    </svg>
  `;
}

function renderGuide(template, thumbnail) {
  const strokeWidth = thumbnail ? 5 : 1.7;
  if (template.guide === 'circle') {
    return '<circle cx="360" cy="360" r="284" fill="none" stroke="#208d38" stroke-width="1.7"/>';
  }

  if (template.guide === 'grid') {
    return `
      <path d="M72 72 H648 V648 H72 Z" fill="none" stroke="#208d38" stroke-width="${strokeWidth}"/>
      <path d="M360 72 V648 M72 360 H648" fill="none" stroke="#208d38" stroke-width="${strokeWidth}"/>
    `;
  }

  const points = template.points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  return `<polyline points="${points}" fill="none" stroke="#208d38" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`;
}

function renderThreads(template) {
  const points = template.points;
  return points.map((point, index) => {
    const next = points[(index + template.threadSkip) % points.length];
    return `<line x1="${point.x.toFixed(1)}" y1="${point.y.toFixed(1)}" x2="${next.x.toFixed(1)}" y2="${next.y.toFixed(1)}" stroke="#4658ff" stroke-width=".9" opacity=".28"/>`;
  }).join('');
}

function renderPoints(points, radius, strokeWidth) {
  return points.map(point =>
    `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${radius}" fill="#e60012" stroke="#071a44" stroke-width="${strokeWidth}"/>`
  ).join('');
}

function renderNumbers(points) {
  return points.map((point, index) => {
    const angle = Math.atan2(point.y - 360, point.x - 360);
    const offset = 16;
    const x = point.x + Math.cos(angle) * offset;
    const y = point.y + Math.sin(angle) * offset + 4;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="#071a44" font-family="Noto Sans KR, Arial, sans-serif" font-size="13" font-weight="800" text-anchor="middle">${index + 1}</text>`;
  }).join('');
}

function downloadSvg() {
  const svg = createSvg(selectedTemplate, getOptions()).trim();
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${selectedTemplate.name.replace(/\s/g, '_')}_${selectedTemplate.points.length}점.svg`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function makeCirclePoints(count, cx, cy, radius) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (-90 + (360 / count) * index) * Math.PI / 180;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    };
  });
}

function makeGridPoints(count) {
  const min = 72;
  const max = 648;
  const mid = 360;
  const candidates = [];
  const perimeterSamples = Math.max(80, count * 4);
  const crossSamples = Math.max(36, count * 2);

  for (let i = 0; i < perimeterSamples; i++) {
    const t = i / perimeterSamples;
    candidates.push(pointOnRect(t, min, max));
  }
  for (let i = 1; i < crossSamples; i++) {
    const t = i / crossSamples;
    candidates.push({ x: min + (max - min) * t, y: mid });
  }
  for (let i = 1; i < crossSamples; i++) {
    const t = i / crossSamples;
    candidates.push({ x: mid, y: min + (max - min) * t });
  }

  return sampleEvenly(uniquePoints(candidates), count);
}

function makeHeartPoints(count) {
  const raw = Array.from({ length: count }, (_, index) => {
    const t = (Math.PI * 2 * index) / count;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x: 360 + x * 17, y: 386 - y * 17 };
  });
  return raw.reverse();
}

function makeStarPoints(count) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (-90 + (360 / count) * index) * Math.PI / 180;
    const wave = (Math.cos(5 * angle) + 1) / 2;
    const radius = 178 + 112 * wave;
    return {
      x: 360 + Math.cos(angle) * radius,
      y: 360 + Math.sin(angle) * radius
    };
  });
}

function makeSpiralPoints(count) {
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0 : index / (count - 1);
    const angle = (Math.PI * 7.4 * t) - Math.PI / 2;
    const radius = 28 + 282 * t;
    return {
      x: 360 + Math.cos(angle) * radius,
      y: 360 + Math.sin(angle) * radius
    };
  });
}

function pointOnRect(t, min, max) {
  const side = Math.floor(t * 4);
  const local = (t * 4) - side;
  if (side === 0) return { x: min + (max - min) * local, y: min };
  if (side === 1) return { x: max, y: min + (max - min) * local };
  if (side === 2) return { x: max - (max - min) * local, y: max };
  return { x: min, y: max - (max - min) * local };
}

function getThreadSkip(count, ratio) {
  const skip = Math.round(count * ratio);
  return Math.max(2, Math.min(count - 1, skip));
}

function difficultyLabel(count, config) {
  const range = config.maxCount - config.minCount;
  const level = (count - config.minCount) / range;
  if (level < .34) return '쉬움';
  if (level < .67) return '보통';
  return '어려움';
}

function clampCount(value, config) {
  const number = Number.isFinite(value) ? Math.round(value) : config.defaultCount;
  return Math.max(config.minCount, Math.min(config.maxCount, number));
}

function sampleEvenly(points, count) {
  if (points.length <= count) return points;
  if (count <= 1) return points.slice(0, count);
  return Array.from({ length: count }, (_, index) => {
    const sourceIndex = Math.round((index * (points.length - 1)) / (count - 1));
    return points[sourceIndex];
  });
}

function uniquePoints(points) {
  const seen = new Set();
  return points.filter(point => {
    const key = `${Math.round(point.x)}-${Math.round(point.y)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
