const templates = [
  {
    id: 'circle',
    name: '원형 도안',
    detail: '64점 · 원 둘레',
    guide: 'circle',
    points: makeCirclePoints(64, 360, 360, 284),
    threadSkip: 17,
    center: true
  },
  {
    id: 'grid',
    name: '격자 도안',
    detail: '73점 · 사각 격자',
    guide: 'grid',
    points: makeGridPoints(),
    threadSkip: 9,
    center: false
  },
  {
    id: 'heart',
    name: '하트 도안',
    detail: '72점 · 대칭 곡선',
    guide: 'polyline',
    points: makeHeartPoints(72),
    threadSkip: 23,
    center: true
  },
  {
    id: 'star',
    name: '별 도안',
    detail: '60점 · 오각 별',
    guide: 'polyline',
    points: makeStarPoints(60),
    threadSkip: 24,
    center: true
  },
  {
    id: 'spiral',
    name: '나선형 도안',
    detail: '78점 · 회전 곡선',
    guide: 'polyline',
    points: makeSpiralPoints(78),
    threadSkip: 8,
    center: true
  }
];

let selectedTemplate = templates[0];

const templateList = document.querySelector('#templateList');
const artBoard = document.querySelector('#artBoard');
const templateTitle = document.querySelector('#templateTitle');
const templateMeta = document.querySelector('#templateMeta');
const showGuide = document.querySelector('#showGuide');
const showThreads = document.querySelector('#showThreads');
const showNumbers = document.querySelector('#showNumbers');
const showCenter = document.querySelector('#showCenter');
const downloadSvgBtn = document.querySelector('#downloadSvgBtn');
const printBtn = document.querySelector('#printBtn');

renderTemplateButtons();
renderSelectedTemplate();

[showGuide, showThreads, showNumbers, showCenter].forEach(input => {
  input.addEventListener('change', renderSelectedTemplate);
});

downloadSvgBtn.addEventListener('click', downloadSvg);
printBtn.addEventListener('click', () => window.print());

function renderTemplateButtons() {
  templateList.innerHTML = templates.map(template => `
    <button class="template-card${template.id === selectedTemplate.id ? ' active' : ''}" type="button" data-template-id="${template.id}">
      <span class="template-thumb" aria-hidden="true">${createSvg(template, { thumbnail: true })}</span>
      <span>
        <span class="template-name">${template.name}</span>
        <span class="template-detail">${template.detail}</span>
      </span>
    </button>
  `).join('');

  templateList.querySelectorAll('.template-card').forEach(button => {
    button.addEventListener('click', () => {
      selectedTemplate = templates.find(template => template.id === button.dataset.templateId);
      renderTemplateButtons();
      renderSelectedTemplate();
    });
  });
}

function renderSelectedTemplate() {
  templateTitle.textContent = selectedTemplate.name;
  artBoard.innerHTML = createSvg(selectedTemplate, getOptions());
  templateMeta.innerHTML = `
    <div class="meta-chip"><strong>${selectedTemplate.points.length}</strong><span>점 개수</span></div>
    <div class="meta-chip"><strong>${selectedTemplate.threadSkip}</strong><span>연결 간격</span></div>
    <div class="meta-chip"><strong>A4</strong><span>인쇄 기준</span></div>
  `;
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
  anchor.download = `${selectedTemplate.name.replace(/\s/g, '_')}.svg`;
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

function makeGridPoints() {
  const points = [];
  const min = 72;
  const max = 648;
  const mid = 360;
  const count = 17;
  const step = (max - min) / (count - 1);

  for (let i = 0; i < count; i++) points.push({ x: min + step * i, y: min });
  for (let i = 1; i < count; i++) points.push({ x: max, y: min + step * i });
  for (let i = count - 2; i >= 0; i--) points.push({ x: min + step * i, y: max });
  for (let i = count - 2; i > 0; i--) points.push({ x: min, y: min + step * i });
  for (let i = 1; i < count - 1; i++) points.push({ x: min + step * i, y: mid });
  for (let i = 1; i < count - 1; i++) points.push({ x: mid, y: min + step * i });

  return uniquePoints(points);
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
    const t = index / (count - 1);
    const angle = (Math.PI * 7.4 * t) - Math.PI / 2;
    const radius = 28 + 282 * t;
    return {
      x: 360 + Math.cos(angle) * radius,
      y: 360 + Math.sin(angle) * radius
    };
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
