import { useState, useEffect } from "react";
import { Clock, Users, Check, ChevronRight, ChevronLeft, Lightbulb, Target, MessageSquare, BarChart3, FileText, ArrowRight, Plus, Heart, Send, Vote, Sparkles, Play, X, Home } from "lucide-react";

/* ═══════════════════════════════════════════
   일관된 데이터 세트 — 모든 단계가 연결됨
   ═══════════════════════════════════════════ */

const MEMBERS = [
  { id: "sh", name: "김승희", initial: "김", color: "bg-blue-500 text-white", isHost: true },
  { id: "jm", name: "전재민", initial: "전", color: "bg-purple-500 text-white" },
  { id: "kb", name: "조경빈", initial: "조", color: "bg-amber-500 text-white" },
  { id: "jg", name: "이중곤", initial: "이", color: "bg-rose-500 text-white" },
];

const GOAL = "교내 해커톤에서 발표할 AI 기반 서비스 아이디어 도출";

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
  risks: ["기존 도구(Miro) 대비 차별성 인지", "AI 개입 수준에 대한 거부감 (33.9%)", "결과물 품질 신뢰도 확보 (40.3%)"],
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

/* ═══════ 공통 컴포넌트 ═══════ */
function Badge({ children, variant = "default" }) {
  const s = { default: "bg-neutral-100 text-neutral-600", primary: "bg-neutral-900 text-white", success: "bg-green-100 text-green-700", warning: "bg-amber-100 text-amber-700", info: "bg-blue-100 text-blue-700" };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s[variant]}`}>{children}</span>;
}

function getMember(id) { return MEMBERS.find(m => m.id === id) || { name: "알 수 없음", initial: "?", color: "bg-neutral-300" }; }

function MemberAvatar({ memberId, size = "sm" }) {
  const m = getMember(memberId);
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
function CreateView({ onStart }) {
  const [goal, setGoal] = useState(GOAL);
  const [method, setMethod] = useState(null);
  const [showRec, setShowRec] = useState(false);
  const [mins, setMins] = useState(60);

  const FW = [
    { id: "brain", icon: <Lightbulb size={18} />, name: "자유 브레인스토밍", match: 95, desc: "제한 없이 아이디어를 쏟아내는 방식. 해커톤 초반 발산에 최적.", reason: "다양한 방향 탐색이 필요한 해커톤에 가장 효과적" },
    { id: "scamper", icon: <Target size={18} />, name: "SCAMPER", match: 82, desc: "기존 아이디어를 7가지 관점으로 변형·발전시키는 체계적 방법.", reason: "기존 서비스 개선 방향이라면 구조화된 접근이 유리" },
    { id: "sixhats", icon: <Users size={18} />, name: "Six Thinking Hats", match: 78, desc: "6가지 사고 모자로 다각도 검토. 역할 분리로 균등 참여 유도.", reason: "팀원 간 참여 균형이 중요할 때 적합" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <span className="font-bold tracking-tight">IdeationEngine</span>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-1">세션 만들기</h1>
        <p className="text-neutral-500 mb-8">목표를 입력하면 AI가 최적의 방식을 추천합니다</p>
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <label className="text-sm font-medium text-neutral-600 mb-2 block">세션 목표</label>
          <textarea value={goal} onChange={e => setGoal(e.target.value)} className="w-full border rounded-xl p-4 text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-neutral-900 transition" />
          {!showRec && <button onClick={() => setShowRec(true)} disabled={!goal.trim()} className="w-full mt-3 py-3 bg-neutral-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition disabled:opacity-40"><Sparkles size={16} /> AI 추천 받기</button>}
        </div>
        {showRec && (
          <div className="space-y-4 anim-up">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-800"><strong>🤖 AI 분석:</strong> "{goal}" — 다양한 방향 탐색이 중요한 주제입니다.</div>
            {FW.map(f => (
              <button key={f.id} onClick={() => setMethod(f.id)} className={`w-full text-left bg-white rounded-xl border-2 p-5 transition-all hover:shadow-md ${method === f.id ? "border-neutral-900 shadow-md" : "border-transparent"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === f.id ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}>{f.icon}</div>
                  <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="font-semibold">{f.name}</span><Badge variant={f.match >= 90 ? "success" : "default"}>적합도 {f.match}%</Badge></div><p className="text-sm text-neutral-500">{f.desc}</p><p className="text-xs text-neutral-400 mt-1">💡 {f.reason}</p></div>
                </div>
              </button>
            ))}
            <div className="bg-white rounded-xl border p-5">
              <label className="text-sm font-medium mb-3 block">세션 시간</label>
              <div className="flex gap-2 mb-2">{[30, 60, 90].map(t => <button key={t} onClick={() => setMins(t)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${mins === t ? "bg-neutral-900 text-white" : "border hover:bg-neutral-50"}`}>{t}분</button>)}</div>
              <p className="text-xs text-neutral-400">📊 설문 62명 중 40.3%가 60분 선호</p>
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
            <button onClick={() => onStart(goal, mins)} disabled={!method} className="w-full py-3.5 bg-neutral-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition disabled:opacity-40"><ArrowRight size={16} /> 세션 생성 및 팀원 초대</button>
          </div>
        )}
      </main>
      <style>{`.anim-up{animation:fadeUp .4s ease-out}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ═══════ 세션 메인 ═══════ */
function SessionView({ goal, mins }) {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const id = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(id); }, []);
  const next = () => { setStep(s => Math.min(3, s + 1)); setElapsed(0); };
  const prev = () => { setStep(s => Math.max(0, s - 1)); setElapsed(0); };
  const phase = PHASES[step];
  const adjD = Math.round(phase.duration * mins / 60);
  const rem = Math.max(0, adjD * 60 - elapsed);
  const remM = Math.floor(rem / 60); const remS = rem % 60;
  const urgent = rem < adjD * 12;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0"><span className="font-bold text-sm">IdeationEngine</span><span className="text-neutral-300">|</span><span className="text-xs text-neutral-500 max-w-[200px] truncate">{goal}</span></div>
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
          <div className="flex items-center h-2.5 rounded-full overflow-hidden bg-neutral-100">
            {PHASES.map((p, i) => <div key={i} className={`h-full bg-gradient-to-r ${p.color} transition-opacity ${i === step ? "opacity-100" : i < step ? "opacity-30" : "opacity-10"}`} style={{ width: `${(Math.round(p.duration * mins / 60) / mins) * 100}%` }} />)}
          </div>
        </div>
      </div>
      <main className="flex-1 py-6">
        <div className="max-w-6xl mx-auto px-6">
          {step === 0 && <IcePhase />}
          {step === 1 && <IdeaPhase />}
          {step === 2 && <AnalyzePhase />}
          {step === 3 && <ReportPhase />}
        </div>
      </main>
      <footer className="bg-white border-t sticky bottom-0">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <button onClick={prev} disabled={step === 0} className="px-4 py-2 border rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-neutral-50 transition disabled:opacity-30"><ChevronLeft size={14} /> 이전</button>
          <div className="text-sm font-medium text-neutral-500">{phase.icon} {phase.label} · {adjD}분 배정</div>
          {step < 3 ? <button onClick={next} className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-neutral-800 transition">다음 <ChevronRight size={14} /></button>
            : <button className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-medium flex items-center gap-1"><Check size={14} /> 완료</button>}
        </div>
      </footer>
    </div>
  );
}

/* ═══════ Phase 1: 아이스브레이킹 ═══════ */
function IcePhase() {
  const [answers, setAnswers] = useState(ICE_ANSWERS.map(a => ({ ...a, member: getMember(a.memberId) })));
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const handleSubmit = () => {
    if (!input.trim()) return;
    setAnswers(prev => [{ memberId: "user", member: { name: "나 (시연자)", initial: "나", color: "bg-emerald-500 text-white" }, text: input, likes: 0 }, ...prev]);
    setInput(""); setSubmitted(true);
    setTimeout(() => setShowAi(true), 800);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-5"><Badge variant="info">💬 PHASE 1 · 10분</Badge><h2 className="text-xl font-bold mt-1">아이스브레이킹</h2><p className="text-sm text-neutral-500">세션 목표와 연결된 워밍업 질문입니다. 이 답변들이 다음 아이디어 발산의 출발점이 됩니다.</p></div>
        <div className="bg-neutral-900 text-white rounded-2xl p-6 mb-5">
          <div className="text-xs text-neutral-400 mb-2 flex items-center gap-1"><Sparkles size={11} /> 세션 목표 "{GOAL.slice(0, 20)}..."에 맞춰 AI가 질문을 생성했습니다</div>
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
              <div className="flex items-center gap-2 mb-2"><MemberAvatar memberId={a.memberId} /><span className="text-sm font-medium">{a.member.name}</span></div>
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

/* ═══════ Phase 2: 아이디어 발산 ═══════ */
function IdeaPhase() {
  const [ideas, setIdeas] = useState(IDEAS.map(i => ({ ...i, member: getMember(i.memberId) })));
  const [input, setInput] = useState("");
  const [aiMsgCount, setAiMsgCount] = useState(0); // 제출할 때마다 AI 메시지 추가

  const handleSubmit = () => {
    if (!input.trim()) return;
    setIdeas(prev => [{ id: Date.now(), memberId: "user", member: { name: "나 (시연자)", initial: "나", color: "bg-emerald-500 text-white" }, title: input, tags: ["NEW"], likes: 0, fromIce: "시연자가 직접 제안" }, ...prev]);
    setInput("");
    setAiMsgCount(c => Math.min(c + 1, AI_MSGS_IDEA.length));
  };

  return (
    <div>
      <div className="mb-5"><Badge variant="warning">💡 PHASE 2 · 20분</Badge><h2 className="text-xl font-bold mt-1">아이디어 발산</h2><p className="text-sm text-neutral-500">아이스브레이킹에서 나온 불편함을 기반으로 자유롭게 아이디어를 제안하세요.</p></div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-700 flex items-start gap-2"><Sparkles size={12} className="mt-0.5 flex-shrink-0" /> <span>아이스브레이킹에서 4명 모두 <strong>'정보가 있는데 접근이 안 되는'</strong> 구조의 불편함을 공유했습니다. 이 공통 패턴을 해결하는 AI 서비스를 자유롭게 상상해보세요.</span></div>
      <div className="bg-white rounded-xl border p-3 flex gap-2 mb-5">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="새 아이디어를 입력하세요... (제출하면 AI가 실시간 분석합니다)" className="flex-1 outline-none text-sm px-2" />
        <button onClick={handleSubmit} className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition flex items-center gap-1"><Send size={13} /> 제출</button>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ideas.map(idea => (
              <div key={idea.id} className="bg-white border rounded-xl p-4 hover:shadow-lg transition group anim-up">
                <div className="flex items-center gap-2 mb-2"><MemberAvatar memberId={idea.memberId} /><span className="text-sm font-medium">{idea.member.name}</span></div>
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

/* ═══════ Phase 3: 분석 + 투표 ═══════ */
function AnalyzePhase() {
  const [votes, setVotes] = useState({});
  const [remaining, setRemaining] = useState(3);
  const handleVote = (id) => {
    if (votes[id]) { setVotes({ ...votes, [id]: false }); setRemaining(r => r + 1); }
    else if (remaining > 0) { setVotes({ ...votes, [id]: true }); setRemaining(r => r - 1); }
  };

  return (
    <div>
      <div className="mb-5"><Badge variant="success">📊 PHASE 3 · 15분</Badge><h2 className="text-xl font-bold mt-1">AI 분석 및 그룹화 완료</h2><p className="text-sm text-neutral-500">이전 단계에서 제출된 아이디어를 AI가 의미 기반으로 4개 테마로 분류했습니다.</p></div>
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-2xl p-6 text-white mb-5">
        <div className="text-xs text-green-400 tracking-wider mb-2">AI INSIGHT SUMMARY</div>
        <p className="text-lg font-semibold mb-1">"팀원 4명의 아이디어가 하나의 공통 구조를 공유합니다: '반복적으로 발생하는 판단을 AI에 위임하여 인지 부하를 줄인다.'"</p>
        <p className="text-sm text-neutral-400">회의 진행, 학습 정리, 공간 탐색, 식재료 관리 — 영역은 다르지만 해결 구조가 동일합니다.</p>
        <div className="flex items-center gap-2 mt-2"><span className="text-xs text-neutral-500">분석 신뢰도</span><span className="text-xl font-bold text-green-400">94.2%</span></div>
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
function ReportPhase() {
  const [dl, setDl] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><Badge variant="primary">📋 FINAL · 5분</Badge><h2 className="text-xl font-bold mt-1">최종 아이데이션 결과 보고서</h2></div>
        <button onClick={() => setDl(true)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${dl ? "bg-green-500 text-white" : "bg-neutral-900 text-white hover:bg-neutral-800"}`}>{dl ? "✓ 완료" : "↓ PDF 다운로드"}</button>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-5">
          <div className="bg-white rounded-2xl border p-6">
            <div className="flex justify-between mb-3"><h3 className="font-semibold flex items-center gap-2"><Target size={15} /> 선정된 최종 아이디어</h3><Badge variant="success">Score: {REPORT.score}/100</Badge></div>
            <div className="bg-neutral-50 rounded-xl p-5 mb-4">
              <h4 className="text-lg font-bold mb-2">{REPORT.title}</h4>
              <p className="text-sm text-neutral-600 leading-relaxed">{REPORT.desc}</p>
            <p className="text-xs text-neutral-400 mt-2 italic">← 투표 1위 "AI 커뮤니케이션 도구" 테마에서 도출 ← 김승희의 아이디어에서 파생 ← 아이스브레이킹의 "팀플 눈치" 불편함에서 시작</p>
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
            <div className="font-semibold text-green-800 mb-1">🔄 데이터 흐름 요약</div>
            <p className="text-xs text-green-700 leading-relaxed">아이스브레이킹("팀플 눈치 보기, 카페 헛걸음, 식재료 낭비, 필기 정리 스트레스") → 4개 아이디어(퍼실리테이터 봇, 카페 정보 앱, 식재료 관리 앱, 학습 도우미) → AI가 공통 구조 감지("반복 판단의 AI 위임") → 테마 1위("AI 커뮤니케이션 도구", 38%) → 최종 선정("AI 커뮤니케이션 퍼실리테이터", 94점). 5개 단계가 인과관계로 연결됩니다.</p>
          </div>
        </div>
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4">
          <div className="bg-neutral-900 text-white rounded-2xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><BarChart3 size={14} /> 세션 요약</h3>
            {[["총 소요 시간", "60분"], ["참여자 수", `${MEMBERS.length + 1}명`], ["제출된 아이디어", "5+α개"], ["도출된 테마", "4개"]].map(([k, v]) => <div key={k} className="flex justify-between text-sm py-1"><span className="text-neutral-400">{k}</span><span className="font-bold">{v}</span></div>)}
            <div className="mt-3 pt-3 border-t border-neutral-700">
              <div className="text-xs text-neutral-400 mb-1">핵심 키워드</div>
              <div className="flex flex-wrap gap-1">{["AI 자동화", "퍼실리테이션", "익명성", "실시간"].map(k => <span key={k} className="text-[10px] px-2 py-0.5 bg-neutral-800 rounded-full">{k}</span>)}</div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="font-semibold text-amber-800 text-sm mb-1">📊 설문 데이터 근거</div>
            <p className="text-xs text-amber-700 leading-relaxed">이 보고서는 설문 62명 중 54.8%가 1위로 선택한 "결과 자동 요약" 기능으로 생성되었습니다. 세션 데이터를 AI가 분석하여 핵심 가치, 타겟, 리스크까지 자동 구성합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════ 대기실 (로비) ═══════ */
function LobbyView({ goal, mins, onSessionStart }) {
  const link = "https://ideationengine.app/s/aB3x9Y";
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
  const METHODS = { brain: "자유 브레인스토밍", scamper: "SCAMPER", sixhats: "Six Thinking Hats" };

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
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-neutral-900 text-white flex items-center justify-center"><Users size={24} /></div>
          <h1 className="text-2xl font-bold mb-1">팀원을 기다리고 있어요</h1>
          <p className="text-neutral-500 text-sm">아래 링크를 공유해서 팀원을 초대하세요</p>
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
        </div>

        {/* 세션 정보 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl border p-4">
            <div className="text-[10px] text-neutral-400 mb-0.5">세션 목표</div>
            <div className="text-sm font-medium">{goal}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-[10px] text-neutral-400 mb-0.5">방식 · 시간</div>
            <div className="text-sm font-medium">자유 브레인스토밍 · {mins}분</div>
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
        <button onClick={onSessionStart} disabled={!allJoined} className={`w-full py-4 rounded-2xl font-medium text-base flex items-center justify-center gap-2 transition-all ${allJoined ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-[1.01] active:scale-[0.99]" : "bg-neutral-200 text-neutral-400 cursor-not-allowed"}`}>
          {allJoined ? <><Play size={18} /> 전원 입장 완료 — 세션 시작하기</> : <><div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" /> 팀원 입장 대기 중...</>}
        </button>
      </main>
      <style>{`.anim-up{animation:fadeUp .4s ease-out}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ═══════ App ═══════ */
export default function App() {
  const [view, setView] = useState("create");
  const [data, setData] = useState({ goal: "", mins: 60 });

  if (view === "create") {
    return <CreateView onStart={(g, m) => { setData({ goal: g, mins: m }); setView("lobby"); }} />;
  }
  if (view === "lobby") {
    return <LobbyView goal={data.goal} mins={data.mins} onSessionStart={() => setView("session")} />;
  }
  return <SessionView goal={data.goal} mins={data.mins} />;
}
