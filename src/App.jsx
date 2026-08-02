import { useState, useEffect, useRef } from "react";
import { Users, Check, ChevronRight, ChevronLeft, Lightbulb, Target, BarChart3, FileText, ArrowRight, Plus, Heart, Send, Vote, Sparkles, Play } from "lucide-react";
import { api } from "./api.js";

/* ═══════════════════════════════════════════
   일관된 데이터 세트 — 모든 단계가 연결됨
   ═══════════════════════════════════════════ */

const MEMBERS = [
  { id: "sh", name: "김승희", initial: "김", color: "bg-blue-500 text-white", isHost: true, skills: ["기획", "발표"], strengths: "팀 방향을 잡고 정리하는 역할" },
  { id: "jm", name: "전재민", initial: "전", color: "bg-purple-500 text-white", skills: ["디자인", "프론트엔드"], strengths: "UI/UX와 화면 구현" },
  { id: "kb", name: "조경빈", initial: "조", color: "bg-amber-500 text-white", skills: ["백엔드", "데이터"], strengths: "서버·DB 설계" },
  { id: "jg", name: "이중곤", initial: "이", color: "bg-rose-500 text-white", skills: ["AI/ML", "리서치"], strengths: "모델링·자료조사" },
];

/* 선택 가능한 역량 목록 (프로필 작성용) */
const SKILL_OPTIONS = ["기획", "발표", "마케팅", "디자인", "UX", "프론트엔드", "백엔드", "데이터", "인프라", "AI/ML", "리서치", "논문"];

/* 아이스브레이킹 답변 → 이 불편함이 아이디어의 씨앗이 됨 */
const ICE_ANSWERS = [
  { memberId: "sh", text: "팀플 첫 미팅에서 서로 눈치만 보다가 시간이 다 갔어요. 결국 제일 외향적인 한 사람이 다 정했고, 나머지는 그냥 따라갔습니다.", likes: 7 },
  { memberId: "jm", text: "동네 카페에서 작업하려는데 콘센트 있는 자리 정보가 없어서 매번 헛걸음해요. 리뷰에도 그런 정보가 없더라고요.", likes: 4 },
  { memberId: "kb", text: "자취하면서 냉장고 식재료를 자주 버리게 돼요. 유통기한을 일일이 기억할 수가 없어서 매주 음식물 쓰레기가 나와요.", likes: 5 },
  { memberId: "jg", text: "수업 끝나고 복습하려면 필기를 다시 찾아야 하는데, 사진으로 찍어둔 게 폴더별로 정리가 안 돼서 항상 헤매요. 시험 기간에 특히 스트레스예요.", likes: 6 },
];

/* 아이디어 — 각자의 아이스브레이킹 불편함에서 파생 */
const IDEAS = [
  { id: 1, memberId: "sh", title: "AI가 팀 분위기를 읽고 자동으로 회의를 진행해주는 퍼실리테이터 봇", tags: ["AI", "TEAM", "UX"], likes: 6, fromIce: "팀플 눈치 보는 문제에서 착안" },
  { id: 2, memberId: "jm", title: "동네 카페·작업공간의 실시간 좌석·콘센트·소음 정보를 공유하는 앱", tags: ["LOCAL", "REALTIME", "MAP"], likes: 9, fromIce: "카페 헛걸음 문제에서 착안" },
  { id: 3, memberId: "kb", title: "냉장고 식재료를 카메라로 스캔하면 유통기한을 추적하고 레시피를 추천하는 앱", tags: ["FOOD", "AI", "LIFE"], likes: 4, fromIce: "식재료 낭비 문제에서 착안" },
  { id: 4, memberId: "jg", title: "수업 필기 사진을 AI가 자동 분류·요약하고 시험 전 핵심 개념을 퀴즈로 출제하는 학습 도우미", tags: ["EDU", "AI", "OCR"], likes: 7, fromIce: "필기 정리 스트레스에서 착안" },
];

/* 분석 테마 — 아이디어에서 AI가 그룹화 */
const THEMES = [
  { id: 1, name: "AI 커뮤니케이션 도구", desc: "팀 소통과 회의 진행을 AI가 보조", items: ["AI 퍼실리테이터 봇", "실시간 회의 요약", "익명 의견 수렴 시스템"], pct: 38, votes: 19, sourceIdea: "김승희의 '회의 진행 봇'에서 파생" },
  { id: 2, name: "AI 학습·생산성 도구", desc: "학습과 작업 효율을 AI가 자동화", items: ["필기 자동 분류·요약", "핵심 개념 퀴즈 생성", "학습 루틴 최적화"], pct: 27, votes: 13, sourceIdea: "이중곤의 '학습 도우미'에서 파생" },
  { id: 3, name: "하이퍼로컬 생활 정보", desc: "동네 공간·생활 데이터를 실시간 수집", items: ["카페 좌석/콘센트 실시간 정보", "식재료 유통기한 자동 추적", "동네 생활 AI 어시스턴트"], pct: 23, votes: 11, sourceIdea: "전재민 + 조경빈의 아이디어를 AI가 결합" },
  { id: 4, name: "통합 플랫폼: AI 인지부하 감소", desc: "Theme 1~3을 관통하는 핵심 가치 기반 통합", items: ["반복 판단의 AI 위임", "상황 인식형 자동 추천", "크로스 도메인 데이터 연동"], pct: 12, votes: 6, sourceIdea: "AI가 4개 아이디어의 공통 구조에서 도출" },
];

/* AI Assistant 메시지 — 제출할수록 추가됨 */
const AI_MSGS_ICE = [
  { type: "summary", title: "패턴 분석 완료", text: "4명의 답변에서 흥미로운 공통점이 보입니다. 모두 '매일 반복되는 상황인데, 필요한 정보를 제때 얻지 못해서' 불편을 겪고 있어요. 눈치 보는 팀플, 콘센트 없는 카페, 유통기한 모르는 냉장고, 정리 안 되는 필기 — 전부 '정보가 있는데 접근이 안 되는' 구조입니다. 다음 단계에서 이 공통 구조를 해결하는 아이디어를 발산해보세요." },
];
const AI_MSGS_IDEA = [
  { type: "keyword", title: "구조적 유사성 감지", text: "김승희님의 'AI 퍼실리테이터'와 이중곤님의 'AI 학습 도우미'가 동일한 패턴을 공유합니다 — '사람이 직접 해야 했던 판단을 AI가 대신하는' 구조예요. 이 패턴을 다른 영역에도 적용해볼 수 있을까요?" },
  { type: "connect", title: "아이디어 간 연결점 발견", text: "전재민님의 '로컬 공간 정보'와 조경빈님의 '식재료 관리'는 둘 다 '내 주변 환경의 실시간 데이터를 수집해서 즉시 활용'하는 구조입니다. 만약 이 둘을 합치면 — 동네 생활 전반을 커버하는 하이퍼로컬 AI 어시스턴트가 됩니다." },
  { type: "expand", title: "핵심 가치 도출", text: "4개 아이디어의 공통 핵심이 보입니다: '반복적으로 발생하는 판단을 AI에 위임하여 사용자의 인지 부하를 줄인다.' 이것을 서비스의 핵심 가치로 설정하면, 개별 아이디어를 하나의 플랫폼으로 통합하는 그림이 그려집니다." },
];

/* 최종 보고서 — 투표 1위 테마 기반 */
const REPORT = {
  title: "AI 커뮤니케이션 퍼실리테이터",
  desc: "팀 프로젝트 초반의 어색함과 비효율을 AI가 구조화된 세션으로 해결하는 서비스입니다. 아이스브레이킹부터 아이디어 발산, 투표, 결과 정리까지 AI가 자동으로 진행합니다.",
  score: 94,
  coreValues: ["제로 세팅 (링크 하나로 참여)", "AI 자동 진행 (퍼실리테이터 대체)", "익명 입력 (심리적 안전감)"],
  targets: ["팀플 과목 수강 대학생 (초면 불안)", "해커톤 참가자 (시간 부족)", "기업 워크샵 TF팀 (구조 필요)"],
  risks: ["기존 도구(Miro) 대비 차별성 인지", "AI 개입 수준에 대한 거부감", "결과물 품질 신뢰도 확보"],
  actions: [
    { task: "MVP 핵심 기능 정의 및 우선순위 도출", who: "김승희", date: "6. 20." },
    { task: "대학생 5명 대상 사용성 테스트 설계 및 진행", who: "전재민", date: "6. 22." },
    { task: "와이어프레임 → Hi-fi 프로토타입 제작", who: "조경빈", date: "6. 25." },
    { task: "AI 퍼실리테이터 프롬프트 설계 및 톤앤매너 정의", who: "이중곤", date: "6. 23." },
  ],
};

const PHASES = [
  { key: "ice", label: "아이스브레이킹", duration: 10, icon: "💬", color: "from-pink-500 to-purple-500", desc: "어색함 해소 + 주제 워밍업" },
  { key: "idea", label: "아이디어 발산", duration: 20, icon: "💡", color: "from-amber-500 to-orange-500", desc: "자유 브레인스토밍 + AI 자극" },
  { key: "analyze", label: "AI 분석 + 투표", duration: 15, icon: "📊", color: "from-blue-500 to-cyan-500", desc: "테마 그룹화 + 팀 투표" },
  { key: "report", label: "결과 보고서", duration: 5, icon: "📋", color: "from-green-500 to-emerald-500", desc: "AI 요약 + 액션 아이템" },
];

/* ═══════ [1번] 오프라인 / 온라인 모드 정의 ═══════ */
const MODES = {
  offline: {
    key: "offline", label: "오프라인 모드", icon: "🏫",
    tagline: "해커톤 · 다 같이 한 공간에서",
    points: ["전원이 모여야 시작", "공유 타이머로 다 함께 진행", "현장의 긴장감과 즉석 반응을 살림"],
  },
  online: {
    key: "online", label: "온라인 모드", icon: "🌐",
    tagline: "팀플 · 각자 편한 시간에",
    points: ["링크만 있으면 지금 바로 시작", "마감 시간까지 각자 참여", "늦게 온 사람에겐 AI가 지금까지의 논의를 브리핑"],
  },
};

/* ═══════ [2번] 프로필(역량) → 아이디어 각도 배분 ═══════
   같은 질문을 모두에게 던지면 비슷한 답이 나온다.
   각 참여자를 '서로 다른 각도'에 세워 발산의 다양성을 구조적으로 보장한다.
   각도는 무작위가 아니라 개인의 역량(프로필)에서 배정된다. */
const ANGLES = {
  biz:   { id: "biz",   label: "비즈니스 · 시장", icon: "📈", hint: "누가 돈을 내고, 왜 하필 지금인가?",       cls: "bg-amber-50 border-amber-300 text-amber-800" },
  ux:    { id: "ux",    label: "사용자 경험",     icon: "🎨", hint: "실제 사용자가 겪는 결정적 순간의 불편은?", cls: "bg-purple-50 border-purple-300 text-purple-800" },
  tech:  { id: "tech",  label: "기술 실현 가능성", icon: "⚙️", hint: "제한된 시간 안에 진짜로 만들 수 있는가?",  cls: "bg-blue-50 border-blue-300 text-blue-800" },
  novel: { id: "novel", label: "기술 혁신",       icon: "🚀", hint: "기존에 없던, 우리만의 방식은 무엇인가?",   cls: "bg-rose-50 border-rose-300 text-rose-800" },
};
const SKILL_ANGLE = {
  "기획": "biz", "발표": "biz", "마케팅": "biz",
  "디자인": "ux", "UX": "ux", "프론트엔드": "ux",
  "백엔드": "tech", "데이터": "tech", "인프라": "tech",
  "AI/ML": "novel", "리서치": "novel", "논문": "novel",
};
/* 역량 → 각도 배정. 우선 매칭되는 첫 역량 기준, 없으면 biz. (개인 미리보기용) */
function assignAngle(skills = []) {
  for (const s of skills) if (SKILL_ANGLE[s]) return ANGLES[SKILL_ANGLE[s]];
  return ANGLES.biz;
}

/* 팀 단위 각도 배정 — 전원이 같은 각도로 몰리지 않도록 중복을 최소화한다.
   각자 역량에 맞는 각도를 우선 주되, 이미 쓰인 각도면 남은 각도로 분산. */
function assignTeamAngles(people) {
  const order = ["biz", "ux", "tech", "novel"];
  const used = new Set();
  return people.map(p => {
    const prefs = [];
    for (const s of (p.skills || [])) {
      const k = SKILL_ANGLE[s];
      if (k && !prefs.includes(k)) prefs.push(k);
    }
    if (prefs.length === 0) prefs.push("biz");
    let chosen = prefs.find(k => !used.has(k))        // 선호 중 아직 안 쓴 것
      || order.find(k => !used.has(k))                // 없으면 남은 각도 아무거나
      || prefs[0];                                     // 다 찼으면 선호 재사용
    used.add(chosen);
    return ANGLES[chosen];
  });
}

/* [2번] 팀 프로필 기반 주제 추천 — 지금은 규칙 기반 목업.
   3번(백엔드)에서 이 함수를 실제 LLM 호출로 교체한다. (교체 지점 명시) */
function mockRecommendTopics(profiles) {
  const skills = new Set(profiles.flatMap(p => p.skills || []));
  const has = (...ss) => ss.some(s => skills.has(s));
  const topics = [];
  if (has("AI/ML", "리서치")) topics.push({ title: "학습·연구 과정을 자동화하는 AI 도우미", why: "팀에 AI/ML·리서치 역량이 있어 모델 기반 서비스를 직접 구현할 수 있음" });
  if (has("데이터", "백엔드")) topics.push({ title: "생활 데이터를 실시간 수집·분석하는 서비스", why: "백엔드·데이터 역량이 있어 수집 파이프라인 구축이 현실적" });
  if (has("디자인", "UX", "프론트엔드")) topics.push({ title: "복잡한 과정을 단순한 UX로 바꾸는 도구", why: "디자인·프론트 역량이 강해 사용성으로 차별화 가능" });
  if (has("기획", "발표")) topics.push({ title: "팀 협업의 비효율을 줄이는 생산성 서비스", why: "기획·발표 역량이 있어 문제 정의와 스토리텔링에 강점" });
  while (topics.length < 3) topics.push({ title: "일상의 반복 작업을 줄여주는 자동화 서비스", why: "팀의 공통 관심에서 파생된 범용 방향" });
  return topics.slice(0, 3);
}

/* ═══════ 아이데이션 방식(프레임워크) — 방식마다 발산 단계가 실제로 달라진다 ═══════ */
const SCAMPER_LENSES = [
  { key: "S", name: "대체 (Substitute)",         q: "핵심 요소 중 무엇을 다른 것으로 바꿀 수 있을까?" },
  { key: "C", name: "결합 (Combine)",            q: "어떤 기능·서비스와 합치면 더 강해질까?" },
  { key: "A", name: "응용 (Adapt)",              q: "다른 분야의 방식을 여기에 빌려온다면?" },
  { key: "M", name: "수정·확대 (Modify)",         q: "무엇을 크게 키우거나 강조하면 달라질까?" },
  { key: "P", name: "다른 용도 (Put to other use)", q: "전혀 다른 사용자·상황에 쓴다면?" },
  { key: "E", name: "제거 (Eliminate)",          q: "무엇을 없애도 여전히 동작할까?" },
  { key: "R", name: "반대·재배열 (Reverse)",      q: "순서나 역할을 뒤집으면 어떻게 될까?" },
];
const SIX_HATS = [
  { key: "white",  name: "흰색 · 사실", icon: "⚪", cls: "bg-neutral-100 border-neutral-300 text-neutral-800", q: "지금 확실한 데이터와 사실은 무엇인가?" },
  { key: "red",    name: "빨강 · 감정", icon: "🔴", cls: "bg-rose-50 border-rose-300 text-rose-800",           q: "직관적으로 어떤 느낌이 드는가? (근거 없어도 OK)" },
  { key: "black",  name: "검정 · 위험", icon: "⚫", cls: "bg-neutral-200 border-neutral-500 text-neutral-900",  q: "무엇이 잘못될 수 있는가? 약점은?" },
  { key: "yellow", name: "노랑 · 이점", icon: "🟡", cls: "bg-amber-50 border-amber-300 text-amber-800",         q: "이게 잘 되면 어떤 가치가 생기는가?" },
  { key: "green",  name: "초록 · 창의", icon: "🟢", cls: "bg-green-50 border-green-300 text-green-800",          q: "완전히 새로운 대안은 없을까?" },
  { key: "blue",   name: "파랑 · 정리", icon: "🔵", cls: "bg-blue-50 border-blue-300 text-blue-800",            q: "지금까지 나온 것을 어떻게 정리·결론지을까?" },
];
const METHOD_META = {
  brain:   { id: "brain",   name: "자유 브레인스토밍",   phaseLabel: "자유 발산",     desc: "제한 없이 아이디어를 쏟아냅니다. 각자 배정된 각도에서 시작하세요.", reason: "다양한 방향을 넓게 탐색할 때" },
  scamper: { id: "scamper", name: "SCAMPER",            phaseLabel: "SCAMPER 변형",  desc: "7가지 렌즈로 대상을 하나씩 비틀어 아이디어를 만듭니다.",            reason: "기존 대상을 개선·변형할 때" },
  sixhats: { id: "sixhats", name: "Six Thinking Hats",  phaseLabel: "6색 모자 검토", desc: "한 번에 하나의 모자를 쓰고, 같은 관점에서 함께 생각합니다.",         reason: "여러 관점을 균형 있게 검토·결정할 때" },
};
/* 선택한 방식이 발산(Phase 2)뿐 아니라 아이스브레이킹·분석·보고서에도 일관되게 반영되도록,
   단계별 안내 문구를 방식별로 둔다. */
const METHOD_PHASE_HINT = {
  brain:   { ice: "곧 자유 브레인스토밍으로 발산합니다 — 워밍업의 불편함을 아이디어의 씨앗으로.", analyze: "자유 발산으로 나온 아이디어를 의미 기반으로 묶었습니다.",        report: "자유 브레인스토밍으로 모인 아이디어를 종합했습니다." },
  scamper: { ice: "곧 SCAMPER 7렌즈로 발산합니다 — 대상을 하나씩 비틀 준비를 하세요.",        analyze: "SCAMPER 렌즈(대체·결합·응용…)로 나온 변형 아이디어를 테마로 묶었습니다.", report: "SCAMPER 렌즈별 변형을 종합했습니다." },
  sixhats: { ice: "곧 Six Thinking Hats로 검토합니다 — 한 번에 한 관점씩 함께 봅니다.",        analyze: "6색 모자 관점에서 나온 의견을 테마로 묶었습니다.",              report: "6색 모자 검토 결과를 종합했습니다." },
};
const methodHint = (method, phase) => (METHOD_PHASE_HINT[method] || METHOD_PHASE_HINT.brain)[phase];
const methodName = (method) => (METHOD_META[method] || METHOD_META.brain).name;

/* 가짜 퍼센트 대신, 목표 텍스트와 모드에서 실제로 계산하는 방식 추천 점수 */
function recommendMethods(goal = "", mode = "offline") {
  const g = goal || "";
  const score = { brain: 2, scamper: 2, sixhats: 2 };
  if (/새로운|신규|발산|탐색|해커톤|창업|아이디어|처음/.test(g)) score.brain += 2;
  if (/개선|기존|업그레이드|고도화|변형|리뉴얼|바꾸|개편/.test(g)) score.scamper += 2;
  if (/결정|선택|검토|평가|리스크|위험|의사결정|합의|우선순위/.test(g)) score.sixhats += 2;
  if (mode === "offline") score.brain += 1;
  if (mode === "online") score.sixhats += 1;
  const top = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
  return { score, top };
}

/* ═══════ 공통 컴포넌트 ═══════ */
function Badge({ children, variant = "default" }) {
  const s = { default: "bg-neutral-100 text-neutral-600", primary: "bg-neutral-900 text-white", success: "bg-green-100 text-green-700", warning: "bg-amber-100 text-amber-700", info: "bg-blue-100 text-blue-700" };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s[variant]}`}>{children}</span>;
}

function getMember(id) { return MEMBERS.find(m => m.id === id) || { name: "알 수 없음", initial: "?", color: "bg-neutral-300" }; }

function MemberAvatar({ memberId, member, size = "sm" }) {
  const m = member || getMember(memberId);
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return <div className={`${sz} rounded-full ${m.color} flex items-center justify-center font-semibold flex-shrink-0`}>{m.initial}</div>;
}

function AiCard({ msg }) {
  const colors = { keyword: "bg-green-50 border-green-400", connect: "bg-purple-50 border-purple-400", expand: "bg-blue-50 border-blue-400", summary: "bg-amber-50 border-amber-400" };
  const icons = { keyword: "📍", connect: "✨", expand: "🔭", summary: "📊" };
  return (
    <div className={`rounded-xl p-4 border-l-[3px] ${colors[msg.type]} transition-all`} style={{ animation: "fadeUp .4s ease-out" }}>
      <div className="text-xs font-semibold mb-1 flex items-center gap-1">{icons[msg.type]} {msg.title}</div>
      <p className="text-xs text-neutral-700 leading-relaxed">{msg.text}</p>
    </div>
  );
}

/* ═══════ 세션 생성 ═══════ */
function CreateView({ myProfile, onStart }) {
  const [goal, setGoal] = useState("");
  const [method, setMethod] = useState(null);
  const [showRec, setShowRec] = useState(false);
  const [mins, setMins] = useState(60);
  const [mode, setMode] = useState("offline");
  const [topics, setTopics] = useState(null);

  const team = [...MEMBERS, myProfile].filter(Boolean);
  const recommend = () => setTopics(mockRecommendTopics(team));

  const rec = recommendMethods(goal, mode);
  const ICONS = { brain: <Lightbulb size={18} />, scamper: <Target size={18} />, sixhats: <Users size={18} /> };
  const FW = ["brain", "scamper", "sixhats"]
    .map(id => ({ ...METHOD_META[id], icon: ICONS[id] }))
    .sort((a, b) => rec.score[b.id] - rec.score[a.id]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <span className="font-bold tracking-tight">IdeationEngine</span>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-1">세션 만들기</h1>
        <p className="text-neutral-500 mb-8">진행 방식을 고르고 목표를 정하면 세션이 만들어집니다</p>

        {/* [1번] 모드 선택 */}
        <div className="mb-6">
          <label className="text-sm font-medium text-neutral-600 mb-2 block">진행 방식</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(MODES).map(md => (
              <button key={md.key} onClick={() => setMode(md.key)} className={`text-left bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md ${mode === md.key ? "border-neutral-900 shadow-md" : "border-transparent"}`}>
                <div className="text-2xl mb-1">{md.icon}</div>
                <div className="font-bold flex items-center gap-2">{md.label}{mode === md.key && <Check size={15} className="text-green-600" />}</div>
                <div className="text-xs text-neutral-500 mb-3">{md.tagline}</div>
                <ul className="space-y-1">{md.points.map(p => <li key={p} className="text-xs text-neutral-600 flex items-start gap-1"><span className="text-neutral-400">·</span> {p}</li>)}</ul>
              </button>
            ))}
          </div>
        </div>

        {/* [2번] 세션 목표 + 팀 프로필 기반 주제 추천 */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <label className="text-sm font-medium text-neutral-600 mb-2 block">세션 목표</label>
          <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="목표를 직접 입력하거나, 아래에서 AI 추천을 받아보세요" className="w-full border rounded-xl p-4 text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-neutral-900 transition" />
          <button onClick={recommend} className="w-full mt-3 py-2.5 border border-purple-200 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-purple-100 transition"><Sparkles size={15} /> 팀 프로필 기반 주제 추천받기 <Badge variant="info">AI · 데모</Badge></button>
          {topics && (
            <div className="mt-3 space-y-2 anim-up">
              <p className="text-xs text-neutral-400">팀 역량({[...new Set(team.flatMap(p => p.skills || []))].join(", ")})을 분석해 추천했습니다. 클릭하면 목표로 설정됩니다.</p>
              {topics.map((t, i) => (
                <button key={i} onClick={() => setGoal(t.title)} className={`w-full text-left rounded-xl border-2 p-3 transition ${goal === t.title ? "border-purple-400 bg-purple-50" : "border-neutral-100 hover:border-neutral-300"}`}>
                  <div className="text-sm font-semibold">{t.title}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">💡 {t.why}</div>
                </button>
              ))}
            </div>
          )}
          {!showRec && <button onClick={() => setShowRec(true)} disabled={!goal.trim()} className="w-full mt-3 py-3 bg-neutral-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition disabled:opacity-40"><ArrowRight size={16} /> 다음: 방식·시간 정하기</button>}
        </div>
        {showRec && (
          <div className="space-y-4 anim-up">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-800"><strong>🤖 방식 추천:</strong> 목표 "{goal.slice(0, 24)}{goal.length > 24 ? "…" : ""}"와 {MODES[mode].label}를 고려하면 <strong>{METHOD_META[rec.top].name}</strong>이 가장 잘 맞습니다. (직접 골라도 됩니다)</div>
            {FW.map(f => (
              <button key={f.id} onClick={() => setMethod(f.id)} className={`w-full text-left bg-white rounded-xl border-2 p-5 transition-all hover:shadow-md ${method === f.id ? "border-neutral-900 shadow-md" : "border-transparent"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === f.id ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}>{f.icon}</div>
                  <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="font-semibold">{f.name}</span>{f.id === rec.top && <Badge variant="success">추천</Badge>}</div><p className="text-sm text-neutral-500">{f.desc}</p><p className="text-xs text-neutral-400 mt-1">💡 {f.reason}</p></div>
                </div>
              </button>
            ))}
            <div className="bg-white rounded-xl border p-5">
              <label className="text-sm font-medium mb-3 block">세션 시간</label>
              <div className="flex gap-2 mb-2">{[30, 60, 90].map(t => <button key={t} onClick={() => setMins(t)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${mins === t ? "bg-neutral-900 text-white" : "border hover:bg-neutral-50"}`}>{t}분</button>)}</div>
              <p className="text-xs text-neutral-400">📊 예시: 설문 62명 중 40.3%가 60분 선호 (시연용)</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <div className="text-sm font-medium mb-3">⏱ AI 추천 시간 배분 ({mins}분)</div>
              {PHASES.map(p => {
                const adj = Math.round(p.duration * mins / 60);
                return (
                  <div key={p.key} className="flex items-center gap-3 mb-2">
                    <span className="w-6 text-center">{p.icon}</span>
                    <span className="text-sm w-28">{p.label}</span>
                    <div className="flex-1 h-5 bg-neutral-100 rounded-full overflow-hidden relative"><div className={`h-full rounded-full bg-gradient-to-r ${p.color}`} style={{ width: `${(adj / mins) * 100}%` }} /><span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">{adj}분</span></div>
                    <span className="text-[10px] text-neutral-400 w-20">{p.desc}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => onStart(goal, mins, mode, method)} disabled={!method} className="w-full py-3.5 bg-neutral-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition disabled:opacity-40"><ArrowRight size={16} /> {MODES[mode].label}로 세션 생성 및 팀원 초대</button>
          </div>
        )}
      </main>
      <style>{`.anim-up{animation:fadeUp .4s ease-out}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ═══════ 세션 메인 ═══════ */
function SessionView({ sessionId, goal, mins, mode = "offline", method = "brain", deadlineAt, serverPhase, content, onContentSync, onSyncError, syncError, myProfile, onExit }) {
  const isOnline = mode === "online";
  // step 복원: 로컬 스냅샷(ie_step)과 서버 phase 중 더 진행된 쪽을 채택(단일 유저 전진 규칙), 0~3 클램프
  const [step, setStep] = useState(() => {
    const local = parseInt(sessionStorage.getItem("ie_step"), 10);
    const l = Number.isInteger(local) ? local : 0;
    const sp = Number.isInteger(serverPhase) ? serverPhase : 0;
    return Math.min(3, Math.max(0, Math.max(l, sp)));
  });
  const [votes, setVotes] = useState(() => { try { return JSON.parse(sessionStorage.getItem("ie_votes")) || {}; } catch { return {}; } });
  // 현재 단계의 시작 시각을 저장 → 새로고침해도 남은 시간이 0으로 리셋되지 않고 이어짐
  const [phaseStart, setPhaseStart] = useState(() => { const v = parseInt(sessionStorage.getItem("ie_phaseStart"), 10); return Number.isInteger(v) ? v : Date.now(); });
  const [elapsed, setElapsed] = useState(() => Math.max(0, Math.floor((Date.now() - phaseStart) / 1000)));
  useEffect(() => { sessionStorage.setItem("ie_step", String(step)); }, [step]);
  useEffect(() => { sessionStorage.setItem("ie_votes", JSON.stringify(votes)); }, [votes]);
  useEffect(() => { sessionStorage.setItem("ie_phaseStart", String(phaseStart)); }, [phaseStart]);
  // 온라인 마감: 생성 시점에 확정된 deadlineAt을 표시만 (여기서 재계산하지 않음)
  const deadline = deadlineAt ? (() => { const d = new Date(deadlineAt); return Number.isNaN(d.getTime()) ? "" : `${d.getMonth() + 1}/${d.getDate()} 23:59`; })() : "";
  const votedThemes = THEMES.filter(t => votes[t.id]).map(t => t.name);
  useEffect(() => { const id = setInterval(() => setElapsed(Math.max(0, Math.floor((Date.now() - phaseStart) / 1000))), 1000); return () => clearInterval(id); }, [phaseStart]);
  const goToStep = (n) => {
    const clamped = Math.min(3, Math.max(0, n));
    setStep(clamped); setPhaseStart(Date.now()); setElapsed(0);
    if (sessionId) api.patchSession(sessionId, { phase: clamped }).catch(() => {}); // 서버에 단계 저장(best-effort)
  };
  const next = () => goToStep(step + 1);
  const prev = () => goToStep(step - 1);
  // 서버 phase가 (비동기 GET으로) 로컬보다 앞서 도착하면 '최초 1회'만 반영한다.
  // (ref 가드가 없으면 사용자가 '이전'으로 돌아갈 때마다 서버 phase로 튕겨 뒤로 못 감)
  const phaseReconciled = useRef(false);
  useEffect(() => {
    if (!Number.isInteger(serverPhase) || phaseReconciled.current) return;
    phaseReconciled.current = true;
    if (serverPhase > step) { setStep(Math.min(3, serverPhase)); setPhaseStart(Date.now()); setElapsed(0); }
  }, [serverPhase]);
  // 서버에 영속된 내 투표를 복원(로컬 투표가 아직 없을 때만 → 진행 중 투표를 덮지 않음)
  useEffect(() => {
    const mine = content?.votes?.user;
    if (Array.isArray(mine) && mine.length && !Object.values(votes).some(Boolean)) {
      const v = {}; mine.forEach((id) => { v[id] = true; }); setVotes(v);
    }
  }, [content]);
  // 단계 진입 시 해당 kind로 오케스트레이터 호출 → 비용 미터 누적(서버가 kind별 멱등 처리).
  // report는 ReportPhase가 소유(레이스 방지: 응답에 실린 미터를 그대로 사용).
  const aiFired = useRef(new Set());
  useEffect(() => {
    const kind = ["ice", "idea", "analyze"][step];
    if (!sessionId || !kind || aiFired.current.has(kind)) return;
    aiFired.current.add(kind);
    api.ai(kind, goal, null, sessionId).catch(() => {});
  }, [step, sessionId]);
  const phase = PHASES[step];
  const adjD = Math.round(phase.duration * mins / 60);
  const rem = Math.max(0, adjD * 60 - elapsed);
  const remM = Math.floor(rem / 60); const remS = rem % 60;
  const urgent = rem < adjD * 12;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0"><span className="font-bold text-sm">IdeationEngine</span><span className="text-neutral-300">|</span><span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 flex-shrink-0">{MODES[mode].icon} {MODES[mode].label}</span><span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 flex-shrink-0">🧭 {(METHOD_META[method] || METHOD_META.brain).name}</span><span className="text-xs text-neutral-500 max-w-[140px] truncate hidden md:inline">{goal}</span>{isOnline && deadline && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 flex-shrink-0">⏳ 마감 {deadline}</span>}</div>
          <div className="flex items-center gap-0.5 bg-neutral-100 rounded-xl p-0.5 flex-shrink-0">
            {PHASES.map((p, i) => (
              <div key={i} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${i === step ? "bg-white shadow text-neutral-900" : i < step ? "text-green-600" : "text-neutral-400"}`}>
                {i < step ? <Check size={11} className="text-green-500" /> : <span>{p.icon}</span>}
                <span className="hidden lg:inline">{p.label}</span>
                <span className="text-[9px] text-neutral-400">{Math.round(p.duration * mins / 60)}분</span>
              </div>
            ))}
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-mono flex-shrink-0 ${urgent ? "border-red-200 bg-red-50 text-red-600" : "border-neutral-200 bg-white"}`}>
            <span>{phase.icon}</span>
            <span className="font-bold">{String(remM).padStart(2, "0")}:{String(remS).padStart(2, "0")}</span>
            <div className="w-12 h-1.5 bg-neutral-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-500" : "bg-neutral-800"}`} style={{ width: `${(rem / (adjD * 60)) * 100}%` }} /></div>
          </div>
        </div>
      </header>
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-1.5">
          <div className="text-[10px] text-neutral-400 mb-1 text-center">{isOnline ? "🧑‍💻 각자 자기 속도로 진행 — 이 타이머는 나만의 페이스 가이드입니다" : "👥 모두 같은 타이머로 함께 진행 중"}</div>
          <div className="flex items-center h-2.5 rounded-full overflow-hidden bg-neutral-100">
            {PHASES.map((p, i) => <div key={i} className={`h-full bg-gradient-to-r ${p.color} transition-opacity ${i === step ? "opacity-100" : i < step ? "opacity-30" : "opacity-10"}`} style={{ width: `${(Math.round(p.duration * mins / 60) / mins) * 100}%` }} />)}
          </div>
        </div>
      </div>
      <main className="flex-1 py-6">
        <div className="max-w-6xl mx-auto px-6">
          {syncError && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700 flex items-start gap-2"><span>⚠️</span><span>방금 제출이 <strong>서버에 저장되지 않았어요</strong>(네트워크·서버 문제). 화면엔 보이지만 새로고침 시 사라질 수 있습니다.</span></div>}
          {step === 0 && <IcePhase sessionId={sessionId} myProfile={myProfile} goal={goal} method={method} initialIce={content?.ice} onContentSync={onContentSync} onSyncError={onSyncError} />}
          {step === 1 && <IdeaPhase sessionId={sessionId} myProfile={myProfile} method={method} goal={goal} initialIdeas={content?.ideas} onContentSync={onContentSync} onSyncError={onSyncError} />}
          {step === 2 && <AnalyzePhase sessionId={sessionId} votes={votes} setVotes={setVotes} method={method} onContentSync={onContentSync} onSyncError={onSyncError} />}
          {step === 3 && <ReportPhase votedThemes={votedThemes} method={method} sessionId={sessionId} goal={goal} />}
        </div>
      </main>
      <footer className="bg-white border-t sticky bottom-0">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <button onClick={prev} disabled={step === 0} className="px-4 py-2 border rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-neutral-50 transition disabled:opacity-30"><ChevronLeft size={14} /> 이전</button>
          <div className="text-sm font-medium text-neutral-500">{phase.icon} {phase.label} · {adjD}분 배정</div>
          {step < 3 ? <button onClick={next} className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-neutral-800 transition">다음 <ChevronRight size={14} /></button>
            : <button onClick={onExit} className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-green-700 transition"><Check size={14} /> 완료 — 새 세션</button>}
        </div>
      </footer>
    </div>
  );
}

/* ═══════ Phase 1: 아이스브레이킹 ═══════ */
function IcePhase({ myProfile, goal, method = "brain", sessionId, initialIce, onContentSync, onSyncError }) {
  const [answers, setAnswers] = useState(() => ICE_ANSWERS.map(a => ({ ...a, member: getMember(a.memberId) })));
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const meName = myProfile?.name || "나";

  // 서버에 영속된 내 답변을 데모 팀원 목업과 병합 (id 기준 중복 방지)
  useEffect(() => {
    if (!initialIce?.length) return;
    setAnswers(prev => {
      const have = new Set(prev.map(a => a.id).filter(Boolean));
      const add = initialIce.filter(e => !have.has(e.id)).map(e => ({ ...e, member: { name: e.name || meName, initial: (e.name || meName).charAt(0), color: "bg-emerald-500 text-white" } }));
      return [...add, ...prev];
    });
  }, [initialIce]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    const text = input; const cid = Date.now(); // cid: 로컬·서버 항목의 공통 id (중복 방지)
    setAnswers(prev => [{ id: cid, memberId: "user", member: { name: meName, initial: meName.charAt(0), color: "bg-emerald-500 text-white" }, text, likes: 0 }, ...prev]);
    if (sessionId) api.addIce(sessionId, { cid, memberId: "user", name: meName, text }).then((s) => onContentSync?.(s)).catch(() => onSyncError?.());
    setInput(""); setSubmitted(true);
    setTimeout(() => setShowAi(true), 800);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-3"><Badge variant="info">💬 PHASE 1 · 10분</Badge><h2 className="text-xl font-bold mt-1">아이스브레이킹</h2><p className="text-sm text-neutral-500">세션 목표와 연결된 워밍업 질문입니다. 이 답변들이 다음 아이디어 발산의 출발점이 됩니다.</p></div>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5"><span>🧭 이 세션 방식: <strong>{methodName(method)}</strong></span><span className="opacity-70">· {methodHint(method, "ice")}</span></div>
        <div className="bg-neutral-900 text-white rounded-2xl p-6 mb-5">
          <div className="text-xs text-neutral-400 mb-2 flex items-center gap-1"><Sparkles size={11} /> 세션 목표 "{(goal || "이 세션의 목표").slice(0, 24)}{(goal || "").length > 24 ? "…" : ""}"에 맞춰 AI가 질문을 생성했습니다</div>
          <h3 className="text-2xl font-bold leading-snug">최근 일주일간 경험한 가장 큰 '불편함'은 무엇인가요?</h3>
          <p className="text-sm text-neutral-400 mt-2">💡 여기서 나온 불편함이 → 아이디어의 씨앗이 됩니다</p>
        </div>
        <div className="bg-white rounded-xl border p-3 flex gap-2 mb-5">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="여기에 답변을 입력하세요..." className="flex-1 outline-none text-sm px-2" />
          <button onClick={handleSubmit} className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition flex items-center gap-1"><Send size={13} /> 제출</button>
        </div>
        {submitted && <p className="text-sm text-green-600 mb-4 flex items-center gap-1"><Check size={13} /> 제출 완료!</p>}
        <div className="flex items-center gap-2 mb-3"><span className="font-semibold text-sm">팀원 답변</span><Badge>{answers.length}</Badge></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {answers.map((a, i) => (
            <div key={i} className="bg-white border rounded-xl p-4 hover:shadow-md transition anim-up">
              <div className="flex items-center gap-2 mb-2"><MemberAvatar memberId={a.memberId} member={a.member} /><span className="text-sm font-medium">{a.member.name}</span></div>
              <p className="text-sm text-neutral-700 leading-relaxed mb-2">{a.text}</p>
              <button className="text-xs text-neutral-400 hover:text-pink-500 transition flex items-center gap-1"><Heart size={11} /> {a.likes}</button>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3"><Sparkles size={14} className="text-green-600" /><span className="font-semibold text-sm">AI Assistant</span></div>
          {!showAi && <p className="text-xs text-neutral-400 italic">아직 분석 중... 답변을 제출하면 AI가 키워드를 분석합니다.</p>}
          {showAi && <div className="space-y-3 anim-up">{AI_MSGS_ICE.map((m, i) => <AiCard key={i} msg={m} />)}</div>}
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-medium text-neutral-500 mb-2">참여 현황</div>
          <div className="space-y-2">
            {MEMBERS.map(m => <div key={m.id} className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full ${m.color} flex items-center justify-center text-[10px] font-semibold`}>{m.initial}</div><span className="text-xs flex-1">{m.name}</span><span className="text-[10px] text-green-500">제출 ✓</span></div>)}
          </div>
        </div>
      </div>
      <style>{`.anim-up{animation:fadeUp .4s ease-out}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ═══════ Phase 2: 아이디어 발산 — 방식(method)에 따라 완전히 다른 화면 ═══════ */
function IdeaPhase({ myProfile, method = "brain", goal, sessionId, initialIdeas, onContentSync, onSyncError }) {
  if (method === "scamper") return <IdeaScamper goal={goal} />;
  if (method === "sixhats") return <IdeaSixHats goal={goal} />;
  return <IdeaBrainstorm myProfile={myProfile} sessionId={sessionId} initialIdeas={initialIdeas} onContentSync={onContentSync} onSyncError={onSyncError} />;
}

/* 방식 A: 자유 브레인스토밍 (각도 배분 + 자유 입력) */
function IdeaBrainstorm({ myProfile, sessionId, initialIdeas, onContentSync, onSyncError }) {
  const [ideas, setIdeas] = useState(() => IDEAS.map(i => ({ ...i, member: getMember(i.memberId) })));
  const [input, setInput] = useState("");
  const [aiMsgCount, setAiMsgCount] = useState(0); // 제출할 때마다 AI 메시지 추가
  const meName = myProfile?.name || "나";

  // 서버에 영속된 내 아이디어를 데모 목업과 병합 (id 기준 중복 방지)
  useEffect(() => {
    if (!initialIdeas?.length) return;
    setIdeas(prev => {
      const have = new Set(prev.map(i => i.id));
      const add = initialIdeas.filter(x => !have.has(x.id)).map(x => {
        const nm = x.name || (x.memberId === "user" ? meName : "?"); // 작성자: 서버 저장 name 우선(멀티유저 대비)
        return { ...x, tags: x.tags || ["NEW"], fromIce: x.fromIce || `${nm} 제안`, member: { name: nm, initial: nm.charAt(0), color: "bg-emerald-500 text-white" } };
      });
      return [...add, ...prev];
    });
  }, [initialIdeas]);

  // [2번] 팀 단위 각도 배정 — 전원이 같은 각도로 몰리지 않게 분산
  const people = [
    ...MEMBERS.map(m => ({ id: m.id, name: m.name, initial: m.initial, color: m.color, skills: m.skills, isMe: false })),
    ...(myProfile ? [{ id: "user", name: meName, initial: meName.charAt(0), color: "bg-emerald-500 text-white", skills: myProfile.skills, isMe: true }] : []),
  ];
  const teamAngles = assignTeamAngles(people);
  const roster = people.map((p, i) => ({ ...p, angle: teamAngles[i] }));
  const myAngle = roster.find(r => r.isMe)?.angle || null;

  const handleSubmit = () => {
    if (!input.trim()) return;
    const title = input; const cid = Date.now(); // cid: 로컬·서버 항목의 공통 id (중복 방지)
    setIdeas(prev => [{ id: cid, memberId: "user", member: { name: meName, initial: meName.charAt(0), color: "bg-emerald-500 text-white" }, title, tags: ["NEW"], likes: 0, fromIce: `${meName} 제안` }, ...prev]);
    if (sessionId) api.addIdea(sessionId, { cid, memberId: "user", name: meName, title, tags: ["NEW"] }).then((s) => onContentSync?.(s)).catch(() => onSyncError?.());
    setInput("");
    setAiMsgCount(c => Math.min(c + 1, AI_MSGS_IDEA.length));
  };

  return (
    <div>
      <div className="mb-5"><Badge variant="warning">💡 PHASE 2 · 20분</Badge><h2 className="text-xl font-bold mt-1">아이디어 발산</h2><p className="text-sm text-neutral-500">아이스브레이킹에서 나온 불편함을 기반으로 자유롭게 아이디어를 제안하세요.</p></div>
      {/* [2번] 프로필 기반 각도 배분 패널 — '문제 정의를 못박는 지시' 대신 '각자 다른 문을 열어줌' */}
      <div className="bg-white border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-1"><Sparkles size={14} className="text-purple-600" /><span className="font-semibold text-sm">AI가 프로필을 보고 각자에게 다른 각도를 배정했어요</span></div>
        <p className="text-xs text-neutral-400 mb-3">같은 목표라도 서로 다른 각도에서 출발하면 아이디어가 겹치지 않습니다. 각자 <strong>자기 각도</strong>에서 먼저 생각해보세요.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {roster.map(r => (
            <div key={r.id} className={`rounded-xl border-2 p-3 ${r.angle.cls} ${r.isMe ? "ring-2 ring-neutral-900 border-transparent" : "border-transparent"}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-6 h-6 rounded-full ${r.color} flex items-center justify-center text-[10px] font-semibold`}>{r.initial}</div>
                <span className="text-xs font-medium">{r.name}{r.isMe && " (나)"}</span>
              </div>
              <div className="text-sm font-bold flex items-center gap-1">{r.angle.icon} {r.angle.label}</div>
              <p className="text-[11px] mt-1 opacity-80 leading-snug">{r.angle.hint}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border p-3 flex gap-2 mb-5">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder={myAngle ? `내 각도(${myAngle.label})에서 아이디어를 입력하세요...` : "새 아이디어를 입력하세요..."} className="flex-1 outline-none text-sm px-2" />
        <button onClick={handleSubmit} className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition flex items-center gap-1"><Send size={13} /> 제출</button>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ideas.map(idea => (
              <div key={idea.id} className="bg-white border rounded-xl p-4 hover:shadow-lg transition group anim-up">
                <div className="flex items-center gap-2 mb-2"><MemberAvatar memberId={idea.memberId} member={idea.member} /><span className="text-sm font-medium">{idea.member.name}</span></div>
                <h3 className="text-sm font-semibold leading-relaxed mb-1 group-hover:text-blue-600 transition">{idea.title}</h3>
                {idea.fromIce && <p className="text-[10px] text-neutral-400 mb-2 italic">← {idea.fromIce}</p>}
                <div className="flex flex-wrap gap-1 mb-2">{idea.tags.map(t => <Badge key={t}>{t}</Badge>)}</div>
                <button onClick={() => setIdeas(ideas.map(i => i.id === idea.id ? { ...i, likes: i.likes + 1 } : i))} className="text-xs text-neutral-400 hover:text-pink-500 transition flex items-center gap-1"><Heart size={11} /> {idea.likes}</button>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-3"><Sparkles size={14} className="text-green-600" /><span className="font-semibold text-sm">AI Assistant</span></div>
            {aiMsgCount === 0 && <p className="text-xs text-neutral-400 italic">아이디어를 제출하면 AI가 실시간으로 키워드를 분석하고 연결점을 제안합니다.</p>}
            <div className="space-y-3">{AI_MSGS_IDEA.slice(0, aiMsgCount).map((m, i) => <AiCard key={i} msg={m} />)}</div>
          </div>
          <div className="bg-neutral-900 text-white rounded-xl p-4">
            <div className="text-xs text-neutral-400 mb-2">실시간 통계</div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div><div className="text-2xl font-bold">{ideas.length}</div><div className="text-[10px] text-neutral-400">제출된 아이디어</div></div>
              <div><div className="text-2xl font-bold">{MEMBERS.length + (ideas.some(i => i.memberId === "user") ? 1 : 0)}</div><div className="text-[10px] text-neutral-400">참여자</div></div>
            </div>
          </div>
        </div>
      </div>
      <style>{`.anim-up{animation:fadeUp .4s ease-out}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* 방식 B: SCAMPER — 7개 렌즈로 대상을 변형 */
function IdeaScamper({ goal }) {
  const [active, setActive] = useState("S");
  const [byLens, setByLens] = useState({
    S: [{ who: "전재민", text: "사람이 직접 하던 분류를 AI 모델로 대체" }],
    C: [{ who: "조경빈", text: "캘린더 알림과 결합해 자동 리마인드" }],
    A: [], M: [], P: [], E: [], R: [],
  });
  const [input, setInput] = useState("");
  const lens = SCAMPER_LENSES.find(l => l.key === active);
  const add = () => {
    if (!input.trim()) return;
    setByLens(prev => ({ ...prev, [active]: [{ who: "나", text: input.trim() }, ...prev[active]] }));
    setInput("");
  };
  const filled = SCAMPER_LENSES.filter(l => byLens[l.key].length > 0).length;

  return (
    <div>
      <div className="mb-4"><Badge variant="warning">💡 PHASE 2 · SCAMPER</Badge><h2 className="text-xl font-bold mt-1">SCAMPER 변형</h2><p className="text-sm text-neutral-500">변형 대상: <strong>{goal || "세션 목표"}</strong> — 7개 렌즈를 하나씩 적용해 아이디어를 만듭니다.</p></div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {SCAMPER_LENSES.map(l => (
          <button key={l.key} onClick={() => setActive(l.key)} className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition flex items-center gap-1.5 ${active === l.key ? "border-neutral-900 bg-neutral-900 text-white" : "border-transparent bg-white hover:bg-neutral-50"}`}>
            {l.key}
            {byLens[l.key].length > 0 && <span className={`text-[10px] px-1.5 rounded-full font-normal ${active === l.key ? "bg-white/20" : "bg-neutral-100"}`}>{byLens[l.key].length}</span>}
          </button>
        ))}
        <div className="ml-auto text-xs text-neutral-400">진행 {filled}/7 렌즈</div>
      </div>
      <div className="bg-white border rounded-2xl p-5 mb-4">
        <div className="text-lg font-bold">{lens.name}</div>
        <p className="text-sm text-neutral-500 mt-0.5 mb-3">💡 {lens.q}</p>
        <div className="flex gap-2 mb-4">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder={`'${goal || "목표"}'에 이 렌즈를 적용한 아이디어...`} className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900" />
          <button onClick={add} className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 flex items-center gap-1"><Send size={13} /> 추가</button>
        </div>
        <div className="space-y-2">
          {byLens[active].length === 0 && <p className="text-xs text-neutral-400 italic">아직 이 렌즈로 나온 아이디어가 없어요. 위 질문에 답해보세요.</p>}
          {byLens[active].map((it, i) => (
            <div key={i} className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2 anim-up">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${it.who === "나" ? "bg-emerald-500 text-white" : "bg-neutral-300"}`}>{it.who.charAt(0)}</div>
              <span className="text-sm flex-1">{it.text}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`.anim-up{animation:fadeUp .4s ease-out}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* 방식 C: Six Thinking Hats — 한 번에 한 모자, 순차 검토 */
function IdeaSixHats({ goal }) {
  const [idx, setIdx] = useState(0);
  const hat = SIX_HATS[idx];
  const [byHat, setByHat] = useState({
    white: [{ who: "조경빈", text: "비슷한 서비스가 이미 3개, 전부 유료 전환율이 낮음" }],
    red: [{ who: "전재민", text: "왠지 '또 AI야?' 소리 들을 것 같아 걱정" }],
    black: [], yellow: [], green: [], blue: [],
  });
  const [input, setInput] = useState("");
  const add = () => {
    if (!input.trim()) return;
    setByHat(prev => ({ ...prev, [hat.key]: [{ who: "나", text: input.trim() }, ...(prev[hat.key] || [])] }));
    setInput("");
  };

  return (
    <div>
      <div className="mb-4"><Badge variant="warning">💡 PHASE 2 · Six Thinking Hats</Badge><h2 className="text-xl font-bold mt-1">6색 모자 검토</h2><p className="text-sm text-neutral-500">검토 대상: <strong>{goal || "세션 목표"}</strong> — 지금은 <strong>모두 같은 모자</strong>를 쓰고 그 관점에서만 생각합니다.</p></div>
      <div className="flex items-center gap-1 mb-4">
        {SIX_HATS.map((h, i) => (
          <button key={h.key} onClick={() => setIdx(i)} className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition ${i === idx ? "border-neutral-900" : "border-transparent"} ${h.cls}`}>
            <div className="text-base">{h.icon}</div>
            <div className="hidden sm:block mt-0.5">{h.name}</div>
          </button>
        ))}
      </div>
      <div className={`border-2 rounded-2xl p-5 mb-4 ${hat.cls}`}>
        <div className="text-lg font-bold flex items-center gap-2">{hat.icon} {hat.name}</div>
        <p className="text-sm mt-0.5 mb-3 opacity-80">💡 {hat.q}</p>
        <div className="flex gap-2 mb-4">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="이 모자의 관점에서 한마디..." className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none bg-white/70 focus:ring-2 focus:ring-neutral-900" />
          <button onClick={add} className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 flex items-center gap-1"><Send size={13} /> 추가</button>
        </div>
        <div className="space-y-2">
          {(byHat[hat.key] || []).length === 0 && <p className="text-xs opacity-70 italic">아직 이 모자로 나온 의견이 없어요.</p>}
          {(byHat[hat.key] || []).map((it, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 anim-up">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${it.who === "나" ? "bg-emerald-500 text-white" : "bg-neutral-300"}`}>{it.who.charAt(0)}</div>
              <span className="text-sm flex-1 text-neutral-800">{it.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <button disabled={idx === 0} onClick={() => setIdx(i => Math.max(0, i - 1))} className="px-4 py-2 border rounded-xl text-sm font-medium disabled:opacity-30 flex items-center gap-1"><ChevronLeft size={14} /> 이전 모자</button>
        {idx < SIX_HATS.length - 1
          ? <button onClick={() => setIdx(i => Math.min(SIX_HATS.length - 1, i + 1))} className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium flex items-center gap-1">다음 모자 <ChevronRight size={14} /></button>
          : <span className="text-sm text-green-600 font-medium self-center flex items-center gap-1"><Check size={14} /> 6색 모자 검토 완료</span>}
      </div>
      <style>{`.anim-up{animation:fadeUp .4s ease-out}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ═══════ Phase 3: 분석 + 투표 ═══════ */
function AnalyzePhase({ votes, setVotes, method = "brain", sessionId, onContentSync, onSyncError }) {
  const used = Object.values(votes).filter(Boolean).length;
  const remaining = 3 - used;
  const handleVote = (id) => {
    let next;
    if (votes[id]) next = { ...votes, [id]: false };
    else if (remaining > 0) next = { ...votes, [id]: true };
    else return;
    setVotes(next);
    if (sessionId) { const themeIds = Object.keys(next).filter((k) => next[k]).map(Number); api.setVotes(sessionId, "user", themeIds).then((s) => onContentSync?.(s)).catch(() => onSyncError?.()); }
  };

  return (
    <div>
      <div className="mb-3"><Badge variant="success">📊 PHASE 3 · 15분</Badge><h2 className="text-xl font-bold mt-1">AI 분석 및 그룹화 완료</h2><p className="text-sm text-neutral-500">{methodHint(method, "analyze")} (<strong>{methodName(method)}</strong> 방식)</p></div>
      <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-start gap-2"><span>⚠️</span><span>아래 분석 문구·신뢰도·테마 수치는 <strong>시연용 샘플</strong>입니다. 실제 제출 아이디어에서 생성된 값이 아니며, 투표만 실제로 반영됩니다.</span></div>
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-2xl p-6 text-white mb-5">
        <div className="text-xs text-green-400 tracking-wider mb-2">AI INSIGHT SUMMARY</div>
        <p className="text-lg font-semibold mb-1">"팀원 4명의 아이디어가 하나의 공통 구조를 공유합니다: '반복적으로 발생하는 판단을 AI에 위임하여 인지 부하를 줄인다.'"</p>
        <p className="text-sm text-neutral-400">회의 진행, 학습 정리, 공간 탐색, 식재료 관리 — 영역은 다르지만 해결 구조가 동일합니다.</p>
        <div className="flex items-center gap-2 mt-2"><span className="text-xs text-neutral-500">분석 신뢰도</span><span className="text-xl font-bold text-green-400">94.2%</span><span className="text-[10px] text-neutral-500">· 시연용 예시값</span></div>
      </div>
      <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">남은 투표권: <div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className={`w-5 h-5 rounded-full border-2 transition ${i < remaining ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"}`} />)}</div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {THEMES.map(t => (
          <div key={t.id} className={`bg-white rounded-xl border-2 p-5 transition-all ${votes[t.id] ? "border-neutral-900 shadow-lg" : "border-transparent hover:border-neutral-200"}`}>
            <div className="flex justify-between mb-1"><Badge>THEME {t.id}</Badge><span className="text-xs text-neutral-400">{t.pct}% · {t.votes}표</span></div>
            <h3 className="font-bold mb-1">{t.name}</h3>
            <p className="text-xs text-neutral-400 mb-3 italic">← {t.sourceIdea}</p>
            <div className="space-y-1.5 mb-3">{t.items.map((item, i) => <div key={i} className="text-sm px-3 py-1.5 bg-neutral-50 rounded-lg">{item}</div>)}</div>
            <div className="h-1.5 bg-neutral-100 rounded-full mb-3 overflow-hidden"><div className="h-full bg-neutral-800 rounded-full" style={{ width: `${t.pct}%` }} /></div>
            <button onClick={() => handleVote(t.id)} className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition ${votes[t.id] ? "bg-neutral-900 text-white" : "border hover:bg-neutral-50"}`}>
              {votes[t.id] ? <><Check size={13} /> 투표 완료</> : <><Vote size={13} /> 투표하기</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════ Phase 4: 리포트 ═══════ */
function ReportPhase({ votedThemes = [], method = "brain", sessionId, goal = "" }) {
  const [dl, setDl] = useState(false);
  const [meter, setMeter] = useState(null); // 오케스트레이터 비용 미터 (발표 패널)
  // report 호출을 여기서 소유 → 응답에 실린 '전체 미터'를 그대로 사용(별도 fetch 레이스 제거)
  useEffect(() => {
    if (!sessionId) return;
    api.ai("report", goal, null, sessionId)
      .then((r) => setMeter(r.meter))
      .catch(() => api.getAiMeter(sessionId).then(setMeter).catch(() => {}));
  }, [sessionId]);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div><Badge variant="primary">📋 FINAL · 5분</Badge><h2 className="text-xl font-bold mt-1">최종 아이데이션 결과 보고서</h2><p className="text-sm text-neutral-500 mt-0.5">🧭 {methodHint(method, "report")} (<strong>{methodName(method)}</strong>)</p></div>
        <button onClick={() => setDl(true)} className="px-4 py-2 rounded-xl text-sm font-medium border bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition">{dl ? "🚧 PDF 내보내기는 준비 중입니다" : "↓ PDF 다운로드 (준비 중)"}</button>
      </div>
      <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-start gap-2"><span>⚠️</span><span>이 보고서는 <strong>시연용 고정 템플릿</strong>입니다. 실제 세션의 투표·아이디어로 자동 생성된 결과가 아닙니다.</span></div>
      {votedThemes.length > 0 && (
        <div className="mb-4 rounded-xl bg-neutral-900 text-white px-4 py-3"><span className="text-xs text-green-400">✅ 내가 이번 세션에서 실제로 투표한 테마</span><div className="font-semibold text-sm mt-0.5">{votedThemes.join(", ")}</div></div>
      )}
      {/* 발표용: 이번 세션에서 어느 모델이 뭘 했나 + 얼마 아꼈나 (오케스트레이터 미터) */}
      {meter && meter.calls?.length > 0 && (
        <div className="mb-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-sm flex items-center gap-1.5">🧭 이 세션의 AI 분업 & 비용</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border text-neutral-500">{meter.pricingMode === "measured" ? "실측" : "추정(목업 단가)"}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 my-3">
            {meter.calls.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border">
                <span className="truncate"><span className="text-neutral-500">{c.role}</span> · <strong>{c.model}</strong></span>
                <span className={`ml-2 flex-shrink-0 px-1.5 rounded-full text-[10px] ${c.tier === "flagship" ? "bg-rose-100 text-rose-700" : c.tier === "mid" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{c.tier === "flagship" ? "고가" : c.tier === "mid" ? "중가" : "저가"}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 bg-neutral-900 text-white rounded-xl px-4 py-3">
            <span className="text-2xl font-bold text-green-400">약 {meter.savedPct}% 절감</span>
            <span className="text-xs text-neutral-300">우리 방식 ${meter.ourCost} vs 전부 고가면 ${meter.allFlagshipCost}</span>
            <span className="text-[10px] text-neutral-400 w-full">품질 지표 — 승격률 {meter.escalateRate ?? 0}% · 오버헤드 ${meter.overheadCost ?? 0} (생성 콜만 절감 계산)</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">※ {meter.baselineNote}. 저가/고가 LLM을 작업에 맞게 자동 배분한 결과입니다.</p>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-5">
          <div className="bg-white rounded-2xl border p-6">
            <div className="flex justify-between mb-3"><h3 className="font-semibold flex items-center gap-2"><Target size={15} /> 선정된 최종 아이디어 <span className="text-xs font-normal text-neutral-400">(시연 예시 · 실제 투표 결과 아님)</span></h3><div className="flex items-center gap-1"><Badge variant="success">Score: {REPORT.score}/100</Badge><span className="text-[10px] text-neutral-400">시연용</span></div></div>
            <div className="bg-neutral-50 rounded-xl p-5 mb-4">
              <h4 className="text-lg font-bold mb-2">{REPORT.title}</h4>
              <p className="text-sm text-neutral-600 leading-relaxed">{REPORT.desc}</p>
            <p className="text-xs text-neutral-400 mt-2 italic">시연 시나리오: "AI 커뮤니케이션 도구" 테마 → 김승희의 아이디어 → 아이스브레이킹의 "팀플 눈치" 불편함으로 이어지는 흐름 예시</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><div className="text-xs text-neutral-500 font-medium mb-1">핵심 가치</div>{REPORT.coreValues.map(v => <div key={v} className="text-neutral-600 text-xs mb-0.5">• {v}</div>)}</div>
              <div><div className="text-xs text-neutral-500 font-medium mb-1">타겟 유저</div>{REPORT.targets.map(v => <div key={v} className="text-neutral-600 text-xs mb-0.5">• {v}</div>)}</div>
              <div><div className="text-xs text-neutral-500 font-medium mb-1">주요 리스크</div>{REPORT.risks.map(v => <div key={v} className="text-neutral-600 text-xs mb-0.5">• {v}</div>)}</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText size={15} /> 실행 계획</h3>
            {REPORT.actions.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b last:border-0">
                <input type="checkbox" className="w-4 h-4 rounded accent-neutral-900" />
                <span className="flex-1 text-sm">{a.task}</span>
                <MemberAvatar memberId={MEMBERS.find(m => m.name === a.who)?.id || "sh"} />
                <span className="text-xs text-neutral-500">{a.who}</span>
                <span className="text-xs text-neutral-400">{a.date}</span>
              </div>
            ))}
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm">
            <div className="font-semibold text-green-800 mb-1">🔄 데이터 흐름 요약 <span className="text-[10px] font-normal text-green-600">(시연 시나리오)</span></div>
            <p className="text-xs text-green-700 leading-relaxed">아이스브레이킹("팀플 눈치 보기, 카페 헛걸음, 식재료 낭비, 필기 정리 스트레스") → 4개 아이디어(퍼실리테이터 봇, 카페 정보 앱, 식재료 관리 앱, 학습 도우미) → AI가 공통 구조 감지("반복 판단의 AI 위임") → 테마 1위("AI 커뮤니케이션 도구", 38%) → 최종 선정("AI 커뮤니케이션 퍼실리테이터", 94점). 5개 단계가 인과관계로 연결됩니다.</p>
          </div>
        </div>
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4">
          <div className="bg-neutral-900 text-white rounded-2xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><BarChart3 size={14} /> 세션 요약</h3>
            {[["진행 방식", methodName(method)], ["총 소요 시간", "60분"], ["참여자 수", `${MEMBERS.length + 1}명`], ["제출된 아이디어", "5+α개"], ["도출된 테마", "4개"]].map(([k, v]) => <div key={k} className="flex justify-between text-sm py-1"><span className="text-neutral-400">{k}</span><span className="font-bold">{v}</span></div>)}
            <div className="mt-3 pt-3 border-t border-neutral-700">
              <div className="text-xs text-neutral-400 mb-1">핵심 키워드</div>
              <div className="flex flex-wrap gap-1">{["AI 자동화", "퍼실리테이션", "익명성", "실시간"].map(k => <span key={k} className="text-[10px] px-2 py-0.5 bg-neutral-800 rounded-full">{k}</span>)}</div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="font-semibold text-amber-800 text-sm mb-1">📊 설문 데이터 근거 <span className="text-[10px] font-normal">(시연용 예시 수치)</span></div>
            <p className="text-xs text-amber-700 leading-relaxed">예시: 설문 62명 중 54.8%가 1위로 선택한 "결과 자동 요약" 기능. 실서비스에서는 실제 세션 데이터를 AI가 분석해 핵심 가치·타겟·리스크를 자동 구성합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════ 대기실 (로비) ═══════ */
function LobbyView({ sessionId, goal, mins, mode = "offline", method = "brain", onSessionStart }) {
  // 서버에서 발급된 실제 세션 id를 초대 링크에 사용 (서버 미연결 시 데모 표기)
  const link = sessionId ? `https://ideationengine.app/s/${sessionId}` : "https://ideationengine.app/s/(서버 연결 대기)";
  const md = MODES[mode];
  const isOnline = mode === "online";
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState([MEMBERS[0]]); // 방장만 처음에

  // 시연용: 2초 간격으로 팀원이 한 명씩 입장
  useEffect(() => {
    const timers = MEMBERS.slice(1).map((m, i) =>
      setTimeout(() => setJoined(prev => [...prev, m]), (i + 1) * 2000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const allJoined = joined.length === MEMBERS.length;
  const canStart = isOnline || allJoined; // 온라인: 전원 대기 없이 바로 시작
  const methodName = (METHOD_META[method] || METHOD_META.brain).name;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <span className="font-bold tracking-tight">IdeationEngine</span>
          <span className="text-neutral-300 mx-3">/</span>
          <span className="text-sm text-neutral-500">대기실</span>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-2xl">{md.icon}</div>
          <div className="flex items-center justify-center gap-2 mb-1"><Badge variant="primary">{md.label}</Badge></div>
          <h1 className="text-2xl font-bold mb-1">{isOnline ? "링크를 공유하세요" : "팀원을 기다리고 있어요"}</h1>
          <p className="text-neutral-500 text-sm">{isOnline ? "팀원은 마감 시간까지 각자 편할 때 참여하면 됩니다. 지금 바로 시작할 수 있어요." : "전원이 입장하면 다 함께 세션을 시작합니다."}</p>
        </div>

        {/* 링크 공유 */}
        <div className="bg-white rounded-2xl border p-6 mb-5">
          <h2 className="font-semibold text-sm mb-3">팀원 초대하기</h2>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <div className="text-xs text-neutral-500 mb-1">초대 링크</div>
              <div className="flex gap-2">
                <input readOnly value={link} className="flex-1 border rounded-xl px-3 py-2.5 text-sm font-mono text-neutral-600 bg-neutral-50 outline-none" />
                <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all flex-shrink-0 ${copied ? "bg-green-500 text-white" : "border hover:bg-neutral-50"}`}>
                  {copied ? <><Check size={14} /> 복사됨</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> 복사</>}
                </button>
              </div>
            </div>
            <div className="w-20 h-20 bg-neutral-100 rounded-xl flex items-center justify-center border flex-shrink-0">
              <div className="grid grid-cols-5 gap-[2px]">{Array(25).fill(0).map((_, i) => <div key={i} className={`w-[4px] h-[4px] rounded-[1px] ${[0,1,3,4,5,9,10,14,15,19,20,21,23,24].includes(i) ? "bg-neutral-800" : "bg-transparent"}`} />)}</div>
            </div>
          </div>
          <div className="text-xs text-neutral-500 bg-neutral-50 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-neutral-400">ⓘ</span> 링크를 통해 접속하면 닉네임만 입력하고 바로 참여할 수 있습니다
          </div>
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-2 flex items-start gap-2">
            <span>🔒</span><span>데모: 이 링크를 아는 사람은 세션을 열람할 수 있어요. 참가자 인증은 준비 중이라, 지금은 <strong>비밀 링크로 취급</strong>해 주세요.</span>
          </div>
        </div>

        {/* 세션 정보 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl border p-4">
            <div className="text-[10px] text-neutral-400 mb-0.5">세션 목표</div>
            <div className="text-sm font-medium">{goal}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-[10px] text-neutral-400 mb-0.5">방식 · 시간</div>
            <div className="text-sm font-medium">{methodName} · {mins}분</div>
          </div>
        </div>

        {/* 참여자 목록 */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Users size={15} /> 참여자</h2>
            <Badge>{joined.length} / {MEMBERS.length}</Badge>
          </div>
          <div className="space-y-2.5">
            {joined.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 anim-up">
                <div className={`w-9 h-9 rounded-full ${m.color} flex items-center justify-center text-sm font-semibold`}>{m.initial}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">{m.name} {m.isHost && <Badge variant="primary">HOST</Badge>}</div>
                  <div className="text-xs text-neutral-400">{i === 0 ? "방 생성" : `${i * 2}초 전 입장`}</div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
            ))}
            {joined.length < MEMBERS.length && (
              <div className="flex items-center gap-3 p-2.5 opacity-50">
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-300 animate-pulse"><Plus size={14} /></div>
                <div className="text-sm text-neutral-400 italic">참여자를 기다리는 중... ({MEMBERS.length - joined.length}명 남음)</div>
              </div>
            )}
          </div>
        </div>

        {/* 시작 버튼 */}
        <button onClick={onSessionStart} disabled={!canStart} className={`w-full py-4 rounded-2xl font-medium text-base flex items-center justify-center gap-2 transition-all ${canStart ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-[1.01] active:scale-[0.99]" : "bg-neutral-200 text-neutral-400 cursor-not-allowed"}`}>
          {isOnline
            ? <><Play size={18} /> 지금 세션 시작하기 {!allJoined && <span className="text-xs font-normal opacity-70">(나머지는 나중에 참여)</span>}</>
            : (allJoined ? <><Play size={18} /> 전원 입장 완료 — 세션 시작하기</> : <><div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" /> 팀원 입장 대기 중...</>)}
        </button>
        {isOnline && <p className="text-center text-xs text-neutral-400 mt-3">⏳ 이 세션은 <strong>마감 시간까지</strong> 열려 있습니다. 참여자는 링크로 각자 입장합니다.</p>}
      </main>
      <style>{`.anim-up{animation:fadeUp .4s ease-out}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ═══════ [2번] 프로필 작성 ═══════ */
function ProfileView({ onDone }) {
  const [name, setName] = useState("");
  const [skills, setSkills] = useState([]);
  const [strengths, setStrengths] = useState("");
  const toggle = (s) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const angle = skills.length ? assignAngle(skills) : null;
  const valid = name.trim() && skills.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <span className="font-bold tracking-tight">IdeationEngine</span>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-1">프로필 만들기</h1>
        <p className="text-neutral-500 mb-8">내가 뭘 할 수 있는지 알려주면, AI가 세션에서 나에게 <strong>다른 사람과 겹치지 않는 역할</strong>을 배정합니다.</p>

        <div className="bg-white rounded-2xl border p-6 mb-5">
          <label className="text-sm font-medium text-neutral-600 mb-2 block">닉네임</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="세션에서 표시될 이름" className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900 transition" />
        </div>

        <div className="bg-white rounded-2xl border p-6 mb-5">
          <label className="text-sm font-medium text-neutral-600 mb-1 block">내가 할 수 있는 것 <span className="text-neutral-400 font-normal">(여러 개 선택)</span></label>
          <p className="text-xs text-neutral-400 mb-3">선택한 역량에 따라 아이디어 발산 단계에서 접근 각도가 달라집니다.</p>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map(s => (
              <button key={s} onClick={() => toggle(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${skills.includes(s) ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 mb-5">
          <label className="text-sm font-medium text-neutral-600 mb-2 block">한 줄 강점 <span className="text-neutral-400 font-normal">(선택)</span></label>
          <input value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="예: 발표 자료를 빠르게 잘 만들어요" className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900 transition" />
        </div>

        {angle && (
          <div className={`rounded-2xl border-2 p-5 mb-5 anim-up ${angle.cls}`}>
            <div className="text-xs font-medium mb-1 opacity-70">AI가 배정할 나의 발산 각도 (예상)</div>
            <div className="text-lg font-bold flex items-center gap-2">{angle.icon} {angle.label}</div>
            <p className="text-sm mt-1 opacity-80">💡 {angle.hint}</p>
            <p className="text-[11px] mt-2 opacity-60">※ 팀 구성에 따라 세션에서 다른 각도로 조정될 수 있어요 (각도가 겹치지 않도록 분산)</p>
          </div>
        )}

        <button onClick={() => onDone({ name: name.trim(), skills, strengths: strengths.trim(), angle })} disabled={!valid} className="w-full py-3.5 bg-neutral-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition disabled:opacity-40"><ArrowRight size={16} /> 프로필 저장하고 시작</button>
      </main>
      <style>{`.anim-up{animation:fadeUp .4s ease-out}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ═══════ App ═══════ */
const DEFAULT_DATA = { goal: "", mins: 60, mode: "offline", method: "brain" };
const loadJSON = (key, fallback) => { try { return JSON.parse(sessionStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

export default function App() {
  const [view, setView] = useState(() => sessionStorage.getItem("ie_view") || "profile");
  const [myProfile, setMyProfile] = useState(() => loadJSON("ie_profile", null));
  const [data, setData] = useState(() => loadJSON("ie_data", DEFAULT_DATA));
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem("ie_sid") || null);
  // 서버에 영속된 콘텐츠(내 제출물). 데모 팀원 목업과 병합해 표시한다.
  const [content, setContent] = useState({ ice: [], ideas: [], votes: {} });

  // 새로고침해도 세션·프로필이 유지되도록 sessionStorage에 스냅샷 저장
  useEffect(() => { sessionStorage.setItem("ie_view", view); }, [view]);
  useEffect(() => { sessionStorage.setItem("ie_profile", JSON.stringify(myProfile)); }, [myProfile]);
  useEffect(() => { sessionStorage.setItem("ie_data", JSON.stringify(data)); }, [data]);
  useEffect(() => { if (sessionId) sessionStorage.setItem("ie_sid", sessionId); else sessionStorage.removeItem("ie_sid"); }, [sessionId]);

  // 서버 영속: 세션 id가 있으면 로드 시 서버에서 세션 필드(메타 + phase)를 복원한다.
  // (서버 다운/미존재 시엔 조용히 로컬 스냅샷 유지 — best-effort)
  // active 플래그로 stale 응답을 무시 → 세션 전환 시 옛 GET이 새 data를 덮는 레이스 방지
  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    api.getSession(sessionId)
      .then((s) => { if (!active) return;
        setData((d) => ({ ...d, goal: s.goal, mins: s.mins, mode: s.mode, method: s.method, deadlineAt: s.deadlineAt, phase: s.phase }));
        setContent({ ice: s.ice || [], ideas: s.ideas || [], votes: s.votes || {} });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [sessionId]);

  // 새 세션 시작/종료 시 이전 세션 진행도(단계·투표) 스냅샷 제거
  const clearProgress = () => { sessionStorage.removeItem("ie_step"); sessionStorage.removeItem("ie_votes"); sessionStorage.removeItem("ie_phaseStart"); };
  const exitToNew = () => { setData(DEFAULT_DATA); setSessionId(null); setContent({ ice: [], ideas: [], votes: {} }); setSyncError(false); clearProgress(); setView("create"); };

  // 콘텐츠 POST 성공 시 서버가 돌려준 세션으로 content를 갱신 → 재진입해도 유지 + id 정합
  const [syncError, setSyncError] = useState(false);
  const onContentSync = (s) => { if (s) { setContent({ ice: s.ice || [], ideas: s.ideas || [], votes: s.votes || {} }); setSyncError(false); } };
  const onSyncError = () => setSyncError(true);

  // 세션 생성: 서버에 등록해 실제 id를 확보한다. 서버가 없으면 로컬 전용으로 계속 진행.
  const startSession = async (g, m, mode, method) => {
    const localData = { goal: g, mins: m, mode, method, deadlineAt: Date.now() + 2 * 24 * 60 * 60 * 1000, phase: 0 };
    setData(localData);
    setSessionId(null);
    setContent({ ice: [], ideas: [], votes: {} });
    clearProgress();
    setView("lobby");
    try {
      const host = myProfile ? { id: "user", name: myProfile.name, initial: (myProfile.name || "나").charAt(0), skills: myProfile.skills } : null;
      const s = await api.createSession({ ...localData, host });
      // 생성 응답(서버 정규화값)으로 바로 data를 맞춰 GET 왕복 전 깜빡임을 없앤다
      setData((d) => ({ ...d, goal: s.goal, mins: s.mins, mode: s.mode, method: s.method, deadlineAt: s.deadlineAt, phase: s.phase }));
      setSessionId(s.id);
    } catch { /* 서버 미가동: 로컬 전용 폴백 */ }
  };

  if (view === "profile") {
    return <ProfileView onDone={(p) => { setMyProfile(p); setView("create"); }} />;
  }
  if (view === "create") {
    return <CreateView myProfile={myProfile} onStart={startSession} />;
  }
  if (view === "lobby") {
    return <LobbyView sessionId={sessionId} goal={data.goal} mins={data.mins} mode={data.mode} method={data.method} onSessionStart={() => setView("session")} />;
  }
  return <SessionView sessionId={sessionId} goal={data.goal} mins={data.mins} mode={data.mode} method={data.method} deadlineAt={data.deadlineAt} serverPhase={data.phase} content={content} onContentSync={onContentSync} onSyncError={onSyncError} syncError={syncError} myProfile={myProfile} onExit={exitToNew} />;
}
