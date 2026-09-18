# 9 파트 나누기 · 배치 · 보고서 (9-1 ~ 9-5) 화면 정의 + 8-5 · 8-7 · A4 연결 수정
# ho_screens_v2.py 다음에 적용된다 (handoff.py 가 이 파일에서 SCREENS/GROUPS/STAGE_OF/BOARD_EDITS 를 가져감)
from ho_screens_v2 import SCREENS, GROUPS, STAGE_OF, BOARD_EDITS
from ho_screens import R

K = {s['key']: s for s in SCREENS}
NOT_MOCK = "if (!IE_CONFIG.useMock) load();"

# ───────── 단계 ↔ 화면 ─────────
STAGE_OF.update({
    '09-1-part-split': 'team.split team.questions',
    '09-2-overlap-questions': 'team.questions',
    '09-3-assign-draft': 'team.assign',
    '09-4-leader-confirm': 'team.assign',
    '09-5-report': 'report',
})

# ───────── 화면에 없던 조작을 붙이기 (디자인 확인 필요 — 목업 모드에서는 숨김) ─────────
BOARD_EDITS.update({
    # 9-1: 진행자만 보이는 "다음 단계" 버튼 (디자인에는 없음 · 실서버 모드에서 role=host 일 때만 표시)
    '9-1': [('추가 질문을 해서 정해요.</p></div></div>',
             '추가 질문을 해서 정해요.</p></div>'
             '<span class="aside" data-host hidden><button class="btn sm">추가 질문 시작 →</button></span></div>')],
    # 9-2: 3줄 답을 실제 입력칸으로
    '9-2': [('<div class="ta9 focus">공지마다 마감일을 날짜 값으로 저장해 두고 목록을 마감순으로 정렬해요.<br>오늘과 하루 이하로 남았으면 배지를 붙여요.<br>마감일이 없는 공지는 맨 아래 \'마감 없음\'으로 따로 묶어요.</div>',
             '<textarea class="ta9" rows="4">공지마다 마감일을 날짜 값으로 저장해 두고 목록을 마감순으로 정렬해요.\n'
             '오늘과 하루 이하로 남았으면 배지를 붙여요.\n'
             "마감일이 없는 공지는 맨 아래 '마감 없음'으로 따로 묶어요.</textarea>")],
})

TEAM_JS_NOTE = ' + ../../assets/js/team.js (9 공통)'

# ───────── 9-1 파트 나누기 ─────────
S91 = dict(key='09-1-part-split', num='9-1', group='team', title='파트 나누기 — 후보 찾기', who='모두 (각자)', team=True,
 summary='확정된 주제를 파트로 나누고, 파트마다 프로필 스킬로 맡을 수 있는 후보를 보여준다. 후보가 겹친 파트는 그 사람들에게만 추가 질문(9-2)으로 정하고, 팀에 없는 스킬은 "후보 없음 + 대안"으로 표시한다.',
 rules=[R('<button class="btn sm">추가 질문 시작', '진행자만 보이는 다음 단계 버튼', action='advanceTeam')],
 front=['실서버 모드: 파트·후보·내가 후보인 파트를 team.parts로 그리기',
        '단계가 추가 질문(team.questions)으로 바뀌고 내게 질문이 있으면 9-2로 자동 이동, 없으면 이 화면에서 기다림',
        '진행자에게만 "추가 질문 시작 →"(겹친 후보가 없으면 "배치 초안 보기 →") 버튼 표시',
        '파트 나누기 AI가 끝나면(team.parts.ready) 자동으로 다시 그리기'],
 todo=['AI가 파트를 나누는 중(ready=false)일 때 기다리는 화면 디자인 — 지금은 안내 문구만',
       '진행자용 다음 단계 버튼은 디자인에 없어서 임시로 넣음 (디자인 확인 필요)'],
 load=['session.get', 'team.parts'], acts=[('진행자: 다음 단계', ['session.advance'])],
 backend=['<b>주제 확정 직후</b> 파트 나누기 AI 작업이 돈다. 확정된 주제를 <b>핵심 파트 / 보통 파트 / 작은 일</b>로 나누고, 파트마다 필요한 스킬을 정한다.',
          '<b>후보</b>는 참가자 프로필 스냅샷의 "할 수 있는 것"과 파트의 필요한 스킬을 맞춰서 고른다. 2명 이상이면 <b>겹침</b>(추가 질문), 1명이면 바로 배정, 없으면 <b>후보 없음</b> + 대안 한 줄.',
          'AI에는 <b>이름을 보내지 않는다</b>. P1·P2 같은 임시 번호와 스킬 목록만 보낸다.',
          '인터뷰의 "피하고 싶은 것"은 후보를 고를 때 조용히 빼는 데만 쓰고, 화면에 이유로 쓰지 않는다.',
          '작은 일(스킬 없이 누구나)은 이 화면에서는 개수와 이름만 보여주고, 사람에게 나누는 것은 배치 초안(9-3)에서 한다.'],
 events=['team.parts.ready', 'stage.changed'],
 js=r'''/* 9-1 파트 나누기 — 후보 찾기 */
const esc = App.escape;

function partRow(p) {
  const cand = p.status === 'none'
    ? `<span class="bad9">후보 없음</span><span class="q9">→ ${esc(p.alternative || '')} 제안</span>`
    : p.candidates.map(Team.av).join('') + (p.status === 'overlap'
        ? '<span class="pill9 k">겹침 · 추가 질문</span>'
        : `<span class="q9">1명 · 바로 배정</span>`);
  return `<div class="pr9${p.status === 'none' ? ' out' : ''}"><span class="pn">${esc(p.name)}<small>${esc(p.desc || '')}</small></span>` +
         `<span class="skl">${esc(p.skill || '누구나')}</span><span class="cand">${cand}</span></div>`;
}

function render(d) {
  App.$('.p9top b').textContent = d.topic.title;
  App.$('.p9top .r').innerHTML = `${esc(d.topic.owner.nickname)} 님의 ${d.topic.owner.rank}순위 · ${d.topic.votes}표` +
    `<span class="pill9">구현 가능성 ${esc(d.topic.feasibility)}</span>`;

  const tab = App.$('.ptab');
  tab.querySelectorAll('.pg9,.pr9').forEach(n => n.remove());
  [['core', '결과를 좌우하는 파트'], ['normal', '보통 파트']].forEach(([tier, label]) => {
    const parts = d.parts.filter(p => p.tier === tier);
    if (!parts.length) return;
    tab.insertAdjacentHTML('beforeend', `<div class="pg9">${label}</div>` + parts.map(partRow).join(''));
  });
  const s = d.smallTasks;
  tab.insertAdjacentHTML('beforeend', '<div class="pg9">작은 일 · 스킬 없이 누구나</div>' +
    `<div class="pr9"><span class="pn">작은 일 ${s.count}개<small>${esc(s.names.join(' · '))}</small></span>` +
    `<span class="skl">누구나</span><span class="cand"><span class="q9">${esc(s.note)}</span></span></div>`);

  const box = App.$('.sc2.me9');
  box.querySelectorAll('.mine9').forEach(n => n.remove());
  const note = box.querySelector('p');
  d.mine.forEach(m => note.insertAdjacentHTML('beforebegin',
    `<div class="mine9"><span class="pill9${m.status === 'overlap' ? ' k' : ''}">${m.status === 'overlap' ? '겹침' : '바로 배정'}</span>${esc(m.name)}</div>`));
  const overlap = d.mine.filter(m => m.status === 'overlap').length;
  note.textContent = overlap
    ? `겹친 ${overlap}개는 다음 화면에서 질문 2개씩 드려요. 다른 사람은 이 화면에서 바로 배치로 넘어가요.`
    : '겹친 파트가 없어서 추가 질문은 없어요. 곧 배치 초안으로 넘어가요.';
}

let stage = 'team.split';
function hostButton(isHost, hasOverlap) {
  const bar = App.$('[data-host]');
  if (!bar) return;
  bar.hidden = !isHost;
  const b = bar.querySelector('button');
  b.dataset.from = stage;
  b.textContent = stage === 'team.questions' ? '질문 마감하고 배치 보기 →' : (hasOverlap ? '추가 질문 시작 →' : '배치 초안 보기 →');
}

async function load() {
  const s = await api.call('session.get');
  stage = s.stage.id;
  const d = await api.call('team.parts');
  if (!d.ready) { App.toast('AI가 파트를 나누는 중이에요. 잠시만 기다려 주세요'); return; }
  render(d);
  hostButton(s.me.role === 'host', d.parts.some(p => p.status === 'overlap'));
  if (stage === 'team.questions' && d.myPendingQuestions > 0) App.go(App.screen('09-2-overlap-questions'));
}

App.action('advanceTeam', async (el) => {
  await api.call('session.advance', {}, { from: el.dataset.from || 'team.split' });
  return false;
});

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'team.parts.ready') load();
  if (ev.type === 'stage.changed') {
    stage = ev.data.stage.id;
    if (stage === 'team.questions') load();
    else { const want = App.stageScreen(ev.data.stage, App.state.role, App.state.isLeader); if (want) App.go(App.screen(want)); }
  }
});
''' + NOT_MOCK + '\n')

# ───────── 9-2 겹친 후보 질문 ─────────
S92 = dict(key='09-2-overlap-questions', num='9-2', group='team', title='겹친 후보 질문 (후보가 겹친 사람만)', who='후보가 겹친 사람만', team=True,
 summary='후보가 겹친 파트마다 질문 2개(경험 고르기 + 한 줄, 까다로운 부분 3줄)에 답한다. 답은 본인과 AI만 보고, 결과는 배치표에 "추가 질문으로 정했어요"라고만 나온다.',
 rules=[R('<button class="btn">답 제출하고 다음 파트로', '답 제출하고 다음 파트로', action='submitAnswer')],
 front=['보기 4개 중 하나 고르기(라디오)', '파트 탭 표시(지금 답하는 파트 / 다음)', '실서버 모드: 내 질문을 team.questions로 그리고, 제출하면 다음 파트 질문으로 바꾸기',
        '마지막 파트까지 제출하면 9-1로 돌아가 기다림', '겹친 파트가 없는 사람이 들어오면 9-1로 돌려보냄'],
 todo=['남은 시간(remainingSec) 표시 — 지금은 상단바 타이머만 사용', '제출 전에 나가려 할 때 확인'],
 load=['team.questions'], acts=[('답 제출하고 다음 파트로', ['team.answer'])],
 backend=['파트마다 <b>질문 2개</b>를 AI가 만든다(①경험 고르기 + 한 줄 설명 ②이 파트에서 제일 까다로운 부분을 어떻게 만들지 3줄). 같은 파트의 후보들은 <b>같은 질문</b>을 받는다.',
          '<b>답 원문은 본인과 AI만</b> 본다. 다른 후보·진행자·팀장 응답에 절대 넣지 않는다.',
          '겹친 후보가 모두 답하거나 시간이 끝나면 AI가 <b>끝까지 완성해 본 경험</b>과 <b>방법이 구체적인지</b>를 보고 누가 맡을지 정한다.',
          '결과는 배치표에 <b>"추가 질문으로 정했어요"</b>라고만 표시한다. 점수·누가 더 못했는지는 저장만 하고 공개하지 않는다.',
          '판단이 끝나면 단계를 team.assign으로 넘기고 stage.changed를 보낸다.'],
 events=['stage.changed'],
 js=r'''/* 9-2 겹친 후보 질문 */
const esc = App.escape;
let data = null, idx = 0;

function render() {
  const it = data.items[idx];
  if (!it) return;
  const tabs = App.$('.qtabs');
  tabs.querySelectorAll('.qtab').forEach(n => n.remove());
  const hint = tabs.querySelector('.q9');
  data.items.forEach((x, i) => hint.insertAdjacentHTML('beforebegin',
    `<span class="qtab${i === idx ? ' on' : ''}">${esc(x.partName)} · ${i === idx ? '답하는 중' : (x.status === 'done' ? '제출함' : '다음')}</span>`));
  hint.textContent = it.otherCandidateCount
    ? `다른 후보 ${it.otherCandidateCount}명도 같은 질문에 답하고 있어요`
    : '이 파트의 후보는 나만 남았어요';
  App.$('.dvh .aside').textContent = `파트 ${idx + 1} / ${data.items.length}`;

  const [q1, q2] = it.questions;
  const heads = App.$$('.qh');
  heads[0].innerHTML = `<i>Q1</i>${esc(q1.text)}`;
  App.$('.opts9').innerHTML = q1.options.map(o =>
    `<div class="opt9" data-value="${esc(o.value)}"><span class="radio"></span>${esc(o.label)}</div>`).join('');
  App.$$('.sub9')[0].textContent = q1.detailLabel;
  const detail = App.$('input.inp');
  detail.value = (it.answer && it.answer.q1 && it.answer.q1.detail) || '';
  detail.placeholder = q1.detailPlaceholder || '';
  heads[1].innerHTML = `<i>Q2</i>${esc(q2.text)}`;
  App.$('.ctx9').innerHTML = App.rich(q2.context);
  const ta = App.$('textarea.ta9');
  ta.value = (it.answer && it.answer.q2 && it.answer.q2.text) || '';
  ta.placeholder = '3줄 정도로 적어주세요';
  App.$$('.sub9')[1].textContent = q2.hint;
  App.$('[data-action="submitAnswer"]').textContent = idx + 1 < data.items.length ? '답 제출하고 다음 파트로' : '답 제출하고 마치기';
}

App.action('submitAnswer', async () => {
  const it = (data && data.items[idx]) || null;
  const choice = App.$('.opt9.on');
  const detail = App.$('input.inp').value.trim();
  const text = App.$('textarea.ta9').value.trim();
  if (!choice) { App.toast('보기 중 하나를 골라주세요'); return false; }
  if (!text) { App.toast('까다로운 부분을 어떻게 만들지 적어주세요'); App.$('textarea.ta9').focus(); return false; }
  const body = { answers: { q1: { choice: choice.dataset.value || App.text(choice), detail }, q2: { text } } };
  const r = await api.call('team.answer', { partId: it ? it.partId : 'prt_1' }, body);
  if (data && data.items[idx]) data.items[idx].status = 'done';
  if (r.nextPartId && data) {
    idx = Math.max(0, data.items.findIndex(x => x.partId === r.nextPartId));
    render();
    App.toast('다음 파트 질문이에요');
  } else {
    App.toast('답을 모두 보냈어요 · 다른 후보를 기다려요');
    App.go(App.screen('09-1-part-split'));
  }
  return false;
});

async function load() {
  data = await api.call('team.questions');
  if (IE_CONFIG.useMock) return;                       // 목업 모드: 화면의 디자인 예시 그대로
  if (!data.items.length) { App.go(App.screen('09-1-part-split')); return; }
  const i = data.items.findIndex(x => x.status !== 'done');
  idx = i < 0 ? data.items.length - 1 : i;
  render();
}
load();

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'stage.changed' && ev.data.stage.id !== 'team.questions') {
    const want = App.stageScreen(ev.data.stage, App.state.role, App.state.isLeader);
    if (want) App.go(App.screen(want));
  }
});
''')

# ───────── 9-3 배치 초안 ─────────
ASSIGN_RENDER = r'''
function memberCard(m) {
  const counts = [`핵심 ${m.counts.core}`, `보통 ${m.counts.normal}`, `작은 일 ${m.counts.small}`].join(' · ');
  const tag = m.over ? '<span class="pill9 w">많아요</span>' : (m.changeFromDraft === 'less' ? '<span class="pill9">줄었어요</span>' : '');
  return `<div class="lc${m.isMe ? ' me' : ''}${m.over ? ' over' : ''}"><div class="n">${Team.av(m)}${esc(m.nickname)}` +
         `${m.isMe ? ' <small>(나)</small>' : ''}${tag}</div><div class="bar"><i style="width:${m.loadPct}%"></i></div><div class="c">${counts}</div></div>`;
}
function methodCell(p) {
  if (p.method === 'excluded') return `<span class="q9">${esc(p.alternative || '')} · 팀 선택</span>`;
  if (p.method === 'question') return '<span class="pill9 k">추가 질문으로 정했어요</span>';
  return `<span class="q9">${esc(p.methodLabel || '')}</span>`;
}
'''
S93 = dict(key='09-3-assign-draft', num='9-3', group='team', title='배치 초안 (모두가 보는 화면)', who='모두 (팀장은 9-4)', team=True,
 summary='파트마다 가장 잘할 사람으로 만든 AI 배치 초안. 사람별 분량 막대와 "이렇게 맞췄어요" 설명을 보고, 회의에서 바꾸고 싶은 파트를 표시해 두면 팀장 화면에 모인다.',
 rules=[R('<button class="btn ghost sm" style="width:100%;margin-top:10px">이야기해 볼 파트 표시하기', '이야기해 볼 파트 표시하기', action='markMode')],
 front=['실서버 모드: 분량 카드·배치표·작은 일·오른쪽 설명을 team.assignment로 그리기',
        '"이야기해 볼 파트 표시하기" → 표시 모드에서 파트 줄을 눌러 표시/해제 (team.mark)',
        '팀장이 바꾸면(team.assignment.updated) 자동으로 다시 그리기', '팀장이 확정하면 보고서(9-5)로 이동',
        '팀장이 이 화면을 열면 팀장 화면(9-4)으로 보냄'],
 todo=['표시 모드 디자인 확인 (지금은 표시한 줄에 회색 "표시함" 배지만)'],
 load=['team.assignment'], acts=[('파트 줄 누르기(표시 모드)', ['team.mark'])],
 backend=['<b>배치 초안</b>: 겹친 파트는 추가 질문 결과로, 후보 1명인 파트는 그대로, 후보 없는 파트는 담당 없이 대안으로 둔다.',
          '<b>작은 일</b>은 핵심·보통 파트가 적은 사람일수록 더 맡게 나눠서 네 사람의 <b>분량이 비슷</b>해지게 한다. 분량은 파트마다 추정한 작업량(effort)의 합.',
          '<b>표시(mark)</b>는 "회의에서 이야기해 보자"는 뜻이다. 누가 표시했는지는 <b>팀장에게만</b> 보여준다.',
          '팀원(팀장이 아닌 사람)이 부르는 응답에는 marks·changes·suggestion을 넣지 않는다.',
          '배치가 바뀔 때마다 version을 올리고 team.assignment.updated 이벤트를 보낸다.'],
 events=['team.assignment.updated', 'team.confirmed', 'stage.changed'],
 js=r'''/* 9-3 배치 초안 */
const esc = App.escape;
let cur = null, marking = false;
''' + ASSIGN_RENDER + r'''
function render(a) {
  cur = a;
  App.$('.load9').innerHTML = a.members.map(memberCard).join('');

  const tab = App.$('.ptab');
  tab.querySelectorAll('.pg9,.pr9,.sm9').forEach(n => n.remove());
  const marked = a.markedByMe || [];
  const row = (p) => {
    const who = p.assignee ? Team.who9(p.assignee) : '<span class="q9">담당 없음</span>';
    const mark = marked.includes(p.partId) ? '<span class="pill9 mk">표시함</span>' : '';
    return `<div class="pr9${p.method === 'excluded' ? ' out' : ''}" data-part-id="${esc(p.partId)}">` +
           `<span class="pn">${esc(p.name)}${mark}</span>${who}<span class="cand">${methodCell(p)}</span></div>`;
  };
  [['core', '결과를 좌우하는 파트'], ['normal', '보통 파트']].forEach(([tier, label]) => {
    const parts = a.parts.filter(p => p.tier === tier);
    if (parts.length) tab.insertAdjacentHTML('beforeend', `<div class="pg9">${label}</div>` + parts.map(row).join(''));
  });
  const small = a.parts.filter(p => p.tier === 'small');
  if (small.length) tab.insertAdjacentHTML('beforeend', '<div class="pg9">작은 일 · 분량 맞추기</div><div class="sm9">' +
    small.map(p => `<div data-part-id="${esc(p.partId)}"><span>${esc(p.name)}</span>${p.assignee ? Team.who9(p.assignee) : ''}</div>`).join('') + '</div>');

  const [balance, , mine] = App.$$('.p9side .sc2');
  balance.querySelector('p').textContent = a.balance.note;
  balance.querySelectorAll('.mine9').forEach(n => n.remove());
  a.balance.smallTaskCounts.forEach(x => balance.insertAdjacentHTML('beforeend',
    `<div class="mine9"><span class="pill9">${x.count}개</span>${esc(x.nickname)} · ${esc(x.why)}</div>`));
  const myParts = a.myParts && a.myParts.length ? a.myParts : a.parts.filter(p => p.assignee && p.assignee.isMe).map(p => p.name);
  mine.querySelector('h4').textContent = `내 파트 ${myParts.length}개`;
  mine.querySelector('p').textContent = myParts.join(' · ') || '맡은 파트가 없어요';
}

App.action('markMode', async (el) => {
  marking = !marking;
  el.textContent = marking ? '표시 끝내기' : '이야기해 볼 파트 표시하기';
  App.$('.ptab').classList.toggle('marking', marking);
  App.toast(marking ? '이야기해 볼 파트를 눌러주세요' : '표시를 마쳤어요');
  return false;
});

// 목업 모드에서는 화면의 디자인 예시 줄에 임시 partId를 붙여 표시 동작을 확인할 수 있게 함
App.$$('.ptab .pr9, .ptab .sm9 > div').forEach((r, i) => { if (!r.dataset.partId) r.dataset.partId = 'prt_' + (i + 1); });

App.$('.ptab').addEventListener('click', async (e) => {
  if (!marking) return;
  const row = e.target.closest('[data-part-id]');
  if (!row) return;
  const on = !row.querySelector('.pill9.mk');
  const done = await App.run(null, () => api.call('team.mark', { partId: row.dataset.partId }, { marked: on }));
  if (done === false) return;
  row.querySelector('.pill9.mk')?.remove();
  if (on) row.querySelector('.pn,span').insertAdjacentHTML('beforeend', '<span class="pill9 mk">표시함</span>');
  App.toast(on ? '팀장 화면에 표시됐어요' : '표시를 해제했어요');
});

async function load() {
  const a = await api.call('team.assignment');
  if (a.viewer && a.viewer.isLeader) { App.go(App.screen('09-4-leader-confirm')); return; }
  render(a);
}

realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'team.assignment.updated' && !IE_CONFIG.useMock) load();
  if (ev.type === 'team.confirmed' || (ev.type === 'stage.changed' && ev.data.stage.id === 'report')) App.go(App.screen('09-5-report'));
});
''' + NOT_MOCK + '\n')

# ───────── 9-4 팀장 확정 ─────────
S94 = dict(key='09-4-leader-confirm', num='9-4', group='team', title='팀장 확정 — 회의 내용 반영', who='팀장', team=True,
 summary='팀장이 회의에서 말로 정한 대로 담당을 바꾸고 확정한다. 바꾼 줄은 표시되고, 분량이 한쪽으로 쏠리면 작은 일을 옮기자는 제안이 뜬다. 확정하면 모두에게 보고서가 열린다.',
 rules=[R('<button class="btn ghost sm">그대로 둘게요', '그대로 둘게요 (제안 닫기)', action='keepSuggestion'),
        R('<button class="btn sm">옮기기', '옮기기 (제안대로 바꾸기)', action='moveSuggestion'),
        R('<button class="btn ghost sm" style="width:100%;margin-top:8px">AI 초안으로 되돌리기', 'AI 초안으로 되돌리기', action='revertAssign'),
        R('<button class="btn block">이대로 확정하고 보고서 만들기', '이대로 확정하고 보고서 만들기', action='confirmAssign')],
 front=['맡은 사람 칸을 누르면 팀원 목록이 열리고, 고르면 담당 변경(team.reassign)',
        '바꾼 줄 강조 · 분량 막대·"많아요/줄었어요" 다시 계산(서버 응답으로)',
        '옮기기 제안 받기 / 그대로 두기', 'AI 초안으로 되돌리기(확인 창)', '확정 → 보고서(9-5)로 이동',
        '팀장이 아닌 사람이 열면 9-3으로 보냄'],
 todo=['담당 고르는 목록(드롭다운) 디자인 확인 — 지금은 흰 카드에 팀원 목록',
       '후보 없는 파트에 담당을 넣고 싶을 때의 화면 (지금은 선택칸 없음)'],
 load=['team.assignment'],
 acts=[('맡은 사람 바꾸기', ['team.reassign']), ('옮기기 / 그대로 둘게요', ['team.suggestion']),
       ('AI 초안으로 되돌리기', ['team.revert']), ('이대로 확정하고 보고서 만들기', ['team.confirm'])],
 backend=['<b>팀장만</b> 담당을 바꾸고 확정할 수 있다(그 외에는 403 NOT_LEADER). 팀장은 주제 확정 때 정해진다.',
          '담당을 바꾸면 <b>분량과 옮기기 제안을 다시 계산</b>해서 배치 전체를 돌려준다. AI 초안과 같아지면 "바꿈" 표시를 뗀다.',
          '<b>확정</b>: 요청의 version이 서버와 다르면 409 (그 사이 누가 바꿨다는 뜻). 확정하면 보고서 AI 작업을 시작하고 모두에게 stage.changed(report)를 보낸다.',
          '확정 뒤에도 팀장은 담당을 고칠 수 있고, 그러면 보고서를 다시 만든다(report.ready).'],
 events=['team.assignment.updated', 'stage.changed'],
 js=r'''/* 9-4 팀장 확정 */
const esc = App.escape;
let cur = null;
''' + ASSIGN_RENDER + r'''
function statusCell(p) {
  if (p.method === 'excluded') return `<span class="q9">${esc(p.alternative || '')}</span>`;
  if (p.changed) return `<span class="pill9 solid">회의에서 바꿈</span><span class="q9">AI 초안: ${esc((p.aiAssignee || {}).nickname || '')}</span>`;
  if (p.method === 'question') return '<span class="q9">추가 질문으로 정함</span>';
  return '<span class="q9">AI 초안 그대로</span>';
}
function select(p) {
  if (!p.assignee) return '<span class="q9"></span>';
  return `<span class="sel9${p.changed ? ' chg' : ''}" data-part-id="${esc(p.partId)}">${Team.av(p.assignee)}${esc(p.assignee.nickname)}</span>`;
}

function render(a) {
  cur = a;
  App.$('.load9').innerHTML = a.members.map(memberCard).join('');

  const tab = App.$('.ptab');
  tab.querySelectorAll('.pg9,.pr9,.sm9').forEach(n => n.remove());
  const markTag = (p) => (p.marks || []).length ? `<span class="pill9 k mk">${esc(p.marks[0].nickname)} 님이 표시</span>` : '';
  const row = (p) => `<div class="pr9${p.method === 'excluded' ? ' out' : ''}${p.changed ? ' chg' : ''}" data-part-id="${esc(p.partId)}">` +
    `<span class="pn">${esc(p.name)}${markTag(p)}</span>${select(p)}<span class="cand">${statusCell(p)}</span></div>`;
  [['core', '결과를 좌우하는 파트'], ['normal', '보통 파트']].forEach(([tier, label]) => {
    const parts = a.parts.filter(p => p.tier === tier);
    if (parts.length) tab.insertAdjacentHTML('beforeend', `<div class="pg9">${label}</div>` + parts.map(row).join(''));
  });
  const small = a.parts.filter(p => p.tier === 'small');
  if (small.length) tab.insertAdjacentHTML('beforeend', '<div class="pg9">작은 일</div><div class="sm9">' +
    small.map(p => `<div data-part-id="${esc(p.partId)}"><span>${esc(p.name)}</span>${select(p)}</div>`).join('') + '</div>');

  const warn = App.$('.sc2.warn9');
  warn.hidden = !a.suggestion;
  if (a.suggestion) {
    const s = a.suggestion;
    warn.querySelector('p').textContent = s.reason;
    warn.querySelector('.sug9 span:last-child').textContent = `${s.partName} · ${s.from.nickname} → ${s.to.nickname}`;
    warn.dataset.suggestionId = s.suggestionId;
  }
  const changes = App.$$('.p9side .sc2')[1];
  changes.querySelectorAll('.chgl').forEach(n => n.remove());
  const btn = changes.querySelector('button');
  (a.changes || []).forEach(c => {
    const html = c.type === 'mark'
      ? `<span class="pill9 k">표시</span><span>${esc(c.partName)} — ${esc(c.by.nickname)} 님이 이야기해 보자고 표시</span>`
      : `<span class="pill9 w">바꿈</span><span>${esc(c.partName)} · ${esc(c.from.nickname)} → ${esc(c.to.nickname)}</span>`;
    btn.insertAdjacentHTML('beforebegin', `<div class="chgl">${html}</div>`);
  });
  changes.querySelector('h4').textContent = `회의에서 바꾼 것${(a.changes || []).length ? '' : ' 없음'}`;
  btn.hidden = !(a.changes || []).some(c => c.type === 'change');
}

/* 맡은 사람 고르기 */
function closeMenu() { App.$('.menu9')?.remove(); }
document.addEventListener('click', async (e) => {
  const sel = e.target.closest('.sel9');
  const item = e.target.closest('.menu9 [data-participant-id]');
  if (item) {
    const box = item.closest('.sel9');
    const partId = (box && box.dataset.partId) || App.$('.menu9').dataset.partId || '';
    const html = item.innerHTML;
    closeMenu();
    const r = await App.run(null, () => api.call('team.reassign', { partId: partId || 'prt_1' }, { participantId: item.dataset.participantId }));
    if (r === false) return;
    if (IE_CONFIG.useMock) {                                  // 목업 모드: 고른 이름만 바꿔서 보여줌
      if (box) { box.innerHTML = html; box.classList.add('chg'); box.closest('.pr9')?.classList.add('chg'); }
    } else render(r);
    App.toast('맡은 사람을 바꿨어요');
    return;
  }
  const wasOpen = !!(sel && sel.querySelector('.menu9'));
  closeMenu();
  if (!sel || wasOpen) return;
  const members = (cur && cur.members) || [];
  if (!members.length) { App.toast('팀원 목록을 불러오지 못했어요'); return; }
  const menu = document.createElement('div');
  menu.className = 'menu9';
  menu.dataset.partId = sel.dataset.partId || '';
  menu.innerHTML = members.map(m => `<div data-participant-id="${esc(m.participantId)}">${Team.av(m)}${esc(m.nickname)}</div>`).join('');
  sel.appendChild(menu);
});

App.action('moveSuggestion', async () => {
  const warn = App.$('.sc2.warn9');
  const r = await api.call('team.suggestion', { suggestionId: warn.dataset.suggestionId || 'sug_1' }, { accept: true });
  if (IE_CONFIG.useMock) warn.hidden = true; else render(r);
  App.toast('작은 일을 옮겼어요');
  return false;
});
App.action('keepSuggestion', async () => { App.$('.sc2.warn9').hidden = true; return false; });
App.action('revertAssign', async () => {
  if (!(await App.confirm('AI 초안으로 되돌릴까요?', '팀장이 바꾼 담당이 모두 AI 초안으로 돌아가요. 팀원이 표시한 파트는 남아요.', '되돌리기'))) return false;
  const r = await api.call('team.revert', {}, {});
  if (!IE_CONFIG.useMock) render(r);
  App.toast('AI 초안으로 되돌렸어요');
  return false;
});
App.action('confirmAssign', async () => {
  if (!(await App.confirm('이대로 확정할까요?', '확정하면 모두에게 보고서가 열려요. 확정한 뒤에도 팀장은 담당을 다시 고칠 수 있어요.', '확정하기'))) return false;
  await api.call('team.confirm', {}, { version: (cur && cur.version) || 1 });
  App.go(App.screen('09-5-report'));
  return false;
});

async function load() {
  const a = await api.call('team.assignment');
  if (a.viewer && !a.viewer.isLeader) { App.go(App.screen('09-3-assign-draft')); return; }
  render(a);
}
realtime.connect(App.sessionId(), (ev) => { if (ev.type === 'team.assignment.updated' && !IE_CONFIG.useMock) load(); });
''' + NOT_MOCK + r'''
if (IE_CONFIG.useMock) api.call('team.assignment').then(a => { cur = a; });   // 목업 모드: 이름 목록만 미리 받아둠
''')

# ───────── 9-5 보고서 ─────────
S95 = dict(key='09-5-report', num='9-5', group='team', title='최종 보고서 (A4 세로 2쪽)', who='모두 (지난 세션 기록에서도)', team=True,
 summary='확정된 배치로 만든 최종 보고서. PDF와 같은 A4 세로 2쪽으로 보여주고, 페이지를 누르면 크게 볼 수 있다. 링크 복사·PDF 저장(브라우저 인쇄)도 여기서 한다.',
 rules=[R('<button class="btn">PDF로 저장', 'PDF로 저장 (브라우저 인쇄)', action='savePdf')],
 front=['A4 페이지를 누르면 크게 보기 팝업(실제 크기 · 위아래 스크롤 · ✕·바깥·Esc로 닫기)',
        'PDF로 저장 = 브라우저 인쇄로 A4 2쪽 그대로 저장', '링크 복사(참가자만 열 수 있는 주소)',
        '실서버 모드: report.get으로 1쪽(요약·투표·파트)과 2쪽(워크플로우)을 다시 그리기',
        '지난 세션 기록(A4)에서 `?sessionId=`로 들어오면 그 세션 보고서를 보여줌',
        '보고서가 아직 준비 중이면(ready=false) 안내 후 report.ready 이벤트를 기다림'],
 todo=['보고서 만드는 중 화면 디자인 (지금은 안내 문구만)', '팀장이 보고서에서 담당을 다시 고치는 화면 (API는 team.reassign으로 준비됨)',
       '로그인 없이 볼 수 있는 공개 링크를 만들지 정책 결정'],
 load=['report.get'], acts=[('PDF로 저장', [])],
 backend=['<b>보고서</b>는 배치 확정 때 AI가 만든다(요약 문장 + 팀 워크플로우 4단계). 만드는 동안에는 ready=false, 끝나면 report.ready 이벤트.',
          '내용은 모두 <b>이미 저장된 데이터</b>에서 만든다: 투표 결과·AI 검증·익명 댓글 요약·숨은 공통점·확정된 파트 배치.',
          '<b>익명 규칙</b>: 아이디어 주인과 파트 담당 이름은 보여주지만, 댓글 쓴 사람·누가 어디에 투표했는지·인터뷰 답 원문·추가 질문 답은 절대 넣지 않는다.',
          '세션이 끝난 뒤에도 <b>그 세션 참가자였던 회원</b>은 계속 볼 수 있다(지난 세션 기록 A4).',
          'PDF는 <b>서버에서 만들지 않는다</b>. 프론트가 브라우저 인쇄로 A4 2쪽을 그대로 저장한다.',
          '팀장이 담당을 고치면(team.reassign) 보고서의 파트·워크플로우를 다시 만들고 version을 올린다.'],
 events=['report.ready'],
 js=r'''/* 9-5 최종 보고서 (A4 2쪽) */
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
const av = (n) => `<i class="av9">${esc(n[0])}</i>`;
const kv = (k, v) => `<div class="pp-kv"><span>${esc(k)}</span><div>${v}</div></div>`;
const GRADE = { go: '바로 해볼 만해요', fix: '보완하면 좋아요', re: '다시 생각해 봐요' };

function page1(r) {
  const w = r.why, f = r.feasibility, p = r.parts;
  const part = (x) => `<div class="pp-part"><span>${esc(x.name)}</span><span class="pp-who">${av(x.assignee)}${esc(x.assignee)}</span></div>`;
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
  const card = (t) => `<div class="pp-card">${av(t.nickname)}<div><b>${esc(t.nickname)}${t.lead ? `<small>${esc(t.lead)}</small>` : ''}</b>` +
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
    r.workflow.always.map(a => `<span>${esc(a.text)}</span><b>${esc(a.nickname)}</b>`).join('') + '</div></div>' +
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

async function load() {
  const r = await api.call('report.get');
  if (!r.ready) { App.toast('보고서를 만드는 중이에요. 잠시만 기다려 주세요'); return; }
  render(r);
}

const fromHistory = new URLSearchParams(location.search).get('sessionId');
if (fromHistory) App.save({ sessionId: fromHistory });

realtime.connect(App.sessionId(), (ev) => { if (ev.type === 'report.ready') load(); });
''' + NOT_MOCK + '\n')

TEAM_SCREENS = [S91, S92, S93, S94, S95]
i = [n for n, s in enumerate(SCREENS) if s['key'] == '08-7-vote-result-host'][0] + 1
SCREENS[i:i] = TEAM_SCREENS
GROUPS.insert(3, ('team', '9 · 파트 나누기 · 보고서', '파트와 후보 → 겹친 후보 질문 → 배치 초안 → 팀장 확정 → A4 보고서'))

# ───────── 8-5 · 8-6 · 8-7 · A4 를 9번 화면에 연결 ─────────
r5 = K['08-5-ai-review']
r5['backend'] = [b.replace('역할 정하기(9-1)의 "빈 역할"', '파트 나누기(9-1)의 "후보 없음"') for b in r5['backend']]

r6 = K['08-6-vote']
r6['js'] = r6['js'].replace(
    "  if (ev.type === 'vote.closed') App.go(App.screen('08-7-vote-result-host'));   // 모두 결과로 (참가자는 보기 전용)",
    "  if (ev.type === 'vote.closed') App.go(App.screen('08-7-vote-result-host'));   // 모두 결과로 (참가자는 보기 전용)\n"
    "  if (ev.type === 'stage.changed') { const want = App.stageScreen(ev.data.stage, App.state.role, App.state.isLeader); if (want) App.go(App.screen(want)); }")
assert 'stageScreen' in r6['js']

r7 = K['08-7-vote-result-host']
r7['summary'] = r7['summary'].replace('역할 정하기로 넘어간다', '파트 나누기(9-1)로 넘어간다')
r7['rules'] = [R('<button class="btn block lg">1위로 확정하고', '○위로 확정하고 파트 나누기 →', action='confirmTopic'),
               R('<button class="btn ghost sm" style="margin-top:10px;width:100%">동점만 다시 투표', '동점만 다시 투표', action='revote')]
r7['front'] = ['결과 줄 누르면 라디오 선택 + 버튼 문구 "N위로 확정하고…" 변경', '주제 확정 → 파트 나누기(9-1)로 이동',
               '동점 재투표(확인 창)', '실서버 모드에서 결과 목록 그리기(renderResults)',
               '참가자는 같은 화면에서 라디오·확정·재투표 버튼을 숨김(보기 전용) · topic.confirmed를 받으면 9-1로']
r7['todo'] = ['팀장 고르기 UI (지금은 진행자가 그대로 팀장 · topic.confirm의 leaderParticipantId 는 준비됨) — 디자인 필요']
r7['backend'] = [b.replace('역할 정하기 단계로 넘긴다', '파트 나누기 단계(team.split)로 넘긴다').replace('역할 초안 AI 작업', '파트 나누기 AI 작업') for b in r7['backend']]
r7['backend'].append('<b>팀장</b>: topic.confirm의 leaderParticipantId로 배치를 확정할 사람을 정한다. 안 보내면 진행자가 팀장이 된다(9-4).')
r7['js'] = r7['js'].replace("confirmBtn.textContent = `${App.text(e.detail.querySelector('.num'))}위로 확정하고 역할 정하기 →`;",
                            "confirmBtn.textContent = `${App.text(e.detail.querySelector('.num'))}위로 확정하고 파트 나누기 →`;")
r7['js'] = r7['js'].replace(
    "  App.toast(`\"${App.text(pick.querySelector('.rt'))}\"(으)로 확정했어요 · 역할 정하기(9-1)는 다음 작업에서 연결돼요`);\n  return false;",
    "  App.toast(`\"${App.text(pick.querySelector('.rt'))}\"(으)로 확정했어요`);\n  App.go(App.screen('09-1-part-split'));\n  return false;")
r7['js'] = r7['js'].replace("확정할 주제를 고르면 역할 정하기로 넘어가요.", "확정할 주제를 고르면 파트 나누기로 넘어가요.")
assert '09-1-part-split' in r7['js'] and '역할' not in r7['js']

a4 = K['A4-session-history']
a4['todo'] = ['목록 끝에서 더 불러오기(nextCursor)', '기록이 하나도 없을 때 빈 화면 디자인']
a4['front'] = a4['front'] + ['"보고서 보기" → 보고서 화면(9-5)으로 이동(sessionId 전달)']
a4['js'] = a4['js'].replace(
    "App.action('openReport', async () => { App.toast('보고서 화면(9-2)은 디자인 수정 후 연결돼요'); return false; });",
    "App.action('openReport', async (el) => {\n"
    "  const id = el.dataset.sessionId || App.state.sessionId;\n"
    "  App.go(App.screen('09-5-report') + (id ? '?sessionId=' + encodeURIComponent(id) : ''));\n"
    "  return false;\n});")
assert '09-5-report' in a4['js']
