/* 8-7 투표 결과 · 주제 확정 (진행자) · 보기 전용 (참가자) */
const isHost = App.state.role === 'host';
function applyRole() {   // 참가자: 라디오 · 확정 · 재투표 숨김
  if (isHost) return;
  App.$$('[data-action="confirmTopic"],[data-action="revote"]').forEach(b => { b.hidden = true; });
  App.$$('.res7 .radio').forEach(r => { r.style.visibility = 'hidden'; });
  const p = App.$('.dvh p'); if (p) p.textContent = '진행자가 주제를 확정하면 함께 파트 나누기로 넘어가요. 누가 어디에 투표했는지는 공개되지 않아요.';
  const lh = App.$('.listh span'); if (lh) lh.textContent = '표 수 순이에요 · 확정은 진행자가 해요';
  App.$$('p.note').forEach(n => { n.hidden = true; });
}
applyRole();
/* 팀장 고르기: 진행자 카드의 sel9를 실제 <select>로 (실서버 모드 · session.participants) */
async function leaderSelect() {
  const box = App.$('.sel9'); if (!box || !isHost) return;
  const r = await api.call('session.participants');
  const sel = document.createElement('select'); sel.id = 'leaderSel'; sel.className = 'sel9'; sel.style.width = '100%';
  r.items.forEach(p => { const o = document.createElement('option'); o.value = p.participantId; o.textContent = p.nickname + (p.role === 'host' ? ' (진행자)' : ''); if (p.role === 'host') o.selected = true; sel.appendChild(o); });
  box.replaceWith(sel);
}
if (!IE_CONFIG.useMock) leaderSelect();
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'stage.changed' && ev.data.stage.id === 'diverge.vote') App.go(App.screen('08-6-vote'));   // 동점 재투표
  if (ev.type === 'topic.confirmed' && !isHost) { App.toast(`주제가 "${ev.data.title}"(으)로 확정됐어요`); App.go(App.screen('09-1-part-split')); }
});
const confirmBtn = App.$('[data-action="confirmTopic"]');
App.$$('.res7').forEach((r, i) => { r.dataset.id = r.dataset.id || 'idea_' + i; });

document.addEventListener('ie:pick', (e) => { confirmBtn.textContent = `${App.text(e.detail.querySelector('.num'))}위로 확정하고 파트 나누기 →`; });

App.action('confirmTopic', async () => {
  const pick = App.$('.res7 .radio.on').closest('.res7');
  const leader = App.$('#leaderSel')?.value || undefined;   // 팀장 고르기(진행자 카드) — 없으면 서버가 진행자를 팀장으로
  await api.call('topic.confirm', {}, leader ? { ideaId: pick.dataset.id, leaderParticipantId: leader } : { ideaId: pick.dataset.id });
  App.toast(`"${App.text(pick.querySelector('.rt'))}"(으)로 확정했어요`);
  App.go(App.screen('09-1-part-split'));
  return false;
});
App.action('revote', async () => {
  if (!(await App.confirm('동점인 아이디어만 다시 투표할까요?', '동점 후보만 가지고 짧은 재투표를 열어요. 모두의 화면이 투표로 돌아가요.', '재투표 열기'))) return false;
  const ids = ties.length ? ties : App.$$('.res7').filter(r => App.text(r.querySelector('.num')) === '3').map(r => r.dataset.id);
  if (!ids.length) { App.toast('동점인 아이디어가 없어요'); return false; }
  await api.call('vote.revote', {}, { ids, maxVotes: 1 });
  App.toast('동점 재투표를 열었어요');
  return false;
});

function renderResults(r) {
  App.$('.dvh p').textContent = `${r.memberCount}명이 ${r.totalVotes}표를 썼어요. 확정할 주제를 고르면 파트 나누기로 넘어가요.`;
  const box = App.$('.detail'); box.querySelectorAll('.res7').forEach(n => n.remove());
  const anchor = box.querySelector('.more'); const top = Math.max(...r.ranks.map(x => x.votes), 1);
  const GRADE = { go: '바로 해볼 만해요', fix: '보완하면 좋아요', re: '다시 생각해 봐요' };
  r.ranks.forEach((x, i) => {
    const owner = x.aiMerged
      ? `<div class="own"><span class="aitag">AI가 모음</span>${x.sourceOwners.map(o => `${App.escape(o.nickname)} 님 ${o.rank}순위`).join(' · ')}의 좋은 점</div>`
      : `<div class="own"><i>${App.escape(x.owner.nickname[0])}</i>${App.escape(x.owner.nickname)} 님의 ${x.owner.rank}순위</div>`;
    const row = document.createElement('div'); row.className = 'res7' + (x.rank <= 2 ? ' top' : ''); row.dataset.id = x.id;
    row.innerHTML = `<span class="radio${i === 0 ? ' on' : ''}"></span><span class="num${x.rank === 1 ? ' n1' : ''}">${x.rank}</span>` +
      `<div><div class="rt">${App.escape(x.title)}</div>${owner}</div><span class="grade ${x.grade}"><i></i>${GRADE[x.grade]}</span>` +
      `<div class="vbar"><i style="width:${Math.round(x.votes * 100 / top)}%"></i></div><span class="vc">${x.votes}표</span>`;
    box.insertBefore(row, anchor);
  });
  anchor.textContent = `표를 받지 못한 아이디어 ${r.unvotedCount}개도 주인과 함께 기록에 남아요`;
  applyRole();
}
let ties = [];   // 서버가 계산한 동점 후보 (동점 재투표에 사용)
function renderInsight(ins) {
  const card = App.$('.sc2');
  if (!card) return;
  if (!ins) { card.hidden = true; return; }
  card.hidden = false;
  const h = card.querySelector('h4'); if (h) h.textContent = ins.title;
  const ps = card.querySelectorAll('p'); if (ps[0]) ps[0].textContent = ins.body;
}
async function load() {
  const r = await api.call('vote.results');
  ties = (r.ties || []).flatMap(t => t.ids || []);
  renderResults(r);
  renderInsight(r.insight);
}
if (!IE_CONFIG.useMock) load();
