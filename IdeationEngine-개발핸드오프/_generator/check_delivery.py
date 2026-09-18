# 차수 전달 문서 하나만 검사하고 미리보기 만들기 (작성 중에 수시로 실행)
# 실행: python _generator/check_delivery.py 3      → 3차 SPEC 검사 + _미리보기/00-백엔드-3차-….md 생성
#       python _generator/check_delivery.py all    → 1차~6차 전부 검사 (READY 여부와 상관없이)
# docs/ 에 진짜로 쓰는 건 handoff.py (READY=True + 검사 통과일 때만)
import os, sys
sys.stdout.reconfigure(errors='replace')
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ho_delivery as DL

ROOT = os.path.dirname(HERE)
arg = (sys.argv[1] if len(sys.argv) > 1 else 'all').replace('차', '')
names = [f'{n}차' for n in '1234567'] if arg == 'all' else [f'{arg}차']
bad = 0
for name in names:
    if name not in DL.PHASE_FILES:
        print(f'{name}: 없는 차수 (1~7)'); bad += 1; continue
    mod, spec = DL.load_spec(name)
    P = DL.check(spec, ROOT, name)
    text = DL.render(spec) if not any(p.startswith('SPEC에') or p.startswith('ids가') or p.startswith('why 키') or p.startswith('없는 실시간') for p in P) else None
    if text is not None:
        os.makedirs(os.path.join(ROOT, '_미리보기'), exist_ok=True)
        with open(os.path.join(ROOT, '_미리보기', DL.PHASE_FILES[name][1]), 'w', encoding='utf-8', newline='\n') as f:
            f.write(text)
    state = 'READY' if getattr(mod, 'READY', False) else '작성 중'
    print(f"{name} [{state}] 시나리오 {len(spec.get('scenarios', []))}개 · 문제 {len(P)}건" + (f" · 미리보기 _미리보기/{DL.PHASE_FILES[name][1]}" if text is not None else ' · 미리보기 못 만듦'))
    for p in P:
        print('  - ' + p)
    bad += len(P)
sys.exit(1 if bad else 0)
