/* T2 진행자 넘기기 + 제출 확인 (목업) — 실제 동작은 assets/js/app.js 의 App.hostBar */
App.action('hostAdvance', async () => { App.toast('안 낸 사람이 있으면 확인 창이 떠요 (목업에서는 이미 떠 있음)'); return false; });
App.action('forceCancel', async () => { App.$('.tdim')?.remove(); App.toast('기다려요 · 모두 내면 다시 눌러주세요'); return false; });
App.action('forceAdvance', async () => { await api.call('session.advance', {}, { from: 'diverge.write', force: true }); App.$('.tdim')?.remove(); App.toast('다음 단계로 넘겼어요 · 안 낸 사람 줄은 빈 칸으로 남아요'); return false; });
