const tools = [
  {
    icon: '📄',
    title: '생기부 텍스트화',
    desc: '엑셀 파일의 학생별 특기사항을 복사하기 좋은 텍스트 형식으로 정리합니다.',
    badge: '사용 가능',
    link: 'tools/student-record-textifier.html'
  },
  {
    icon: '📈',
    title: '그래프 활동지 생성기',
    desc: '함수 그래프를 활용한 수업용 활동지와 문제 아이디어를 만듭니다.',
    badge: '예정',
    link: '#'
  },
  {
    icon: '🧵',
    title: '스트링아트 도안',
    desc: '점과 번호를 이용해 수학적 패턴이 담긴 스트링아트 도안을 제작합니다.',
    badge: '예정',
    link: '#'
  },
  {
    icon: '🧮',
    title: '수학 수업 도구',
    desc: '수업 도입, 개념 시각화, 탐구 활동에 사용할 작은 도구들을 모읍니다.',
    badge: '예정',
    link: '#'
  }
];

const toolGrid = document.querySelector('#toolGrid');
const toolCount = document.querySelector('#toolCount');

toolCount.textContent = tools.length;

toolGrid.innerHTML = tools.map(tool => `
  <article class="tool-card">
    <div>
      <span class="badge">${tool.badge}</span>
      <div class="tool-icon" aria-hidden="true">${tool.icon}</div>
      <h4>${tool.title}</h4>
      <p>${tool.desc}</p>
    </div>
    <a class="tool-link" href="${tool.link}" aria-label="${tool.title} 열기">도구 열기 →</a>
  </article>
`).join('');
