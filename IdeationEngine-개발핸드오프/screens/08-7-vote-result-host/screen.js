/* 8-7 투표 결과 · 주제 확정 (진행자) · 보기 전용 (참가자) */
const isHost = App.state.role === 'host';
function applyRole() {   // 참가자: 라디오 · 확정 · 재투표 숨김
  if (isHost) return;
  App.$$('[data-action="confirmTopic"],[data-action="revote"]').forEach(b => { b.hidden = true; });
  App.$$('.res7 .radio').forEach(r => { r.style.visibility = 'hidden'; });
  // 버튼만 숨기면 "동점이 있을 때" · "팀장 정하기" 카드가 참가자에게 그대로 남아(진행자만 하는 일인데)
  // 눌러도 아무 일이 없는 빈 카드로 보인다 — 카드째로 숨긴다
  App.$$('[data-action="revote"]').forEach(b => { const c = b.closest('.sc2'); if (c) c.hidden = true; });
  const leaderCard = App.$('.sel9')?.closest('.sc2'); if (leaderCard) leaderCard.hidden = true;
  const p = App.$('.dvh p'); if (p) p.textContent = '진행자가 주제를 확정하면 함께 파트 나누기로 넘어가요. 누가 어디에 투표했는지는 공개되지 않아요.';
  const lh = App.$('.listh span'); if (lh) lh.textContent = '표 수 순이에요 · 확정은 진행자가 해요';
  App.$$('p.note').forEach(n => { n.hidden = true; });
}
applyRole();
/* 팀장 고르기: 진행자 카드의 sel9를 실제 <select>로 (실서버 모드 · session.participants) */
async function leaderSelect() {
  const box = App.$('.sel9'); if (!box || !isHost) return;
  let r; try { r = await api.call('session.participants'); } catch (e) { return; }   // 실패하면 기본 표시(진행자)로 그냥 둠
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
const revoteBtn = App.$('[data-action="revote"]');
App.$$('.res7').forEach((r, i) => { r.dataset.id = r.dataset.id || 'idea_' + i; });
// 실서버 모드: 진짜 결과가 올 때까지 확정·재투표를 막는다 — 안 그러면 화면의 예시 데이터(idea_0 등)로 잘못 확정될 수 있음
if (isHost && !IE_CONFIG.useMock) {
  confirmBtn.classList.add('disabled'); confirmBtn.title = '결과를 불러오는 중이에요';
  if (revoteBtn) { revoteBtn.classList.add('disabled'); revoteBtn.title = '결과를 불러오는 중이에요'; }
}

function selectRow(row) { App.$$('.res7').forEach(r => r.querySelector('.radio')?.classList.toggle('on', r === row)); }
let lastPick = null;
document.addEventListener('ie:pick', (e) => {
  const row = e.detail;
  // AI가 모은 아이디어는 표를 받아 1위가 될 수는 있지만 주제로 확정할 수 없다(파트 나누기 · 보고서가
  // 원본 아이디어만 읽어서 9-1의 주제 칸이 비고 보고서가 터진다 · 서버도 400으로 막는다).
  if (row.dataset.aiMerged) {
    App.toast('AI가 모은 아이디어는 주제로 확정할 수 없어요 · 재료가 된 원래 아이디어를 골라주세요');
    selectRow(lastPick);
    return;
  }
  lastPick = row;
  confirmBtn.textContent = `${App.text(row.querySelector('.num'))}위로 확정하고 파트 나누기 →`;
});

App.action('confirmTopic', async () => {
  const pick = App.$('.res7 .radio.on')?.closest('.res7');
  if (!pick) { App.toast('확정할 주제를 골라주세요'); return false; }
  const leader = App.$('#leaderSel')?.value || undefined;   // 팀장 고르기(진행자 카드) — 없으면 서버가 진행자를 팀장으로
  await api.call('topic.confirm', {}, leader ? { ideaId: pick.dataset.id, leaderParticipantId: leader } : { ideaId: pick.dataset.id });
  App.toast(`"${App.text(pick.querySelector('.rt'))}"(으)로 확정했어요`);
  App.go(App.screen('09-1-part-split'));
  return false;
});
App.action('revote', async () => {
  // 동점 묶음이 여러 개일 수 있어서(1위 동점 · 2위 동점 …) 전부 합치면 "동점만" 이 아니게 된다 —
  // 가장 높은 순위 묶음(ties[0])만 후보로 올린다. 표를 못 받은 0표끼리는 서버가 동점으로 세지 않는다.
  if (!ties.length) { App.toast('동점인 아이디어가 없어요'); return false; }
  if (!(await App.confirm(`${tieRank}위 동점 ${ties.length}개로 다시 투표할까요?`, '동점 후보만 가지고 짧은 재투표를 열어요. 모두의 화면이 투표로 돌아가요.', '재투표 열기'))) return false;
  await api.call('vote.revote', {}, { ids: ties, maxVotes: 1 });
  App.toast('동점 재투표를 열었어요');
  return false;
});

function renderResults(r) {
  App.$('.dvh p').textContent = `${r.memberCount}명이 ${r.totalVotes}표를 썼어요. 확정할 주제를 고르면 파트 나누기로 넘어가요.`;
  const box = App.$('.detail'); box.querySelectorAll('.res7').forEach(n => n.remove());
  const anchor = box.querySelector('.more'); const top = Math.max(...r.ranks.map(x => x.votes), 1);
  const GRADE = { go: '바로 해볼 만해요', fix: '보완하면 좋아요', re: '다시 생각해 봐요' };
  let picked = false;
  r.ranks.forEach((x) => {
    const owner = x.aiMerged
      ? `<div class="own"><span class="aitag">AI가 모음</span>${(x.sourceOwners || []).map(o => `${App.escape(o.nickname)} 님 ${o.rank}순위`).join(' · ')}의 좋은 점</div>`
      : x.owner
        ? `<div class="own"><i>${App.escape(x.owner.nickname[0])}</i>${App.escape(x.owner.nickname)} 님의 ${x.owner.rank}순위</div>`
        : '<div class="own">주인을 찾을 수 없어요</div>';   // 세션을 떠난 사람의 아이디어 (서버가 owner를 null로 준다)
    // AI가 모은 아이디어는 확정할 수 없으니 기본 선택(첫 줄)도 확정할 수 있는 첫 줄로 내린다
    const on = !x.aiMerged && !picked ? (picked = true, ' on') : '';
    // 검증이 실패하면 grade가 null이라 예전엔 등급 칸에 "undefined"가 찍혔다 — 그럴 땐 빈 칸으로 둔다
    const grade = GRADE[x.grade] ? `<span class="grade ${x.grade}"><i></i>${GRADE[x.grade]}</span>` : '<span></span>';
    const row = document.createElement('div'); row.className = 'res7' + (x.rank <= 2 ? ' top' : ''); row.dataset.id = x.id;
    if (x.aiMerged) row.dataset.aiMerged = '1';
    row.innerHTML = `<span class="radio${on}"></span><span class="num${x.rank === 1 ? ' n1' : ''}">${x.rank}</span>` +
      `<div><div class="rt">${App.escape(x.title)}</div>${owner}</div>${grade}` +
      `<div class="vbar"><i style="width:${Math.round(x.votes * 100 / top)}%"></i></div><span class="vc">${x.votes}표</span>`;
    box.insertBefore(row, anchor);
    if (on) lastPick = row;
  });
  if (lastPick) confirmBtn.textContent = `${App.text(lastPick.querySelector('.num'))}위로 확정하고 파트 나누기 →`;
  // "동점이 있을 때" 카드 — HTML 예시("3위 동점 3개")가 그대로 남아 동점이 없어도 있는 것처럼 보였다
  const tieText = revoteBtn?.closest('.sc2')?.querySelector('p');
  if (tieText) tieText.textContent = ties.length
    ? `${tieRank}위 동점 ${ties.length}개는 그대로 두거나, 한 번 더 투표를 열 수 있어요. 다시 투표해도 누가 어디에 투표했는지는 익명이에요.`
    : '동점인 아이디어는 없어요. 바로 확정할 수 있어요.';
  anchor.textContent = `표를 받지 못한 아이디어 ${r.unvotedCount}개도 주인과 함께 기록에 남아요`;
  confirmBtn.classList.remove('disabled'); confirmBtn.title = '';
  if (revoteBtn) { revoteBtn.classList.remove('disabled'); revoteBtn.title = ''; }
  applyRole();
}
let ties = [], tieRank = 0;   // 서버가 계산한 동점 묶음 중 가장 높은 순위 하나 (동점 재투표에 사용)
function renderInsight(ins) {
  const card = App.$('.sc2');
  if (!card) return;
  if (!ins) { card.hidden = true; return; }
  card.hidden = false;
  const h = card.querySelector('h4'); if (h) h.textContent = ins.title;
  const ps = card.querySelectorAll('p'); if (ps[0]) ps[0].textContent = ins.body;
}
let notClosedTries = 0;
async function load() {
  try {
    const r = await api.call('vote.results');
    const tie = (r.ties || [])[0];
    ties = (tie && tie.ids) || []; tieRank = (tie && tie.rank) || 0;
    renderResults(r);
    renderInsight(r.insight);
  } catch (err) {
    // 아직 투표 중이라는 응답 — 서버가 단계 저장(커밋)보다 vote.closed·stage.changed를 먼저 보내는
    // 순간에 걸리면 결과가 열렸는데도 이 에러가 온다. 잠깐 뒤 한 번 더 물어보고, 그래도 투표 중이면
    // 정말 아직 투표 중이니(뒤로 가기로 들어온 경우) 투표 화면으로 돌려보낸다.
    if (err && err.code === 'VOTE_NOT_CLOSED') {
      if (++notClosedTries <= 2) { setTimeout(load, 800); return; }
      App.go(App.screen('08-6-vote'));
      return;
    }
    App.toast(err.message || '투표 결과를 불러오지 못했어요. 새로고침해 주세요', 'error');
  }
}
if (!IE_CONFIG.useMock) load();
