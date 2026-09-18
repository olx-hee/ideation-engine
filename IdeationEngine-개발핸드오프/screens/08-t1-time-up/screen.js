/* T1 세션 시간 종료 안내 (목업) — 실제 동작은 assets/js/app.js 의 App.timeUp */
App.action('timeUpDismiss', async () => { App.$('.tdim')?.remove(); App.toast('이대로 계속 진행해요'); return false; });
App.action('timeUpExtend', async () => { const r = await api.call('session.extend', {}, { addMin: 5 }); App.setTimer(r.timer.remainingSec); App.$('.tdim')?.remove(); App.toast('5분 더 진행해요'); return false; });
