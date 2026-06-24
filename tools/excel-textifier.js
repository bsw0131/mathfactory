let workbook = null;
let rawRows = [];
let rows = [];
let headers = [];
let headerIndex = 0;

const fileInput = document.querySelector('#fileInput');
const sheetSelect = document.querySelector('#sheetSelect');
const columnCount = document.querySelector('#columnCount');
const headerRowSelect = document.querySelector('#headerRowSelect');
const columnSelectPanel = document.querySelector('#columnSelectPanel');
const formatSelect = document.querySelector('#formatSelect');
const rowSeparatorSelect = document.querySelector('#rowSeparatorSelect');
const includeHeader = document.querySelector('#includeHeader');
const skipEmptyRows = document.querySelector('#skipEmptyRows');
const convertBtn = document.querySelector('#convertBtn');
const clearBtn = document.querySelector('#clearBtn');
const copyBtn = document.querySelector('#copyBtn');
const downloadBtn = document.querySelector('#downloadBtn');
const previewArea = document.querySelector('#previewArea');
const resultSummary = document.querySelector('#resultSummary');
const resultText = document.querySelector('#resultText');

fileInput.addEventListener('change', handleFile);
sheetSelect.addEventListener('change', loadSelectedSheet);
headerRowSelect.addEventListener('change', applyHeaderRow);
columnCount.addEventListener('input', renderColumnSelectors);
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
  rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  headerIndex = findHeaderRow(rawRows);
  renderHeaderRowOptions();
  applyHeaderRow();
}

function renderHeaderRowOptions() {
  const options = ['<option value="auto">자동 찾기</option>'];
  rawRows.slice(0, 20).forEach((row, index) => {
    const label = row.map(clean).filter(Boolean).slice(0, 5).join(' / ') || '빈 행';
    options.push(`<option value="${index}">${index + 1}행 - ${escapeHtml(label)}</option>`);
  });
  headerRowSelect.innerHTML = options.join('');
  headerRowSelect.disabled = false;
  headerRowSelect.value = 'auto';
}

function applyHeaderRow() {
  const selected = headerRowSelect.value;
  headerIndex = selected === 'auto' ? findHeaderRow(rawRows) : Number(selected);
  headers = normalizeHeaders(rawRows[headerIndex] || []);
  rows = rawRows.slice(headerIndex + 1);

  columnCount.disabled = headers.length === 0;
  convertBtn.disabled = headers.length === 0;
  renderColumnSelectors();
  renderPreview();
  clearResult();
}

function findHeaderRow(data) {
  let bestIndex = 0;
  let bestScore = -1;

  for (let i = 0; i < Math.min(data.length, 20); i += 1) {
    const row = data[i] || [];
    const filled = row.filter(cell => clean(cell) !== '').length;
    const textScore = row.reduce((sum, cell) => {
      const text = clean(cell);
      if (!text) return sum;
      if (/성명|이름|학년|반|번호|날짜|내용|비고|업무|제목|시간|담당|결과/.test(text)) return sum + 2;
      return sum + 1;
    }, 0);
    const score = filled * 2 + textScore;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function normalizeHeaders(row) {
  const maxLength = Math.max(row.length, ...rawRows.slice(headerIndex + 1, headerIndex + 10).map(item => item.length));
  return Array.from({ length: maxLength }, (_, index) => {
    const title = clean(row[index]);
    return title || `${columnName(index)}열`;
  });
}

function renderColumnSelectors() {
  if (headers.length === 0) {
    columnSelectPanel.innerHTML = '<div class="empty-selects">파일을 올리면 선택할 열 목록이 표시됩니다.</div>';
    return;
  }

  const count = clamp(Number(columnCount.value), 1, Math.min(12, headers.length), Math.min(3, headers.length));
  columnCount.value = String(count);

  const previous = getSelectedColumnIndexes();
  columnSelectPanel.innerHTML = Array.from({ length: count }, (_, index) => {
    const selected = previous[index] ?? Math.min(index, headers.length - 1);
    return `
      <div class="column-card">
        <label for="columnSelect${index}"><span>${index + 1}</span><strong>${index + 1}번째로 뽑을 열</strong></label>
        <select class="column-select" id="columnSelect${index}" data-order="${index}">
          ${headers.map((header, columnIndex) => `
            <option value="${columnIndex}" ${columnIndex === selected ? 'selected' : ''}>${columnName(columnIndex)}열 - ${escapeHtml(header)}</option>
          `).join('')}
        </select>
      </div>
    `;
  }).join('');

  columnSelectPanel.querySelectorAll('.column-select').forEach(select => {
    select.addEventListener('change', clearResult);
  });
}

function renderPreview() {
  if (headers.length === 0) {
    previewArea.innerHTML = '<table class="preview-table"><tbody><tr><td>엑셀 파일을 선택하면 이곳에 일부 행이 표시됩니다.</td></tr></tbody></table>';
    return;
  }

  const previewRows = rows.slice(0, 8);
  const head = `<thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
  const body = `<tbody>${previewRows.map(row =>
    `<tr>${headers.map((_, index) => `<td>${escapeHtml(clean(row[index]))}</td>`).join('')}</tr>`
  ).join('')}</tbody>`;
  previewArea.innerHTML = `<table class="preview-table">${head}${body}</table>`;
}

function convertRows() {
  const selectedIndexes = getSelectedColumnIndexes();
  if (selectedIndexes.length === 0) return;

  const selectedHeaders = selectedIndexes.map(index => headers[index] || `${columnName(index)}열`);
  const records = rows
    .map(row => selectedIndexes.map(index => clean(row[index])))
    .filter(values => !skipEmptyRows.checked || values.some(Boolean));

  const converted = records.map(values => formatRecord(values, selectedHeaders)).join(rowSeparator());
  resultText.value = converted;
  copyBtn.disabled = converted.length === 0;
  downloadBtn.disabled = converted.length === 0;
  resultSummary.textContent = `${records.length}개 행을 변환했습니다. 선택한 열: ${selectedHeaders.join(', ')}`;
}

function formatRecord(values, selectedHeaders) {
  const withHeaders = includeHeader.checked;
  const format = formatSelect.value;

  if (format === 'tab') {
    return values.join('\t');
  }

  if (format === 'pipe') {
    return values.map((value, index) => withHeaders ? `${selectedHeaders[index]}: ${value}` : value).join(' | ');
  }

  if (format === 'sentence') {
    return values
      .map((value, index) => withHeaders ? `${selectedHeaders[index]}은(는) ${value}` : value)
      .filter(Boolean)
      .join(', ');
  }

  return values
    .map((value, index) => withHeaders ? `${selectedHeaders[index]}: ${value}` : value)
    .filter(Boolean)
    .join('\n');
}

function rowSeparator() {
  const value = rowSeparatorSelect.value;
  if (value === 'line') return '\n\n==================================================\n\n';
  if (value === 'none') return '\n';
  return '\n\n';
}

function getSelectedColumnIndexes() {
  return [...columnSelectPanel.querySelectorAll('.column-select')]
    .map(select => Number(select.value))
    .filter(index => Number.isInteger(index) && index >= 0);
}

function clearResult() {
  resultText.value = '';
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  resultSummary.textContent = '선택한 열과 변환 결과가 여기에 표시됩니다.';
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
  a.download = '엑셀_텍스트화_결과.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resetAll() {
  workbook = null;
  rawRows = [];
  rows = [];
  headers = [];
  headerIndex = 0;
  fileInput.value = '';
  sheetSelect.innerHTML = '<option>파일을 먼저 선택하세요</option>';
  sheetSelect.disabled = true;
  headerRowSelect.innerHTML = '<option value="auto">자동 찾기</option>';
  headerRowSelect.disabled = true;
  columnCount.value = '3';
  columnCount.disabled = true;
  columnSelectPanel.innerHTML = '<div class="empty-selects">파일을 올리면 선택할 열 목록이 표시됩니다.</div>';
  convertBtn.disabled = true;
  clearResult();
  previewArea.innerHTML = '<table class="preview-table"><tbody><tr><td>엑셀 파일을 선택하면 이곳에 일부 행이 표시됩니다.</td></tr></tbody></table>';
}

function clean(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
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
