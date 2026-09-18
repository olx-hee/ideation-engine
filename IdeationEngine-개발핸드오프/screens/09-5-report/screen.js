/* 9-5 최종 보고서 (A4 2쪽) */
const esc = App.escape;

/* ── 크게 보기 팝업 ── */
function openZoom(wrap) {
  const pages = App.$$('.desk .a4wrap[data-zoom] .a4');
  const ov = document.createElement('div');
  ov.className = 'zoomov fixed';
  ov.innerHTML = '<div class="zbar"><span class="zl"><b>첫 회의 결과 보고서</b><small>A4 · ' + pages.length + '쪽</small></span>' +
    '<span class="zr"><button class="btn sm" data-action="savePdf">PDF로 저장</button><button class="btn ghost sm zx">✕ 닫기</button></span></div><div class="zscroll"></div>';
  const sc = ov.querySelector('.zscroll');
  pages.forEach((p) => { const box = document.createElement('div'); box.className = 'zpage'; box.appendChild(p.cloneNode(true)); sc.appendChild(box); });
  document.body.appendChild(ov);
  const i = pages.indexOf(wrap.querySelector('.a4'));
  if (i > 0) sc.scrollTop = sc.children[i].offsetTop - 12;
  const close = () => { ov.remove(); document.removeEventListener('keydown', esckey); };
  function esckey(e) { if (e.key === 'Escape') close(); }
  ov.addEventListener('click', (e) => { if (e.target === ov || e.target === sc || e.target.closest('.zx')) close(); });
  document.addEventListener('keydown', esckey);
}
document.addEventListener('click', (e) => { const w = e.target.closest('.desk .a4wrap[data-zoom]'); if (w) openZoom(w); });

/* ── PDF로 저장 = 브라우저 인쇄 (A4 2쪽) ── */
App.action('savePdf', async () => {
  const box = document.createElement('div');
  box.className = 'printonly';
  App.$$('.desk .a4wrap .a4').forEach(p => box.appendChild(p.cloneNode(true)));
  document.body.appendChild(box);
  document.body.classList.add('printing');
  const done = () => { box.remove(); document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 1000);
  return false;
});

/* ── 서버 데이터로 A4 2쪽 그리기 ── */
let report = null;
const av = (n) => n ? `<i class="av9">${esc(n[0])}</i>` : '';   // 담당 없는 파트(후보 없음)는 아바타 없이
const kv = (k, v) => `<div class="pp-kv"><span>${esc(k)}</span><div>${v}</div></div>`;
const GRADE = { go: '바로 해볼 만해요', fix: '보완하면 좋아요', re: '다시 생각해 봐요' };

function page1(r) {
  const w = r.why, f = r.feasibility, p = r.parts;
  const part = (x) => `<div class="pp-part${x.assignee ? '' : ' out'}"><span>${esc(x.name)}</span><span class="pp-who">${av(x.assignee)}${esc(x.assignee || '담당 없음')}</span></div>`;
  const top = Math.max(...r.votes.ranks.map(x => x.votes), 1);
  const vote = (x) => `<div class="pp-vote${x.rank === 1 ? ' top' : ''}"><i>${x.rank}</i><span>${esc(x.title)}` +
    `<small>${esc(x.owner || (x.tieCount ? `동점 ${x.tieCount}개` : ''))}</small></span>` +
    `<span class="pp-bar"><s style="width:${Math.round(x.votes * 100 / top)}%"></s></span><b>${x.votes}표</b></div>`;
  return `<div class="pp-t">${esc(r.topic.title)}</div><div class="pp-sub">${esc(r.topic.summary)}</div>` +
    `<div class="pp-meta"><span>아이디어<b>${esc(r.topic.owner.nickname)} 님의 ${r.topic.owner.rank}순위</b></span>` +
    `<span>팀원<b>${r.meta.memberCount}명</b></span><span>회의 시간<b>약 ${r.meta.durationMin}분</b></span>` +
    `<span>세션<b>${esc(r.meta.sessionTopic)}</b></span></div>` +
    `<div class="pp-sec"><div class="pp-h"><i>01</i>왜 이 주제인가요</div>` +
    kv('투표', `${w.votes.total}표 중 <b>${w.votes.top}표로 1위</b> · 2위와 ${w.votes.gapToSecond}표 차이`) +
    kv('AI 검증', `<span class="pp-tag">${esc(GRADE[w.review.grade])}</span>${esc(w.review.summary)}`) +
    kv('받은 좋은 점', `${w.praise.count}개 · ${esc(w.praise.points.join(' · '))}`) +
    kv('숨은 공통점', esc(w.thread)) + '</div>' +
    `<div class="pp-sec"><div class="pp-h"><i>02</i>현실성</div>` +
    kv('구현 가능성', `<span class="pp-tag">${esc(f.level)}</span>${esc(f.summary)}`) +
    kv('팀에 없는 스킬', f.missingSkills.map(s => `${esc(s.name)} → <b>${esc(s.decision)}</b>`).join('<br>') || '없어요') +
    kv('줄인 범위', esc(f.scope)) + '</div>' +
    `<div class="pp-sec"><div class="pp-h"><i>03</i>투표 결과<small>1인 ${r.votes.maxVotesPerPerson}표 · 누가 어디에 투표했는지는 공개하지 않아요</small></div>` +
    r.votes.ranks.map(vote).join('') + '</div>' +
    `<div class="pp-sec"><div class="pp-h"><i>04</i>파트와 맡은 사람<small>팀장 ${esc(p.leader)} 님이 확정</small></div><div class="pp-parts">` +
    `<div><div class="pp-grp">결과를 좌우하는 파트</div>${p.core.map(part).join('')}` +
    `<div class="pp-grp" style="margin-top:10px">보통 파트</div>${p.normal.map(part).join('')}</div>` +
    `<div><div class="pp-grp">작은 일</div>${p.small.map(part).join('')}` +
    p.excluded.map(x => `<div class="pp-part out" style="margin-top:10px"><span>${esc(x.name)}</span><span>${esc(x.alternative)}</span></div>`).join('') +
    '</div></div></div>';
}

function page2(r) {
  const card = (t) => `<div class="pp-card">${av(t.nickname)}<div><b>${esc(t.nickname || '팀 전체')}${t.lead ? `<small>${esc(t.lead)}</small>` : ''}</b>` +
    `<p>${esc(t.text)}</p></div></div>`;
  const stage = (s) => `<div class="pp-stage"><span class="pp-sn${s.current ? ' now' : ''}">${s.no}</span><div>` +
    `<div class="pp-st">${esc(s.name)}${s.current ? ' <span class="pill9 k">지금 단계</span>' : ''}</div>` +
    `<div class="pp-mk"><span>팀이 만들 것</span>${esc(s.make)}</div>` +
    `<div class="pp-cards">${s.tasks.map(card).join('')}</div>` +
    `<div class="pp-pass"><span>넘겨주기</span>${esc(s.handoffs.join(' · '))}</div></div></div>`;
  return `<div class="pp-sec" style="margin-top:22px"><div class="pp-h"><i>05</i>팀 워크플로우` +
    `<small>이 순서로 함께 진행해요 · 단계마다 팀이 만들 것과 각자 맡는 일</small></div>` +
    r.workflow.stages.map(stage).join('') + '</div>' +
    `<div class="pp-sec" style="margin-top:12px"><div class="pp-h"><i>06</i>내내 하는 일</div><div class="pp-always">` +
    (r.workflow.always || []).map(a => `<span>${esc(a.text)}</span><b>${esc(a.nickname || '')}</b>`).join('') + '</div></div>' +
    `<div class="pp-note">팀장이 확정한 배치로 AI가 만든 초안이에요. 단계별 일은 회의에서 고칠 수 있어요.<br>` +
    `끝까지 익명으로 남는 것: ${esc(r.anonymous.join(' · '))}</div>`;
}

function render(r) {
  report = r;
  const pages = App.$$('.desk .a4');
  const head = pages[0].querySelector('.pp-top').outerHTML;
  const foot = (n) => `<div class="pp-foot"><span>${esc(r.topic.title)}</span><span>${n} / 2</span></div>`;
  pages[0].innerHTML = head + page1(r) + foot(1);
  pages[1].innerHTML = head + page2(r) + foot(2);
  App.$('.dvh h3').innerHTML = `<span class="rmeta">첫 회의 결과 보고서 · ${esc(r.meta.date)} · 팀원 ${r.meta.memberCount}명 · 약 ${r.meta.durationMin}분</span>${esc(r.topic.title)}`;
}

/* 보고서를 만드는 중(ready=false)이면 안내 띄우고, 끝나면 걷는다 — 8-5 AI 검증과 같은 방식 */
function pending(ready) {
  App.$('.tdim')?.remove();
  if (ready) return;
  const dim = document.createElement('div'); dim.className = 'tdim';
  dim.innerHTML = '<div class="tdlg" style="text-align:center"><div class="avatar" style="width:72px;height:72px;font-size:var(--fs-h1);margin:0 auto 14px">AI</div><h3>보고서를 만드는 중이에요</h3><p>확정된 배치로 요약과 워크플로우를 만들고 있어요</p><p class="quiet">끝나면 자동으로 보여요</p></div>';
  (App.$('.board') || document.body).appendChild(dim);
}

async function load() {
  const r = await api.call('report.get');
  pending(r.ready);
  if (!r.ready) return;
  if (report && r.version < report.version) return;   // 늦게 도착한 응답 — 이미 더 최신 보고서를 보고 있음
  render(r);
}

const fromHistory = new URLSearchParams(location.search).get('sessionId');
if (fromHistory) App.save({ sessionId: fromHistory });

realtime.connect(App.sessionId(), (ev) => { if (ev.type === 'report.ready') load(); });
if (!IE_CONFIG.useMock) load();
