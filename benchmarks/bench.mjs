/* OpenRouter 모델 벤치마크 하네스 — ice 후보 슛아웃 + 파이프라인 kind 실측.
   측정: in/out/total 토큰, 실비용(usage.include), 지연(ms), 추론누수(reasoning 길이), 출력.
   실행: cd ideation-engine && node benchmarks/bench.mjs   (.env의 OPENROUTER_API_KEY 사용)
   결과: benchmarks/results.json (재현·발표용) */
import "dotenv/config";
import fs from "node:fs";

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("OPENROUTER_API_KEY 없음 — .env 확인"); process.exit(1); }

const PROMPTS = {
  ice: "회의가 목소리 큰 사람에게만 쏠리는 문제를 줄이고 싶다",
  keyword: "비대면 팀 회의의 효율을 높이는 서비스",
  idea: "비대면 팀 회의의 효율을 높이는 서비스",
  analyze: "제출된 아이디어: 익명투표, AI요약, 타임박스 타이머, 역할 랜덤배정, 발언균형 대시보드",
  report: "세션 결과: 익명투표로 3개 테마 선정, AI가 각 테마 요약, 다음 단계 로드맵 필요",
};
const SYSTEM = {
  ice: "너는 아이스브레이킹 진행자다. 참가자가 떠올릴 짧은 발상의 씨앗을 한 문장으로만 준다.",
  keyword: "너는 키워드 추출기다. 목표에서 핵심 키워드 3~5개만 쉼표로 답한다.",
  idea: "너는 아이디어 발산 워커다. 이 목표에 대해 새로운 접근 하나를 두 문장 이내로 제안한다.",
  analyze: "너는 분석가다. 아이디어들을 3~4개 테마로 묶고 공통 구조를 짧게 요약한다.",
  report: "너는 정리 담당이다. 세션 결과를 종합한 짧은 보고서 초안을 5줄 이내로 작성한다.",
};
const MAXTOK = { ice: 512, keyword: 256, idea: 256, analyze: 1500, report: 1500 };

// 테스트 매트릭스 (label=발표용 표기, slug=OpenRouter 실제 모델)
const CASES = [
  // ── ice 슛아웃 (같은 프롬프트, 여러 모델) ──
  { group: "ice-shootout", kind: "ice", label: "Nemotron-Nano (baseline·reasoning)", slug: "nvidia/nemotron-nano-9b-v2:free" },
  { group: "ice-shootout", kind: "ice", label: "Qwen2.5-7B-Instruct", slug: "qwen/qwen-2.5-7b-instruct" },
  { group: "ice-shootout", kind: "ice", label: "Gemini-2.5-Flash-Lite", slug: "google/gemini-2.5-flash-lite" },
  { group: "ice-shootout", kind: "ice", label: "Gemini-2.5-Flash", slug: "google/gemini-2.5-flash" },
  { group: "ice-shootout", kind: "ice", label: "GPT-4o-mini", slug: "openai/gpt-4o-mini" },
  { group: "ice-shootout", kind: "ice", label: "Llama-3.2-3B-Instruct", slug: "meta-llama/llama-3.2-3b-instruct" },
  // ── 파이프라인 나머지 kind (실측·비용 스토리) ──
  { group: "pipeline", kind: "keyword", label: "Qwen2.5-7B", slug: "qwen/qwen-2.5-7b-instruct" },
  { group: "pipeline", kind: "idea", label: "Qwen2.5-7B (biz각도)", slug: "qwen/qwen-2.5-7b-instruct" },
  { group: "pipeline", kind: "idea", label: "Solar-Pro-3 (ux각도·한국어)", slug: "upstage/solar-pro-3" },
  // ── flagship(analyze/report) 비교: 추론 ON vs OFF vs 비추론 ──
  { group: "flagship", kind: "analyze", label: "GLM-4.6 (추론 ON)", slug: "z-ai/glm-4.6" },
  { group: "flagship", kind: "analyze", label: "GLM-4.6 (추론 OFF)", slug: "z-ai/glm-4.6", noReason: true },
  { group: "flagship", kind: "analyze", label: "Gemini-2.5-Flash (비추론)", slug: "google/gemini-2.5-flash" },
  { group: "flagship", kind: "report", label: "GLM-4.6 (추론 ON)", slug: "z-ai/glm-4.6" },
  { group: "flagship", kind: "report", label: "Gemini-2.5-Flash (비추론)", slug: "google/gemini-2.5-flash" },
];

async function run(c) {
  const body = {
    model: c.slug,
    messages: [
      { role: "system", content: SYSTEM[c.kind] },
      { role: "user", content: `아래 목표에 답하라.\n<<<GOAL>>>\n${PROMPTS[c.kind]}\n<<<END>>>` },
    ],
    max_tokens: MAXTOK[c.kind] || 256,
    temperature: 0.7,
    usage: { include: true }, // 실비용 회수
    ...(c.noReason ? { reasoning: { enabled: false } } : {}), // 하이브리드 모델 추론 끄기 비교
  };
  const t0 = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IdeationEngine-Bench" },
      body: JSON.stringify(body),
    });
    const latencyMs = Date.now() - t0;
    const data = await res.json();
    if (!res.ok) return { ...c, ok: false, status: res.status, error: JSON.stringify(data.error || data).slice(0, 180), latencyMs };
    const m = data.choices?.[0]?.message || {};
    const u = data.usage || {};
    return {
      ...c, ok: true, status: 200, latencyMs,
      inTok: u.prompt_tokens ?? null, outTok: u.completion_tokens ?? null, totalTok: u.total_tokens ?? null,
      cost: u.cost ?? null, reasoningLen: (m.reasoning || "").length, textLen: (m.content || "").length,
      text: (m.content || "").replace(/\s+/g, " ").trim().slice(0, 140),
    };
  } catch (e) {
    return { ...c, ok: false, status: "ERR", error: String(e.message || e).slice(0, 180), latencyMs: Date.now() - t0 };
  }
}

const results = [];
for (const c of CASES) {
  const r = await run(c);
  results.push(r);
  const line = r.ok
    ? `in${r.inTok}/out${r.outTok} think${r.reasoningLen} ${r.latencyMs}ms $${r.cost} :: ${r.text.slice(0, 50)}`
    : `(${r.status}) ${r.error}`;
  console.log(`[${r.ok ? "OK  " : "FAIL"}] ${r.group.padEnd(13)} ${r.kind.padEnd(8)} ${r.label.padEnd(34)} ${line}`);
  await new Promise((s) => setTimeout(s, 900)); // 레이트리밋 완화
}

fs.mkdirSync("benchmarks", { recursive: true });
fs.writeFileSync("benchmarks/results.json", JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));
console.log(`\nSAVED benchmarks/results.json  (${results.filter((r) => r.ok).length}/${results.length} OK)`);
