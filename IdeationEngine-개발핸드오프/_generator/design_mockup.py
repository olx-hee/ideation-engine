# IdeationEngine 디자인 목업 생성기 (v14 · 화면 1~9-5 + 계정 A1~A5)
# 실행: python _generator/design_mockup.py  ->  design/IdeationEngine-디자이너-목업-v14.html
# (보통은 handoff.py가 이 파일을 먼저 실행하므로 따로 돌릴 필요 없음)
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'design', 'IdeationEngine-디자이너-목업-v14.html')

BASE_CSS = r"""
:root{
  color-scheme:light;
  /* ── Key color: Indigo 600 #4F46E5 기준 스케일 ── */
  --key-50:#EEF2FF;--key-100:#E0E7FF;--key-200:#C7D2FE;--key-300:#A5B4FC;--key-400:#818CF8;
  --key-500:#6366F1;--key-600:#4F46E5;--key-700:#4338CA;--key-800:#3730A3;--key-900:#312E81;--key-950:#1E1B4B;
  --key:var(--key-600);
  /* ── 뉴트럴 (살짝 인디고 톤) ── */
  --page:#E4E5F1;--app-bg:#FAFAFE;--panel:#FFFFFF;--soft:#F5F5FB;--line:#E2E3EF;--line2:#EDEEF6;
  --ink:#1B1B2F;--muted:#626280;--faint:#9A9AB5;
  /* ── 의미 색 ── */
  --ok:#059669;--ok-soft:#E7F6EF;--ok-line:#B7E2CD;
  --warn:#B45309;--warn-soft:#FBF1E2;--warn-line:#ECCFA0;
  --bad:#BE123C;--bad-soft:#FBE9ED;--bad-line:#EEC0CB;
  --shadow:0 1px 2px rgba(30,27,75,.05),0 8px 24px rgba(30,27,75,.08);
  --board-shadow:0 2px 6px rgba(30,27,75,.06),0 24px 60px rgba(30,27,75,.14);
  --pop-shadow:0 6px 14px rgba(30,27,75,.10),0 24px 48px rgba(30,27,75,.18);
  --mono:"JetBrains Mono",ui-monospace,Menlo,monospace;
  --sans:"Noto Sans KR",system-ui,-apple-system,"Malgun Gothic",sans-serif;
  /* ── 글자 크기 8단계 ── */
  --fs-display:36px;--fs-h1:24px;--fs-h2:18px;--fs-h3:16px;--fs-body:14px;--fs-sm:13px;--fs-cap:12px;--fs-label:11px;
}
*{box-sizing:border-box}
html{scroll-snap-type:y proximity}
body{margin:0;background:var(--page);color:var(--ink);font-family:var(--sans);font-size:var(--fs-body);line-height:1.5;-webkit-font-smoothing:antialiased}
p{margin:0}

/* ── 문서 부분 ── */
.doc{max-width:1280px;margin:0 auto;padding:48px 16px 24px}
.eyebrow{font-family:var(--mono);font-size:var(--fs-label);font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
h1.title{font-size:var(--fs-display);font-weight:900;letter-spacing:-.02em;margin:6px 0 8px;line-height:1.25}
.sub{color:var(--muted);font-size:var(--fs-sm);max-width:72ch}
.memo{margin-top:20px;background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:24px}
.memo h3{font-family:var(--mono);font-size:var(--fs-label);font-weight:700;color:var(--key);letter-spacing:.06em;text-transform:uppercase;margin:0 0 12px}
.memo h3:not(:first-child){margin-top:28px}
.memo ul{margin:0;padding-left:18px;font-size:var(--fs-sm);line-height:1.75}
.keyhero{display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:stretch}
.keychip{border-radius:14px;background:var(--key);color:#fff;padding:16px;display:flex;flex-direction:column;justify-content:flex-end;min-height:150px}
.keychip b{font-size:var(--fs-h1);font-weight:900;line-height:1.2}
.keychip span{font-family:var(--mono);font-size:var(--fs-cap);opacity:.85}
.keyinfo{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 20px;align-content:center}
.kv{border-bottom:1px solid var(--line2);padding:6px 0}
.kv .k{font-family:var(--mono);font-size:var(--fs-label);color:var(--muted)}
.kv .v{font-family:var(--mono);font-size:var(--fs-body);font-weight:700}
.scale{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:6px;margin-top:16px}
.scale div{border-radius:10px;overflow:hidden;border:1px solid var(--line)}
.scale i{display:block;height:48px}
.scale .t{padding:6px 7px;background:var(--panel)}
.scale .t b{display:block;font-family:var(--mono);font-size:var(--fs-label)}
.scale .t span{display:block;font-family:var(--mono);font-size:var(--fs-label);color:var(--muted)}
.scale .t em{display:block;font-style:normal;font-size:var(--fs-label);color:var(--key);margin-top:2px;line-height:1.35}
.scale div.is-key{border:2px solid var(--key)}
.swatches{display:flex;flex-wrap:wrap;gap:6px}
.sw{display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-cap);border:1px solid var(--line);border-radius:8px;padding:5px 9px;background:var(--soft)}
.sw i{width:14px;height:14px;border-radius:4px;display:block;border:1px solid rgba(0,0,0,.08)}
.tscale{width:100%;border-collapse:collapse}
.tscale td{padding:9px 8px;border-bottom:1px solid var(--line2);vertical-align:middle}
.tscale td.tk{font-family:var(--mono);font-size:var(--fs-label);color:var(--key);white-space:nowrap;width:1%}
.tscale td.px{font-family:var(--mono);font-size:var(--fs-label);color:var(--muted);white-space:nowrap;width:1%}
.tscale td.use{font-size:var(--fs-cap);color:var(--muted)}
.flow{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:18px}
.flow a{font-size:var(--fs-cap);padding:5px 10px;border-radius:8px;border:1px solid var(--line);background:var(--panel);color:var(--ink);text-decoration:none;white-space:nowrap}
.flow a.sess{background:var(--key-50);border-color:var(--key-200);color:var(--key-700)}

/* ── 화면 1장 = 1280×800 고정 보드, 창 크기에 맞춰 통째로 축소 ── */
.screen{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;scroll-snap-align:center}
.shot{width:1280px;flex:none}
.cap{display:flex;gap:10px;align-items:center;height:40px;margin-bottom:10px;overflow:hidden}
.cap .num{font-family:var(--mono);font-size:var(--fs-sm);font-weight:700;color:#fff;background:var(--key);border-radius:7px;padding:2px 9px;flex:none}
.cap h2{font-size:var(--fs-h2);font-weight:700;margin:0;white-space:nowrap}
.cap .d{font-size:var(--fs-cap);color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tag{font-family:var(--mono);font-size:var(--fs-label);font-weight:500;padding:2px 8px;border-radius:999px;white-space:nowrap;flex:none}
.tag.new{color:var(--key-700);border:1px solid var(--key-200);background:var(--key-50)}
.tag.ref{color:var(--warn);border:1px solid var(--warn-line);background:var(--warn-soft)}
.board{width:1280px;height:800px;background:var(--app-bg);border-radius:18px;box-shadow:var(--board-shadow);overflow:hidden;display:flex;flex-direction:column;position:relative;border:1px solid var(--line)}
.shot{zoom:1}
@media (max-width:1311px),(max-height:897px){.shot{zoom:.9}}
@media (max-width:1183px),(max-height:812px){.shot{zoom:.8}}
@media (max-width:1055px),(max-height:727px){.shot{zoom:.7}}
@media (max-width:927px),(max-height:642px){.shot{zoom:.6}}
@media (max-width:799px){.shot{zoom:.5}}
@media (max-width:671px){.shot{zoom:.4}}
@media (max-width:543px){.shot{zoom:.3}}
@media (max-width:415px){.shot{zoom:.25}}

/* ── 앱 상단바 (세션 전) ── */
.appbar{height:64px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 32px;border-bottom:1px solid var(--line2);background:var(--panel)}
.appbar.clear{background:transparent;border-bottom-color:transparent}
.applogo{font-weight:900;letter-spacing:-.02em;font-size:var(--fs-h2);color:var(--key)}
.pbtn{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:4px 12px 4px 4px;color:var(--muted);font-size:var(--fs-sm)}
.pbtn .nm{color:var(--ink);font-weight:500}
.pbtn.open{border-color:var(--key);box-shadow:0 0 0 3px var(--key-100)}
.pbtn .avatar{width:32px;height:32px}
.avatar{width:36px;height:36px;border-radius:50%;background:var(--key-100);color:var(--key-700);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--fs-sm);flex:none}
.avatar.guest{background:var(--soft);color:var(--faint);border:1px dashed var(--line)}
.abody{flex:1;min-height:0;position:relative}

/* ── 공통 컴포넌트 ── */
.lead{font-size:var(--fs-h1);font-weight:700;letter-spacing:-.01em;line-height:1.35}
.hint{color:var(--muted);font-size:var(--fs-sm);margin-top:4px}
.muted{color:var(--muted)}.t-sm{font-size:var(--fs-sm)}.t-cap{font-size:var(--fs-cap)}
.btn{background:var(--key);color:#fff;border:1px solid var(--key);border-radius:10px;padding:11px 18px;font-size:var(--fs-body);font-weight:500;font-family:inherit;display:inline-flex;gap:8px;align-items:center;justify-content:center;white-space:nowrap}
.btn.ghost{background:var(--panel);color:var(--ink);border-color:var(--line)}
.btn.soft{background:var(--key-50);color:var(--key-700);border-color:var(--key-200)}
.btn.text{background:transparent;color:var(--key);border-color:transparent}
.btn.sm{padding:7px 12px;font-size:var(--fs-sm);border-radius:8px}
.btn.lg{padding:14px 24px;font-size:var(--fs-h3)}
.btn.block{width:100%;padding:14px}
.btn .r{font-size:var(--fs-cap);opacity:.7}
.inp{width:100%;border:1px solid var(--line);border-radius:10px;padding:11px 14px;font-size:var(--fs-body);background:var(--panel);color:var(--ink)}
.inp.ph{color:var(--faint)}
.card{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:16px 18px}
.badge{font-family:var(--mono);font-size:var(--fs-label);font-weight:500;padding:2px 8px;border-radius:999px;border:1px solid var(--line);background:var(--soft);color:var(--muted);white-space:nowrap}
.badge.ok{color:var(--ok);border-color:var(--ok-line);background:var(--ok-soft)}
.badge.key{color:var(--key-700);border-color:var(--key-200);background:var(--key-50)}
.note-box{font-size:var(--fs-cap);color:var(--warn);background:var(--warn-soft);border:1px solid var(--warn-line);border-radius:10px;padding:9px 12px;margin-top:16px;display:flex;gap:7px}
.chip{font-size:var(--fs-sm);padding:7px 14px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--muted);white-space:nowrap}
.chip.on{background:var(--key);color:#fff;border-color:var(--key);font-weight:500}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.sk{font-size:var(--fs-sm);padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--muted);display:inline-flex;gap:5px;align-items:center;white-space:nowrap}
.sk.on{background:var(--key-50);border-color:var(--key-400);color:var(--key-700);font-weight:500}
.lbl{font-size:var(--fs-sm);font-weight:700;margin-bottom:8px;display:flex;gap:8px;align-items:baseline}
.lbl .q{font-family:var(--mono);color:var(--key);font-size:var(--fs-label)}
.lbl .opt{color:var(--faint);font-weight:400;font-size:var(--fs-cap)}
.whybox{font-size:var(--fs-cap);color:var(--muted);background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:10px 12px}
.foot{display:flex;justify-content:space-between;align-items:center;gap:12px}
.note{font-size:var(--fs-cap);color:var(--muted)}
.divider{display:flex;align-items:center;gap:12px;color:var(--faint);font-size:var(--fs-cap)}
.divider::before,.divider::after{content:"";flex:1;height:1px;background:var(--line)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}

/* 1 랜딩 */
.landing{background:radial-gradient(900px 520px at 50% 38%,var(--key-100),transparent 70%),var(--app-bg)}
.center{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding-bottom:64px}
.hero-logo{font-size:64px;font-weight:900;letter-spacing:-.03em;color:var(--key);line-height:1.1}
.slogan{font-size:var(--fs-h2);margin-top:16px}
.cta{display:flex;gap:12px;justify-content:center;margin-top:36px}
.acct{margin-top:28px;padding-top:22px;border-top:1px solid var(--key-200);width:400px;display:flex;flex-direction:column;align-items:center;gap:10px}
.pop{position:absolute;top:8px;right:32px;width:320px;background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:var(--pop-shadow);overflow:hidden;text-align:left;z-index:2}
.pop .ph{display:flex;gap:12px;align-items:center;padding:18px}
.pop .ph .avatar{width:48px;height:48px;font-size:var(--fs-h3)}
.pop .nm{font-size:var(--fs-h3);font-weight:700;line-height:1.3}
.pop .em{font-family:var(--mono);font-size:var(--fs-label);color:var(--muted)}
.pop .pb{padding:14px 18px;border-top:1px solid var(--line2);background:var(--key-50)}
.pop .pk{font-family:var(--mono);font-size:var(--fs-label);color:var(--key-700);margin-bottom:8px}
.pop .menu{padding:6px}
.pop .mi{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;font-size:var(--fs-sm)}
.pop .mi.hover{background:var(--soft)}
.pop .mi.out{color:var(--bad);border-top:1px solid var(--line2);border-radius:0;margin-top:4px}
.dim{opacity:.35}

/* 2 코드 입장 */
.panel{background:var(--panel);border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow);padding:40px 48px;width:520px;text-align:center}
.codebox{display:flex;gap:8px;justify-content:center}
.codebox b{font-family:var(--mono);font-size:var(--fs-h1);font-weight:700;width:52px;height:64px;border:1px solid var(--line);border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--soft)}
.codebox b.f{border-color:var(--key-400);color:var(--key-700);background:var(--key-50)}
.codebox b.c{border:2px solid var(--key);background:var(--panel);color:var(--faint)}

/* 3 프로필 · 4 세션 만들기 */
.page{height:100%;padding:36px 64px 0;display:flex;flex-direction:column}
.page .cols{display:grid;grid-template-columns:1fr 1.25fr;gap:20px;margin-top:24px}
.stack{display:flex;flex-direction:column;gap:20px}
.pagefoot{margin-top:auto;height:80px;flex:none;border-top:1px solid var(--line2);display:flex;align-items:center;justify-content:space-between}
.grp+.grp{margin-top:14px}
.grp .gl{font-size:var(--fs-label);font-weight:700;color:var(--muted);font-family:var(--mono);margin-bottom:8px}
.preview{border:1px solid var(--key-200);background:linear-gradient(135deg,var(--key-50),var(--panel));border-radius:14px;padding:16px 18px}
.preview .pk{font-family:var(--mono);font-size:var(--fs-label);color:var(--key-700)}
.preview .pv{font-size:var(--fs-h2);font-weight:700;margin:4px 0 2px}
.cardt{font-size:var(--fs-sm);font-weight:700;margin-bottom:12px;display:flex;gap:6px;align-items:center}
.custom{display:flex;align-items:center;gap:8px;margin-top:12px;padding-top:12px;border-top:1px dashed var(--line)}
.custom .mini{width:88px;border:2px solid var(--key);box-shadow:0 0 0 3px var(--key-100);border-radius:8px;padding:6px 10px;font-family:var(--mono);font-size:var(--fs-body);font-weight:700;text-align:right;background:var(--panel)}

/* 5·6 대기실 */
.qr{width:120px;height:120px;background:var(--panel);border:1px solid var(--line);border-radius:12px;display:grid;grid-template-columns:repeat(6,1fr);gap:3px;padding:10px}
.qr i{background:var(--key-950);border-radius:1px}
.roomcode{font-family:var(--mono);font-size:56px;font-weight:700;letter-spacing:.08em;line-height:1.15;color:var(--key)}
.prow{display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--panel);font-size:var(--fs-sm)}
.prow.empty{border-style:dashed;color:var(--faint);background:transparent}
.dot{width:9px;height:9px;border-radius:50%;background:var(--ok);flex:none}

/* ── 세션 셸 ── */
.sbar{height:88px;flex:none;display:grid;grid-template-columns:1fr 500px 1fr;align-items:center;gap:20px;padding:0 28px;background:var(--panel);border-bottom:1px solid var(--line)}
.sb-left,.sb-right{display:flex;align-items:center;gap:10px}
.sb-right{justify-content:flex-end}
.codetag{font-family:var(--mono);font-size:var(--fs-label);color:var(--key-700);background:var(--key-50);border:1px solid var(--key-200);border-radius:6px;padding:1px 7px}
.timer{font-family:var(--mono);font-size:var(--fs-sm);color:var(--muted);white-space:nowrap;border:1px solid var(--line);border-radius:8px;padding:4px 9px}
.timer b{color:var(--ink);font-weight:700}
.prog{display:flex;flex-direction:column;gap:7px;background:var(--key-50);border:1px solid var(--key-100);border-radius:14px;padding:9px 16px 8px}
.prog-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.prog-top .l{display:flex;align-items:center;gap:8px}
.prog-step{font-family:var(--mono);font-size:var(--fs-label);font-weight:700;color:#fff;background:var(--key);border-radius:6px;padding:1px 7px}
.prog-name{font-size:var(--fs-h3);font-weight:700;color:var(--key-950)}
.prog-pct{font-family:var(--mono);font-size:var(--fs-h3);font-weight:700;color:var(--key)}
.prog-pct small{font-size:var(--fs-label);color:var(--muted);font-weight:500;margin-right:6px}
.seg{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.seg i{height:6px;border-radius:99px;background:var(--key-200);display:block;position:relative;overflow:hidden}
.seg i.done{background:var(--key)}
.seg i.cur{background:var(--key-200)}
.seg i.cur b{position:absolute;left:0;top:0;bottom:0;background:var(--key-500);border-radius:99px}
.seg-l{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.seg-l span{font-size:var(--fs-label);color:var(--faint);text-align:center;white-space:nowrap;line-height:1.2}
.seg-l span.done{color:var(--key-400)}
.seg-l span.cur{color:var(--key-700);font-weight:700}
.sbody{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 330px}
.smain{padding:28px 32px;min-width:0;overflow:hidden}
.shead{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px}
.summary{border-left:1px solid var(--line);background:var(--panel);padding:18px 20px;display:flex;flex-direction:column;gap:12px;min-height:0}
.sum-h{display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--line2)}
.sum-h b{font-size:var(--fs-h3);font-weight:700;display:flex;align-items:center;gap:8px}
.live{width:8px;height:8px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 4px var(--ok-soft)}
.sum-meta{font-family:var(--mono);font-size:var(--fs-label);color:var(--faint)}
.sum-list{border-left:2px solid var(--key-100);margin-left:5px}
.si{position:relative;padding:0 0 11px 16px}
.si:last-child{padding-bottom:0}
.si::before{content:"";position:absolute;left:-7px;top:4px;width:12px;height:12px;border-radius:50%;background:var(--panel);border:2px solid var(--key-300)}
.si.fresh::before{border-color:var(--key);background:var(--key);box-shadow:0 0 0 3px var(--key-100)}
.si .k{font-family:var(--mono);font-size:var(--fs-label);color:var(--muted);display:flex;gap:6px;align-items:center;line-height:1.4}
.si .k em{font-style:normal;color:#fff;background:var(--key);border-radius:4px;padding:0 5px;font-weight:700}
.si .v{font-size:var(--fs-sm);margin-top:1px;line-height:1.45}
.si .v b{color:var(--key-700)}
.si.fresh .v{background:var(--key-50);border:1px solid var(--key-200);border-radius:8px;padding:6px 9px;margin-top:4px}
.sum-next{font-size:var(--fs-cap);color:var(--muted);border:1px dashed var(--key-200);border-radius:10px;padding:8px 11px;margin-top:auto}
.sum-next b{color:var(--key-700)}
.sum-foot{display:flex;gap:8px}
.sum-foot .btn{flex:1}

/* 세션 화면 내용 */
.map{width:100%;border-collapse:separate;border-spacing:0;font-size:var(--fs-sm);background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.map th,.map td{padding:9px 10px;border-bottom:1px solid var(--line2);text-align:center}
.map tr:last-child td{border-bottom:none}
.map th{font-size:var(--fs-sm);color:var(--ink);font-weight:700;background:var(--soft)}
.map td.skill{text-align:left;font-weight:500;padding-left:18px}
.map td.cnt{font-family:var(--mono);font-size:var(--fs-cap);color:var(--muted)}
.map tr.gap td{background:var(--warn-soft)}
.map tr.gap td.cnt{color:var(--warn);font-weight:700}
.cell{display:inline-flex;width:26px;height:26px;border-radius:8px;align-items:center;justify-content:center;font-size:var(--fs-cap);font-weight:700}
.cell.g{background:var(--key);color:#fff}
.cell.n{color:var(--line)}
.boxrow{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.strbox,.gapbox{border-radius:12px;padding:12px 14px;font-size:var(--fs-sm)}
.strbox{background:var(--key-50);border:1px solid var(--key-200);color:var(--key-800)}
.gapbox{background:var(--warn-soft);border:1px solid var(--warn-line);color:var(--warn)}
.qcard{border-radius:16px;padding:24px 26px;color:#fff;background:linear-gradient(135deg,var(--key-600),var(--key-800))}
.qcard .s{font-size:var(--fs-cap);opacity:.75}
.qcard .q{font-size:var(--fs-h1);font-weight:700;margin-top:6px}
.idea{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:14px 16px;font-size:var(--fs-sm);display:flex;flex-direction:column;gap:10px;min-height:96px}
.idea .m{display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-size:var(--fs-cap);margin-top:auto}
.idea .h{color:var(--key);font-weight:700}
.idea.new{border-color:var(--key-300);background:linear-gradient(180deg,var(--key-50),var(--panel))}
.tools{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
.tool{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--panel)}
.tool.on{border:2px solid var(--key);background:var(--key-50)}
.tool .ti{font-size:var(--fs-h2);line-height:1.2}
.tool .tt{font-size:var(--fs-sm);font-weight:700}
.tool .td{font-size:var(--fs-cap);color:var(--muted)}
.propose{border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--panel)}
.propose .head{background:linear-gradient(135deg,var(--key-900),var(--key-950));color:#fff;padding:18px 22px}
.propose .head .ai{font-family:var(--mono);font-size:var(--fs-label);color:var(--key-300)}
.propose .head .big{font-size:var(--fs-h2);font-weight:700;margin-top:4px}
.propose .body{padding:18px 22px}
.reasons{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.rc{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--soft)}
.rc.hl{border-color:var(--key-300);background:var(--key-50)}
.rc .rk{font-family:var(--mono);font-size:var(--fs-label);color:var(--muted)}
.rc .rv{font-size:var(--fs-h1);font-weight:700;line-height:1.3}
.rc.hl .rv{color:var(--key)}
.rc .rd{font-size:var(--fs-cap);color:var(--muted)}
.why{font-size:var(--fs-sm);margin:14px 0 16px;background:var(--key-50);border:1px solid var(--key-200);border-radius:10px;padding:11px 14px}
.toolp{border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;background:var(--panel)}
.toolp.on{border:2px solid var(--key)}
.toolh{padding:12px 14px;font-weight:700;font-size:var(--fs-sm);border-bottom:1px solid var(--line2);background:var(--soft);display:flex;justify-content:space-between;align-items:center}
.toolp.on .toolh{background:var(--key-50)}
.toolb{padding:12px 14px;font-size:var(--fs-sm);display:flex;flex-direction:column;gap:8px}
.qline{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:var(--fs-cap)}
.gategrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.gcard{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.gcard.hold{border-color:var(--warn-line)}
.gtop{display:flex;justify-content:space-between;align-items:center}
.gidx{font-family:var(--mono);font-size:var(--fs-label);color:var(--muted)}
.verd{font-family:var(--mono);font-size:var(--fs-label);font-weight:700;padding:2px 9px;border-radius:999px}
.verd.pass{background:var(--ok-soft);color:var(--ok)}
.verd.hold{background:var(--warn-soft);color:var(--warn)}
.gttl{font-size:var(--fs-h3);font-weight:700}
.mkt{border-radius:10px;padding:8px 10px;display:flex;gap:9px;align-items:center;font-size:var(--fs-cap)}
.mkt.exist{background:var(--bad-soft)}.mkt.sim{background:var(--warn-soft)}.mkt.gap{background:var(--ok-soft)}
.mklbl{font-family:var(--mono);font-size:var(--fs-label);font-weight:700;color:#fff;padding:2px 7px;border-radius:6px}
.mklbl.exist{background:var(--bad)}.mklbl.sim{background:var(--warn)}.mklbl.gap{background:var(--ok)}
.gstat{display:flex;justify-content:space-between;align-items:center;font-size:var(--fs-cap);color:var(--muted)}
.gstat b{font-size:var(--fs-sm)}
.vote{display:flex;gap:6px}
.vote i{width:18px;height:18px;border-radius:50%;background:var(--key)}
.vote i.e{background:transparent;border:2px solid var(--key-200)}
.theme{border:1px solid var(--line);border-radius:16px;background:var(--panel);padding:20px}
.theme.on{border:2px solid var(--key);background:linear-gradient(180deg,var(--key-50),var(--panel))}
.theme .tt{font-size:var(--fs-h2);font-weight:700;margin:8px 0 4px}
.bar2{height:8px;border-radius:99px;background:var(--key-100);margin:14px 0 6px;overflow:hidden}
.bar2 i{display:block;height:100%;background:var(--key);border-radius:99px}
.opts{display:flex;gap:10px;align-items:center;margin-bottom:18px}
.cost{display:grid;grid-template-columns:1.3fr 1fr;gap:14px}
.costmain{background:linear-gradient(135deg,var(--key-700),var(--key-950));color:#fff;border-radius:16px;padding:24px}
.costmain .ck{font-family:var(--mono);font-size:var(--fs-label);color:var(--key-200)}
.costmain .cbig{font-size:48px;font-weight:900;margin:6px 0 2px;line-height:1.15}
.costmain .cbig em{font-style:normal;font-size:var(--fs-h3);opacity:.8}
.costmain .csub{font-size:var(--fs-cap);opacity:.8;margin-top:6px}
.b2{font-family:var(--mono);font-size:var(--fs-label);padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.24)}
.costside{border:1px solid var(--line);border-radius:16px;padding:18px 20px;background:var(--panel)}
.role{display:flex;justify-content:space-between;font-size:var(--fs-sm);padding:9px 0;border-bottom:1px solid var(--line2)}
.role:last-child{border-bottom:none}
.role .rm{font-family:var(--mono);font-size:var(--fs-cap);color:var(--key-700)}
.demoflag{font-family:var(--mono);font-size:var(--fs-label);color:var(--warn);border:1px solid var(--warn-line);background:var(--warn-soft);padding:2px 8px;border-radius:999px}
.rep{border:1px solid var(--line);border-radius:16px;background:var(--panel);padding:18px 20px;margin-top:14px}
.rep h4{margin:0 0 8px;font-size:var(--fs-h3)}
.rep ol{margin:0;padding-left:18px;font-size:var(--fs-sm);line-height:1.8}
.done-hero{text-align:center;padding-top:40px}
.done-hero .em{font-size:56px;line-height:1.2}
.foot2{max-width:1280px;margin:0 auto;padding:24px 16px 64px;font-size:var(--fs-cap);color:var(--muted)}
"""

CSS = BASE_CSS + r"""
/* ───── v4 추가 ───── */
.lk{display:inline-block;vertical-align:-1px}
.chip.lock{display:inline-flex;align-items:center;gap:7px;color:var(--faint);background:var(--soft);padding-right:6px}
.pro{display:inline-flex;align-items:center;gap:3px;font-family:var(--sans);font-size:10px;font-weight:700;letter-spacing:.06em;color:var(--key-700);background:var(--panel);border:1px solid var(--key-200);padding:2px 7px 2px 6px;border-radius:999px;line-height:1.3}
.pro .lk{width:10px;height:10px;vertical-align:0}
.plan-free{font-family:var(--mono);font-size:var(--fs-label);font-weight:700;color:var(--muted);background:var(--soft);border:1px solid var(--line);padding:1px 7px;border-radius:5px}
.upsell{display:flex;align-items:center;gap:10px;margin-top:12px;padding:10px 12px;border-radius:10px;background:var(--key-50);border:1px solid var(--key-200);font-size:var(--fs-cap);color:var(--key-800)}
.upsell a{margin-left:auto;color:var(--key);font-weight:700;text-decoration:none;white-space:nowrap}
.limit{font-size:var(--fs-cap);color:var(--muted);margin-left:auto}
.stepper{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--panel)}
.stepper span{width:34px;height:36px;display:flex;align-items:center;justify-content:center;font-size:var(--fs-h3);color:var(--key);background:var(--soft)}
.stepper span.off{color:var(--line)}
.stepper b{min-width:44px;text-align:center;font-family:var(--mono);font-size:var(--fs-h3);font-weight:700;border-left:1px solid var(--line);border-right:1px solid var(--line);line-height:36px}
.btn.disabled{background:var(--soft);color:var(--faint);border-color:var(--line);cursor:not-allowed}
.applogo{display:inline-flex;align-items:center;gap:8px}
.hero-logo{display:inline-flex;align-items:center;gap:18px}
.appicon{flex:none;display:block}
.brandside .bl{display:flex;align-items:center;gap:10px}
.iconrow{display:flex;align-items:flex-end;gap:24px;flex-wrap:wrap}
.iconrow figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px;font-family:var(--mono);font-size:var(--fs-label);color:var(--muted)}
.iconrow .dark{background:var(--key-900);border-radius:14px;padding:14px}
/* 약관 팝업 — key color 없이 검정/회색만 */
.overlay{position:absolute;inset:0;background:rgba(12,12,16,.5);display:flex;align-items:center;justify-content:center;z-index:5}
.modal{width:580px;height:660px;background:#fff;border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden;color:#111}
.mh{display:flex;justify-content:space-between;align-items:center;padding:20px 24px 16px;border-bottom:1px solid #ececec}
.mh b{font-size:var(--fs-h2);font-weight:700}
.mh small{display:block;font-size:var(--fs-cap);color:#777;font-weight:400;margin-top:2px}
.mx{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#444;font-size:22px;line-height:1}
.mb{flex:1;min-height:0;position:relative;padding:18px 32px 0 24px;overflow:hidden;font-size:var(--fs-sm);line-height:1.75;color:#222}
.mb::after{content:"";position:absolute;left:0;right:0;bottom:0;height:64px;background:linear-gradient(rgba(255,255,255,0),#fff)}
.mb h5{font-size:var(--fs-body);font-weight:700;margin:16px 0 2px;color:#111}
.mb h5:first-child{margin-top:0}
.mb p{margin:0}
.mb ol{margin:0;padding-left:18px}
.sbtrack{position:absolute;right:8px;top:14px;bottom:14px;width:4px;border-radius:4px;background:#f1f1f1;z-index:1}
.sbtrack i{display:block;height:28%;background:#bdbdbd;border-radius:4px}
.ptable{width:100%;border-collapse:collapse;font-size:var(--fs-cap);line-height:1.5;margin-top:10px}
.ptable th,.ptable td{border:1px solid #e3e3e3;padding:8px 10px;text-align:left;vertical-align:top}
.ptable th{background:#f7f7f7;font-weight:700;color:#111}
.mnote{font-size:var(--fs-cap);color:#666;background:#f6f6f6;border-radius:8px;padding:8px 10px;margin-top:12px}
.mf{padding:14px 24px;border-top:1px solid #ececec;display:flex;gap:8px;justify-content:flex-end}
.btn.black{background:#111;color:#fff;border-color:#111}
.btn.gray{background:#fff;color:#333;border-color:#d9d9d9}
.fl{font-size:var(--fs-sm);font-weight:700;margin-bottom:6px;display:flex;justify-content:space-between;align-items:baseline}
.fl a{font-weight:500;font-size:var(--fs-cap);color:var(--key);text-decoration:none}
.fgroup+.fgroup{margin-top:14px}
.inp.focus{border:2px solid var(--key);box-shadow:0 0 0 3px var(--key-100);padding:10px 13px}
.inp.pw{display:flex;justify-content:space-between;letter-spacing:.15em}
.inp.pw span{letter-spacing:0;color:var(--faint)}
.okt{font-size:var(--fs-cap);color:var(--ok);margin-top:4px}
.check{display:flex;gap:8px;align-items:center;font-size:var(--fs-sm)}
.box{width:18px;height:18px;border-radius:5px;border:1.5px solid var(--line);display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:#fff;background:var(--panel);flex:none}
.box.on{background:var(--key);border-color:var(--key)}
.req{font-family:var(--mono);font-size:var(--fs-label);color:var(--key)}
.opt2{font-family:var(--mono);font-size:var(--fs-label);color:var(--faint)}
.social{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.btn.google{background:var(--panel);color:var(--ink);border-color:var(--line)}
.btn.kakao{background:#FEE500;color:#191600;border-color:#FEE500}
.gmark{width:18px;height:18px;border-radius:50%;background:conic-gradient(#EA4335 0 25%,#FBBC05 0 50%,#34A853 0 75%,#4285F4 0);display:inline-block}
.split{display:grid;grid-template-columns:460px 1fr;height:100%}
.brandside{background:radial-gradient(500px 400px at 20% 110%,var(--key-500),transparent 70%),linear-gradient(160deg,var(--key-700),var(--key-950));color:#fff;padding:44px 48px;display:flex;flex-direction:column}
.brandside .bl{font-size:var(--fs-h1);font-weight:900;letter-spacing:-.02em}
.brandside .bh{font-size:30px;font-weight:700;line-height:1.35;margin-top:auto}
.brandside ul{list-style:none;padding:0;margin:24px 0 0;display:flex;flex-direction:column;gap:12px}
.brandside li{display:flex;gap:10px;align-items:center;font-size:var(--fs-body);color:var(--key-100)}
.brandside li i{font-style:normal;width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;flex:none}
.brandside .bf{margin-top:40px;font-size:var(--fs-cap);color:var(--key-300)}
.formside{display:flex;align-items:center;justify-content:center;background:var(--app-bg);position:relative}
.formside .back{position:absolute;top:24px;left:32px;font-size:var(--fs-sm);color:var(--muted)}
.form{width:420px}
.form .alt{margin-top:18px;text-align:center;font-size:var(--fs-sm);color:var(--muted)}
.form .alt a{color:var(--key);font-weight:700;text-decoration:none}
.terms{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:12px 14px;display:flex;flex-direction:column;gap:9px;margin-top:16px}
.terms .all{padding-bottom:9px;border-bottom:1px solid var(--line2);font-weight:700}
.terms .check a{margin-left:auto;font-size:var(--fs-cap);color:var(--faint)}
.mypage{display:grid;grid-template-columns:260px 1fr;height:100%}
.side{border-right:1px solid var(--line);background:var(--panel);padding:24px 16px;display:flex;flex-direction:column}
.side .me{display:flex;gap:12px;align-items:center;padding:4px 8px 20px;border-bottom:1px solid var(--line2);margin-bottom:12px}
.side .me .avatar{width:48px;height:48px;font-size:var(--fs-h3)}
.side .me b{display:block;font-size:var(--fs-h3)}
.side .me span{font-family:var(--mono);font-size:var(--fs-label);color:var(--muted)}
.nav{display:flex;flex-direction:column;gap:2px}
.nav a{display:flex;gap:10px;align-items:center;padding:11px 12px;border-radius:10px;font-size:var(--fs-body);color:var(--muted);text-decoration:none}
.nav a.on{background:var(--key-50);color:var(--key-700);font-weight:700}
.nav a .badge{margin-left:auto}
.side .planmini{margin-top:auto;border:1px solid var(--key-200);background:var(--key-50);border-radius:12px;padding:12px 14px;font-size:var(--fs-cap);color:var(--key-800)}
.side .planmini b{display:flex;justify-content:space-between;align-items:center;font-size:var(--fs-sm);margin-bottom:4px;color:var(--ink)}
.mpmain{padding:32px 40px 0;display:flex;flex-direction:column;min-width:0;min-height:0}
.mphead{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px}
.avrow{display:flex;gap:16px;align-items:center}
.avrow .avatar{width:72px;height:72px;font-size:var(--fs-h1)}
.srch{width:260px;display:flex;gap:8px;align-items:center}
.srow{display:grid;grid-template-columns:110px minmax(0,1fr) 190px 150px 110px;gap:16px;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line2);font-size:var(--fs-sm)}
.srow:last-child{border-bottom:none}
.srow.h{font-family:var(--mono);font-size:var(--fs-label);color:var(--muted);background:var(--soft);padding-top:10px;padding-bottom:10px}
.srow .dt{font-family:var(--mono);font-size:var(--fs-cap);color:var(--muted)}
.srow .tp{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.srow .tp small{display:block;font-weight:400;color:var(--muted);font-size:var(--fs-cap)}
.srow .rs{color:var(--key-700);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.srow .mt{font-size:var(--fs-cap);color:var(--muted)}
.slist{border:1px solid var(--line);border-radius:14px;background:var(--panel);overflow:hidden}
.badge.warn{color:var(--warn);border-color:var(--warn-line);background:var(--warn-soft)}
.setgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.sc{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:6px 18px}
.sc h4{margin:0;padding:12px 0 8px;font-size:var(--fs-h3)}
.sr{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid var(--line2);font-size:var(--fs-sm)}
.sr .sk2{color:var(--muted);font-size:var(--fs-cap)}
.sr .sv{font-weight:500}
.toggle{width:40px;height:22px;border-radius:99px;background:var(--line);position:relative;flex:none}
.toggle::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.toggle.on{background:var(--key)}
.toggle.on::after{left:21px}
.plancard{border-radius:14px;padding:20px;background:linear-gradient(135deg,var(--key-700),var(--key-950));color:#fff}
.plancard .pk{font-family:var(--mono);font-size:var(--fs-label);color:var(--key-200)}
.plancard .pn{font-size:var(--fs-h1);font-weight:900;display:flex;align-items:center;gap:8px}
.plancard ul{list-style:none;padding:0;margin:12px 0 16px;display:flex;flex-direction:column;gap:6px;font-size:var(--fs-sm);color:var(--key-100)}
.plancard .btn{background:#fff;color:var(--key-800);border-color:#fff}
.feat{list-style:none;padding:0;margin:4px 0 12px;display:flex;flex-direction:column;gap:8px;font-size:var(--fs-sm)}
.feat li{display:flex;gap:8px;align-items:center}
.feat li.no{color:var(--faint)}
.btn.danger{background:var(--panel);color:var(--bad);border-color:var(--bad-line)}
"""

LOCK = '<svg class="lk" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="7" width="10" height="7" rx="1.6"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>'
LOCK_S = LOCK.replace('width="12" height="12"', 'width="10" height="10"')
PRO = f'<span class="pro">{LOCK_S}PRO</span>'

def icon(px, inv=False):
    # IE 모노그램: I 기둥 + E (위·아래 팔 같은 길이, 가운데 팔은 짧게)
    bg = '#FFFFFF' if inv else '#4F46E5'
    fg = '#4F46E5' if inv else '#FFFFFF'
    bars = [(8.1, 9, 3.4, 14), (14.1, 9, 3.4, 14), (14.1, 9, 9.8, 3.4), (14.1, 14.3, 8.0, 3.4), (14.1, 19.6, 9.8, 3.4)]
    r = ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="0.7" fill="{fg}"/>' for x, y, w, h in bars)
    return (f'<svg class="appicon" width="{px}" height="{px}" viewBox="0 0 32 32" aria-hidden="true">'
            f'<rect width="32" height="32" rx="8" fill="{bg}"/>{r}</svg>')
ICON_DEFS = ""

def screen(num, title, desc, body, tags=""):
    return f'''
<section class="screen" id="s{num}"><div class="shot">
  <div class="cap"><span class="num">{num}</span><h2>{title}</h2>{tags}<span class="d">{desc}</span></div>
  <div class="board">{body}</div>
</div></section>'''

def new(t): return f'<span class="tag new">{t}</span>'
def ref(t): return f'<span class="tag ref">{t}</span>'

def pbtn(who=None, open_=False):
    if who is None:
        return '<span class="pbtn"><span class="avatar guest">👤</span>로그인 전 ▾</span>'
    return f'<span class="pbtn{" open" if open_ else ""}"><span class="avatar">{who[0]}</span><span class="nm">{who}</span>{"▴" if open_ else "▾"}</span>'

def appbar(who=None, clear=False, open_=False):
    return f'<div class="appbar{" clear" if clear else ""}"><span class="applogo">{icon(28)}IdeationEngine</span>{pbtn(who, open_)}</div>'

S = []

# ───────── 1 랜딩 ─────────
S.append(screen(1, '랜딩', '로그인 → A1 · 회원가입 → A2 · 프로필 버튼 → 1-1', f'''
<div class="landing" style="height:100%;display:flex;flex-direction:column">
  <div class="appbar clear"><span></span>{pbtn()}</div>
  <div class="abody"><div class="center">
    <div class="hero-logo">{icon(64)}IdeationEngine</div>
    <p class="slogan">회의 진행자가 없어도, <b>첫 회의에서 주제를 정한다</b></p>
    <p class="muted t-sm" style="margin-top:6px">대학생 해커톤·공모전 팀을 위한 오프라인 아이디어 세션</p>
    <div class="cta"><button class="btn lg">＋ 세션 만들기 <span class="r">진행자</span></button><button class="btn ghost lg">→ 코드로 입장 <span class="r">팀원</span></button></div>
    <div class="acct"><span class="note">로그인하면 프로필·지난 세션 기록이 저장돼요</span>
      <div style="display:flex;gap:8px"><button class="btn soft">로그인</button><button class="btn text">회원가입</button></div></div>
  </div></div>
</div>'''))

# ───────── 1-1 프로필 팝오버 ─────────
S.append(screen('1-1', '프로필 버튼 → 로그인 정보 확인', '메뉴 → A3 프로필 수정 · A4 지난 세션 · A5 계정 설정', f'''
<div class="landing" style="height:100%;display:flex;flex-direction:column">
  <div class="appbar clear"><span></span>{pbtn("노형원", True)}</div>
  <div class="abody">
    <div class="center dim">
      <div class="hero-logo">{icon(64)}IdeationEngine</div>
      <p class="slogan">노형원님, 오늘 회의를 시작해볼까요?</p>
      <div class="cta"><button class="btn lg">＋ 세션 만들기</button><button class="btn ghost lg">→ 코드로 입장</button></div>
    </div>
    <div class="pop">
      <div class="ph"><span class="avatar">노</span><div><div class="nm">노형원</div><div class="em">hyeongwon@example.com</div></div><span class="plan-free" style="margin-left:auto">FREE</span></div>
      <div class="pb"><div class="pk">내 프로필</div>
        <div class="t-sm" style="margin-bottom:8px">맡고 싶은 역할 · <b>개발·구현</b></div>
        <div class="chips" style="gap:6px"><span class="sk on">✓ 프론트엔드</span><span class="sk on">✓ 백엔드</span><span class="sk on">✓ 발표·피칭</span></div></div>
      <div class="menu">
        <div class="mi hover">프로필 수정 <span class="muted">›</span></div>
        <div class="mi">지난 세션 기록 <span class="badge key">6</span></div>
        <div class="mi">계정 설정 <span class="muted">›</span></div>
        <div class="mi" style="color:var(--key-700);font-weight:500">{LOCK} Pro로 업그레이드 <span class="muted">›</span></div>
        <div class="mi out">로그아웃</div>
      </div>
    </div>
  </div>
</div>'''))

# ───────── 2 코드 입장 ─────────
S.append(screen(2, '방 코드 입장 (참가자)', '방 코드 입력 + 초대 링크만', f'''
{appbar()}
<div class="abody"><div class="center" style="padding-bottom:40px"><div class="panel">
  <p class="lead">방 코드를 입력하세요</p>
  <p class="hint" style="margin-bottom:24px">진행자 화면에 보이는 6자리 코드</p>
  <div class="codebox"><b class="f">7</b><b class="f">K</b><b class="f">2</b><b class="c">|</b><b></b><b></b></div>
  <div class="divider" style="margin:28px 0 16px">또는 초대 링크로</div>
  <div style="display:flex;gap:8px"><div class="inp ph" style="text-align:left;font-family:var(--mono);font-size:var(--fs-sm)">https://ideationengine.app/s/…</div><button class="btn ghost">붙여넣기</button></div>
  <button class="btn block" style="margin-top:28px">입장하기 →</button>
</div></div></div>''', ref('참고: Kahoot PIN')))

# ───────── 3 프로필 만들기 ─────────
def grp(title, sub, items, on):
    subh = f' <span style="font-weight:400;color:var(--faint)">· {sub}</span>' if sub else ''
    body = ''.join(f'<span class="sk on">✓ {t}</span>' if t in on else f'<span class="sk">{t}</span>' for t in items)
    return f'<div class="grp"><div class="gl">{title}{subh}</div><div class="chips">{body}</div></div>'
MY_ON = {'프론트엔드', '백엔드', 'PPT 디자인', '기술 설계 기획', '발표·피칭'}
SKILLS = (grp('개발', '', ['프론트엔드', '백엔드', '데이터', '인프라', 'AI/ML'], MY_ON)
          + grp('디자인', '만드는 결과물 기준', ['PPT 디자인', '웹 디자인', '앱 디자인', '영상·모션', '브랜딩·그래픽'], MY_ON)
          + grp('기획', '무엇을 설계하는 기획인지 기준', ['비즈니스 모델 기획', '기술 설계 기획', '서비스 기획', '프로젝트 관리', '사업계획서·제안서'], MY_ON)
          + grp('발표·기타', '', ['발표·피칭', '마케팅·홍보', '리서치·사용자 조사', '문서 정리', '논문'], MY_ON))
SKILL_WHY = '🔎 디자인은 <b>결과물 형태</b>(PPT·웹·앱·영상·브랜딩)로, 기획은 <b>설계 대상</b>(비즈니스 모델=수익·타깃·시장성 / 기술 설계=시스템 구조·기술 스택 / 서비스=기능 명세·화면 흐름)으로 나눴어요. 해커톤 팀에서 자주 나오는 <b>프로젝트 관리·사업계획서·발표 영상</b>도 넣었어요.'
ROLES = '<div class="chips"><span class="chip">자료조사</span><span class="chip">발표·기획</span><span class="chip">문서정리</span><span class="chip on">개발·구현</span><span class="chip">디자인</span></div>'

S.append(screen(3, '프로필 만들기', '할 수 있는 것 4그룹 20개 + 한 줄 강점(선택)', f'''
{appbar("노형원")}
<div class="abody"><div class="page" style="padding-top:28px">
  <div><p class="lead">먼저 프로필을 만들어 주세요</p><p class="hint">처음 한 번만 작성하면, 다음 세션부터는 바로 시작할 수 있어요.</p></div>
  <div class="cols" style="grid-template-columns:1fr 1.75fr;gap:16px;margin-top:18px">
    <div class="stack" style="gap:12px">
      <div class="card"><div class="lbl">닉네임</div><div class="inp">노형원</div></div>
      <div class="card"><div class="lbl">한 줄 강점 <span class="opt">— 선택</span></div><div class="inp ph">예: 발표 자료를 빠르게 잘 만들어요</div></div>
      <div class="card"><div class="lbl">이번에 맡고 싶은 역할</div>{ROLES}</div>
    </div>
    <div class="card">
      <div class="lbl">할 수 있는 것 <span class="opt">— 여러 개 선택</span></div>{SKILLS}
      <div class="whybox" style="margin-top:14px">{SKILL_WHY}</div>
    </div>
  </div>
  <div class="pagefoot" style="height:72px"><span class="note">※ AI가 프로필을 학습하는 게 아니라, 각도 배분의 참고 맥락으로만 씁니다.</span><button class="btn lg">프로필 저장 →</button></div>
</div></div>''', new('스킬 세분화')))

# ───────── 4 세션 만들기 ─────────
def lockchip(t): return f'<span class="chip lock">{t}{PRO}</span>'
S.append(screen(4, '세션 만들기', '무료 = 최대 30분 · 30분 초과는 🔒PRO 태그 · 인원 수 설정', f'''
{appbar("노형원")}
<div class="abody"><div class="page" style="padding-left:120px;padding-right:120px">
  <div style="display:flex;justify-content:space-between;align-items:flex-end">
    <div><p class="lead">세션 만들기</p><p class="hint">주제만 쓰면 바로 시작할 수 있어요. 방법론은 AI가 상황 보고 제안해요.</p></div>
    <span style="display:flex;align-items:center;gap:8px"><span class="plan-free">FREE</span><span class="t-sm muted">무료 플랜 사용 중</span><a class="t-sm" style="color:var(--key);font-weight:700;text-decoration:none">업그레이드 →</a></span>
  </div>
  <div class="card" style="margin-top:22px"><div class="lbl">이번 회의에서 정할 것 (주제)</div><div class="inp">교내 해커톤에서 만들 서비스 아이디어 정하기</div></div>
  <div class="grid2" style="margin-top:14px;align-items:stretch">
    <div class="card">
      <div class="cardt">세션 시간 <span class="limit">무료 최대 30분</span></div>
      <div class="chips"><span class="chip">10분</span><span class="chip">20분</span><span class="chip on">30분</span>{lockchip("60분")}{lockchip("90분")}{lockchip("제한 없음")}</div>
      <div class="custom"><span class="t-sm muted">직접 입력</span><span class="mini">30</span><span class="t-sm">분</span><span class="t-cap muted" style="margin-left:auto">1 ~ 30분까지</span></div>
      <div class="upsell">{LOCK}<span>30분 넘는 세션(60분·90분·제한 없음)은 <b>Pro</b> 전용이에요</span><a>Pro 알아보기 →</a></div>
    </div>
    <div class="stack" style="gap:14px">
      <div class="card">
        <div class="cardt">참여 인원 <span class="limit">나 포함</span></div>
        <div style="display:flex;align-items:center;gap:14px">
          <span class="stepper"><span>−</span><b>4</b><span>＋</span></span><span class="t-body">명</span>
          <span class="chips" style="margin-left:auto;gap:6px"><span class="chip">2</span><span class="chip">3</span><span class="chip on">4</span><span class="chip">5</span><span class="chip">6</span></span>
        </div>
        <p class="t-cap muted" style="margin-top:10px">대기실에 "3 / 4명 입장"처럼 표시돼요</p>
      </div>
      <div class="card" style="flex:1"><div class="cardt">공모전 주제·심사기준 <span class="badge">선택</span></div><div class="inp ph t-sm">예: 지역문제 · 심사=창의성/실현성</div></div>
    </div>
  </div>
  <div class="pagefoot" style="border-top:none;height:auto;margin-top:24px"><button class="btn lg" style="width:100%">세션 만들고 방 코드 받기 →</button></div>
</div></div>''', new('시간 잠금·인원 수')))

# ───────── 5 대기실 진행자 ─────────
S.append(screen(5, '대기실 (진행자)', '왼쪽 = 방 코드 + 링크만 (QR·입장 잠그기 삭제)', f'''
{appbar("노형원")}
<div class="abody"><div class="page" style="padding-bottom:36px">
  <div class="grid2" style="gap:20px;height:100%">
    <div class="card" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:linear-gradient(180deg,var(--key-50),var(--panel));padding:40px">
      <span class="muted t-sm">방 코드</span>
      <div class="roomcode" style="font-size:72px;margin:4px 0 12px">7K2X9</div>
      <button class="btn soft sm">📋 코드 복사</button>
      <div class="divider" style="width:100%;margin:36px 0 16px">또는 초대 링크 보내기</div>
      <div style="display:flex;gap:8px;width:100%"><div class="inp" style="text-align:left;font-family:var(--mono);font-size:var(--fs-sm)">ideationengine.app/s/7K2X9</div><button class="btn">🔗 링크 복사</button></div>
    </div>
    <div class="card" style="display:flex;flex-direction:column">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span style="font-size:var(--fs-h3);font-weight:700">참여자</span><span class="badge ok">3 / 4</span></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="prow"><span class="avatar">노</span><span style="flex:1;font-weight:500">노형원 <span class="badge key">진행자(나)</span></span><span class="dot"></span></div>
        <div class="prow"><span class="avatar">이</span><span style="flex:1">이세민 <span class="muted t-cap">· 클릭해 내보내기</span></span><span class="dot"></span></div>
        <div class="prow"><span class="avatar">김</span><span style="flex:1">김승희</span><span class="dot"></span></div>
        <div class="prow empty"><span class="avatar guest">?</span><span style="flex:1">기다리는 중…</span></div>
      </div>
      <div class="t-cap muted" style="margin-top:14px">⏱ 30분 세션 · 4명 (세션 만들기에서 설정)</div>
      <button class="btn block lg" style="margin-top:auto">▶ 세션 시작하기</button>
    </div>
  </div>
</div></div>''', new('QR·잠금 삭제')))

# ───────── 6 대기실 참가자 ─────────
S.append(screen(6, '대기실 (참가자)', '', f'''
{appbar("이세민")}
<div class="abody"><div class="center"><div class="panel">
  <div class="avatar" style="width:72px;height:72px;font-size:var(--fs-h1);margin:0 auto 14px">이</div>
  <p class="lead">입장 완료!</p><p class="hint">진행자가 시작하길 기다리는 중</p>
  <div class="card" style="margin-top:22px;text-align:left;background:var(--soft)"><div class="muted t-cap">내 프로필</div><div class="t-sm" style="font-weight:700;margin-top:2px">이세민 · 맡고 싶은 역할: 개발</div>
    <div class="chips" style="gap:6px;margin-top:10px"><span class="sk on">✓ 프론트엔드</span><span class="sk on">✓ 리서치·사용자 조사</span></div></div>
  <div class="muted t-sm" style="margin-top:18px">현재 <b style="color:var(--key)">3 / 4</b>명 입장</div>
</div></div></div>'''))

# ───────── A 계정 화면 ─────────
def brandside(head, items):
    lis = ''.join(f'<li><i>{ic}</i>{t}</li>' for ic, t in items)
    return f'''<div class="brandside"><div class="bl">{icon(32, True)}IdeationEngine</div>
  <div class="bh">{head}</div><ul>{lis}</ul>
  <div class="bf">대학생 해커톤·공모전 팀을 위한 오프라인 아이디어 세션</div></div>'''

SOCIAL = '<div class="social"><button class="btn google"><span class="gmark"></span>Google로 계속</button><button class="btn kakao">💬 카카오로 계속</button></div>'

S.append(screen('A1', '로그인', '로그인 없이도 코드 입장은 가능 (하단 링크)', f'''
<div class="split">
  {brandside("다시 오신 걸<br>환영해요", [("👤", "내 프로필이 세션마다 자동 적용"), ("🗂️", "지난 세션 보고서 다시 보기"), ("⚡", "세션 만들기까지 10초")])}
  <div class="formside"><span class="back">← 처음으로</span>
    <div class="form">
      <p class="lead">로그인</p><p class="hint" style="margin-bottom:24px">이메일 또는 소셜 계정으로 로그인하세요</p>
      {SOCIAL}
      <div class="divider" style="margin:20px 0">또는 이메일로</div>
      <div class="fgroup"><div class="fl">이메일</div><div class="inp focus">hyeongwon@example.com</div></div>
      <div class="fgroup"><div class="fl">비밀번호 <a>비밀번호 찾기</a></div><div class="inp pw">••••••••••<span>👁</span></div></div>
      <div class="check" style="margin-top:14px"><span class="box on">✓</span>로그인 상태 유지</div>
      <button class="btn block lg" style="margin-top:20px">로그인</button>
      <p class="alt">계정이 없나요? <a>회원가입</a></p>
      <p class="alt" style="margin-top:8px"><a style="font-weight:500;color:var(--muted)">로그인 없이 코드로 입장 →</a></p>
    </div>
  </div>
</div>''', new('신규')))

A2_BODY = f'''
<div class="split">
  {brandside("첫 회의에서<br>주제를 정하는 팀", [("🆓", "무료로 시작 · 세션 최대 30분"), ("🧭", "팀 스킬맵으로 역할 배분"), ("📝", "회의가 끝나면 보고서 자동 정리")])}
  <div class="formside"><span class="back">← 처음으로</span>
    <div class="form">
      <p class="lead">회원가입</p><p class="hint" style="margin-bottom:20px">1분이면 끝나요</p>
      {SOCIAL}
      <div class="divider" style="margin:18px 0">또는 이메일로 가입</div>
      <div class="fgroup"><div class="fl">이메일</div><div class="inp">hyeongwon@example.com</div></div>
      <div class="grid2 fgroup" style="gap:10px">
        <div><div class="fl">비밀번호</div><div class="inp pw">••••••••••<span>👁</span></div></div>
        <div><div class="fl">비밀번호 확인</div><div class="inp pw">••••••••••<span>👁</span></div><div class="okt">✓ 일치해요</div></div>
      </div>
      <div class="fgroup" style="margin-top:8px"><div class="fl">닉네임 <span class="t-cap muted" style="font-weight:400">팀원에게 보이는 이름</span></div><div class="inp focus">노형원</div></div>
      <div class="terms">
        <div class="check all"><span class="box on">✓</span>전체 동의</div>
        <div class="check"><span class="box on">✓</span><span class="req">필수</span>이용약관 동의<a>보기</a></div>
        <div class="check"><span class="box on">✓</span><span class="req">필수</span>개인정보 수집·이용 동의<a>보기</a></div>
        <div class="check"><span class="box on">✓</span><span class="opt2">선택</span>새 기능·이벤트 소식 받기</div>
      </div>
      <button class="btn block lg" style="margin-top:16px">가입하고 프로필 만들기 →</button>
      <p class="alt" style="margin-top:12px">이미 계정이 있나요? <a>로그인</a></p>
    </div>
  </div>
</div>'''
S.append(screen('A2', '회원가입', '필수 = 이메일·비밀번호·닉네임·약관 2개 / "보기" → A2-1 · A2-2 팝업', A2_BODY, new('신규')))

def modal(title, sub, content, pos):
    return f'''{A2_BODY}
<div class="overlay"><div class="modal">
  <div class="mh"><div><b>{title}</b><small>{sub}</small></div><span class="mx">×</span></div>
  <div class="mb"><div class="sbtrack"><i style="margin-top:{pos}%"></i></div>{content}</div>
  <div class="mf"><button class="btn gray">닫기</button><button class="btn black">동의하고 닫기</button></div>
</div></div>'''

TERMS = '''
<h5>제1조 (목적)</h5>
<p>이 약관은 IdeationEngine(이하 "서비스")을 이용할 때 회사와 회원 사이의 권리·의무와 이용 조건을 정합니다.</p>
<h5>제2조 (용어의 뜻)</h5>
<ol><li>"회원"은 이 약관에 동의하고 가입한 사람을 말합니다.</li><li>"세션"은 방 코드로 여러 사람이 함께 참여하는 아이디어 회의를 말합니다.</li><li>"보고서"는 세션이 끝난 뒤 정리되는 결과물을 말합니다.</li></ol>
<h5>제3조 (약관의 변경)</h5>
<p>약관을 바꿀 때는 시행 7일 전부터 서비스 안에 공지합니다. 회원에게 불리한 변경은 30일 전에 공지합니다.</p>
<h5>제4조 (서비스 이용)</h5>
<ol><li>무료 회원은 한 세션을 최대 30분까지 이용할 수 있습니다.</li><li>30분을 넘는 세션은 유료(Pro) 회원만 이용할 수 있습니다.</li></ol>
<h5>제5조 (회원의 의무)</h5>
<p>회원은 다른 사람의 정보를 도용하거나, 세션 참여자의 동의 없이 세션 내용을 외부에 공개해서는 안 됩니다.</p>
<h5>제6조 (아이디어와 AI 결과)</h5>
<p>세션에서 입력한 아이디어의 권리는 작성한 회원과 그 팀에 있습니다. AI가 정리한 내용은 참고용이며 정확성을 보장하지 않습니다.</p>
<h5>제7조 (탈퇴)</h5>
<p>회원은 계정 설정에서 언제든 탈퇴할 수 있습니다.</p>
'''
PRIVACY = '''
<p>IdeationEngine은 회원가입과 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다.</p>
<table class="ptable">
  <tr><th style="width:36%">수집 항목</th><th>이용 목적</th><th style="width:22%">보유 기간</th></tr>
  <tr><td>이메일, 비밀번호(암호화), 닉네임</td><td>회원 식별, 로그인</td><td>탈퇴 시까지</td></tr>
  <tr><td>세션 입력 내용<br>(아이디어·답변·투표)</td><td>세션 진행, 보고서 생성</td><td>탈퇴 시까지</td></tr>
  <tr><td>소셜 로그인 시 제공 정보<br>(이메일·이름)</td><td>간편 로그인</td><td>탈퇴 시까지</td></tr>
  <tr><td>접속 기록, 기기 정보</td><td>오류 확인, 부정 이용 방지</td><td>3개월</td></tr>
</table>
<h5>동의를 거부할 권리</h5>
<p>동의를 거부할 수 있습니다. 다만 거부하면 회원가입을 할 수 없습니다. (로그인 없이 방 코드로 입장하는 것은 가능)</p>
<h5>AI 처리 안내</h5>
<p>보고서 생성을 위해 세션 내용이 외부 AI 모델로 전달될 수 있으며, 모델 학습에는 사용하지 않습니다.</p>
'''
S.append(screen('A2-1', '이용약관 보기 (팝업)', 'A2에서 "보기" 클릭 · key color 없이 검정/회색 · 내용은 창 안에서 스크롤', modal('이용약관', '시행일 2026.09.01 · 예시 문구 (법률 검토 필요)', TERMS, 0), new('신규')))
S.append(screen('A2-2', '개인정보 수집·이용 동의 (팝업)', '같은 팝업 틀 · 표로 항목/목적/보유 기간', modal('개인정보 수집·이용 동의', '필수 · 예시 문구 (법률 검토 필요)', PRIVACY, 0), new('신규')))

def mypage(active, main):
    items = [('A3', '👤', '프로필 수정', ''), ('A4', '🗂️', '지난 세션 기록', '<span class="badge key">6</span>'), ('A5', '⚙️', '계정 설정', '')]
    nav = ''.join(f'<a class="{"on" if k == active else ""}">{ic} {t}{b}</a>' for k, ic, t, b in items)
    return f'''{appbar("노형원")}
<div class="abody"><div class="mypage">
  <div class="side">
    <div class="me"><span class="avatar">노</span><div><b>노형원</b><span>hyeongwon@example.com</span></div></div>
    <div class="nav">{nav}</div>
    <div class="planmini"><b>현재 플랜 <span class="plan-free">FREE</span></b>세션 최대 30분<br><a style="color:var(--key);font-weight:700">{LOCK} Pro로 업그레이드 →</a></div>
  </div>
  <div class="mpmain">{main}</div>
</div></div>'''

S.append(screen('A3', '프로필 수정', '3번(프로필 만들기)과 같은 항목 · 다음 세션부터 반영', mypage('A3', f'''
<div class="mphead" style="margin-bottom:16px"><div><p class="lead">프로필 수정</p><p class="hint">세션에 들어갈 때 이 프로필이 자동으로 쓰여요 · 다음 세션부터 반영</p></div><span class="badge ok">✓ 저장됨 · 9/12</span></div>
<div class="cols" style="display:grid;grid-template-columns:1fr 1.75fr;gap:14px">
  <div class="stack" style="gap:12px">
    <div class="card"><div class="avrow"><span class="avatar" style="width:56px;height:56px">노</span><div><div class="t-sm" style="font-weight:700">프로필 사진</div><div style="display:flex;gap:6px;margin-top:6px"><button class="btn ghost sm">변경</button><button class="btn text sm">삭제</button></div></div></div></div>
    <div class="card"><div class="lbl">닉네임</div><div class="inp focus">노형원</div></div>
    <div class="card"><div class="lbl">한 줄 강점 <span class="opt">— 선택</span></div><div class="inp">발표 자료를 빠르게 잘 만들어요</div></div>
    <div class="card"><div class="lbl">맡고 싶은 역할</div>{ROLES}</div>
  </div>
  <div class="card">
    <div class="lbl">할 수 있는 것 <span class="opt">— 여러 개 선택</span></div>{SKILLS}
  </div>
</div>
<div class="pagefoot" style="gap:8px;justify-content:flex-end;height:72px"><button class="btn ghost">취소</button><button class="btn">변경 사항 저장</button></div>
''')))

SESS = [('2026.09.15', '교내 해커톤에서 만들 서비스 아이디어', '진행자 · 4명 · 30분', '첫 회의 돕기', 'ok'),
        ('2026.09.08', '공모전 — 지역문제 해결 앱', '참가자 · 5명 · 28분', '전통시장 길찾기', 'ok'),
        ('2026.09.02', '캡스톤 디자인 주제 정하기', '진행자 · 3명 · 30분', '실험실 예약 통합', 'ok'),
        ('2026.08.27', '동아리 홍보 영상 기획', '참가자 · 6명 · 17분', '— (중간 종료)', 'warn'),
        ('2026.08.20', '창업 동아리 첫 아이템', '참가자 · 4명 · 30분', '자취생 식재료 나눔', 'ok'),
        ('2026.08.11', '해커톤 리허설', '진행자 · 2명 · 12분', '연습용 세션', 'ok')]
rows = ''.join(
    f'<div class="srow"><span class="dt">{d}</span><span class="tp">{t}</span><span class="mt">{m}</span>'
    f'<span class="rs"{" style=color:var(--faint)" if st == "warn" else ""}>{r}</span>'
    f'<span>{"<button class=\"btn ghost sm\">보고서 보기</button>" if st == "ok" else "<button class=\"btn ghost sm disabled\" disabled>보고서 없음</button>"}</span></div>'
    for d, t, m, r, st in SESS)
S.append(screen('A4', '지난 세션 기록', '행 클릭 = 보고서 다시 보기', mypage('A4', f'''
<div class="mphead"><div><p class="lead">지난 세션 기록</p><p class="hint">참여한 세션의 결정과 보고서를 다시 볼 수 있어요</p></div>
  <div class="srch"><div class="inp ph t-sm">🔍 주제로 검색</div></div></div>
<div class="chips" style="margin-bottom:14px"><span class="chip on">전체 6</span><span class="chip">진행자 3</span><span class="chip">참가자 3</span></div>
<div class="slist">
  <div class="srow h"><span>날짜</span><span>주제</span><span>역할 · 인원 · 시간</span><span>정해진 방향</span><span></span></div>
  {rows}
</div>
''')))

S.append(screen('A5', '계정 설정', '로그인 정보 · 알림 · 요금제 · 계정 관리', mypage('A5', f'''
<div class="mphead"><div><p class="lead">계정 설정</p><p class="hint">로그인 정보와 요금제를 관리해요</p></div></div>
<div class="setgrid">
  <div class="stack" style="gap:16px">
    <div class="sc"><h4>로그인 정보</h4>
      <div class="sr"><div><div class="sk2">이메일</div><div class="sv">hyeongwon@example.com</div></div><button class="btn ghost sm">변경</button></div>
      <div class="sr"><div><div class="sk2">비밀번호</div><div class="sv">마지막 변경 3개월 전</div></div><button class="btn ghost sm">변경</button></div>
      <div class="sr"><div style="display:flex;gap:8px;align-items:center"><span class="gmark"></span>Google</div><span class="badge ok">연결됨</span></div>
      <div class="sr"><div>💬 카카오</div><button class="btn ghost sm">연결하기</button></div>
    </div>
    <div class="sc"><h4>알림</h4>
      <div class="sr"><span>세션 초대 알림</span><span class="toggle on"></span></div>
      <div class="sr"><span>보고서 완성 알림</span><span class="toggle on"></span></div>
      <div class="sr"><span>새 기능·이벤트 소식</span><span class="toggle"></span></div>
    </div>
  </div>
  <div class="stack" style="gap:16px">
    <div class="sc" style="padding-bottom:18px"><h4 style="display:flex;justify-content:space-between;align-items:center">요금제 <span class="plan-free">FREE 사용 중</span></h4>
      <ul class="feat"><li>✓ 세션 최대 30분</li><li>✓ 프로필·지난 세션 기록</li><li class="no">{LOCK} 60분 · 90분 · 제한 없음 세션</li></ul>
      <div class="plancard"><div class="pk">UPGRADE</div><div class="pn">Pro</div>
        <ul><li>✓ 30분 넘는 세션 (60분 · 90분 · 제한 없음)</li><li>✓ 그 외 혜택 — 미정</li></ul>
        <div style="display:flex;align-items:center;justify-content:space-between"><span class="t-sm" style="color:var(--key-200)">가격 미정</span><button class="btn">Pro로 업그레이드 →</button></div>
      </div>
    </div>
    <div class="sc" style="padding-bottom:6px"><h4>계정 관리</h4>
      <div class="sr"><span>로그아웃</span><button class="btn ghost sm">로그아웃</button></div>
      <div class="sr"><div><div class="sv" style="color:var(--bad)">회원 탈퇴</div><div class="sk2">세션 기록이 모두 삭제되고 복구할 수 없어요</div></div><button class="btn danger sm">탈퇴</button></div>
    </div>
  </div>
</div>
''')))

S.append(screen('A6', '소셜 로그인 처리 중 (콜백)', '/oauth/callback?code=…&state=… 로 돌아온 직후 · 확인되면 원래 가려던 화면으로 · 처음 가입이면 약관 동의(A2)', f'''
{appbar()}
<div class="abody"><div class="center"><div class="panel" style="text-align:center;max-width:520px">
  <div class="avatar" style="width:72px;height:72px;font-size:var(--fs-h1);margin:0 auto 14px">G</div>
  <p class="lead">로그인 처리 중이에요</p><p class="hint">Google 계정을 확인하고 있어요. 잠시만요.</p>
  <div class="muted t-sm" style="margin-top:18px">처음 가입이면 약관 동의(A2)로, 아니면 원래 가려던 화면으로 가요</div>
  <div class="quiet" style="margin-top:8px">5초가 지나도 안 넘어가면 <u>다시 시도</u>를 눌러주세요</div>
</div></div></div>'''))

# ───────── 7 아이스브레이킹 (AI와 1:1 인터뷰) — v8 정리판 ─────────
# 추가 색은 1개만: Sky 600(최근 소식). 나머지는 기존 key 인디고 / 뉴트럴 / 완료 초록(안내 말풍선).
ICE_CSS = r"""
:root{--news:#0284C7;--news-soft:#E8F4FB;--news-line:#B5DCF1;--news-ink:#075985}
.ibar{height:64px;flex:none;display:grid;grid-template-columns:1fr 400px 1fr;align-items:center;gap:20px;padding:0 28px;background:var(--panel);border-bottom:1px solid var(--line)}
.ib-l,.ib-r{display:flex;align-items:center;gap:10px;min-width:0}
.ib-r{justify-content:flex-end}
.ib-topic{font-size:var(--fs-cap);color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-left:1px solid var(--line);padding-left:10px}
.ib-c{display:flex;flex-direction:column;gap:6px}
.ib-stage{font-size:var(--fs-sm);font-weight:500;text-align:center;color:var(--ink);line-height:1.2}
.ib-row{display:flex;align-items:center;gap:8px}
.ib-lbl{width:30px;flex:none;font-size:var(--fs-label);color:var(--faint)}
.ib-track{flex:1;height:4px;border-radius:99px;background:var(--key-100);overflow:hidden}
.ib-track i{display:block;height:100%;background:var(--key);border-radius:99px}
.ib-pct{width:30px;flex:none;font-family:var(--mono);font-size:var(--fs-label);color:var(--key);text-align:right}
.rolebadge{font-size:var(--fs-cap);color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:3px 10px;white-space:nowrap}
.ico{display:inline-block;vertical-align:-2px;color:var(--faint);flex:none}
.ibody{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px;padding:18px 24px}
.chat{background:var(--panel);border:1px solid var(--line);border-radius:16px;display:flex;flex-direction:column;min-height:0;overflow:hidden}
.ch-h{height:52px;flex:none;display:flex;align-items:center;gap:14px;padding:0 20px;border-bottom:1px solid var(--line2)}
.ch-h b{font-size:var(--fs-body);font-weight:700;white-space:nowrap}
.ch-prog{flex:1;height:4px;border-radius:99px;background:var(--line2);overflow:hidden}
.ch-prog i{display:block;height:100%;background:var(--key);border-radius:99px}
.ch-n{font-family:var(--mono);font-size:var(--fs-cap);color:var(--muted)}
.lockchip{display:inline-flex;align-items:center;gap:5px;font-size:var(--fs-cap);color:var(--muted);white-space:nowrap}
.msgs{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;padding:0 20px 16px;background:var(--app-bg);overflow:hidden;
  -webkit-mask-image:linear-gradient(transparent 0,#000 48px);mask-image:linear-gradient(transparent 0,#000 48px)}
.b{max-width:78%;border-radius:16px;padding:10px 14px;font-size:var(--fs-body);line-height:1.55;flex:none}
.b.ai{align-self:flex-start;background:var(--panel);border:1px solid var(--line);border-top-left-radius:4px}
.b.me{align-self:flex-end;background:var(--key);color:#fff;border-top-right-radius:4px}
.b.fq{background:var(--key-50);border-color:var(--key-200)}
.b.explain{background:var(--news-soft);border-color:var(--news-line)}
.b.good{background:var(--ok-soft);border-color:var(--ok-line)}
.b.wide{max-width:100%;align-self:stretch}
.b.wait{color:var(--muted);display:flex;align-items:center;gap:8px}
.blab{font-family:var(--mono);font-size:var(--fs-label);color:var(--faint);flex:none;margin-top:4px}
.comp{flex:none;border-top:1px solid var(--line2);padding:12px 20px 16px;background:var(--panel)}
.comp-row{display:flex;gap:8px;align-items:center}
.skip{font-size:var(--fs-cap);color:var(--muted);white-space:nowrap;padding:0 6px}
.btn.off{background:var(--line);border-color:var(--line);color:#fff}
.side2{display:flex;flex-direction:column;gap:12px;min-height:0}
.sc2{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px 18px}
.sc2 h4{margin:0 0 8px;font-size:var(--fs-sm);font-weight:700;display:flex;align-items:baseline;gap:6px}
.sc2 h4 small{font-size:var(--fs-cap);color:var(--faint);font-weight:400}
.sc2 p{font-size:var(--fs-cap);color:var(--muted);line-height:1.6}
.sc2 hr{border:none;border-top:1px solid var(--line2);margin:12px 0}
.tp{display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:10px;font-size:var(--fs-sm)}
.tp i{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;font-family:var(--mono);font-size:var(--fs-label);background:var(--soft);color:var(--muted);flex:none;border:1px solid var(--line)}
.tp.done{color:var(--faint)}
.tp.done i{color:var(--faint);background:var(--soft);border-color:var(--line2)}
.tp.cur{background:var(--key-50);font-weight:700}
.tp.cur i{background:var(--key);border-color:var(--key);color:#fff}
.tr{display:flex;justify-content:space-between;align-items:center;font-size:var(--fs-sm);padding:4px 0}
.tr span:last-child{font-family:var(--mono);font-size:var(--fs-cap);color:var(--muted)}
.asked{display:inline-block;font-size:var(--fs-cap);color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:2px 9px;margin-top:6px}
/* 최근 소식 카드 */
.news{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;flex:none}
.nc{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 16px 14px;display:flex;flex-direction:column;gap:10px;min-height:330px}
.nc.on{border-color:var(--news-line);box-shadow:0 0 0 3px var(--news-soft)}
.nc-top{display:flex;justify-content:space-between;align-items:center}
.ncat{font-size:var(--fs-label);font-weight:700;color:var(--news-ink);background:var(--news-soft);border-radius:5px;padding:1px 7px;white-space:nowrap}
.ndate{font-family:var(--mono);font-size:var(--fs-label);color:var(--faint)}
.nt{font-size:var(--fs-body);font-weight:700;line-height:1.5}
.ne{font-size:var(--fs-cap);color:var(--muted);line-height:1.65}
.ne b,.nteam b{display:block;font-size:var(--fs-label);color:var(--faint);font-weight:500;margin-bottom:2px}
.nteam{font-size:var(--fs-cap);background:var(--soft);border-radius:10px;padding:9px 11px;line-height:1.65}
.nsrc{font-family:var(--mono);font-size:var(--fs-label);color:var(--faint);display:flex;justify-content:space-between;margin-top:auto}
.nsrc a{font-family:var(--sans);color:var(--muted);text-decoration:underline;text-underline-offset:2px}
.rbs{display:flex;gap:4px}
.rb{flex:1;text-align:center;font-size:var(--fs-cap);border:1px solid var(--line);border-radius:999px;padding:6px 0;color:var(--muted);white-space:nowrap}
.rb.on{background:var(--ink);border-color:var(--ink);color:#fff;font-weight:500}
.qlist{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.qrow{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:10px;padding:7px 10px;font-size:var(--fs-sm)}
.qrow span:last-child{margin-left:auto;font-size:var(--fs-cap);color:var(--muted)}
.hints{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
.hint2{font-size:var(--fs-cap);border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:var(--muted);background:var(--soft)}
/* 재료 — 종류 라벨 없음, "피할 것"만 따로 */
.avoid{font-size:var(--fs-label);color:var(--muted);border:1px solid var(--line);background:var(--soft);border-radius:5px;padding:1px 7px;white-space:nowrap;flex:none}
.mats{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px;flex:none}
.mats h5{margin:0;font-size:var(--fs-body);display:flex;justify-content:space-between;align-items:center}
.mats .sub2{font-size:var(--fs-cap);color:var(--muted);margin:2px 0 6px}
.mrow{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid var(--line2);font-size:var(--fs-sm)}
.mrow::before{content:"";width:4px;height:4px;border-radius:50%;background:var(--faint);flex:none}
.mrow.av::before{display:none}
.mrow .cnt{margin-left:auto;font-family:var(--mono);font-size:var(--fs-cap);color:var(--faint)}
/* 진행자 */
.hbody{flex:1;min-height:0;display:grid;grid-template-columns:320px minmax(0,1fr);gap:16px;padding:18px 24px}
.pr{display:flex;align-items:center;gap:12px;font-size:var(--fs-sm);padding:6px 0;min-height:32px}
.pr .nm2{width:88px;flex:none}
.pr .bar{flex:1;height:4px;border-radius:99px;background:var(--line2);overflow:hidden}
.pr .bar i{display:block;height:100%;background:var(--key);border-radius:99px}
.pr .st{margin-left:auto;font-family:var(--mono);font-size:var(--fs-cap);color:var(--muted)}
.pr .st.done{font-family:var(--sans);color:var(--faint)}
.rx{padding:6px 0}
.rx-t{display:flex;align-items:center;gap:6px;font-size:var(--fs-sm)}
.rx-t .c{font-size:var(--fs-cap);color:var(--faint);width:28px;flex:none}
.stack3{display:flex;height:6px;border-radius:99px;overflow:hidden;margin-top:6px;background:var(--line2)}
.stack3 i{display:block;height:100%}
.s-new{background:var(--line)}.s-heard{background:var(--key-300)}.s-know{background:var(--key)}
.lg3{display:flex;gap:12px;font-size:var(--fs-label);color:var(--muted);margin-top:8px}
.lg3 span{display:inline-flex;align-items:center;gap:4px}.lg3 i{width:8px;height:8px;border-radius:2px;display:inline-block}
.hmain{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px 22px 0;display:flex;flex-direction:column;min-height:0}
.grps{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
.gp{border:1px solid var(--line);border-radius:14px;padding:14px 16px;background:var(--panel)}
.gp.on{border-color:var(--key);box-shadow:inset 0 0 0 1px var(--key)}
.gp-h{display:flex;align-items:center;gap:8px}
.gp-h b{font-size:var(--fs-body)}
.gp-h .ai2{font-size:var(--fs-label);color:var(--faint)}
.gp-h .tg{margin-left:auto;font-size:var(--fs-cap);border-radius:999px;padding:3px 10px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}
.gp-h .tg.on{background:var(--key);border-color:var(--key);color:#fff}
.gp-d{font-size:var(--fs-cap);color:var(--muted);margin:3px 0 4px}
.hfoot{margin-top:auto;height:72px;flex:none;border-top:1px solid var(--line2);display:flex;align-items:center;gap:14px}
/* 발산 시작 */
.dbody{flex:1;min-height:0;padding:18px 24px;display:flex;flex-direction:column;gap:14px}
.matpanel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px 20px}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.fgc{border:1px solid var(--key);box-shadow:inset 0 0 0 1px var(--key);border-radius:14px;padding:10px 14px}
.fgc .h{display:flex;align-items:center;gap:8px;font-size:var(--fs-body);font-weight:700;margin-bottom:2px}
.fgc .h em{font-style:normal;font-size:var(--fs-label);color:var(--key-700);background:var(--key-50);border-radius:999px;padding:1px 8px;font-weight:500}
.rest{display:grid;grid-template-columns:110px 1fr;gap:8px 12px;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--line2);font-size:var(--fs-sm)}
.rest b{font-size:var(--fs-sm);font-weight:500;color:var(--muted)}
.pill2{display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-cap);color:var(--ink);border:1px solid var(--line);border-radius:999px;padding:3px 10px;margin-right:6px}
.empty{flex:1;border:1px dashed var(--line);border-radius:16px;display:flex;align-items:center;justify-content:center;color:var(--faint);font-size:var(--fs-sm)}
"""
CSS = CSS + ICE_CSS

GLOCK = LOCK.replace('class="lk"', 'class="ico"')
SEARCH = '<svg class="ico" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.4 10.4 14 14"/></svg>'
TIMER = '<svg class="ico" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="9" r="5.5"/><path d="M8 6v3l2 1.5M6.5 1.8h3"/></svg>'

ICE_TOPICS = ['최근 불편했던 순간', '요즘 이 주제 주변에서 바뀐 것', '그 변화와 내 경험', '요즘 쓰는 서비스와 아쉬운 점', '해보고 싶은 것 · 피하고 싶은 것']

def ibar(stage, pct, timer, host=False, who='노형원'):
    role = '진행자 화면' if host else '참가자 화면'
    return f'''<div class="ibar">
  <div class="ib-l"><span class="applogo">{icon(28)}IdeationEngine</span><span class="ib-topic">교내 해커톤 서비스 아이디어</span></div>
  <div class="ib-c"><div class="ib-stage">{stage}</div><div class="ib-row"><span class="ib-lbl">전체</span><div class="ib-track"><i style="width:{pct}%"></i></div><span class="ib-pct">{pct}%</span></div></div>
  <div class="ib-r"><span class="rolebadge">{role}</span><span class="timer">{TIMER} <b>{timer}</b></span>{pbtn(who)}</div>
</div>'''

def topics(cur):
    rows = []
    for i, t in enumerate(ICE_TOPICS, 1):
        cls = 'done' if i < cur else ('cur' if i == cur else '')
        rows.append(f'<div class="tp {cls}"><i>{i}</i>{t}</div>')
    return f'<div class="sc2"><h4>오늘 나눌 이야기</h4>{"".join(rows)}</div>'

def team(rows):
    out = ''.join(f'<div class="tr"><span>{n}</span><span>{s}</span></div>' for n, s in rows)
    return f'<div class="sc2"><h4>팀 진행 <small>답 내용은 비공개</small></h4>{out}</div>'

def info(title, body, extra=''):
    return f'<div class="sc2"><h4>{title}</h4><p>{body}</p>{extra}</div>'

def chat(step, msgs, comp):
    return f'''<div class="chat"><div class="ch-h"><b>AI와 1:1 인터뷰</b><div class="ch-prog"><i style="width:{step * 20}%"></i></div><span class="ch-n">{"완료" if step == 5 and "done" in comp else f"{step} / 5"}</span><span class="lockchip">{GLOCK}나만 보는 대화</span></div>
  <div class="msgs">{msgs}</div>{comp}</div>'''

def comp(ph, skip='', off=False, done=False):
    sk = f'<span class="skip">{skip}</span>' if skip else ''
    return f'''<div class="comp{" done" if done else ""}"><div class="comp-row"><div class="inp ph">{ph}</div>{sk}<button class="btn{" off" if off else ""}">보내기</button></div></div>'''

def ai(t, c=''): return f'<div class="b ai {c}">{t}</div>'
def me(t, c=''): return f'<div class="b me {c}">{t}</div>'
def lab(t): return f'<div class="blab">{t}</div>'

def ice(num, title, desc, pct, timer, main, side, tags=''):
    return screen(num, title, desc, f'{ibar("아이스브레이킹", pct, timer)}<div class="ibody">{main}<div class="side2">{side}</div></div>', tags)

ICE = []
ICE.append(ice('7-1', '아이스브레이킹 · 질문 1 불편했던 순간', '답이 어디로 가는지는 AI 첫 말에서만 안내', 3, '09:12', chat(1,
    ai('안녕하세요 노형원님. 저와 1:1로 짧게 이야기해요. 답은 팀원도 진행자도 그대로 볼 수 없고, AI가 뽑은 재료만 이름 없이 발산에 쓰여요.')
    + lab('질문 1 · 불편했던 순간') + ai('최근 일주일, 가장 불편했던 순간은 언제였어요? 사소한 것도 좋아요.')
    + me('과제 공지 놓친 거')
    + lab('꼬리질문') + ai('어떤 과제였고, 공지가 <b>어디에</b> 올라와 있었어요?', 'fq')
    + me('교양 과제였는데 LMS 말고 교수님 메일로만 와서 마감 지나고 봤어요')
    + ai('좋아요, 충분해요. 다음으로 갈게요.')
    + lab('질문 2 · 요즘 바뀐 것') + ai(f'{SEARCH}이 주제 주변의 최근 소식을 찾는 중이에요…', 'wait'),
    comp('최근 소식을 불러오는 중이에요', '넘어가기', True)),
    topics(2)
    + team([('노형원 (나)', '1 / 5'), ('이세민', '2 / 5'), ('김승희', '2 / 5'), ('박상진', '0 / 5')]),
    new('정리')))

def news(cat, t, e, tm, src, react, on=False):
    rb = ''.join(f'<span class="rb{" on" if r == react else ""}">{r}</span>' for r in ['처음 들어요', '들어봤어요', '잘 알아요'])
    return (f'<div class="nc{" on" if on else ""}"><div class="nc-top"><span class="ncat">{cat}</span><span class="ndate">[날짜]</span></div>'
            f'<div class="nt">{t}</div><div class="ne"><b>쉽게 말하면</b>{e}</div><div class="nteam"><b>우리 팀에게</b>{tm}</div>'
            f'<div class="nsrc"><span>출처 {src}</span><a>이게 뭐예요?</a></div><div class="rbs">{rb}</div></div>')

NEWS = ('<div class="news">'
        + news('시장', '[예시] 대학가 중고거래가 앱 밖 단톡방으로 이동', '거래는 늘었는데 믿을 장치가 없어요', '신뢰·정산을 돕는 도구가 틈새일 수 있어요', '[기사·매체]', '들어봤어요')
        + news('기술', '[예시] 폰 안에서 도는 온디바이스 AI 모델 무료 공개', '서버 없이도 요약 같은 AI 기능을 넣을 수 있어요', '백엔드가 약해도 AI 시연이 가능해요', '[공식 블로그]', '처음 들어요', True)
        + news('규제', '[예시] 학생 개인정보 동의 절차 강화', '학번·시간표를 쓰면 동의 화면이 더 분명해야 해요', '학생 정보를 쓰면 동의 흐름도 기능이에요', '[기관 보도자료]', '처음 들어요')
        + '</div>')
ICE.append(ice('7-2', '아이스브레이킹 · 질문 2 최근 소식 카드', '카드마다 출처·날짜 · 반응 3단계 · "이게 뭐예요?" 뜻풀이', 6, '08:05', chat(2,
    ai("요즘 '캠퍼스 생활 서비스' 주변 소식이에요. 모르는 분야여도 괜찮아요, 들어봤는지 눌러주세요.")
    + NEWS
    + me('온디바이스 AI가 뭐예요?')
    + ai('<b>온디바이스 AI</b>는 인터넷 서버를 거치지 않고 폰이나 노트북 안에서 바로 도는 AI예요. 빠르고, 개인정보가 밖으로 나가지 않아요.', 'explain'),
    comp("카드에서 반응을 눌러주세요 · 모르는 말은 '이게 뭐예요?'", '넘어가기')),
    topics(2)
    + '<div class="sc2"><h4>최근 소식 출처</h4><p>세션 주제로 최근 기사·공식 자료를 검색해, 검색된 내용만 쉬운 말로 요약했어요. 검색이 안 되는 날엔 질문 2·3은 건너뛰어요.</p>'
      '<hr><h4>내가 물어본 말</h4><span class="asked">온디바이스 AI</span></div>'))

QCARD = ('<div class="b ai wide" style="max-width:88%;align-self:flex-start">방금 본 변화 중 하나 때문에 <b>새로 가능해지거나 더 불편해질</b> 사람이 주변에 있나요?<div class="qlist">'
         '<div class="qrow"><span class="ncat">시장</span><span>[예시] 중고거래가 단톡방으로 이동</span><span>들어봤어요</span></div>'
         '<div class="qrow"><span class="ncat">기술</span><span>[예시] 온디바이스 AI 무료 공개</span><span>처음 들어요</span></div>'
         '<div class="qrow"><span class="ncat">규제</span><span>[예시] 학생 정보 동의 강화</span><span>처음 들어요</span></div></div></div>')
ICE.append(ice('7-3', '아이스브레이킹 · 질문 3 변화 × 내 경험', '반응한 카드 요약 + 꼬리질문', 10, '06:20', chat(3,
    lab('질문 3 · 변화 × 내 경험') + QCARD
    + me('과대요')
    + lab('꼬리질문') + ai('과대분이 어떤 변화 때문에, <b>어떤 일</b>이 더 번거로워졌을 것 같아요?', 'fq')
    + me('단톡방 공동구매가 늘어서 정산을 늘 혼자 떠안아요. 누가 돈을 냈는지 헷갈려서 매번 다시 확인해요')
    + ai('좋아요, 충분해요. 다음으로 갈게요.'),
    comp('답을 입력하세요', '넘어가기')),
    topics(3)
    + info('꼬리질문은 언제 오나요?', '답이 짧거나 모호할 때만 한 번 더 물어봐요. 원하지 않으면 넘어가도 돼요.')
    + team([('노형원 (나)', '3 / 5'), ('이세민', '4 / 5'), ('김승희', '3 / 5'), ('박상진', '2 / 5')])))

ICE.append(ice('7-4', '아이스브레이킹 · 질문 4 요즘 쓰는 서비스', '힌트 칩은 방향만 · 충분히 답하면 꼬리질문 없음', 14, '04:48', chat(4,
    me('단톡방 공동구매가 늘어서 정산을 늘 혼자 떠안아요. 누가 돈을 냈는지 헷갈려서 매번 다시 확인해요')
    + ai('좋아요, 충분해요. 다음으로 갈게요.')
    + lab('질문 4 · 요즘 쓰는 서비스')
    + ai('요즘 가장 자주 쓰는 앱이나 서비스는 뭐고, <b>아쉬운 점</b>은요?<div class="hints"><span class="hint2">수업·과제</span><span class="hint2">팀플 협업</span><span class="hint2">돈·결제</span><span class="hint2">학교생활</span></div>')
    + me('피그마랑 노션을 제일 많이 써요. 피그마는 팀플 때 누가 어디를 고쳤는지 추적이 어렵고, 노션은 팀원들이 잘 안 들어와서 결국 단톡으로 다시 물어봐요')
    + ai('구체적으로 말해줘서 바로 다음으로 갈게요. 마지막 질문만 남았어요.'),
    comp('답을 입력하세요', '넘어가기')),
    topics(4)
    + info('답이 떠오르지 않을 때', '질문 아래 힌트를 눌러 보세요. 답을 대신 채우지 않고 생각할 방향만 보여줘요.')
    + team([('노형원 (나)', '4 / 5'), ('이세민', '완료'), ('김승희', '4 / 5'), ('박상진', '3 / 5')])))

MATS = ['교양 과제 공지가 메일로만 와서 마감을 놓침', '단톡방 공동구매가 늘며 정산을 한 사람이 떠안음',
        '피그마 수정 내역 추적이 어렵고, 노션엔 팀원이 잘 안 들어옴', 'AI 기능을 직접 넣어보고 싶음', '학교 앞 카페 콘센트 자리 경쟁']
MATBOX = ('<div class="mats"><h5>내 답에서 AI가 뽑은 재료 <span class="lockchip">' + GLOCK + '나만 보임</span></h5>'
          '<div class="sub2">이름 없이 발산 재료로 쓰여요.</div>'
          + ''.join(f'<div class="mrow">{t}</div>' for t in MATS)
          + '<div class="mrow av"><span class="avoid">피할 것</span>앱 개발</div></div>')
ICE.append(ice('7-5', '아이스브레이킹 · 질문 5 마무리', '재료는 라벨 없이 나열 · "피할 것"만 따로 표시', 18, '03:05', chat(5,
    lab('질문 5 · 해보고 싶은 것 · 피하고 싶은 것')
    + me('AI 기능은 꼭 넣어보고 싶어요. 대신 앱 개발은 피하고 싶어요')
    + ai('끝! 수고했어요. 진행자가 단계를 넘기면 함께 발산으로 이동해요.', 'good')
    + MATBOX,
    comp('인터뷰가 끝났어요', '', True, done=True)),
    topics(6)
    + info('다음에 일어나는 일', '진행자가 모두의 재료를 묶은 형태로 보고, 먼저 이야기할 묶음만 표시해요. 재료는 전부 발산으로 넘어가요.')
    + team([('노형원 (나)', '완료'), ('이세민', '완료'), ('김승희', '4 / 5'), ('박상진', '3 / 5')])))

# 7-6 진행자
def prow(n, pct):
    if pct >= 100:
        return f'<div class="pr"><span class="nm2">{n}</span><span class="st done">완료</span></div>'
    return f'<div class="pr"><span class="nm2">{n}</span><div class="bar"><i style="width:{pct}%"></i></div><span class="st">{round(pct / 20)} / 5</span></div>'
def rx(cat, t, a, b, c):
    tot = a + b + c
    return (f'<div class="rx"><div class="rx-t"><span class="c">{cat}</span>{t}</div>'
            f'<div class="stack3"><i class="s-new" style="width:{a / tot * 100}%"></i><i class="s-heard" style="width:{b / tot * 100}%"></i><i class="s-know" style="width:{c / tot * 100}%"></i></div></div>')
def gp(title, desc, rows, on=None, ai_pick=False):
    tag = '' if on is None else ('<span class="tg on">먼저 보기 ✓</span>' if on else '<span class="tg">먼저 보기</span>')
    pick = '<span class="ai2">AI 추천</span>' if ai_pick else ''
    body = ''.join((f'<div class="mrow av"><span class="avoid">피할 것</span>{t}<span class="cnt">{c}명</span></div>' if av
                    else f'<div class="mrow">{t}<span class="cnt">{c}명</span></div>') for t, c, av in rows)
    return f'<div class="gp{" on" if on else ""}"><div class="gp-h"><b>{title}</b>{pick}{tag}</div><div class="gp-d">{desc}</div>{body}</div>'

HOST = f'''{ibar("아이스브레이킹", 20, "01:48", host=True)}
<div class="hbody">
  <div class="side2">
    <div class="sc2"><h4>인터뷰 진행 <small>답 내용은 비공개</small></h4>
      {prow("노형원 (나)", 100)}{prow("이세민", 100)}{prow("김승희", 100)}{prow("박상진", 80)}</div>
    <div class="sc2"><h4>최근 소식 × 팀 반응</h4>
      {rx("시장", "단톡방 중고거래", 1, 2, 1)}{rx("기술", "온디바이스 AI", 3, 0, 1)}{rx("규제", "학생 정보 동의 강화", 4, 0, 0)}
      <div class="lg3"><span><i class="s-new"></i>처음 들어요</span><span><i class="s-heard"></i>들어봤어요</span><span><i class="s-know"></i>잘 알아요</span></div>
      <p style="margin-top:12px">온디바이스 AI를 잘 아는 사람이 1명 있어요. 발산 때 설명을 부탁해 보세요.</p></div>
    <p class="note" style="padding:0 4px;display:flex;gap:6px">{GLOCK}<span>진행자도 답 원문은 볼 수 없어요.</span></p>
  </div>
  <div class="hmain">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><p style="font-size:var(--fs-h2);font-weight:700">발산 재료 11개 · 비슷한 것끼리 묶었어요</p><p class="hint">재료는 전부 발산으로 넘어가요. 먼저 이야기할 묶음만 표시하세요.</p></div>
      <button class="btn ghost sm">다시 묶기</button></div>
    <div class="grps">
      {gp("흩어진 학교 정보", '묶으면 "캠퍼스 정보를 한곳에서" 방향이 돼요', [("과제 공지가 메일·LMS·단톡으로 흩어짐", 2, False), ("시험기간 열람실 빈자리 찾기", 1, False), ("학교 앞 카페 콘센트 자리 경쟁", 1, False)], on=True, ai_pick=True)}
      {gp("AI를 직접 써보고 싶음", "동기가 가장 많이 겹치고, 최근 소식과도 이어져요", [("AI 기능을 직접 넣어보고 싶음", 3, False), ("온디바이스 AI로 서버 없이 시연", 1, False), ("온디바이스 AI를 잘 아는 사람이 있음", 1, False)], on=True)}
      {gp("돈·정산의 신뢰", "최근 시장 변화와 실제 경험이 맞닿아 있어요", [("단톡방 공동구매 정산을 한 사람이 떠안음", 1, False), ("팀플 회비 누가 냈는지 헷갈림", 1, False)], on=False)}
      {gp("우리 팀의 조건", "주제가 아니라 범위를 정하는 재료예요", [("웹 화면과 발표 자료는 자신 있음", 2, False), ("앱 개발 · 서버가 무거운 방향", 2, True), ("피그마 수정 내역 추적이 어려움", 1, False)])}
    </div>
    <div class="hfoot"><button class="btn ghost">이전 단계</button><span class="note" style="flex:1">늦게 낸 답도 재료에 추가돼요</span><button class="btn lg">발산 시작 →</button></div>
  </div>
</div>'''
ICE.append(screen('7-6', '아이스브레이킹 · 진행자', '완료한 사람은 "완료"만 · 반응은 막대 + 범례만 · 재료 라벨 없음', HOST))

def fgc(title, rows):
    return f'<div class="fgc"><div class="h">{title}<em>먼저 보기</em></div>' + ''.join(f'<div class="mrow" style="border-top:none;padding:4px 0">{t}</div>' for t in rows) + '</div>'
DIVERGE = f'''{ibar("아이디어 발산", 25, "19:58")}
<div class="dbody">
  <div class="matpanel">
    <div style="display:flex;align-items:baseline;gap:10px"><b style="font-size:var(--fs-body)">아이스브레이킹에서 모인 재료 11개</b><span class="t-cap muted">이름 없음</span></div>
    <div class="fg">
      {fgc("흩어진 학교 정보", ["과제 공지가 메일·LMS·단톡으로 흩어짐", "시험기간 열람실 빈자리 찾기", "학교 앞 카페 콘센트 자리 경쟁"])}
      {fgc("AI를 직접 써보고 싶음", ["AI 기능을 직접 넣어보고 싶음", "온디바이스 AI로 서버 없이 시연", "온디바이스 AI를 잘 아는 사람이 있음"])}
    </div>
    <div class="rest">
      <b>돈·정산의 신뢰</b><div><span class="pill2">단톡방 공동구매 정산 떠안기</span><span class="pill2">팀플 회비 누가 냈는지 헷갈림</span></div>
      <b>우리 팀의 조건</b><div><span class="pill2">웹 화면·발표 자료 자신 있음</span><span class="pill2"><span class="avoid">피할 것</span>앱·무거운 서버</span><span class="pill2">피그마 수정 내역 추적</span></div>
    </div>
  </div>
  <div><p class="lead">아이디어 발산</p><p class="hint">재료 하나에서 출발해도, 묶음을 섞어도, 자유롭게 떠올려도 좋아요.</p></div>
  <div class="comp-row" style="background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px"><div class="inp ph" style="border:none">아이디어를 입력하세요</div><button class="btn">제출</button></div>
  <div class="empty">아직 올라온 아이디어가 없어요</div>
</div>'''
ICE.append(screen('7-7', '발산 시작 — 상단에 재료', '먼저 보기 묶음은 펼침, 나머지는 한 줄', DIVERGE))

S[7:7] = ICE

# ───────── 8 아이디어 발산 (내 아이디어 → 순위 → 댓글 → AI 검증 → 투표) ─────────
# 새 색 추가 없음. AI 검증 등급 점 3색은 기존 의미 색(완료 초록 · 주의 · 위험)을 점 크기로만 사용.
DIV_CSS = r"""
.dvp{flex:1;min-height:0;padding:18px 32px 24px;display:flex;flex-direction:column}
.dsteps{display:flex;align-items:center;gap:10px;font-size:var(--fs-cap);color:var(--faint);flex:none}
.ds{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.ds i{font-style:normal;width:18px;height:18px;border-radius:50%;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10px;background:var(--panel)}
.ds.done{color:var(--muted)}
.ds.cur{color:var(--ink);font-weight:500}
.ds.cur i{background:var(--key);border-color:var(--key);color:#fff}
.dl{width:24px;height:1px;background:var(--line);display:block}
.dvh{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin:14px 0 16px;flex:none}
.dvh h3{margin:0;font-size:var(--fs-h1);font-weight:700;letter-spacing:-.01em;line-height:1.3}
.dvh p{font-size:var(--fs-sm);color:var(--muted);margin-top:4px}
.dvh .aside{font-size:var(--fs-cap);color:var(--muted);text-align:right;white-space:nowrap}
.panel2{background:var(--panel);border:1px solid var(--line);border-radius:16px}
.quiet{display:flex;align-items:center;gap:6px;font-size:var(--fs-cap);color:var(--muted)}
.linkish{font-size:var(--fs-cap);color:var(--muted);text-decoration:underline;text-underline-offset:2px}
/* 8-1 */
.rrow{display:grid;grid-template-columns:56px minmax(0,1fr) 32px;gap:16px;align-items:center}
.rrow+.rrow{margin-top:14px}
.rk{width:56px;height:64px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--mono);font-size:var(--fs-h2);font-weight:700;line-height:1.1}
.rk small{font-family:var(--sans);font-size:var(--fs-label);font-weight:400;margin-top:2px}
.rk.r1{background:var(--key);color:#fff}
.rk.r2{background:var(--key-100);color:var(--key-700)}
.rk.r3{background:var(--soft);color:var(--faint);border:1px dashed var(--line)}
.rlab{font-size:var(--fs-cap);color:var(--muted);margin-bottom:6px}
.rin{border:1px solid var(--line);border-radius:10px;padding:14px 16px;font-size:var(--fs-body);background:var(--panel)}
.rin.ph{color:var(--faint);border-style:dashed}
.arw{display:flex;flex-direction:column;gap:6px;padding-top:20px}
.arw span{width:32px;height:26px;border:1px solid var(--line);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:var(--fs-cap)}
.arw span.off{color:var(--line)}
.dfoot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex:none;padding-top:16px}
/* 8-2 */
.recs{display:flex;flex-direction:column;gap:10px}
.rec{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center}
.rec.on{border-color:var(--key);box-shadow:inset 0 0 0 1px var(--key)}
.rec b{font-size:var(--fs-body);font-weight:700}
.rec p{font-size:var(--fs-cap);color:var(--muted);margin-top:3px}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:9px;overflow:hidden}
.seg span{min-width:36px;padding:6px 10px;text-align:center;font-size:var(--fs-cap);color:var(--muted);border-left:1px solid var(--line)}
.seg span:first-child{border-left:none}
.seg span.on{background:var(--key);color:#fff;font-weight:500}
.mine li{display:flex;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--line2);font-size:var(--fs-sm)}
.mine li:first-child{border-top:none}
.mine{list-style:none;margin:0;padding:0}
.num{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:var(--fs-cap);font-weight:700;flex:none;background:var(--soft);color:var(--muted)}
.num.n1{background:var(--key);color:#fff}
.num.n2{background:var(--key-100);color:var(--key-700)}
/* 8-3 */
.rtab{width:100%;border-collapse:collapse;font-size:var(--fs-sm)}
.rtab th{text-align:left;font-size:var(--fs-cap);color:var(--muted);font-weight:500;padding:16px 24px;border-bottom:1px solid var(--line)}
.rtab td{padding:0 24px;height:118px;border-bottom:1px solid var(--line2);vertical-align:middle;line-height:1.6;font-size:var(--fs-body)}
.rtab tr:last-child td{border-bottom:none}
.rtab td.who{white-space:nowrap;color:var(--muted);width:130px}
.rtab td.r1{font-weight:500}
.rtab tr.me td{background:var(--key-50)}
.metag{font-size:var(--fs-label);color:var(--key-700);border:1px solid var(--key-200);border-radius:999px;padding:0 6px;margin-left:6px;background:var(--panel)}
/* 8-4 */
.two{flex:1;min-height:0;display:grid;grid-template-columns:320px minmax(0,1fr);gap:16px}
.ilist{display:flex;flex-direction:column;gap:6px;min-height:0}
.igl{font-size:var(--fs-cap);color:var(--faint);margin:8px 0 2px}
.igl:first-child{margin-top:0}
.it{display:flex;align-items:center;gap:10px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:9px 12px;font-size:var(--fs-sm)}
.it .n{font-family:var(--mono);font-size:var(--fs-label);color:var(--faint);width:12px;flex:none}
.it .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.it .s{font-size:var(--fs-cap);color:var(--faint);white-space:nowrap}
.it .s.k{color:var(--key)}
.it.on{border-color:var(--key);box-shadow:inset 0 0 0 1px var(--key)}
.it.off{color:var(--faint)}
.detail{padding:20px 22px;display:flex;flex-direction:column;min-height:0}
.dk{font-size:var(--fs-cap);color:var(--muted)}
.dt{font-size:var(--fs-h2);font-weight:700;margin-top:2px;line-height:1.4}
.cform{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
.cf .cl{display:flex;justify-content:space-between;align-items:baseline;font-size:var(--fs-sm);font-weight:700;margin-bottom:6px}
.cf .cl small{font-size:var(--fs-cap);color:var(--muted);font-weight:400}
.cf .ta{border:1px solid var(--line);border-radius:10px;padding:12px 14px;min-height:100px;font-size:var(--fs-sm);line-height:1.6}
.cf .ta.focus{border:2px solid var(--key);padding:11px 13px}
.cf .ta.ph{color:var(--faint)}
.cf .hint3{font-size:var(--fs-cap);color:var(--faint);margin-top:6px}
.csave{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:12px}
.clist{margin-top:18px;border-top:1px solid var(--line2);padding-top:12px}
.clist h6{margin:0 0 4px;font-size:var(--fs-sm);font-weight:700}
.clist h6 small{font-weight:400;color:var(--faint);font-size:var(--fs-cap);margin-left:6px}
.cm{display:grid;grid-template-columns:64px 1fr;gap:10px;padding:8px 0;border-top:1px solid var(--line2);font-size:var(--fs-sm)}
.cm:first-of-type{border-top:none}
.cm span{font-size:var(--fs-cap);color:var(--muted)}
.cm.plus span{color:var(--key)}
.counts{display:flex;gap:20px;font-size:var(--fs-cap);color:var(--muted)}
.counts b{font-family:var(--mono);font-size:var(--fs-body);color:var(--ink);font-weight:700;margin-left:4px}
/* 등급 */
.grade{display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-cap);color:var(--ink);white-space:nowrap}
.grade i{width:7px;height:7px;border-radius:50%;display:block;flex:none}
.grade.go i{background:var(--ok)}.grade.fix i{background:var(--warn)}.grade.re i{background:var(--bad)}
.grade.gbox{border:1px solid var(--line);border-radius:999px;padding:3px 10px;background:var(--panel)}
.dhead{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.dhead>div{flex:1;min-width:0}
.dhead>.grade{flex:none;margin-top:2px}
.ans{display:inline-block;font-size:var(--fs-label);border:1px solid var(--line);border-radius:999px;padding:1px 8px;color:var(--ink);white-space:nowrap;margin-right:8px;vertical-align:1px}
.qa{display:grid;grid-template-columns:150px 1fr;gap:12px;padding:11px 0;border-top:1px solid var(--line2);font-size:var(--fs-sm);line-height:1.6}
.qa>b{font-weight:500;color:var(--muted)}
.qa.tight{grid-template-columns:110px 1fr;padding:7px 0}
.more{font-size:var(--fs-cap);color:var(--faint);padding:2px 4px}
.refnote{margin-top:auto;font-size:var(--fs-cap);color:var(--faint);display:flex;gap:6px;align-items:flex-start;padding-top:12px}
/* 8-6 */
.vitem{display:grid;grid-template-columns:20px minmax(0,1fr);gap:12px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 14px}
.vitem .vt{font-size:var(--fs-sm);line-height:1.45}
.vitem .vm{display:flex;align-items:center;gap:8px;margin-top:3px}
.vitem .vm small{font-size:var(--fs-label);color:var(--faint)}
.vitem.on{border-color:var(--key);box-shadow:inset 0 0 0 1px var(--key)}
.cb{width:18px;height:18px;border-radius:5px;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px}
.cb.on{background:var(--key);border-color:var(--key)}
.dots3{display:inline-flex;gap:4px;margin-left:8px;vertical-align:-1px}
.dots3 i{width:10px;height:10px;border-radius:50%;background:var(--key);display:block}
.dots3 i.e{background:transparent;border:1.5px solid var(--key-300)}
.orig{background:var(--soft);border-radius:10px;padding:10px 14px;font-size:var(--fs-sm);margin-top:6px}
.sech{font-size:var(--fs-cap);color:var(--muted);margin:14px 0 2px;display:flex;gap:6px}
.sech b{color:var(--ink);font-weight:700}
/* 8-7 */
.res{display:grid;grid-template-columns:32px minmax(0,1fr) 150px 160px 40px;gap:14px;align-items:center;padding:12px 0;border-top:1px solid var(--line2);font-size:var(--fs-sm)}
.res:first-child{border-top:none}
.res .rt{line-height:1.45}
.res.top .rt{font-weight:700}
.vbar{height:6px;border-radius:99px;background:var(--line2);overflow:hidden}
.vbar i{display:block;height:100%;background:var(--key-300);border-radius:99px}
.res.top .vbar i{background:var(--key)}
.res .vc{font-family:var(--mono);font-size:var(--fs-cap);color:var(--muted);text-align:right}
.res.top .vc{color:var(--ink);font-weight:700}
"""
CSS = CSS + DIV_CSS

DSTEPS = ['내 아이디어', '순위 보기', '서로 댓글', 'AI 검증', '투표']
def steps(cur):
    out = []
    for i, n in enumerate(DSTEPS, 1):
        cls = 'done' if i < cur else ('cur' if i == cur else '')
        out.append(f'<span class="ds {cls}"><i>{i}</i>{n}</span>')
    return '<div class="dsteps">' + '<b class="dl"></b>'.join(out) + '</div>'

def gradeh(g, box=False):
    name = {'go': '바로 해볼 만해요', 'fix': '보완하면 좋아요', 're': '다시 생각해 봐요'}[g]
    return f'<span class="grade {g}{" gbox" if box else ""}"><i></i>{name}</span>'

def dv(num, title, desc, pct, timer, step, h, sub, body, aside='', host=False):
    return screen(num, title, desc, f'''{ibar("아이디어 발산", pct, timer, host=host)}
<div class="dvp">{steps(step)}
  <div class="dvh"><div><h3>{h}</h3><p>{sub}</p></div>{aside}</div>
  {body}
</div>''')

DIV = []

# 8-1 원래 아이디어
def rrow(r, cls, lab, val, ph=False, first=False, last=False):
    up = '<span class="off">↑</span>' if first else '<span>↑</span>'
    dn = '<span class="off">↓</span>' if last else '<span>↓</span>'
    return (f'<div class="rrow"><div class="rk {cls}">{r}<small>순위</small></div>'
            f'<div><div class="rlab">{lab}</div><div class="rin{" ph" if ph else ""}">{val}</div></div>'
            f'<div class="arw">{up}{dn}</div></div>')
DIV.append(dv('8-1', '발산 · 내 아이디어 정하기', '최대 3개, 하고 싶은 순서대로 · 없으면 AI 추천에서 고르기', 25, '04:10', 1,
    '원래 해보고 싶었던 아이디어를 적어주세요', f'최대 3개까지, 하고 싶은 순서대로 적어요.<span class="lockline">{GLOCK}아이디어는 투표가 끝날 때까지 익명이에요. 결과가 나오면 주인만 공개되고, 댓글과 투표는 끝까지 익명이에요.</span>',
    '<div class="panel2" style="padding:22px 24px">'
    + rrow(1, 'r1', '가장 해보고 싶은 아이디어', '과제 공지와 마감을 메일·학교 사이트·단톡에서 한곳에 모아 알려주는 웹', first=True)
    + rrow(2, 'r2', '두 번째', '강의자료 PDF를 요약해 주는 브라우저 도구')
    + rrow(3, 'r3', '세 번째 · 비어 있어요', '직접 적거나, AI 추천에서 골라 채워요', ph=True, last=True)
    + '</div>'
    + '<div class="dfoot" style="margin-top:16px"><span class="quiet">생각해 둔 아이디어가 없어도 괜찮아요. 아까 인터뷰를 바탕으로 추천해 드려요.</span>'
      '<span style="display:flex;gap:8px"><button class="btn ghost">AI 추천 보기</button><button class="btn">이 순서로 제출</button></span></div>',
    '<a class="linkish">아이스브레이킹 재료 11개 보기</a>'))

# 8-2 AI 추천에서 고르기
def rec(t, why, rank):
    seg = ''.join(f'<span class="{"on" if rank == i else ""}">{f"{i}순위" if rank == i else i}</span>' for i in (1, 2, 3))
    return f'<div class="rec{" on" if rank else ""}"><div><b>{t}</b><p>추천 이유 · {why}</p></div><div class="seg">{seg}</div></div>'
DIV.append(dv('8-2', '발산 · AI 추천에서 고르기', '추천 이유 한 줄 · 고른 문장은 고쳐도 됨 · 팀에는 똑같이 "내 아이디어"', 25, '03:40', 1,
    'AI가 추천한 아이디어에서 골라주세요', '인터뷰에서 나눈 이야기를 바탕으로 골랐어요. 문장은 자유롭게 고쳐도 돼요.',
    '<div class="two" style="grid-template-columns:minmax(0,1fr) 340px">'
    '<div style="display:flex;flex-direction:column"><div class="recs">'
    + rec('학교 행사·특강 소식 중 관심 있는 것만 골라 알려주는 웹', '"중요한 공지를 자주 놓친다"고 했어요', 1)
    + rec('중고 전공책을 같은 학과 안에서만 사고파는 게시판', '"학기마다 책값이 부담"이라고 했어요', 2)
    + rec('팀플 회비를 누가 냈는지 링크 하나로 확인하는 웹', '최근 소식 "단톡방 거래 증가"를 들어봤어요', 0)
    + rec('디자인 수정 요청을 한 화면에 모아 보는 팀플 도구', '"피그마에서 누가 어디를 고쳤는지 모르겠다"고 했어요', 3)
    + '</div><div style="display:flex;align-items:center;gap:12px;margin-top:12px"><button class="btn ghost sm">다른 추천 더 보기</button><span class="quiet">인터뷰 원문은 다른 사람에게 보이지 않아요</span></div></div>'
    '<div class="panel2" style="padding:18px 20px;display:flex;flex-direction:column">'
    '<b style="font-size:var(--fs-body)">내 순위</b><p class="t-cap muted" style="margin:2px 0 10px">팀에는 내 아이디어로 보여요</p>'
    '<ul class="mine"><li><span class="num n1">1</span>학교 행사·특강 소식 중 관심 있는 것만 골라 알려주는 웹</li>'
    '<li><span class="num n2">2</span>중고 전공책을 같은 학과 안에서만 사고파는 게시판</li>'
    '<li><span class="num">3</span>디자인 수정 요청을 한 화면에 모아 보는 팀플 도구</li></ul>'
    '<button class="btn block" style="margin-top:auto">이 순서로 제출</button></div>'
    '</div>'))

# 8-3 익명 순위표
ROWS = [('A', '열람실·카페 빈자리를 함께 알려주는 지도', '팀플 회의가 끝나면 할 일을 정리해 주는 서비스', '내 필기로 시험 예상 문제를 만들어 주는 웹', False),
        ('B', '학교 행사·특강 소식 중 관심 있는 것만 골라 알려주는 웹', '중고 전공책을 같은 학과 안에서만 사고파는 게시판', '디자인 수정 요청을 한 화면에 모아 보는 팀플 도구', False),
        ('C', '과제 공지와 마감을 한곳에 모아 알려주는 웹', '강의자료 PDF를 요약해 주는 브라우저 도구', '공동구매 정산을 링크로 확인하는 웹', True),
        ('D', '동아리 굿즈 재고를 한 화면에서 관리', '시간표가 겹치는 사람에게만 스터디 모집 보여주기', '학교 앞 카페 콘센트 자리 알림', False)]
trs = ''.join(f'<tr class="{"me" if me else ""}"><td class="who">팀원 {w}{"<span class=metag>나</span>" if me else ""}</td><td class="r1">{a}</td><td>{b}</td><td>{c}</td></tr>' for w, a, b, c, me in ROWS)
DIV.append(dv('8-3', '발산 · 익명 순위표', '이름 대신 팀원 A~D · 줄 순서 무작위 · 내 줄은 나만 표시', 30, '02:30', 2,
    '모두의 1·2·3순위 아이디어예요', '누구 아이디어인지 신경 쓰지 말고, 아이디어만 보고 판단해 주세요.',
    f'<div class="panel2" style="overflow:hidden"><table class="rtab"><tr><th>익명</th><th>1순위</th><th>2순위</th><th>3순위</th></tr>{trs}</table></div>'
    f'<div class="dfoot" style="margin-top:16px"><span class="quiet">{GLOCK}줄 순서는 섞였고, 진행자도 누구 줄인지 몰라요 · 투표가 끝나면 아이디어 주인만 공개돼요</span><span class="quiet">진행자가 넘기면 댓글 달기가 시작돼요</span></div>',
    '<span class="aside">4명 모두 제출했어요</span>'))

# 8-4 ~ 9-2 (v12) — 회색 레일(보조) + 떠 있는 흰 본문(집중) · 레일 접기 버튼 · 역할/보고서
DIV_CSS2 = r"""
.focusgrid{flex:1;min-height:0;display:grid;grid-template-columns:290px minmax(0,1fr);gap:20px;position:relative}
.rail{background:#EDEEF5;border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:1px;min-height:0;overflow:hidden}
.rgl{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:var(--fs-label);color:var(--muted);padding:10px 30px 4px 10px;font-weight:500}
.rgl:first-child{padding-top:6px}
.rgl small{font-size:var(--fs-label);color:var(--faint);font-weight:400}
.ri{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;font-size:var(--fs-sm);color:var(--ink);min-width:0}
.ri .n{font-family:var(--mono);font-size:var(--fs-label);color:var(--faint);width:10px;flex:none}
.ri .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ri .s,.ri small{font-size:var(--fs-label);color:var(--faint);white-space:nowrap;flex:none}
.ri .gd{width:7px;height:7px;border-radius:50%;flex:none}
.gd.go{background:var(--ok)}.gd.fix{background:var(--warn)}.gd.re{background:var(--bad)}
.ri.on{background:var(--panel);box-shadow:inset 3px 0 0 var(--key),0 1px 2px rgba(30,27,75,.06),0 6px 16px rgba(30,27,75,.08)}
.ri.on .s.k{color:var(--key)}
.rmore{font-size:var(--fs-label);color:var(--faint);padding:2px 10px 4px}
.rlegend{margin-top:auto;display:flex;gap:12px;font-size:var(--fs-label);color:var(--faint);padding:8px 10px 4px;border-top:1px solid #DFE0EA}
.rlegend span{display:inline-flex;align-items:center;gap:5px}
.rlegend .gd{width:7px;height:7px;border-radius:50%;display:inline-block}
.rail .cb{flex:none;background:var(--panel);border-color:#C9CADB}
.rail .cb.on{background:var(--key);border-color:var(--key)}
.railbtn{position:absolute;top:8px;left:276px;z-index:3;width:28px;height:28px;border-radius:50%;background:var(--panel);border:1px solid var(--line);box-shadow:0 1px 3px rgba(30,27,75,.14);display:flex;align-items:center;justify-content:center;gap:6px;color:var(--muted);font-size:var(--fs-sm);line-height:1}
.focusgrid.closed{display:flex;justify-content:center}
.focusgrid.closed .detail{width:100%;max-width:960px}
.focusgrid.closed .railbtn{left:0;width:auto;height:30px;padding:0 12px 0 10px;border-radius:999px;font-size:var(--fs-cap)}
.detail.lift{border:none;box-shadow:0 1px 2px rgba(30,27,75,.05),0 14px 36px rgba(30,27,75,.10)}
.aitag{font-size:var(--fs-label);color:var(--key-700);border:1px solid var(--key-200);background:var(--key-50);border-radius:999px;padding:0 7px;white-space:nowrap;font-weight:500;flex:none}
.dk.key{color:var(--key-700)}
.sec{margin-top:14px}
.sec h6{margin:0 0 6px;font-size:var(--fs-sm);font-weight:700}
.sec h6 small{font-weight:400;color:var(--faint);font-size:var(--fs-cap);margin-left:6px}
.srcs{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.src{background:var(--soft);border-radius:10px;padding:10px 12px}
.src .m{display:flex;gap:8px;align-items:center;font-size:var(--fs-label);color:var(--muted)}
.src .m .grade{font-size:var(--fs-label)}
.src .tt{font-size:var(--fs-sm);font-weight:700;margin:3px 0}
.src .g{font-size:var(--fs-cap);line-height:1.5}
.src .g span{color:var(--muted);margin-right:6px}
.fixrow{display:grid;grid-template-columns:260px 18px 1fr;gap:8px;font-size:var(--fs-sm);padding:5px 0;align-items:baseline;border-top:1px solid var(--line2)}
.fixrow:first-of-type{border-top:none}
.fixrow .p{color:var(--muted)}
.fixrow .p small{color:var(--faint);font-size:var(--fs-label);margin-left:4px}
.fixrow .a{color:var(--faint)}
.vgrid{display:grid;grid-template-columns:1fr 1fr;gap:2px 20px}
.vgrid div{display:flex;gap:10px;align-items:center;padding:5px 0;font-size:var(--fs-sm);border-top:1px solid var(--line2)}
.vgrid b{font-weight:500;color:var(--muted);width:90px;flex:none;font-size:var(--fs-cap)}
.from{display:grid;grid-template-columns:118px 1fr;gap:10px;font-size:var(--fs-sm);padding:4px 0;align-items:center}
.from span{font-size:var(--fs-label);color:var(--muted);border:1px solid var(--line);border-radius:6px;padding:1px 7px;justify-self:start}
.crows{display:flex;flex-direction:column;gap:6px}
.crow{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:10px;padding:7px 12px;font-size:var(--fs-sm)}
.crow .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crow small{font-size:var(--fs-label);color:var(--faint)}
.rbtn{font-size:var(--fs-cap);border:1px solid var(--line);border-radius:999px;padding:5px 12px;color:var(--muted);white-space:nowrap}
.rbtn.on{background:var(--ink);border-color:var(--ink);color:#fff}
.dfoot2{margin-top:auto;padding-top:12px;border-top:1px solid var(--line2);display:flex;justify-content:space-between;align-items:center;gap:16px}
.lockline{display:flex;align-items:center;gap:6px;font-size:var(--fs-cap);color:var(--muted);margin-top:6px}
/* 8-7 */
.res7{display:grid;grid-template-columns:18px 28px minmax(0,1fr) 130px 120px 36px;gap:14px;align-items:center;padding:11px 0;border-top:1px solid var(--line2);font-size:var(--fs-sm)}
.res7:first-of-type{border-top:none}
.res7 .rt{font-weight:500;line-height:1.4}
.res7.top .rt{font-weight:700}
.radio{width:18px;height:18px;border-radius:50%;border:1.5px solid #C9CADB;background:var(--panel)}
.radio.on{border:5px solid var(--key)}
.own{display:flex;align-items:center;gap:6px;font-size:var(--fs-cap);color:var(--muted);margin-top:3px;font-weight:400}
.own i{width:18px;height:18px;border-radius:50%;background:var(--key-100);color:var(--key-700);font-style:normal;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.res7 .vc{font-family:var(--mono);font-size:var(--fs-cap);color:var(--muted);text-align:right}
.res7.top .vc{color:var(--ink);font-weight:700}
.listh{display:flex;justify-content:space-between;font-size:var(--fs-cap);color:var(--faint);padding:14px 0 6px}
/* 9-1 역할 */
.topicbar{display:flex;align-items:center;gap:16px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 18px;flex:none}
.topicbar .l{font-size:var(--fs-cap);color:var(--faint);flex:none}
.topicbar b{font-size:var(--fs-h3);flex:1;min-width:0}
.topicbar .r{display:flex;align-items:center;gap:10px;font-size:var(--fs-cap);color:var(--muted);flex:none}
.roles{display:flex;flex-direction:column;gap:6px}
.rolesh{display:grid;grid-template-columns:200px 130px minmax(0,1fr) 160px;gap:14px;font-size:var(--fs-label);color:var(--faint);padding:0 16px 2px}
.rrow2{display:grid;grid-template-columns:200px 130px minmax(0,1fr) 160px;gap:14px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 16px;font-size:var(--fs-sm)}
.rrow2.mine{border-color:var(--key);box-shadow:inset 0 0 0 1px var(--key)}
.rrow2.empty{background:transparent;border-style:dashed;border-color:#C9CADB}
.rrow2 .rn{font-weight:700;font-size:var(--fs-body)}
.rrow2 .rd{font-size:var(--fs-cap);color:var(--muted);margin-top:1px}
.who2{display:flex;align-items:center;gap:8px}
.who2 small{font-size:var(--fs-label);color:var(--faint)}
.tags2{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.tags2 .ans{margin:0}
.tags2 .mnote{font-size:var(--fs-label);color:var(--key-700)}
.reqbox{font-size:var(--fs-cap);color:var(--ink);background:var(--soft);border-radius:8px;padding:5px 9px;margin-top:4px;width:100%}
.reqbox span{color:var(--muted);margin-right:4px}
.st2{display:flex;justify-content:flex-end;gap:6px;align-items:center}
.st2 .q{font-size:var(--fs-cap);color:var(--muted)}
.st2 .q2{font-size:var(--fs-cap);color:var(--faint)}
.emptytag{font-size:var(--fs-label);color:var(--bad);border:1px solid var(--bad-line);border-radius:5px;padding:1px 6px;background:var(--panel)}
.oll{margin:0;padding-left:18px;font-size:var(--fs-cap);color:var(--muted);line-height:1.75}
.oll b{color:var(--ink);font-weight:500}
/* 9-2 보고서 */
.rmeta{display:block;font-family:var(--mono);font-size:var(--fs-label);color:var(--faint);font-weight:400;letter-spacing:.02em;margin-bottom:4px}
.rep2{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}
.rep2 .sec:first-child{margin-top:0}
.kv2{display:grid;grid-template-columns:92px 1fr;gap:10px;padding:7px 0;border-top:1px solid var(--line2);font-size:var(--fs-sm);line-height:1.55}
.kv2>span{color:var(--muted);font-size:var(--fs-cap);padding-top:1px}
.kv2 .ans{margin-right:6px}
.rolet{display:grid;grid-template-columns:104px 76px 1fr;gap:10px;padding:7px 0;border-top:1px solid var(--line2);font-size:var(--fs-sm);align-items:center;line-height:1.45}
.rolet.h{font-size:var(--fs-label);color:var(--faint);padding-top:0}
.rolet .own{margin:0;color:var(--ink);font-size:var(--fs-sm)}
.qq{display:grid;grid-template-columns:22px 1fr;gap:8px;padding:7px 0;border-top:1px solid var(--line2);font-size:var(--fs-sm);line-height:1.5}
.qq i{font-style:normal;width:20px;height:20px;border-radius:6px;background:var(--key);color:#fff;font-family:var(--mono);font-size:var(--fs-label);display:flex;align-items:center;justify-content:center;margin-top:1px}
.qq small{display:block;font-size:var(--fs-label);color:var(--faint);margin-top:1px}
.vt3{display:grid;grid-template-columns:16px 1fr auto;gap:8px;font-size:var(--fs-sm);padding:4px 0}
.vt3 small{font-size:var(--fs-label);color:var(--faint)}
.vt3 b{font-family:var(--mono);font-size:var(--fs-cap)}
"""
CSS = CSS + DIV_CSS2
RBTN = '<span class="railbtn" title="목록 접기">«</span>'

def ri(t, s='', on=False, k=False, n=None):
    nn = f'<span class="n">{n}</span>' if n is not None else ''
    ss = f'<span class="s{" k" if k else ""}">{s}</span>' if s else ''
    return f'<div class="ri{" on" if on else ""}">{nn}<span class="t">{t}</span>{ss}</div>'

# 8-4 댓글
RAIL4 = ('<div class="rail">'
         '<div class="rgl">팀원 A</div>' + ri('열람실·카페 빈자리 지도', '완료', n=1) + ri('회의 후 할 일 정리 서비스', '완료', n=2) + ri('필기로 시험 예상 문제 만들기', '완료', n=3)
         + '<div class="rgl">팀원 B</div>' + ri('관심 있는 학교 소식만 골라 알려주는 웹', '작성 중', on=True, k=True, n=1) + ri('학과 안 중고 전공책 게시판', '완료', n=2) + ri('디자인 수정 요청 모아 보기', '아직', n=3)
         + '<div class="rgl">팀원 D</div>' + ri('동아리 굿즈 재고 관리', '아직', n=1) + ri('시간표 겹치는 스터디 모집', '아직', n=2) + ri('카페 콘센트 자리 알림', '아직', n=3)
         + '<div class="rmore" style="margin-top:6px">내 아이디어(팀원 C)는 목록에 없어요</div></div>')
DETAIL4 = (f'<div class="panel2 detail lift"><div class="dk">팀원 B의 1순위</div><div class="dt">학교 행사·특강 소식 중 관심 있는 것만 골라 알려주는 웹</div>'
           '<div class="cform">'
           '<div class="cf"><div class="cl">아쉬운 점 <small>필수</small></div><div class="ta focus">학교마다 공지 사이트가 달라서 자동으로 모으기 어려울 것 같아요. 처음엔 우리 학교 한 곳만 해야 할 듯해요</div><div class="hint3">어떤 점이 걸리는지, 어떻게 하면 나아질지</div></div>'
           '<div class="cf"><div class="cl">좋은 점 <small>선택 · 1개 남음</small></div><div class="ta ph">정말 좋다고 느낀 아이디어에만 써요</div><div class="hint3">한 사람당 2개까지 · 이미 쓴 곳: 팀원 A의 1순위</div></div>'
           '</div>'
           f'<div class="csave"><span class="quiet">{GLOCK}익명으로 저장돼요</span><button class="btn">댓글 저장</button></div>'
           '<div class="clist"><h6>먼저 남겨진 익명 댓글<small>아쉬운 점 2 · 좋은 점 1</small></h6>'
           '<div class="cm"><span>아쉬운 점</span>관심사를 처음에 고르는 게 귀찮을 수 있어요. 고르지 않아도 일단 보이게 하면 좋겠어요</div>'
           '<div class="cm"><span>아쉬운 점</span>에브리타임 공지 게시판과 겹칠 수 있어요</div>'
           '<div class="cm plus"><span>좋은 점</span>공지를 따로 찾아다닐 필요가 없어져요</div></div></div>')
DIV.append(dv('8-4', '발산 · 익명 댓글', '왼쪽 목록은 « 로 접을 수 있음 · 댓글 쓴 사람은 끝까지 익명', 35, '06:15', 3,
    '다른 팀원의 아이디어를 비판적으로 봐요', '아쉬운 점은 모든 아이디어에 꼭, 좋은 점은 정말 좋다고 느낀 2개에만 적어요.',
    f'<div class="focusgrid">{RBTN}{RAIL4}{DETAIL4}</div>',
    '<div class="counts"><span>아쉬운 점<b>4 / 9</b></span><span>좋은 점<b>1 / 2</b></span></div>'))

# 8-5 AI 검증 · 현실성
RAIL5 = ('<div class="rail">'
         f'<div class="rgl">{gradeh("go")}<small>4</small></div>' + ri('과제 공지와 마감을 한곳에 모아 알려주는 웹', on=True) + ri('학과 안 중고 전공책 게시판') + ri('회의 후 할 일 정리 서비스') + ri('관심 있는 학교 소식만 골라 알려주기')
         + f'<div class="rgl">{gradeh("fix")}<small>5</small></div>' + ri('열람실·카페 빈자리 지도') + ri('시간표 겹치는 스터디 모집') + ri('디자인 수정 요청 모아 보기') + '<div class="rmore">2개 더 보기</div>'
         + f'<div class="rgl">{gradeh("re")}<small>3</small></div>' + ri('강의자료 PDF 요약 도구') + '<div class="rmore">2개 더 보기</div>'
         + '<div class="rlegend">등급과 상관없이 12개 모두 투표에 올라가요</div></div>')
DETAIL5 = ('<div class="panel2 detail lift"><div class="dhead"><div><div class="dk">팀원 C의 1순위</div><div class="dt">과제 공지와 마감을 한곳에 모아 알려주는 웹</div></div>'
           + gradeh('go', True) + '</div><div style="margin-top:12px">'
           '<div class="qa"><b>이미 있는 서비스인가요?</b><div><span class="ans">비슷한 게 있음</span>일정 관리 앱은 많지만, 여러 곳의 학교 공지를 모아주는 건 드물어요. <a class="linkish">검색 결과 보기</a></div></div>'
           '<div class="qa"><b>우리 팀 구현 가능성</b><div><span class="ans">상</span>웹 화면 2명 · 백엔드 1명이 있어요. 학교 사이트 자동 연결 대신 링크를 붙여넣는 방식이면 지금 수준으로 충분해요.</div></div>'
           '<div class="qa"><b>필요한데 팀에 없는 스킬</b><div><span class="ans">1개</span>메일·LMS 자동 연동(API) 경험 — 없어도 시연은 돼요. 누가 배울지, 범위에서 뺄지는 파트를 나눌 때 정해요.</div></div>'
           '<div class="qa"><b>정말 필요한 사람이 있나요?</b><div><span class="ans">있음</span>인터뷰에서 2명이 공지를 놓쳐 마감을 넘긴 경험을 말했어요.</div></div>'
           '<div class="qa"><b>기간 안에 완성할 수 있나요?</b><div><span class="ans">가능</span>모으기·마감 알림만 하면 해커톤 기간 안에 시연할 수 있어요.</div></div>'
           '<div class="qa"><b>익명 댓글 요약</b><div>아쉬운 점 3 · 학교마다 공지 사이트가 달라요 · 알림이 많으면 귀찮아요<br>좋은 점 2 · 다들 겪는 문제라 공감이 커요 · 발표하기 쉬워요</div></div>'
           f'</div><div class="refnote">{SEARCH}<span>"이미 있는 서비스"는 실제 검색 결과가 근거예요. 구현 가능성은 팀원 프로필 스킬을 인원 수로만 봐요(이름은 AI에 보내지 않아요).</span></div></div>')
DIV.append(dv('8-5', '발산 · AI 검증 · 현실성', '구현 가능성 상/중/하 · 팀에 없는 스킬 · 등급이 낮아도 모두 투표에', 45, '03:00', 4,
    'AI가 아이디어 12개의 실효성과 현실성을 살펴봤어요', '참고용 판단이에요. 등급이 낮아도 빼지 않고 12개 모두 투표에 올라가요.',
    f'<div class="focusgrid">{RBTN}{RAIL5}{DETAIL5}</div>',
    '<span class="aside">모두가 보는 화면</span>'))

# 8-6 투표 — 레일은 등급을 점으로만
def rv(t, g, checked=False, on=False, mine=False, ai=False):
    tags = ('<small>내 아이디어</small>' if mine else '') + ('<span class="aitag">AI가 모음</span>' if ai else '')
    return (f'<div class="ri{" on" if on else ""}"><span class="cb{" on" if checked else ""}">{"✓" if checked else ""}</span>'
            f'<span class="gd {g}"></span><span class="t">{t}</span>{tags}</div>')
LEGEND = '<div class="rlegend"><span><i class="gd go"></i>바로 해볼 만해요</span><span><i class="gd fix"></i>보완</span><span><i class="gd re"></i>다시 생각</span></div>'
def rail6(sel):
    return ('<div class="rail">'
            '<div class="rgl">투표 후보<small>12</small></div>'
            + rv('과제 공지와 마감을 한곳에 모아 알려주는 웹', 'go', checked=True, mine=True)
            + rv('관심 있는 학교 행사·특강 소식만 골라 알려주는 웹', 'go')
            + rv('팀플 회의가 끝나면 할 일을 정리해 주는 서비스', 'go', on=(sel == 'idea'))
            + rv('중고 전공책을 같은 학과 안에서만 사고파는 게시판', 'go')
            + rv('열람실·카페 빈자리를 함께 알려주는 지도', 'fix')
            + rv('강의자료 PDF를 요약해 주는 브라우저 도구', 're', mine=True)
            + '<div class="rmore">6개 더 보기</div>'
            '<div class="rgl">AI가 좋은 점을 모아본 아이디어<small>2</small></div>'
            + rv('시험기간에만 여는 열람실·카페 빈자리·콘센트 제보판', 'go', on=(sel == 'ai'), ai=True)
            + rv('팀플 자료·수정 요청을 링크 하나에 모으고 바뀐 점만 요약', 'fix', ai=True)
            + '<div class="rgl">투표 참고 · 숨은 공통점<small>선택지 아님</small></div>'
            + ri('"누가 무엇을 했는지"가 한곳에 안 남아요', '후보 4', on=(sel == 'common'), n=1)
            + ri('알림이 너무 많아 중요한 걸 놓쳐요', '후보 2', n=2)
            + ri('AI는 넣고 싶지만 무거운 서버는 피하고 싶어요', '후보 2', n=3)
            + LEGEND + '</div>')
VOTE_H = ('우리 팀이 해보고 싶은 아이디어에 투표해 주세요', '한 사람당 2표예요. 누가 어디에 투표했는지는 끝까지 공개되지 않아요.')
VOTE_ASIDE = '<span class="aside" style="display:flex;align-items:center;gap:12px">남은 표<span class="dots3"><i></i><i class="e"></i></span><button class="btn ghost sm" style="margin-left:8px">투표 마치기</button></span>'

DETAIL6 = ('<div class="panel2 detail lift"><div class="dhead"><div><div class="dk">팀원 A의 2순위</div><div class="dt">팀플 회의가 끝나면 할 일을 정리해 주는 서비스</div></div>'
           + gradeh('go', True) + '</div>'
           '<div class="sech"><b>처음 적은 내용</b></div><div class="orig">회의 메모나 녹음을 올리면 누가 언제까지 뭘 해야 하는지 정리해서 단톡방에 보내주는 서비스</div>'
           '<div class="sech"><b>AI 검증</b>참고용</div>'
           '<div class="qa tight"><b>이미 있나요?</b><div><span class="ans">비슷한 게 있음</span>회의록 AI는 많지만 대학 팀플·단톡 공유에 맞춘 건 드물어요. <a class="linkish">검색 결과 보기</a></div></div>'
           '<div class="qa tight"><b>구현 가능성</b><div><span class="ans">상</span>텍스트 메모부터 시작하면 돼요. 녹음 변환은 나중으로 미루길 권해요.</div></div>'
           '<div class="qa tight"><b>필요한가요?</b><div><span class="ans">있음</span>인터뷰에서 3명이 비슷한 경험을 말했어요.</div></div>'
           '<div class="qa tight"><b>기간 안에 되나요?</b><div><span class="ans">가능</span>메모 입력과 할 일 정리 화면만 하면 시연할 수 있어요.</div></div>'
           '<div class="sech"><b>익명 댓글</b>아쉬운 점 3 · 좋은 점 2</div>'
           '<div class="cm"><span>아쉬운 점</span>회의 메모를 누가 정리해서 올릴지가 또 문제예요</div>'
           '<div class="cm"><span>아쉬운 점</span>할 일을 잘못 뽑으면 오히려 헷갈릴 것 같아요</div>'
           '<div class="cm plus"><span>좋은 점</span>팀플마다 겪는 문제라 발표할 때 공감을 얻기 쉬워요</div>'
           '<div class="dfoot2"><span class="quiet">투표한 사람 3 / 4 · 모두 투표하면 결과가 열려요</span><button class="btn">이 아이디어에 투표</button></div></div>')
DIV.append(dv('8-6', '발산 · 투표', '목록의 등급은 점만 (아래 범례) · « 로 목록 접기', 55, '02:10', 5,
    VOTE_H[0], VOTE_H[1], f'<div class="focusgrid">{RBTN}{rail6("idea")}{DETAIL6}</div>', VOTE_ASIDE))
DIV.append(dv('8-6′', '발산 · 투표 — 목록 접은 상태', '« 를 누르면 목록이 숨고 본문이 가운데로 · » 목록 버튼으로 다시 열기', 55, '02:05', 5,
    VOTE_H[0], VOTE_H[1], f'<div class="focusgrid closed"><span class="railbtn" title="목록 열기">» 목록</span>{DETAIL6}</div>', VOTE_ASIDE))

DETAIL6B = ('<div class="panel2 detail lift"><div class="dhead"><div><div class="dk key">AI가 좋은 점을 모아본 아이디어</div><div class="dt">시험기간에만 여는 열람실·카페 빈자리·콘센트 제보판</div></div>'
            + gradeh('go', True) + '</div>'
            '<div class="sec"><h6>어떤 아이디어에서 좋은 점을 가져왔나요</h6><div class="srcs">'
            f'<div class="src"><div class="m">팀원 A의 1순위 · {gradeh("fix")}</div><div class="tt">열람실·카페 빈자리를 함께 알려주는 지도</div><div class="g"><span>가져온 점</span>시험기간엔 누구나 겪는 문제라 공감이 커요</div></div>'
            f'<div class="src"><div class="m">팀원 D의 3순위 · {gradeh("re")}</div><div class="tt">학교 앞 카페 콘센트 자리 알림</div><div class="g"><span>가져온 점</span>콘센트 자리는 실제로 다들 찾아다녀요</div></div>'
            '</div></div>'
            '<div class="sec"><h6>원래 아이디어의 아쉬운 점은 이렇게 줄였어요</h6>'
            '<div class="fixrow"><span class="p">실시간 정보가 틀릴 수 있어요<small>아쉬운 점 3</small></span><span class="a">→</span><span>제보 시간과 "지금도 맞아요" 확인 수를 같이 보여주기</span></div>'
            '<div class="fixrow"><span class="p">평소엔 쓸 일이 별로 없어요<small>아쉬운 점 2</small></span><span class="a">→</span><span>시험기간 2주만 여는 서비스로 범위 줄이기</span></div></div>'
            '<div class="sec"><h6>AI 검증<small>참고용 · 새로 만든 아이디어로 다시 검증했어요</small></h6><div class="vgrid">'
            '<div><b>이미 있나요?</b><span class="ans">비슷한 게 있음</span><a class="linkish">검색 결과</a></div>'
            '<div><b>구현 가능성</b><span class="ans">상</span>장소 목록 + 제보 버튼</div>'
            '<div><b>필요한가요?</b><span class="ans">있음</span>원래 두 아이디어의 좋은 점 3개</div>'
            '<div><b>기간 안에 되나요?</b><span class="ans">가능</span>제보·확인 두 기능</div>'
            '</div></div>'
            '<div class="dfoot2"><span class="quiet">새로 만든 아이디어라 댓글은 없어요 · 똑같이 1표로 세고, 뽑히면 결과에 "AI가 모음"으로 표시돼요</span><button class="btn">이 아이디어에 투표</button></div></div>')
DIV.append(dv('8-6b', '발산 · 투표 — AI가 모은 아이디어', '"AI가 모음" 항상 표시 · 어디서 좋은 점을 가져왔고 아쉬운 점을 어떻게 줄였는지 공개', 55, '01:55', 5,
    VOTE_H[0], VOTE_H[1], f'<div class="focusgrid">{RBTN}{rail6("ai")}{DETAIL6B}</div>', VOTE_ASIDE))

DETAIL6C = ('<div class="panel2 detail lift"><div class="dhead"><div><div class="dk">투표 참고 · 숨은 공통점 1</div><div class="dt">팀플에서 "누가 무엇을 했는지"가 한곳에 남지 않아요</div></div>'
            f'<span class="quiet" style="flex:none">{GLOCK}내 답도 들어 있어요 · 나만 보임</span></div>'
            '<div class="sec"><h6>어디서 나왔나요<small>3명의 답 · 인터뷰 재료 요약 · 원문 인용 없음</small></h6>'
            '<div class="from"><span>질문 1 · 불편</span>과제 공지가 메일·LMS·단톡으로 흩어져 마감을 놓침</div>'
            '<div class="from"><span>질문 1 · 불편</span>팀플 회비를 누가 냈는지 헷갈림</div>'
            '<div class="from"><span>질문 4 · 쓰는 서비스</span>피그마 수정 내역을 추적하기 어렵고, 노션엔 팀원이 잘 안 들어옴</div></div>'
            '<div class="sec"><h6>왜 따로 보면 안 보였나요</h6><p class="t-sm muted" style="line-height:1.65">세 재료는 서로 다른 묶음(흩어진 학교 정보 · 돈·정산 · 팀의 조건)에 있었어요. 겉은 달라도 모두 "기록이 한곳에 없다"는 같은 문제예요.</p></div>'
            '<div class="sec"><h6>이 공통점과 이어지는 후보 4개<small>같은 문제를 푸는 방향일 뿐, 추천 순서가 아니에요</small></h6><div class="crows">'
            f'<div class="crow"><span class="cb on">✓</span><span class="t">과제 공지와 마감을 한곳에 모아 알려주는 웹 <small>내 아이디어</small></span>{gradeh("go")}</div>'
            f'<div class="crow"><span class="cb"></span><span class="t">팀플 회의가 끝나면 할 일을 정리해 주는 서비스</span>{gradeh("go")}</div>'
            f'<div class="crow"><span class="cb"></span><span class="t">디자인 수정 요청을 한 화면에 모아 보는 팀플 도구</span>{gradeh("fix")}</div>'
            f'<div class="crow"><span class="cb"></span><span class="t">팀플 자료·수정 요청을 링크 하나에 모으고 바뀐 점만 요약 <span class="aitag">AI가 모음</span></span>{gradeh("fix")}</div>'
            '</div></div>'
            '<div class="dfoot2"><span class="quiet">투표 선택지가 아니에요 · AI가 찾은 연결이라 틀릴 수 있어요</span>'
            '<span style="display:flex;align-items:center;gap:8px"><span class="t-cap muted">이 연결, 알고 있었나요?</span><span class="rbtn on">몰랐어요</span><span class="rbtn">이미 알았어요</span></span></div></div>')
DIV.append(dv('8-6c', '발산 · 투표 — 숨은 공통점 (참고)', '아이디어를 다 낸 뒤 투표 때만 공개 · 선택지 아님 · 누가 말했는지 비공개', 55, '01:40', 5,
    VOTE_H[0], VOTE_H[1], f'<div class="focusgrid">{RBTN}{rail6("common")}{DETAIL6C}</div>', VOTE_ASIDE))

# 8-6w 투표 마침 · 결과 기다리기 — 대기실(6)과 같은 틀 (2026-09-18 추가)
DIV.append(dv('8-6w', '발산 · 투표 마침 — 결과 기다리기', '대기실(6)과 같은 틀 · 모두 마치면 자동으로 결과(8-7)로 · 진행자도 같은 화면', 55, '01:40', 5,
    '투표를 마쳤어요', '모두 투표하면 결과가 열려요. 잠시만 기다려 주세요.',
    '<div class="center" style="flex:1;display:flex;align-items:center;justify-content:center"><div class="panel" style="text-align:center;max-width:520px">'
    '<div class="avatar" style="width:72px;height:72px;font-size:var(--fs-h1);margin:0 auto 14px">✓</div>'
    '<p class="lead">내 표는 저장됐어요</p><p class="hint">누가 어디에 투표했는지는 공개되지 않아요</p>'
    '<div class="muted t-sm wait-count" style="margin-top:18px">현재 <b style="color:var(--key)">3 / 4</b>명 투표 완료</div>'
    '<div class="quiet" style="margin-top:8px">모두 마치면 결과 화면으로 자동 이동해요 · 진행자가 먼저 넘길 수도 있어요</div>'
    '</div></div>'))

# 8-7 결과 · 주제 확정 · 아이디어 주인 공개
def own(name, text):
    return f'<div class="own"><i>{name[0]}</i>{text}</div>'
RES7 = [(1, '과제 공지와 마감을 한곳에 모아 알려주는 웹', own('노형원', '노형원 님의 1순위'), 'go', 3),
        (2, '관심 있는 학교 행사·특강 소식만 골라 알려주는 웹', own('김승희', '김승희 님의 1순위'), 'go', 2),
        (3, '팀플 회의가 끝나면 할 일을 정리해 주는 서비스', own('이세민', '이세민 님의 2순위'), 'go', 1),
        (3, '시험기간에만 여는 열람실·카페 빈자리·콘센트 제보판', '<div class="own"><span class="aitag">AI가 모음</span>이세민 님 1순위 · 박상진 님 3순위의 좋은 점</div>', 'go', 1),
        (3, '중고 전공책을 같은 학과 안에서만 사고파는 게시판', own('김승희', '김승희 님의 2순위'), 'go', 1)]
rres7 = ''.join(f'<div class="res7{" top" if r <= 2 else ""}"><span class="radio{" on" if i == 0 else ""}"></span><span class="num{" n1" if r == 1 else ""}">{r}</span>'
                f'<div><div class="rt">{t}</div>{o}</div>{gradeh(g)}<div class="vbar"><i style="width:{round(v * 100 / 3)}%"></i></div><span class="vc">{v}표</span></div>'
                for i, (r, t, o, g, v) in enumerate(RES7))
DIV.append(dv('8-7', '발산 · 투표 결과 · 주제 확정 (진행자)', '이때 아이디어 주인만 공개 · 댓글 쓴 사람·투표한 곳은 끝까지 익명 · 확정할 주제 선택', 65, '00:45', 6,
    '투표 결과가 나왔어요. 이제 아이디어 주인을 공개해요', '4명이 8표를 썼어요. 확정할 주제를 고르면 파트 나누기로 넘어가요.',
    '<div class="two" style="grid-template-columns:minmax(0,1fr) 320px">'
    f'<div class="panel2 detail lift" style="padding:0 22px 14px"><div class="listh"><span>확정할 주제를 골라주세요 · 기본은 1위</span><span>표 수</span></div>{rres7}'
    '<div class="more" style="margin-top:8px;padding:0">표를 받지 못한 아이디어 9개도 주인과 함께 기록에 남아요</div>'
    f'<div class="lockline" style="margin-top:auto;padding-top:10px">{GLOCK}아이디어 주인만 공개했어요. 댓글 쓴 사람과 누가 어디에 투표했는지는 끝까지 익명이에요.</div></div>'
    '<div style="display:flex;flex-direction:column;gap:12px">'
    '<div class="sc2"><h4>1위와 "회의 후 할 일 정리"는 같은 숨은 공통점에서 나왔어요</h4><p>둘 다 팀플에서 "누가 무엇을 했는지"가 한곳에 남지 않는 문제를 풀어요. 파트를 나눌 때 할 일 정리 기능을 범위에 넣을지 이야기해 보세요.</p><p style="margin-top:6px;color:var(--faint)">숨은 공통점 1 · 참고용 · 합칠지는 팀이 정해요</p></div>'
    '<div class="sc2"><h4>팀장 정하기</h4><p>파트 배치를 고치고 확정할 사람이에요. 안 고르면 진행자가 팀장이에요.</p>'
    '<div class="sel9" style="margin-top:8px"><span class="av9">노</span>노형원 (진행자)<span style="margin-left:auto;color:var(--faint)">▾</span></div></div>'
    '<div class="sc2"><h4>동점이 있을 때</h4><p>3위 동점 3개는 그대로 두거나, 한 번 더 투표를 열 수 있어요. 다시 투표해도 누가 어디에 투표했는지는 익명이에요.</p><button class="btn ghost sm" style="margin-top:10px;width:100%">동점만 다시 투표</button></div>'
    '<p class="note" style="margin-top:auto">확정하면 모두의 화면이 파트 나누기로 넘어가요.</p>'
    '<button class="btn block lg">1위로 확정하고 파트 나누기 →</button></div></div>',
    host=True))

# ───── 9 파트 나누기 · 배치 · 보고서 (v14) ─────
NINE_CSS = r"""
.p9grid{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px}
.p9main{display:flex;flex-direction:column;gap:12px;min-height:0}
.p9side{display:flex;flex-direction:column;gap:12px;min-height:0}
.p9side .sc2 p b{color:var(--ink);font-weight:500}
.sc2.me9{border-color:var(--key);box-shadow:inset 0 0 0 1px var(--key)}
.sc2.warn9{border-color:var(--key-300);box-shadow:inset 0 0 0 1px var(--key-300);background:var(--key-50)}
.p9top{display:flex;align-items:center;gap:14px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px 18px;flex:none}
.p9top .l{font-size:var(--fs-cap);color:var(--faint);flex:none}
.p9top b{font-size:var(--fs-h3);flex:1;min-width:0}
.p9top .r{font-size:var(--fs-cap);color:var(--muted);display:flex;gap:10px;align-items:center;flex:none}
.ptab{overflow:hidden;display:flex;flex-direction:column;flex:1;min-height:0}
.ph9,.pr9{display:grid;grid-template-columns:var(--cols);gap:16px;align-items:center;padding:0 20px}
.ph9{font-size:var(--fs-label);color:var(--faint);background:var(--soft);border-bottom:1px solid var(--line2);height:32px;flex:none}
.pg9{font-size:var(--fs-label);color:var(--muted);font-weight:700;padding:8px 20px 2px;flex:none}
.ptab.roomy .pr9{min-height:48px}
.ptab.roomy .pg9{padding:12px 20px 4px}
.pr9{min-height:36px;border-top:1px solid var(--line2);font-size:var(--fs-sm);flex:none}
.pg9+.pr9,.pg9+.sm9{border-top:none}
.pr9 .pn{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pr9 .pn small{font-weight:400;color:var(--faint);font-size:var(--fs-cap);margin-left:8px}
.pr9 .pn .mk{margin-left:8px}
.pr9.out{background:var(--soft)}
.pr9.out .pn{color:var(--muted)}
.pr9.chg{background:var(--key-50);box-shadow:inset 3px 0 0 var(--key)}
.sm9{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--line2);flex:none}
.sm9>div{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;min-height:36px;padding:0 20px;font-size:var(--fs-sm)}
.sm9>div:nth-child(2n){border-left:1px solid var(--line2)}
.sm9>div:nth-child(n+3){border-top:1px solid var(--line2)}
.skl{font-size:var(--fs-cap);color:var(--muted)}
.av9{width:22px;height:22px;border-radius:50%;background:var(--key-100);color:var(--key-700);font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:none;font-style:normal}
.who9{display:flex;align-items:center;gap:7px;white-space:nowrap}
.cand{display:flex;align-items:center;gap:6px;white-space:nowrap}
.pill9{font-size:var(--fs-label);border-radius:999px;padding:1px 8px;white-space:nowrap;border:1px solid var(--line);color:var(--muted);background:var(--panel);font-weight:500}
.pill9.k{color:var(--key-700);border-color:var(--key-200);background:var(--key-50)}
.pill9.w{color:var(--key-800);border-color:var(--key-300);background:var(--key-100)}
.pill9.solid{color:#fff;border-color:var(--key-700);background:var(--key-700)}
.q9{font-size:var(--fs-cap);color:var(--faint);white-space:nowrap}
.bad9{font-size:var(--fs-cap);color:var(--bad);white-space:nowrap}
.mine9{display:flex;align-items:center;gap:8px;font-size:var(--fs-sm);padding:3px 0}
.mine9 .pill9{min-width:58px;text-align:center}
.load9{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;flex:none}
.lc{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px 14px}
.lc.me{border-color:var(--key);box-shadow:inset 0 0 0 1px var(--key)}
.lc .n{display:flex;align-items:center;gap:7px;font-size:var(--fs-sm);font-weight:700}
.lc .n small{font-weight:400;color:var(--faint);font-size:var(--fs-cap)}
.lc .n .pill9{margin-left:auto}
.lc .bar{height:6px;border-radius:99px;background:var(--line2);margin:8px 0 5px;overflow:hidden}
.lc .bar i{display:block;height:100%;border-radius:99px;background:var(--key-300)}
.lc.over{border-color:var(--key-300)}
.lc.over .bar i{background:var(--key-700)}
.lc .c{font-size:var(--fs-label);color:var(--muted)}
.sel9{display:flex;align-items:center;gap:7px;height:28px;border:1px solid var(--line);border-radius:8px;padding:0 9px 0 4px;background:var(--panel);font-size:var(--fs-sm);white-space:nowrap}
.sel9::after{content:'▾';margin-left:auto;color:var(--faint);font-size:10px;padding-left:6px}
.sel9.chg{border-color:var(--key);box-shadow:0 0 0 2px var(--key-100)}
.sug9{display:flex;gap:8px;align-items:flex-start;font-size:var(--fs-cap);color:var(--ink);background:var(--panel);border-radius:8px;padding:7px 10px;margin-top:8px;line-height:1.5}
.btn2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.chgl{display:flex;align-items:flex-start;gap:8px;font-size:var(--fs-cap);color:var(--ink);padding:3px 0;line-height:1.5}
.chgl .pill9{flex:none}
/* 9-2 질문 */
.qpanel{flex:1;min-height:0;display:flex;flex-direction:column;padding:16px 24px 16px}
.qtabs{display:flex;align-items:center;gap:8px;padding-bottom:12px;border-bottom:1px solid var(--line2);flex:none}
.qtab{font-size:var(--fs-sm);border:1px solid var(--line);border-radius:999px;padding:5px 12px;color:var(--muted);white-space:nowrap}
.qtab.on{background:var(--ink);border-color:var(--ink);color:#fff;font-weight:500}
.qtabs .q9{margin-left:auto}
.qh{display:flex;gap:10px;align-items:baseline;font-size:var(--fs-body);font-weight:700;margin:14px 0 10px}
.qh i{font-style:normal;font-family:var(--mono);font-size:var(--fs-label);color:var(--key);font-weight:700}
.opts9{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.opt9{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:10px;padding:9px 14px;font-size:var(--fs-sm);background:var(--panel)}
.opt9.on{border-color:var(--key);box-shadow:inset 0 0 0 1px var(--key);font-weight:500}
.sub9{font-size:var(--fs-cap);color:var(--muted);margin:12px 0 6px}
.ctx9{font-size:var(--fs-cap);color:var(--muted);background:var(--soft);border-radius:8px;padding:8px 12px;margin-bottom:8px}
.ctx9 b{color:var(--ink);font-weight:500}
.ta9{border:1px solid var(--line);border-radius:10px;padding:10px 14px;font-size:var(--fs-sm);line-height:1.7;background:var(--panel)}
.ta9.focus{border:2px solid var(--key);box-shadow:0 0 0 3px var(--key-100);padding:9px 13px}
.qfoot{margin-top:auto;padding-top:12px;border-top:1px solid var(--line2);display:flex;justify-content:space-between;align-items:center;gap:16px;flex:none}
/* 9-5 보고서 */
.rep5{display:grid;grid-template-columns:1.15fr 1fr .9fr;flex:none}
.rep5>div{padding:14px 20px}
.rep5>div+div{border-left:1px solid var(--line2)}
.rep5 h6,.wf h6{margin:0 0 6px;font-size:var(--fs-sm);font-weight:700}
.kv5{display:grid;grid-template-columns:78px 1fr;gap:8px;padding:5px 0;font-size:var(--fs-cap);line-height:1.5;border-top:1px solid var(--line2)}
.kv5:first-of-type{border-top:none}
.kv5>span{color:var(--muted)}
.kv5 b{font-weight:500}
.vt5{display:grid;grid-template-columns:14px 1fr auto;gap:8px;font-size:var(--fs-cap);padding:4px 0;align-items:baseline}
.vt5 i{font-style:normal;font-family:var(--mono);color:var(--faint);font-size:var(--fs-label)}
.vt5 small{color:var(--faint);font-size:var(--fs-label);margin-left:4px}
.vt5 b{font-family:var(--mono);font-size:var(--fs-label)}
.wf{flex:1;min-height:0;display:flex;flex-direction:column;padding:14px 20px 12px}
.wf .wh{display:flex;align-items:baseline;gap:10px;flex:none}
.wf .wh small{font-size:var(--fs-cap);color:var(--faint)}
.wcols{display:grid;grid-template-columns:repeat(4,1fr);margin-top:10px;flex:1;min-height:0}
.ws{padding:0 14px;display:flex;flex-direction:column}
.ws:first-child{padding-left:0}
.ws:last-child{padding-right:0}
.ws+.ws{border-left:1px solid var(--line2)}
.wsh{display:flex;align-items:center;gap:8px;font-size:var(--fs-sm);font-weight:700;height:24px}
.wsh .num{width:20px;height:20px;font-size:var(--fs-label)}
.wsh .pill9{margin-left:auto}
.wmk{font-size:var(--fs-cap);color:var(--muted);margin:4px 0 6px;line-height:1.45;min-height:34px}
.wmk span{color:var(--faint);margin-right:4px}
.wp{display:grid;grid-template-columns:22px 1fr;gap:8px;padding:6px 0;border-top:1px solid var(--line2)}
.wp b{font-size:var(--fs-cap);font-weight:700;display:flex;align-items:center;gap:6px}
.wp p{font-size:var(--fs-cap);color:var(--muted);line-height:1.4;margin:1px 0 0}
.lead9{font-size:var(--fs-label);color:var(--key-700);font-weight:500}
.wpass{margin-top:auto;min-height:40px;font-size:var(--fs-label);color:var(--muted);padding-top:6px;border-top:1px dashed var(--line);line-height:1.45}
.wpass span{color:var(--faint);margin-right:4px}
.wfoot{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:10px;padding-top:8px;border-top:1px solid var(--line2);font-size:var(--fs-cap);color:var(--muted);flex:none}
.wfoot b{color:var(--ink);font-weight:500}
"""
CSS = CSS + NINE_CSS

FIN = ['주제 확정', '파트 나누기', '겹친 후보 질문', '배치 초안', '팀장 확정', '보고서']
def steps2(cur):
    out = []
    for i, n in enumerate(FIN, 1):
        cls = 'done' if i < cur else ('cur' if i == cur else '')
        out.append(f'<span class="ds {cls}"><i>{i}</i>{n}</span>')
    return '<div class="dsteps">' + '<b class="dl"></b>'.join(out) + '</div>'
def dv2(num, title, desc, pct, timer, step, h, sub, body, aside='', badge='팀원 화면', who='노형원'):
    bar = ibar('파트 나누기 · 보고서', pct, timer, who=who).replace('>참가자 화면<', f'>{badge}<')
    return screen(num, title, desc, f'''{bar}
<div class="dvp">{steps2(step)}
  <div class="dvh"><div><h3>{h}</h3><p>{sub}</p></div>{aside}</div>
  {body}
</div>''')

def av(n): return f'<i class="av9">{n[0]}</i>'
def who9(n, me=False): return f'<span class="who9">{av(n)}{n}{" <span class=q9>(나)</span>" if me else ""}</span>'
TOPIC9 = ('<div class="p9top"><span class="l">확정된 주제</span><b>과제 공지와 마감을 한곳에 모아 알려주는 웹</b>'
          '<span class="r">노형원 님의 1순위 · 3표<span class="pill9">구현 가능성 상</span></span></div>')

NDIV = []

# 9-1 파트 나누기
def pr1(name, desc, skill, cand, cls=''):
    return f'<div class="pr9 {cls}"><span class="pn">{name}<small>{desc}</small></span><span class="skl">{skill}</span><span class="cand">{cand}</span></div>'
OVER = '<span class="pill9 k">겹침 · 추가 질문</span>'
ONE = '<span class="q9">1명 · 바로 배정</span>'
T1 = ('<div class="panel2 ptab roomy" style="--cols:minmax(0,1fr) 120px 250px">'
      '<div class="ph9"><span>파트 · 하는 일</span><span>필요한 스킬</span><span>후보 (프로필 기준)</span></div>'
      '<div class="pg9">결과를 좌우하는 파트</div>'
      + pr1('화면 만들기', '공지 목록 · 마감 알림 화면', '프론트엔드', av('노형원') + av('이세민') + OVER)
      + pr1('서버 · 공지 모으기', '게시판 글 가져오기 · 알림 보내기', '백엔드', av('박상진') + ONE)
      + pr1('발표 · 시연', '문제 정의 · 시연 흐름 · 질의응답', '발표·피칭', av('노형원') + av('이세민') + OVER)
      + '<div class="pg9">보통 파트</div>'
      + pr1('화면 디자인', '화면 분위기 · 컴포넌트 스타일', '웹 디자인', av('이세민') + av('김승희') + OVER)
      + pr1('발표 자료', '장표 구성 · 시각화', 'PPT 디자인', av('김승희') + ONE)
      + pr1('기획 · 범위 관리', '기능 범위 · 진행 조율', '서비스 기획', av('노형원') + ONE)
      + pr1('메일·LMS 자동 연동', 'AI 검증에서 나온 팀에 없는 스킬', '외부 API 연동', '<span class="bad9">후보 없음</span><span class="q9">→ 링크 붙여넣기로 대신하기 제안</span>', 'out')
      + '<div class="pg9">작은 일 · 스킬 없이 누구나</div>'
      + pr1('작은 일 6개', '경쟁 서비스 조사 · 예시 공지 · 기능 테스트 · 인터뷰 · 제출 문서 · 회의록', '누구나', '<span class="q9">분량이 비슷해지게 나눠요</span>')
      + '</div>')
S1 = ('<div class="p9side">'
      '<div class="sc2 me9"><h4>내가 후보인 파트</h4>'
      '<div class="mine9"><span class="pill9 k">겹침</span>화면 만들기</div>'
      '<div class="mine9"><span class="pill9 k">겹침</span>발표 · 시연</div>'
      '<div class="mine9"><span class="pill9">바로 배정</span>기획 · 범위 관리</div>'
      '<p style="margin-top:6px">겹친 2개는 다음 화면에서 질문 2개씩 드려요. 다른 사람은 이 화면에서 바로 배치로 넘어가요.</p></div>'
      '<div class="sc2"><h4>이렇게 맡겨요</h4><ol class="oll">'
      '<li>파트마다 <b>가장 잘할 사람</b>이 맡아요. 원하는 역할보다 실력이 먼저예요</li>'
      '<li>후보가 겹치면 <b>그 사람들에게만</b> 추가 질문으로 가려요</li>'
      '<li>중요한 파트가 한 사람에게 <b>몰려도 괜찮아요</b></li>'
      '<li>대신 <b>작은 일</b>을 나머지 사람에게 나눠, 모두 <b>비슷한 분량</b>이 되게 해요</li>'
      '<li>AI 배치는 초안이고, <b>확정은 팀장</b>이 해요</li></ol></div>'
      '<p class="note" style="margin-top:auto">프로필의 "할 수 있는 것"으로만 찾았어요. 이름은 AI에 보내지 않아요.</p>'
      '</div>')
NDIV.append(dv2('9-1', '파트 나누기 — 후보 찾기', '주제를 파트로 나누고 프로필 스킬로 후보 · 겹친 파트만 추가 질문 · 팀에 없는 스킬은 "후보 없음"', 70, '09:30', 2,
    '주제를 파트로 나누고, 파트마다 맡을 수 있는 사람을 찾았어요',
    '프로필 스킬로 파트마다 후보를 찾았어요. 후보가 겹친 파트는 그 사람들에게만 추가 질문을 해서 정해요.',
    f'<div class="p9grid"><div class="p9main">{TOPIC9}{T1}</div>{S1}</div>'))

# 9-2 겹친 후보 질문
Q2 = ('<div class="panel2 detail lift qpanel">'
      '<div class="qtabs"><span class="qtab on">화면 만들기 · 답하는 중</span><span class="qtab">발표 · 시연 · 다음</span><span class="q9">다른 후보 1명도 같은 질문에 답하고 있어요</span></div>'
      '<div class="qh"><i>Q1</i>비슷한 화면을 끝까지 만들어 본 적 있나요?</div>'
      '<div class="opts9">'
      '<div class="opt9"><span class="radio"></span>아직 없어요</div>'
      '<div class="opt9"><span class="radio"></span>수업·튜토리얼로 따라 만들어 봤어요</div>'
      '<div class="opt9"><span class="radio"></span>혼자 기능 있는 화면을 완성해 봤어요</div>'
      '<div class="opt9 on"><span class="radio on"></span>팀 프로젝트에서 화면 파트를 맡아 완성했어요</div></div>'
      '<div class="sub9">무엇을, 어떤 기술로 만들었는지 한 줄</div>'
      '<div class="inp">동아리 행사 신청 웹 · React · 목록 필터와 마감 표시를 맡음</div>'
      '<div class="qh" style="margin-top:18px"><i>Q2</i>이 파트에서 제일 까다로운 부분을 어떻게 만들지 3줄로 적어주세요</div>'
      '<div class="ctx9">여러 곳에서 모은 공지를 <b>한 목록에 마감 가까운 순</b>으로 보여주고, <b>마감 하루 전</b>인 건 눈에 띄게 표시하기</div>'
      '<div class="ta9 focus">공지마다 마감일을 날짜 값으로 저장해 두고 목록을 마감순으로 정렬해요.<br>오늘과 하루 이하로 남았으면 배지를 붙여요.<br>마감일이 없는 공지는 맨 아래 \'마감 없음\'으로 따로 묶어요.</div>'
      '<div class="sub9" style="margin:6px 0 0;color:var(--faint)">정답을 맞히는 문제가 아니에요. 얼마나 구체적으로 그려지는지를 봐요.</div>'
      f'<div class="qfoot"><span class="quiet">{GLOCK}답은 나와 AI만 봐요. 다른 후보의 답도 볼 수 없어요.</span><button class="btn">답 제출하고 다음 파트로</button></div>'
      '</div>')
S2 = ('<div class="p9side">'
      '<div class="sc2"><h4>왜 물어보나요?</h4><p>프로필에는 "프론트엔드 할 수 있음"만 있어서, 후보 두 명 중 누가 이 파트를 <b>더 잘할지</b> 알 수 없어요. 결과를 가장 잘 낼 사람에게 맡기려고 <b>겹친 사람에게만</b> 물어봐요.</p></div>'
      '<div class="sc2"><h4>이렇게 판단해요</h4><ol class="oll"><li><b>끝까지 완성해 본 경험</b>이 있는지</li><li>까다로운 부분의 방법이 <b>구체적인지</b></li></ol></div>'
      '<div class="sc2"><h4>결과는 이렇게만 보여요</h4><p>배치표에는 "추가 질문으로 정했어요"라고만 나와요. <b>점수나 누가 더 못했는지는 공개하지 않아요.</b></p></div>'
      '<p class="note" style="margin-top:auto">AI 판단이라 틀릴 수 있어요. 배치는 초안이라 회의에서 이야기해 팀장이 바꿀 수 있어요.</p>'
      '</div>')
NDIV.append(dv2('9-2', '겹친 후보 질문 — 후보가 겹친 사람만', '파트마다 질문 2개 · 약 2분 · 답은 나와 AI만 · 결과는 "추가 질문으로 정했어요"만 공개', 75, '08:10', 3,
    '두 파트에 후보가 겹쳐서, 조금만 더 물어볼게요',
    '결과를 가장 잘 낼 사람에게 맡기려고 해요. 파트마다 질문 2개, 2분이면 끝나요.',
    f'<div class="p9grid">{Q2}{S2}</div>',
    '<span class="aside">파트 1 / 2</span>', badge='후보가 겹친 사람만'))

# 9-3 배치 초안
def lc(n, pct, c, me=False, over=False, tag=''):
    return (f'<div class="lc{" me" if me else ""}{" over" if over else ""}"><div class="n">{av(n)}{n}{" <small>(나)</small>" if me else ""}{tag}</div>'
            f'<div class="bar"><i style="width:{pct}%"></i></div><div class="c">{c}</div></div>')
def pr3(name, person, method, cls=''):
    return f'<div class="pr9 {cls}"><span class="pn">{name}</span>{person}<span class="cand">{method}</span></div>'
QM = '<span class="pill9 k">추가 질문으로 정했어요</span>'
def one(s): return f'<span class="q9">후보 1명 · {s}</span>'
SMALL3 = [('경쟁 서비스 조사', '이세민'), ('사용자 인터뷰 3명', '김승희'), ('시연용 예시 공지 만들기', '이세민'),
          ('제출 문서 · 보고서 정리', '김승희'), ('기능 테스트 · 버그 기록', '이세민'), ('회의록 · 일정 챙기기', '박상진')]
T3 = ('<div class="panel2 ptab" style="--cols:minmax(0,1fr) 150px 250px">'
      '<div class="ph9"><span>파트</span><span>맡은 사람</span><span>정한 방법</span></div>'
      '<div class="pg9">결과를 좌우하는 파트</div>'
      + pr3('화면 만들기', who9('노형원'), QM) + pr3('서버 · 공지 모으기', who9('박상진'), one('백엔드')) + pr3('발표 · 시연', who9('노형원'), QM)
      + '<div class="pg9">보통 파트</div>'
      + pr3('화면 디자인', who9('이세민'), QM) + pr3('발표 자료', who9('김승희'), one('PPT 디자인')) + pr3('기획 · 범위 관리', who9('노형원'), one('서비스 기획'))
      + pr3('메일·LMS 자동 연동', '<span></span>', '<span class="q9">링크 붙여넣기로 대신 · 팀 선택</span>', 'out')
      + '<div class="pg9">작은 일 · 분량 맞추기</div><div class="sm9">'
      + ''.join(f'<div><span>{t}</span>{who9(n)}</div>' for t, n in SMALL3)
      + '</div></div>')
S3 = ('<div class="p9side">'
      '<div class="sc2"><h4>분량은 이렇게 맞췄어요</h4><p>노형원 님에게 <b>핵심 파트가 몰려서</b> 작은 일은 드리지 않았어요. 작은 일 6개는 핵심 파트가 적은 사람일수록 더 맡아, 네 분의 분량이 비슷해지게 했어요.</p>'
      '<div class="mine9" style="margin-top:6px"><span class="pill9">3개</span>이세민 · 보통 파트 1개</div>'
      '<div class="mine9"><span class="pill9">2개</span>김승희 · 보통 파트 1개</div>'
      '<div class="mine9"><span class="pill9">1개</span>박상진 · 핵심 파트 1개</div></div>'
      '<div class="sc2"><h4>회의하면서 바꿔도 돼요</h4><p>AI 초안이에요. 함께 보면서 말로 정하고, 바꾸고 싶은 파트는 표시해 두면 <b>팀장 화면에 모여요.</b> 확정은 팀장이 해요.</p></div>'
      '<div class="sc2 me9" style="margin-top:auto"><h4>내 파트 3개</h4><p>화면 만들기 · 발표·시연 · 기획·범위 관리</p>'
      '<button class="btn ghost sm" style="width:100%;margin-top:10px">이야기해 볼 파트 표시하기</button></div>'
      '</div>')
LOAD3 = ('<div class="load9">' + lc('노형원', 88, '핵심 2 · 보통 1 · 작은 일 0', me=True) + lc('박상진', 86, '핵심 1 · 작은 일 1')
         + lc('김승희', 84, '보통 1 · 작은 일 2') + lc('이세민', 86, '보통 1 · 작은 일 3') + '</div>')
NDIV.append(dv2('9-3', '배치 초안 — 모두가 보는 화면', '파트마다 맡은 사람 · 정한 방법(추가 질문 결과는 점수 없이) · 사람별 분량 막대 · 바꾸고 싶은 파트 표시', 80, '06:40', 4,
    '파트마다 가장 잘할 사람으로 배치 초안을 만들었어요',
    '겹친 파트 3개는 추가 질문으로 정했어요. 작은 일은 모두 비슷한 분량이 되게 나눴어요. 확정은 팀장이 해요.',
    f'<div class="p9grid"><div class="p9main">{LOAD3}{T3}</div>{S3}</div>',
    '<span class="pill9">초안 · 아직 확정 전</span>'))

# 9-4 팀장 확정
def sel(n, chg=False): return f'<span class="sel9{" chg" if chg else ""}">{av(n)}{n}</span>'
KEEP = '<span class="q9">AI 초안 그대로</span>'
T4 = ('<div class="panel2 ptab" style="--cols:minmax(0,1fr) 150px 250px">'
      '<div class="ph9"><span>파트</span><span>맡은 사람 · 눌러서 바꾸기</span><span>상태</span></div>'
      '<div class="pg9">결과를 좌우하는 파트</div>'
      + pr3('화면 만들기', sel('노형원'), '<span class="q9">추가 질문으로 정함</span>') + pr3('서버 · 공지 모으기', sel('박상진'), KEEP)
      + pr3('발표 · 시연<span class="pill9 k mk">이세민 님이 표시</span>', sel('이세민', True), '<span class="pill9 solid">회의에서 바꿈</span><span class="q9">AI 초안: 노형원</span>', 'chg')
      + '<div class="pg9">보통 파트</div>'
      + pr3('화면 디자인', sel('이세민'), '<span class="q9">추가 질문으로 정함</span>') + pr3('발표 자료', sel('김승희'), KEEP) + pr3('기획 · 범위 관리', sel('노형원'), KEEP)
      + pr3('메일·LMS 자동 연동', '<span></span>', '<span class="q9">링크 붙여넣기로 대신</span>', 'out')
      + '<div class="pg9">작은 일</div><div class="sm9">'
      + ''.join(f'<div><span>{t}</span>{sel(n)}</div>' for t, n in SMALL3)
      + '</div></div>')
S4 = ('<div class="p9side">'
      '<div class="sc2 warn9"><h4>분량이 한쪽으로 쏠렸어요</h4><p>발표·시연을 이세민 님이 맡으면서 <b>이세민 님 분량이 많아졌어요.</b> 작은 일 하나를 옮기면 다시 비슷해져요.</p>'
      '<div class="sug9"><span class="pill9">제안</span><span>시연용 예시 공지 만들기 · 이세민 → 노형원</span></div>'
      '<div class="btn2"><button class="btn ghost sm">그대로 둘게요</button><button class="btn sm">옮기기</button></div></div>'
      '<div class="sc2"><h4>회의에서 바꾼 것</h4>'
      '<div class="chgl"><span class="pill9 k">표시</span><span>발표 · 시연 — 이세민 님이 이야기해 보자고 표시</span></div>'
      '<div class="chgl"><span class="pill9 w">바꿈</span><span>발표 · 시연 · 노형원 → 이세민</span></div>'
      '<button class="btn ghost sm" style="width:100%;margin-top:8px">AI 초안으로 되돌리기</button></div>'
      '<div style="margin-top:auto"><button class="btn block">이대로 확정하고 보고서 만들기</button>'
      '<p class="note" style="margin-top:8px">확정한 뒤에도 팀장은 보고서에서 담당을 다시 고칠 수 있어요.</p></div>'
      '</div>')
LOAD4 = ('<div class="load9">' + lc('노형원', 70, '핵심 1 · 보통 1 · 작은 일 0', tag='<span class="pill9">줄었어요</span>') + lc('박상진', 86, '핵심 1 · 작은 일 1')
         + lc('김승희', 84, '보통 1 · 작은 일 2') + lc('이세민', 100, '핵심 1 · 보통 1 · 작은 일 3', over=True, tag='<span class="pill9 w">많아요</span>') + '</div>')
NDIV.append(dv2('9-4', '팀장 확정 — 회의 내용 반영', '맡은 사람 눌러서 바꾸기 · 바꾼 줄은 주황 · 분량 쏠림 경고 + 옮기기 제안 · 확정하면 모두에게 보고서', 90, '03:20', 5,
    '회의에서 이야기한 대로 고치고 확정해 주세요',
    'AI 배치는 초안이에요. 말로 정한 내용을 맡은 사람을 눌러 바꾸고, 다 됐으면 확정해요. 확정하면 모두에게 보고서가 열려요.',
    f'<div class="p9grid"><div class="p9main">{LOAD4}{T4}</div>{S4}</div>',
    badge='팀장 화면', who='김승희'))

# 9-5 보고서 — A4 세로 2쪽 미리보기 + 누르면 크게 보기(팝업)
REP_CSS = r"""
.desk{flex:1;min-height:0;background:#EDEEF5;border-radius:16px;display:flex;justify-content:center;align-items:center;gap:32px}
.a4col{display:flex;flex-direction:column;align-items:center;gap:8px}
.a4wrap{width:381px;height:539px;overflow:hidden;position:relative;background:#fff;border-radius:3px;box-shadow:0 1px 2px rgba(30,27,75,.06),0 10px 28px rgba(30,27,75,.14);cursor:zoom-in;flex:none}
.a4wrap .a4{transform:scale(.48);transform-origin:0 0}
.a4wrap .zhint{position:absolute;right:10px;bottom:10px;font-size:var(--fs-label);color:var(--muted);background:rgba(255,255,255,.94);border:1px solid var(--line);border-radius:999px;padding:3px 10px;display:flex;gap:5px;align-items:center}
.a4lab{font-size:var(--fs-cap);color:var(--muted)}
.a4{width:794px;height:1123px;background:#fff;padding:56px 64px 40px;display:flex;flex-direction:column;color:var(--ink);font-size:12.5px;line-height:1.6;text-align:left}
.a4 .pp-top{display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:10.5px;color:var(--faint);letter-spacing:.04em}
.a4 .pp-logo{display:flex;align-items:center;gap:6px;font-family:var(--sans);font-weight:900;color:var(--key);font-size:12px;letter-spacing:-.01em}
.a4 .pp-t{font-size:28px;font-weight:900;letter-spacing:-.02em;line-height:1.3;margin:16px 0 4px}
.a4 .pp-sub{font-size:13.5px;color:var(--muted)}
.a4 .pp-meta{display:flex;gap:20px;font-size:11px;color:var(--muted);margin-top:12px;padding-bottom:16px;border-bottom:2px solid var(--ink)}
.a4 .pp-meta b{color:var(--ink);font-weight:500;margin-left:5px}
.a4 .pp-sec{margin-top:20px}
.a4 .pp-h{display:flex;align-items:baseline;gap:8px;font-size:15px;font-weight:700;margin-bottom:6px}
.a4 .pp-h i{font-style:normal;font-family:var(--mono);font-size:11px;color:var(--key)}
.a4 .pp-h small{font-size:11px;color:var(--faint);font-weight:400}
.a4 .pp-kv{display:grid;grid-template-columns:104px 1fr;gap:12px;padding:6px 0;border-top:1px solid var(--line2)}
.a4 .pp-kv>span{color:var(--muted)}
.a4 .pp-kv b{font-weight:700}
.a4 .pp-tag{display:inline-block;font-size:10.5px;border:1px solid var(--line);border-radius:999px;padding:0 7px;margin-right:6px;color:var(--ink)}
.a4 .pp-vote{display:grid;grid-template-columns:18px minmax(0,1fr) 140px 32px;gap:12px;align-items:center;padding:6px 0;border-top:1px solid var(--line2)}
.a4 .pp-vote i{font-style:normal;font-family:var(--mono);color:var(--muted);font-size:11px}
.a4 .pp-vote small{color:var(--faint);font-size:11px;margin-left:6px}
.a4 .pp-vote b{font-family:var(--mono);font-size:11px;text-align:right}
.a4 .pp-bar{height:5px;background:var(--line2);border-radius:9px;overflow:hidden}
.a4 .pp-bar s{display:block;height:100%;background:var(--key-300);border-radius:9px}
.a4 .pp-vote.top .pp-bar s{background:var(--key)}
.a4 .pp-parts{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}
.a4 .pp-grp{font-size:11px;color:var(--muted);font-weight:700;margin:6px 0 2px}
.a4 .pp-part{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:5px 0;border-top:1px solid var(--line2)}
.a4 .pp-part.out{color:var(--muted)}
.a4 .pp-who{display:flex;align-items:center;gap:6px;white-space:nowrap}
.a4 .pp-note{font-size:11px;color:var(--muted);margin-top:14px;line-height:1.6}
.a4 .pp-foot{margin-top:auto;display:flex;justify-content:space-between;font-size:10px;color:var(--faint);padding-top:10px;border-top:1px solid var(--line2);font-family:var(--mono)}
.a4 .pp-stage{display:grid;grid-template-columns:26px 1fr;gap:12px;padding:12px 0;border-top:1px solid var(--line2)}
.a4 .pp-sn{width:24px;height:24px;border-radius:50%;background:var(--soft);color:var(--muted);font-family:var(--mono);font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center}
.a4 .pp-sn.now{background:var(--key);color:#fff}
.a4 .pp-st{font-size:14px;font-weight:700;display:flex;gap:8px;align-items:center;line-height:24px}
.a4 .pp-st .pill9{font-size:10px}
.a4 .pp-mk{font-size:12px;color:var(--ink);margin:0 0 7px}
.a4 .pp-mk span,.a4 .pp-pass span{color:var(--faint);margin-right:6px}
.a4 .pp-cards{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.a4 .pp-card{display:grid;grid-template-columns:22px 1fr;gap:8px;background:var(--soft);border-radius:8px;padding:7px 10px}
.a4 .pp-card b{font-size:12px;display:flex;gap:6px;align-items:center;line-height:1.4}
.a4 .pp-card b small{font-size:10.5px;color:var(--key-700);font-weight:500}
.a4 .pp-card p{margin:1px 0 0;font-size:11.5px;color:var(--muted);line-height:1.45}
.a4 .pp-pass{font-size:11px;color:var(--muted);margin-top:6px}
.a4 .pp-always{display:flex;gap:16px;font-size:12px;border:1px dashed var(--line);border-radius:8px;padding:8px 12px;margin-top:4px}
.a4 .pp-always span{color:var(--faint)}
/* 크게 보기 팝업 */
.zoomov{position:absolute;inset:0;z-index:50;background:rgba(27,27,47,.86);display:flex;flex-direction:column}
.zoomov.fixed{position:fixed}
.zbar{flex:none;height:60px;background:#1B1B2F;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;color:#fff;font-size:var(--fs-sm)}
.zbar .zl{display:flex;align-items:center;gap:12px}
.zbar .zl small{font-family:var(--mono);font-size:var(--fs-label);color:rgba(255,255,255,.7)}
.zbar .zr{display:flex;gap:8px}
.zscroll{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;align-items:center;gap:24px;padding:0 0 40px}
.zoomov:not(.fixed) .zscroll{overflow:hidden}
.zpage{flex:none;width:794px;height:1123px;box-shadow:0 20px 60px rgba(0,0,0,.35);border-radius:3px;overflow:hidden}
.zpage .a4{transform:none}
.zsb{position:absolute;right:10px;top:72px;width:6px;height:260px;border-radius:9px;background:rgba(255,255,255,.45)}
"""
CSS = CSS + REP_CSS

def ppcard(n, task, lead=''):
    return f'<div class="pp-card">{av(n)}<div><b>{n}{f"<small>{lead}</small>" if lead else ""}</b><p>{task}</p></div></div>'
def ppstage(i, name, make, cards, passing, now=False):
    tag = ' <span class="pill9 k">지금 단계</span>' if now else ''
    return (f'<div class="pp-stage"><span class="pp-sn{" now" if now else ""}">{i}</span><div>'
            f'<div class="pp-st">{name}{tag}</div><div class="pp-mk"><span>팀이 만들 것</span>{make}</div>'
            f'<div class="pp-cards">{"".join(cards)}</div><div class="pp-pass"><span>넘겨주기</span>{passing}</div></div></div>')
PPTOP = f'<div class="pp-top"><span>첫 회의 결과 보고서 · 2026-09-18</span><span class="pp-logo">{icon(16)}IdeationEngine</span></div>'
def ppfoot(n): return f'<div class="pp-foot"><span>과제 공지와 마감을 한곳에 모아 알려주는 웹</span><span>{n} / 2</span></div>'
def pppart(t, n): return f'<div class="pp-part"><span>{t}</span><span class="pp-who">{av(n)}{n}</span></div>'

PAGE1 = ('<div class="a4">' + PPTOP
    + '<div class="pp-t">과제 공지와 마감을 한곳에 모아 알려주는 웹</div>'
      '<div class="pp-sub">메일·학교 사이트·단톡에 흩어진 과제 공지와 마감을 한 화면에 모아 알려줘요.</div>'
      '<div class="pp-meta"><span>아이디어<b>노형원 님의 1순위</b></span><span>팀원<b>4명</b></span><span>회의 시간<b>약 70분</b></span><span>세션<b>교내 해커톤 서비스 아이디어</b></span></div>'
      '<div class="pp-sec"><div class="pp-h"><i>01</i>왜 이 주제인가요</div>'
      '<div class="pp-kv"><span>투표</span><div>8표 중 <b>3표로 1위</b> · 2위와 1표 차이</div></div>'
      '<div class="pp-kv"><span>AI 검증</span><div><span class="pp-tag">바로 해볼 만해요</span>일정 앱은 많지만 여러 곳의 학교 공지를 모아주는 건 드물어요 (검색 결과 링크)</div></div>'
      '<div class="pp-kv"><span>받은 좋은 점</span><div>2개 · 다들 겪는 문제라 공감이 커요 · 발표하기 쉬워요</div></div>'
      '<div class="pp-kv"><span>숨은 공통점</span><div>팀플에서 "누가 무엇을 했는지"가 한곳에 남지 않는 문제와 이어져요 (3위 아이디어도 같은 뿌리)</div></div></div>'
      '<div class="pp-sec"><div class="pp-h"><i>02</i>현실성</div>'
      '<div class="pp-kv"><span>구현 가능성</span><div><span class="pp-tag">상</span>웹 화면 2명 · 백엔드 1명으로 만들 수 있어요</div></div>'
      '<div class="pp-kv"><span>팀에 없는 스킬</span><div>메일·LMS 자동 연동 → <b>이번 범위에서 빼고 링크 붙여넣기로 대신</b>하기로 팀이 정했어요</div></div>'
      '<div class="pp-kv"><span>줄인 범위</span><div>핵심 기능은 공지 모으기 · 마감 알림 두 가지로 시작해요</div></div></div>'
      '<div class="pp-sec"><div class="pp-h"><i>03</i>투표 결과<small>1인 2표 · 누가 어디에 투표했는지는 공개하지 않아요</small></div>'
      '<div class="pp-vote top"><i>1</i><span>과제 공지와 마감을 한곳에 모아 알려주는 웹<small>노형원</small></span><span class="pp-bar"><s style="width:100%"></s></span><b>3표</b></div>'
      '<div class="pp-vote"><i>2</i><span>관심 있는 학교 행사·특강 소식만 골라 알려주는 웹<small>김승희</small></span><span class="pp-bar"><s style="width:67%"></s></span><b>2표</b></div>'
      '<div class="pp-vote"><i>3</i><span>회의 후 할 일 정리 · 열람실 빈자리 제보판 · 학과 중고 전공책<small>동점 3개</small></span><span class="pp-bar"><s style="width:33%"></s></span><b>1표</b></div></div>'
      '<div class="pp-sec"><div class="pp-h"><i>04</i>파트와 맡은 사람<small>팀장 김승희 님이 확정</small></div><div class="pp-parts"><div>'
      '<div class="pp-grp">결과를 좌우하는 파트</div>' + pppart('화면 만들기', '노형원') + pppart('서버 · 공지 모으기', '박상진') + pppart('발표 · 시연', '이세민')
    + '<div class="pp-grp" style="margin-top:10px">보통 파트</div>' + pppart('화면 디자인', '이세민') + pppart('발표 자료', '김승희') + pppart('기획 · 범위 관리', '노형원')
    + '</div><div><div class="pp-grp">작은 일</div>'
    + pppart('경쟁 서비스 조사', '이세민') + pppart('시연용 예시 공지 만들기', '노형원') + pppart('기능 테스트 · 버그 기록', '이세민')
    + pppart('사용자 인터뷰 3명', '김승희') + pppart('제출 문서 · 보고서 정리', '김승희') + pppart('회의록 · 일정 챙기기', '박상진')
    + '<div class="pp-part out" style="margin-top:10px"><span>메일·LMS 자동 연동</span><span>링크 붙여넣기로 대신</span></div>'
    + '</div></div></div>'
    + ppfoot(1) + '</div>')

PAGE2 = ('<div class="a4">' + PPTOP
    + '<div class="pp-sec" style="margin-top:22px"><div class="pp-h"><i>05</i>팀 워크플로우<small>이 순서로 함께 진행해요 · 단계마다 팀이 만들 것과 각자 맡는 일</small></div>'
    + ppstage(1, '범위와 설계 정하기', '핵심 기능 2개의 화면 흐름 · 공지를 가져올 게시판 3곳',
              [ppcard('노형원', '기능 범위와 화면 흐름 정리', '이끌기'), ppcard('박상진', '게시판 3곳에서 글을 가져올 수 있는지 확인'),
               ppcard('김승희', '사용자 인터뷰 3명으로 불편 확인'), ppcard('이세민', '경쟁 서비스 조사해서 공유')],
              '화면 흐름 노형원 → 이세민 · 가져올 수 있는 게시판 박상진 → 노형원', now=True)
    + ppstage(2, '만들기', '공지 목록 · 마감 알림이 동작하는 웹',
              [ppcard('노형원', '공지 목록·마감 표시 화면 · 시연용 예시 공지', '이끌기 · 화면'), ppcard('박상진', '공지 모으기 · 알림 보내기', '이끌기 · 서버'),
               ppcard('이세민', '화면 디자인 · 발표 흐름 초안'), ppcard('김승희', '발표 자료 틀 · 서비스 이름 정하기')],
              '화면 디자인 이세민 → 노형원 · 공지 데이터 형식 박상진 ↔ 노형원')
    + ppstage(3, '합치고 확인하기', '처음부터 끝까지 시연되는 버전',
              [ppcard('노형원', '화면과 서버 연결 (박상진과 함께)'), ppcard('박상진', '서버 연결 · 시연 환경 준비'),
               ppcard('이세민', '기능 테스트 · 버그 기록', '이끌기'), ppcard('김승희', '인터뷰 결과를 발표 자료에 반영')],
              '버그 목록 이세민 → 노형원 · 박상진')
    + ppstage(4, '발표 준비', '발표 자료 · 시연 · 제출 문서',
              [ppcard('이세민', '발표 흐름 · 시연 연습', '이끌기 · 발표'), ppcard('김승희', '발표 자료 완성 · 제출 문서 정리', '이끌기 · 자료'),
               ppcard('노형원', '시연 화면 점검 · 리허설 피드백'), ppcard('박상진', '시연 환경 최종 점검')],
              '발표 자료 김승희 → 이세민')
    + '</div><div class="pp-sec" style="margin-top:12px"><div class="pp-h"><i>06</i>내내 하는 일</div>'
      '<div class="pp-always"><span>회의록 · 일정 챙기기</span><b>박상진</b><span>기능 범위 지키기</span><b>노형원</b></div></div>'
      '<div class="pp-note">팀장이 확정한 배치로 AI가 만든 초안이에요. 단계별 일은 회의에서 고칠 수 있어요. 검색 결과가 근거인 부분만 링크를 달았어요.<br>'
      '끝까지 익명으로 남는 것: 댓글 쓴 사람 · 누가 어디에 투표했는지 · 인터뷰 답 원문 · 추가 질문의 답</div>'
    + ppfoot(2) + '</div>')

def a4col(page, label):
    return (f'<div class="a4col"><div class="a4wrap" data-zoom>{page}<span class="zhint">{SEARCH}크게 보기</span></div>'
            f'<span class="a4lab">{label}</span></div>')
DESK = f'<div class="desk">{a4col(PAGE1, "1쪽 · 요약 · 투표 · 파트 배치")}{a4col(PAGE2, "2쪽 · 팀 워크플로우")}</div>'
S5 = ('<div class="p9side">'
      '<div class="sc2"><h4>A4 2쪽으로 만들었어요</h4>'
      '<div class="mine9"><span class="pill9">1쪽</span>왜 이 주제인지 · 현실성 · 투표 · 파트 배치</div>'
      '<div class="mine9"><span class="pill9">2쪽</span>팀 워크플로우 4단계 · 내내 하는 일</div>'
      '<p style="margin-top:6px">페이지를 누르면 크게 볼 수 있어요. PDF로 저장하면 이 모양 그대로 저장돼요.</p></div>'
      f'<div class="sc2"><h4>끝까지 익명으로 남는 것</h4><p>{GLOCK} 댓글 쓴 사람 · 누가 어디에 투표했는지 · 인터뷰 답 원문 · 추가 질문의 답</p></div>'
      '<div class="sc2"><h4>팀장만</h4><p>확정한 뒤에도 보고서에서 담당을 다시 고칠 수 있어요. 고치면 모두의 보고서가 같이 바뀌어요.</p></div>'
      '<div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">'
      '<p class="note">요약과 워크플로우는 AI가 회의 기록으로 만든 초안이에요.</p>'
      '<div class="btn2" style="margin-top:0"><button class="btn">PDF로 저장</button></div></div>'
      '</div>')
REP_H = ('<span class="rmeta">첫 회의 결과 보고서 · 2026-09-18 · 팀원 4명 · 약 70분</span>과제 공지와 마감을 한곳에 모아 알려주는 웹',
         '보고서가 완성됐어요. 페이지를 누르면 크게 볼 수 있어요.')
NDIV.append(dv2('9-5', '최종 보고서 — A4 세로 2쪽', 'PDF와 같은 A4 세로 비율로 미리보기 · 페이지를 누르면 크게 보기 팝업(9-5′) · PDF 저장(브라우저 인쇄)만 · 공유 링크 없음(2026-09-18 결정)', 100, '00:00', 6,
    REP_H[0], REP_H[1], f'<div class="p9grid">{DESK}{S5}</div>', badge='모두가 보는 화면'))

ZOOM = ('<div class="zoomov"><div class="zbar"><span class="zl"><b>첫 회의 결과 보고서</b><small>A4 · 1 / 2쪽</small></span>'
        '<span class="zr"><button class="btn sm">PDF로 저장</button><button class="btn ghost sm">✕ 닫기</button></span></div>'
        f'<div class="zscroll"><div class="zpage">{PAGE1}</div></div><span class="zsb"></span></div>')
NDIV.append(dv2('9-5′', '최종 보고서 — 크게 보기 (팝업)', '페이지를 누르면 열림 · 실제 크기(A4 794×1123)로 위아래 스크롤 · 바깥·✕·Esc로 닫기', 100, '00:00', 6,
    REP_H[0], REP_H[1], f'<div class="p9grid">{DESK}{S5}</div>{ZOOM}', badge='모두가 보는 화면'))

ZOOM_JS = r"""
<script>
/* 9-5 보고서: A4 페이지를 누르면 크게 보기 팝업 (목업 확인용) */
(function () {
  function open(wrap) {
    var board = wrap.closest('.board');
    var pages = [].slice.call(board.querySelectorAll('.desk .a4wrap[data-zoom] .a4'));
    var ov = document.createElement('div');
    ov.className = 'zoomov fixed';
    ov.innerHTML = '<div class="zbar"><span class="zl"><b>첫 회의 결과 보고서</b><small>A4 · ' + pages.length + '쪽</small></span>'
      + '<span class="zr"><button class="btn sm">PDF로 저장</button><button class="btn ghost sm zx">✕ 닫기</button></span></div><div class="zscroll"></div>';
    var sc = ov.querySelector('.zscroll');
    pages.forEach(function (p) {
      var box = document.createElement('div'); box.className = 'zpage';
      box.appendChild(p.cloneNode(true)); sc.appendChild(box);
    });
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    var i = pages.indexOf(wrap.querySelector('.a4'));
    if (i > 0) sc.scrollTop = sc.children[i].offsetTop - 12;
    function esc(e) { if (e.key === 'Escape') close(); }
    function close() { ov.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', esc); }
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target === sc || e.target.closest('.zx')) close(); });
    document.addEventListener('keydown', esc);
  }
  document.addEventListener('click', function (e) {
    var w = e.target.closest('.desk .a4wrap[data-zoom]');
    if (w) open(w);
  });
})();
</script>
"""

# ───── T 보조 화면 (2026-09-18 추가: 시간 종료 · 진행자 넘기기 + 제출 확인 · AI 검증 중) ─────
T_CSS = r"""
.tdim{position:absolute;inset:0;background:rgba(12,12,16,.42);display:flex;align-items:center;justify-content:center;z-index:5}
.tdlg{width:560px;background:#fff;border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.28);padding:28px 30px 24px;color:#111}
.tdlg h3{font-size:var(--fs-h2);font-weight:700;margin:0 0 6px}
.tdlg p{font-size:var(--fs-sm);color:var(--muted);margin:0 0 6px}
.tdlg .tdf{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}
.tdlg .tdk{display:flex;gap:10px;align-items:center;background:var(--soft);border-radius:12px;padding:10px 14px;margin:14px 0 4px;font-size:var(--fs-sm)}
.hostbar{position:absolute;left:50%;transform:translateX(-50%);bottom:64px;display:flex;align-items:center;gap:14px;background:var(--ink);color:#fff;border-radius:999px;padding:8px 10px 8px 20px;box-shadow:0 12px 32px rgba(0,0,0,.28);z-index:4;font-size:var(--fs-sm);white-space:nowrap}
.hostbar b{font-weight:700}
.hostbar .hb-q{color:rgba(255,255,255,.7)}
.tpend{flex:1;display:flex;align-items:center;justify-content:center}
.tpend .panel{max-width:560px;text-align:center}
.tpend .bar{height:8px;border-radius:99px;background:var(--line2);overflow:hidden;margin:14px auto 8px;max-width:360px}
.tpend .bar i{display:block;height:100%;background:var(--key);border-radius:99px}
"""
CSS = CSS + T_CSS

DIV.append(dv('T1', '세션 시간이 끝났을 때 (진행자)', '자동으로 끝내지 않음 · 진행자가 "5분 더" 또는 "이대로 계속" · 참가자는 "진행자가 정하는 중" 안내만 · 어느 단계에서든 같은 창', 55, '00:00', 5,
    '우리 팀이 해보고 싶은 아이디어에 투표해 주세요', '한 사람당 2표예요. (시간이 끝난 순간의 8-6 위에 뜨는 안내 — 다른 단계도 같은 창)',
    '<div class="panel2" style="padding:22px 24px;min-height:320px"><p class="quiet">(지금 보고 있던 화면 그대로)</p></div>'
    '<div class="tdim"><div class="tdlg"><h3>세션 시간이 끝났어요</h3>'
    '<p>정해둔 30분이 지났어요. 세션은 자동으로 끝나지 않아요 — 진행자가 정해요.</p>'
    '<div class="tdk"><span>지금 단계</span><b>아이디어 발산 · 투표</b><span class="quiet" style="margin-left:auto">투표한 사람 3 / 4</span></div>'
    '<p class="quiet">"5분 더"는 무료 세션 한도(30분)를 넘으면 안 돼요(PRO는 제한 없음) · 참가자 화면에는 "진행자가 정하는 중이에요"만 보여요</p>'
    '<div class="tdf"><button class="btn gray">이대로 계속 진행하기</button><button class="btn">5분 더 진행하기</button></div></div></div>',
    host=True))

DIV.append(dv('T2', '진행자 단계 넘기기 + 제출 확인 (8-1 ~ 8-6 공통)', '진행자에게만 아래 막대 · 안 낸 사람이 있으면 넘기기 전에 확인(제출 강제) · "그냥 넘기기"만 빈 줄이 생김', 25, '02:40', 1,
    '원래 해보고 싶었던 아이디어를 적어주세요', '최대 3개까지, 하고 싶은 순서대로 적어요. (진행자가 보는 8-1 — 자기도 제출하면서 팀 진행을 봐요)',
    '<div class="panel2" style="padding:22px 24px;min-height:300px"><p class="quiet">(8-1 화면 그대로 · 다른 8-x 화면도 같은 막대)</p></div>'
    '<div class="hostbar"><span>제출 <b>3 / 4</b>명</span><span class="hb-q">· 아직 1명이 안 냈어요</span><button class="btn">다음 단계 →</button></div>'
    '<div class="tdim"><div class="tdlg"><h3>아직 1명이 제출하지 않았어요</h3>'
    '<p>모두 내야 다음 단계로 넘어가요. 연결이 끊긴 사람이 있으면 그냥 넘길 수 있어요 — 그 사람 줄은 순위표에 빈 칸으로 남아요.</p>'
    '<div class="tdk"><span>기다리는 사람</span><b>1명</b><span class="quiet" style="margin-left:auto">누구인지는 표시하지 않아요</span></div>'
    '<div class="tdf"><button class="btn gray">기다리기</button><button class="btn">그냥 넘기기</button></div></div></div>',
    host=True))

DIV.append(dv('T3', 'AI 검증이 아직 안 끝났을 때 (8-5)', 'ready=false 동안 · 끝나면 reviews.ready로 자동 표시 · 실패한 아이디어는 "검증 실패"로 두고 투표는 진행 · 끝나기 전엔 진행자도 투표로 못 넘김', 45, '03:00', 4,
    'AI가 아이디어 12개의 실효성과 현실성을 살펴보고 있어요', '검색으로 "이미 있는 서비스인지"를 확인하고 있어서 조금 걸려요. 끝나면 자동으로 보여요.',
    '<div class="tpend"><div class="panel"><div class="avatar" style="width:72px;height:72px;font-size:var(--fs-h1);margin:0 auto 14px">AI</div>'
    '<p class="lead">검증하는 중이에요</p><p class="hint">아이디어 12개 중 <b style="color:var(--key)">8개</b> 끝남 · 검색 근거 확인 중</p>'
    '<div class="bar"><i style="width:66%"></i></div>'
    '<p class="quiet">검증에 실패한 아이디어는 "검증 실패"로 표시되고 등급 없이 그대로 투표에 올라가요 · 진행자는 끝나기 전엔 투표로 넘길 수 없어요(409 STAGE_LOCKED)</p>'
    '</div></div>'))

DIV += NDIV
S[14:14] = DIV

# ───────── 문서 헤더 + 메모 ─────────
SCALE = [('50', '#EEF2FF', '연한 배경·선택 영역'), ('100', '#E0E7FF', '아바타·포커스 링'), ('200', '#C7D2FE', '선택 테두리'),
         ('300', '#A5B4FC', '어두운 면 위 보조 글자'), ('400', '#818CF8', '선택 칩 테두리'), ('500', '#6366F1', '보조 강조'),
         ('600', '#4F46E5', 'KEY · 버튼·로고'), ('700', '#4338CA', '강조 글자'), ('800', '#3730A3', '진한 강조 글자'),
         ('900', '#312E81', '진한 카드'), ('950', '#1E1B4B', '가장 진한 면')]
scale_html = ''.join(
    f'<div class="{"is-key" if n == "600" else ""}"><i style="background:{h}"></i><div class="t"><b>{n}</b><span>{h}</span><em>{u}</em></div></div>'
    for n, h, u in SCALE)
nav = ''.join(f'<a href="#s{n}" class="{"sess" if str(n)[:1] in "789" else ""}">{n} {t}</a>' for n, t in [
    (1, '랜딩'), ('1-1', '프로필 팝오버'), (2, '코드입장'), (3, '프로필 만들기'), (4, '세션만들기'), (5, '대기실 진행자'), (6, '대기실 참가자'), ('7-1', '질문1'), ('7-2', '소식 카드'), ('7-3', '질문3'), ('7-4', '질문4'), ('7-5', '마무리·재료'), ('7-6', '진행자 재료 묶음'), ('7-7', '발산 시작'), ('8-1', '내 아이디어'), ('8-2', 'AI 추천'), ('8-3', '익명 순위표'), ('8-4', '익명 댓글'), ('8-5', 'AI 검증'), ('8-6', '투표'), ('8-6′', '목록 접기'), ('8-6b', 'AI가 모은 아이디어'), ('8-6c', '숨은 공통점'), ('8-7', '결과·주제 확정'), ('9-1', '파트 나누기'), ('9-2', '겹친 후보 질문'), ('9-3', '배치 초안'), ('9-4', '팀장 확정'), ('9-5', '보고서 A4'), ('9-5′', '보고서 크게 보기'), 
    ('A1', '로그인'), ('A2', '회원가입'), ('A2-1', '이용약관'), ('A2-2', '개인정보 동의'), ('A3', '프로필 수정'), ('A4', '지난 세션'), ('A5', '계정 설정')])

DOC = f'''
<div class="doc">
  <div class="eyebrow">IdeationEngine · 디자이너 목업 v14</div>
  <h1 class="title">세션 시작 전 + 아이스브레이킹 + 계정 화면</h1>
  <p class="sub">v12 범위 = 1~6번 + <b>7 아이스브레이킹(7-1~7-7)</b> + 계정 화면 A1~A5. 발산 이후 화면은 추후. 모든 화면 1280 × 800 고정, 창이 작으면 통째로 축소. 스크립트 없는 순수 HTML. 이름·이메일·날짜는 시연용 예시.</p>
  <div class="flow">{nav}</div>

  <div class="memo">
    <h3>7 아이스브레이킹 — 추가한 색은 1개</h3>
    <div class="swatches">
      <span class="sw"><i style="background:#0284C7"></i><b>Sky 600 #0284C7</b>&nbsp;· 연한 면 #E8F4FB · 선 #B5DCF1 · 글자 #075985 — 최근 소식(카드 태그·뜻풀이)에만</span>
    </div>
    <ul style="margin-top:12px">
      <li>v9: 소식 카드 세로로 여유 있게(높이 330+, 줄 간격↑) · 진행 막대 옆 회색 '전체' · 초록 말풍선은 인터뷰 끝 안내 1번만</li>
      <li>v8 정리: "지금" 배지 삭제 · 단계 이름 가운데·보통 굵기 · 진행률 % 작게 · 오른쪽 "내 답은 어디로" 카드 삭제(AI 첫 말에서 안내)</li>
      <li>팀 진행은 <b>n / 5</b> 또는 <b>완료</b>만 · 지나간 질문은 회색(체크 아이콘 없음) · 자물쇠·돋보기·타이머는 회색 선 아이콘</li>
      <li>"질문 말고 하고 싶은 말" 버튼 삭제 · 재료 종류 라벨(문제 씨앗 등) 삭제 → 재료는 점 목록, <b>"피할 것"만 회색 태그</b></li>
      <li>7-6: 완료한 사람은 막대 없이 "완료" · 소식 반응은 막대 + 범례만(숫자 삭제) · v7의 Orange 색은 쓸 곳이 없어져 뺌</li>
    </ul>

    <h3>앱 로고 — IE 모노그램</h3>
    <div class="iconrow">
      <figure>{icon(120)}<span>120</span></figure>
      <figure>{icon(64)}<span>64</span></figure>
      <figure>{icon(32)}<span>32</span></figure>
      <figure>{icon(20)}<span>20</span></figure>
      <figure><span class="dark">{icon(64, True)}</span><span>어두운 배경용</span></figure>
      <figure><span style="display:inline-flex;align-items:center;gap:10px;font-family:var(--sans);font-size:28px;font-weight:900;letter-spacing:-.02em;color:var(--key)">{icon(40)}IdeationEngine</span><span>로고 + 글자 조합</span></figure>
    </div>
    <ul style="margin-top:14px">
      <li><b>I</b>deation <b>E</b>ngine 앞 글자 두 개를 직선 막대로만 그림 — 그라데이션·광택·그림자 없음, 단색 2개(#4F46E5 + #FFFFFF)</li>
      <li>그리드 32×32 · 배경 모서리 8 (25%) · 막대 두께 3.4 · 글자 높이 14 · I와 E 사이 간격 2.6</li>
      <li>E의 위·아래 팔 9.8, 가운데 팔 8.0 (살짝 짧게 해서 작은 크기에서도 E로 읽힘) · 막대 모서리 0.7</li>
      <li>크기: 상단바 28 · 랜딩 64 · 로그인/회원가입 왼쪽 패널 32 (흰 배경 버전)</li>
      <li>⚠️ 비슷한 IE 로고(예: 브라우저 계열) 상표 검색은 하지 않았음 — 확정 전에 확인 필요</li>
    </ul>

    <h3>v6 변경 사항</h3>
    <ul>
      <li>로고: 발산·수렴 아이콘 → <b>IE 모노그램</b> (단색, 광택 없음)</li>
      <li>프로필(3번·A3): 할 수 있는 것을 <b>개발 / 디자인(결과물 기준) / 기획(설계 대상 기준) / 발표·기타</b> 4그룹 20개로 세분화 + <b>한 줄 강점</b>(선택) 추가</li>
      <li>1-1 팝오버·6번 대기실의 스킬 표시도 새 이름으로 맞춤</li>
    </ul>

    <h3>v5 변경 사항</h3>
    <ul>
      <li>모든 "IdeationEngine" 글자 옆에 앱 아이콘 추가 · 4번 PRO 태그 정리 · 참여 인원 스테퍼 축소</li>
      <li>신규 팝업 A2-1 이용약관 · A2-2 개인정보 수집·이용 동의 · A4 "보고서 없음" = 회색 비활성 버튼</li>
    </ul>

    <h3>v4 변경 사항</h3>
    <ul>
      <li><b>신규</b> A1 로그인 · A2 회원가입 · A3 프로필 수정 · A4 지난 세션 기록 · A5 계정 설정 (A3~A5는 왼쪽 메뉴 공통 = "마이페이지")</li>
      <li><b>4 세션 만들기</b> — 시간: 10·20·30분 무료 / 60·90분·제한 없음 = 자물쇠 + PRO, 직접 입력 1~30분 · <b>참여 인원</b> 스테퍼(나 포함) 추가</li>
      <li><b>5 대기실</b> — 왼쪽은 방 코드 + 코드 복사 + 초대 링크 복사만. QR·입장 잠그기 삭제</li>
      <li><b>1-1 팝오버</b> — FREE 배지 + "Pro로 업그레이드" 메뉴 추가, 메뉴가 A3~A5로 연결</li>
    </ul>

    <h3>무료 / Pro 표시 규칙</h3>
    <ul>
      <li>잠긴 옵션 = <b>회색 칩 + 오른쪽에 <span class="pro">{LOCK_S}PRO</span> 태그</b> (흰 바탕 · key/700 글자 · key/200 테두리, 누르면 업그레이드 안내)</li>
      <li>현재 플랜은 <span class="plan-free">FREE</span> 회색 배지</li>
      <li>업그레이드 유도는 화면당 한 곳만 — 세션 만들기의 안내 박스, 마이페이지 왼쪽 아래, 계정 설정의 요금제 카드</li>
    </ul>

    <h3>Key color — Indigo 600 #4F46E5</h3>
    <div class="keyhero">
      <div class="keychip"><b>Indigo 600</b><span>#4F46E5</span></div>
      <div class="keyinfo">
        <div class="kv"><div class="k">HEX</div><div class="v">#4F46E5</div></div>
        <div class="kv"><div class="k">RGB</div><div class="v">79, 70, 229</div></div>
        <div class="kv"><div class="k">HSL</div><div class="v">243°, 75%, 59%</div></div>
        <div class="kv"><div class="k">이름</div><div class="v">인디고 (Tailwind indigo-600)</div></div>
        <div class="kv"><div class="k">흰 글자 대비</div><div class="v">6.3 : 1 (AA 통과)</div></div>
        <div class="kv"><div class="k">Figma 이름 제안</div><div class="v">key/600</div></div>
      </div>
    </div>
    <div class="scale">{scale_html}</div>
    <div class="swatches" style="margin-top:14px">
      <span class="sw"><i style="background:#FAFAFE"></i>앱 배경 #FAFAFE</span>
      <span class="sw"><i style="background:#FFFFFF"></i>카드 #FFFFFF</span>
      <span class="sw"><i style="background:#E2E3EF"></i>선 #E2E3EF</span>
      <span class="sw"><i style="background:#1B1B2F"></i>본문 #1B1B2F</span>
      <span class="sw"><i style="background:#626280"></i>보조 글자 #626280</span>
      <span class="sw"><i style="background:#059669"></i>완료·연결됨 #059669</span>
      <span class="sw"><i style="background:#B45309"></i>주의 #B45309</span>
      <span class="sw"><i style="background:#BE123C"></i>위험·탈퇴 #BE123C</span>
    </div>

    <h3>폰트 · 글자 크기 8단계</h3>
    <ul style="margin-bottom:10px"><li><b>Noto Sans KR</b> (한글, 400/500/700/900) · <b>JetBrains Mono</b> (배지·코드·날짜·수치)</li></ul>
    <table class="tscale">
      <tr><td class="tk">Display</td><td class="px">36 / 900</td><td style="font-size:36px;font-weight:900;color:var(--key)">7K2X9</td><td class="use">큰 수치 (예외: 랜딩 로고 64 · 대기실 방 코드 72)</td></tr>
      <tr><td class="tk">H1</td><td class="px">24 / 700</td><td style="font-size:24px;font-weight:700">계정 설정</td><td class="use">화면 제목</td></tr>
      <tr><td class="tk">H2</td><td class="px">18 / 700</td><td style="font-size:18px;font-weight:700">회의 진행자가 없어도</td><td class="use">슬로건 · 카드 헤드라인</td></tr>
      <tr><td class="tk">H3</td><td class="px">16 / 700</td><td style="font-size:16px;font-weight:700">요금제</td><td class="use">카드 제목 · 큰 버튼</td></tr>
      <tr><td class="tk">Body</td><td class="px">14 / 400·500</td><td style="font-size:14px">세션 만들고 방 코드 받기</td><td class="use">본문 · 입력칸 · 버튼 · 메뉴</td></tr>
      <tr><td class="tk">Small</td><td class="px">13 / 400·500</td><td style="font-size:13px">교내 해커톤에서 만들 서비스 아이디어</td><td class="use">카드 내용 · 칩 · 표</td></tr>
      <tr><td class="tk">Caption</td><td class="px">12 / 400</td><td style="font-size:12px;color:var(--muted)">대기실에 "3 / 4명 입장"처럼 표시돼요</td><td class="use">힌트 · 보조 설명</td></tr>
      <tr><td class="tk">Label</td><td class="px">11 / Mono</td><td style="font-size:11px;font-family:var(--mono);color:var(--muted)">2026.09.15 · FREE</td><td class="use">배지 · 날짜 · 라벨</td></tr>
    </table>
  </div>
</div>'''

html = f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>IdeationEngine 목업 v14</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>{CSS}</style>
</head>
<body>
{ICON_DEFS}
{DOC}
{"".join(S)}
<div class="foot2">목업 v14 · 1~6번 + 7 아이스브레이킹 + 8 발산 + 9 파트 나누기·보고서 + 계정 A1~A5 · 1280×800 고정 · Key color Indigo 600 #4F46E5 · 이름·이메일·날짜는 시연용 예시 · 실제 앱 아님</div>
{ZOOM_JS}
</body>
</html>'''

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)
print('written', len(html))
