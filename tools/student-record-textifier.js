let workbook = null;
let rows = [];
let headers = [];

const fileInput = document.querySelector('#fileInput');
const sheetSelect = document.querySelector('#sheetSelect');
const nameColumn = document.querySelector('#nameColumn');
const contentColumn = document.querySelector('#contentColumn');
const formatSelect = document.querySelector('#formatSelect');
const convertBtn = document.querySelector('#convertBtn');
const clearBtn = document.querySelector('#clearBtn');
const copyBtn = document.querySelector('#copyBtn');
const downloadBtn = document.querySelector('#downloadBtn');
const previewArea = document.querySelector('#previewArea');
const resultText = document.querySelector('#resultText');

fileInput.addEventListener('change', handleFile);
sheetSelect.addEventListener('change', loadSelectedSheet);
convertBtn.addEventListener('click', convertRows);
clearBtn.addEventListener('click', resetAll);
copyBtn.addEventListener('click', copyResult);
downloadBtn.addEventListener('click', downloadTxt);

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    workbook = XLSX.read(data, { type: 'array' });
    sheetSelect.innerHTML = workbook.SheetNames
      .map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
      .join('');
    sheetSelect.disabled = false;
    loadSelectedSheet();
  };
  reader.readAsArrayBuffer(file);
}

function loadSelectedSheet() {
  const sheetName = sheetSelect.value;
  const sheet = workbook.Sheets[sheetName];
  rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const headerIndex = findHeaderRow(rows);
  headers = rows[headerIndex] || [];
  rows = rows.slice(headerIndex + 1);

  renderColumnOptions();
  renderPreview();
  convertBtn.disabled = headers.length === 0;
}

function findHeaderRow(data) {
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const filled = data[i].filter(cell => String(cell).trim() !== '').length;
    if (filled >= 2) return i;
  }
  return 0;
}

function renderColumnOptions() {
  const options = headers.map((header, index) => {
    const title = String(header || `빈 제목 ${index + 1}`).trim();
    return `<option value="${index}">${columnName(index)}열 - ${escapeHtml(title)}</option>`;
  }).join('');

  nameColumn.innerHTML = options;
  contentColumn.innerHTML = options;
  nameColumn.disabled = false;
  contentColumn.disabled = false;

  const nameGuess = guessColumn(['이름', '성명', '학생명', '학생']);
  const contentGuess = guessColumn(['특기', '사항', '내용', '세특', '행동', '종합', '평가']);

  if (nameGuess >= 0) nameColumn.value = nameGuess;
  if (contentGuess >= 0) contentColumn.value = contentGuess;
}

function guessColumn(keywords) {
  return headers.findIndex(header => {
    const text = String(header).replace(/\s/g, '');
    return keywords.some(keyword => text.includes(keyword));
  });
}

function renderPreview() {
  const previewRows = rows.slice(0, 8);
  const head = `<thead><tr>${headers.map(h => `<th>${escapeHtml(h || '')}</th>`).join('')}</tr></thead>`;
  const body = `<tbody>${previewRows.map(row =>
    `<tr>${headers.map((_, i) => `<td>${escapeHtml(row[i] || '')}</td>`).join('')}</tr>`
  ).join('')}</tbody>`;
  previewArea.innerHTML = `<table class="preview-table">${head}${body}</table>`;
}

function convertRows() {
  const nameIdx = Number(nameColumn.value);
  const contentIdx = Number(contentColumn.value);
  const format = formatSelect.value;

  const converted = rows
    .map((row, index) => {
      const name = clean(row[nameIdx]);
      const content = clean(row[contentIdx]);
      if (!name && !content) return '';
      if (format === 'simple') return `${name}|${content}`;
      if (format === 'numbered') return `${index + 1}. ${name} - ${content}`;
      return `${name}|\n${content}\n\n==================================================`;
    })
    .filter(Boolean)
    .join('\n');

  resultText.value = converted;
  copyBtn.disabled = converted.length === 0;
  downloadBtn.disabled = converted.length === 0;
}

function clean(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

async function copyResult() {
  if (!resultText.value) return;
  await navigator.clipboard.writeText(resultText.value);
  copyBtn.textContent = '복사 완료';
  setTimeout(() => copyBtn.textContent = '결과 복사', 1200);
}

function downloadTxt() {
  const blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '생기부_텍스트화_결과.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resetAll() {
  workbook = null;
  rows = [];
  headers = [];
  fileInput.value = '';
  sheetSelect.innerHTML = '<option>파일을 먼저 선택하세요</option>';
  sheetSelect.disabled = true;
  nameColumn.innerHTML = '';
  contentColumn.innerHTML = '';
  nameColumn.disabled = true;
  contentColumn.disabled = true;
  convertBtn.disabled = true;
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  resultText.value = '';
  previewArea.innerHTML = '<table class="preview-table"><tbody><tr><td>엑셀 파일을 선택하면 이곳에 일부 행이 표시됩니다.</td></tr></tbody></table>';
}

function columnName(index) {
  let name = '';
  let num = index + 1;
  while (num > 0) {
    const rem = (num - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    num = Math.floor((num - 1) / 26);
  }
  return name;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
