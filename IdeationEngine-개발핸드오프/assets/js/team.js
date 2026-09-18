/* ─────────────────────────────────────────────
   team.js — 9 파트 나누기 · 배치 · 보고서 공통
   · Team.av(사람) / Team.who9(사람) : 아바타 · 이름 표시
   · 보기 고르기(.opt9) 라디오 동작
   ───────────────────────────────────────────── */
(function () {
  const esc = (s) => App.escape(s);
  window.Team = {
    av(m) { const n = (m && m.nickname) || ''; return `<i class="av9">${esc(n[0] || '?')}</i>`; },
    who9(m) {
      if (!m) return '<span class="q9">담당 없음</span>';
      return `<span class="who9">${this.av(m)}${esc(m.nickname)}${m.isMe ? ' <span class="q9">(나)</span>' : ''}</span>`;
    },
  };
  /* 9-2 보기 고르기 */
  document.addEventListener('click', (e) => {
    const opt = e.target.closest('.opt9');
    if (!opt) return;
    opt.parentElement.querySelectorAll('.opt9').forEach((o) => {
      const on = o === opt;
      o.classList.toggle('on', on);
      o.querySelector('.radio')?.classList.toggle('on', on);
    });
  });
})();
