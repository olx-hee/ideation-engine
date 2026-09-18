/* 창의 사람축 — 블라인드 A/B (점수 없이 좌/우 택1).
   각 목표에 대해 단일(S: Solar가 4개) vs 다중(M: 4모델이 각 1개) 아이디어 세트 생성,
   라벨 없이 좌/우 무작위 배치. 사용자가 고른 뒤 집계.
   실행: node blind-creative-ab.mjs > (스크래치패드 JSON) */
import "dotenv/config";
const KEY = process.env.OPENROUTER_API_KEY;

async function call(slug, sys, user, maxTok = 300, temp = 0.9) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "IE-CreativeAB" },
    body: JSON.stringify({ model: slug, messages: [{ role: "system", content: sys }, { role: "user", content: user }], max_tokens: maxTok, temperature: temp }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`${slug} ${res.status}`);
  return (d.choices?.[0]?.message?.content ?? "").trim();
}

const GOALS = [
  "저녁 시간 외로움을 느끼는 1인 가구를 위한 서비스",
  "대학생 팀 프로젝트의 무임승차 문제를 줄이는 도구",
  "도서관에서 자리만 맡아두고 오래 비우는 문제 해결",
  "자취생의 식비를 줄여주는 서비스",
  "헬스장 등록만 하고 안 가는 사람을 위한 동기부여 앱",
  "동네 소상공인이 단골을 늘리도록 돕는 방법",
];

// 단일(S): Solar 혼자 4개
async function single(goal) {
  const t = await call("upstage/solar-pro4",
    "너는 아이디어 발산 전문가다. 서로 겹치지 않는 창의적인 아이디어 4개를 각각 한 문장으로. 번호로.",
    `목표: ${goal}`);
  return t;
}
// 다중(M): 4모델이 각 1개(다른 렌즈)
const LENSES = [
  ["upstage/solar-pro4", "실용적이고 저비용으로 바로 실행 가능한"],
  ["google/gemini-2.5-flash", "아무도 생각 못 한 참신하고 의외의"],
  ["moonshotai/kimi-k2.5", "기술로 자동화하거나 데이터를 활용하는"],
  ["mistralai/mistral-medium-3", "전혀 다른 분야의 방식을 결합한"],
];
async function multi(goal) {
  const outs = [];
  for (let i = 0; i < LENSES.length; i++) {
    const [slug, lens] = LENSES[i];
    const t = await call(slug, "너는 아이디어 발산 전문가다. 아래 목표에 대한 아이디어 1개를 한 문장으로만.", `목표: ${goal}\n관점: ${lens} 아이디어.`);
    outs.push(`${i + 1}. ${t.replace(/^\s*\d+[.)]\s*/, "").replace(/\n/g, " ").trim()}`);
  }
  return outs.join("\n");
}

const pairs = [];
for (const goal of GOALS) {
  process.stderr.write(`생성중: ${goal}\n`);
  const [S, M] = [await single(goal), await multi(goal)];
  const leftIsS = Math.random() < 0.5;
  pairs.push({ goal, left: leftIsS ? S : M, right: leftIsS ? M : S, leftIs: leftIsS ? "S" : "M" });
}
console.log(JSON.stringify({ pairs }, null, 2));
