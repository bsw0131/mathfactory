document.addEventListener('DOMContentLoaded', () => {
  const links = [...document.querySelectorAll('.nav a')];
  const sections = links
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const setActive = () => {
    const y = window.scrollY + 120;
    let current = sections[0]?.id || 'home';
    sections.forEach(section => {
      if (section.offsetTop <= y) current = section.id;
    });
    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  };

  setActive();
  window.addEventListener('scroll', setActive, { passive: true });

  document.querySelectorAll('.tool-item.disabled').forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault();
      alert('아직 준비 중인 도구입니다. 곧 추가할 예정입니다.');
    });
  });
});
