/* A6 소셜 로그인 콜백 — 기존 사용자는 화면 이동 없이 바로 로그인, 처음 가입이면 이 화면 위에
   약관 동의 팝업 하나만 띄우고 계속한다 (이메일/비밀번호 회원가입 화면으로 돌려보내지 않는다). */
App.action('retry', async () => { App.go(App.screen('A1-login')); return false; });
(async () => {
  const q = new URLSearchParams(location.search);
  const provider = q.get('provider') || sessionStorage.getItem('ie.oauth.provider') || 'google';
  const code = q.get('code'), state = q.get('state');
  const savedState = sessionStorage.getItem('ie.oauth.state');
  sessionStorage.removeItem('ie.oauth.state');   // 한 번만 씀 — 새로고침으로 이미 쓴 code를 다시 보내는 것을 막는다
  if (IE_CONFIG.useMock) { App.toast('목업: 소셜 로그인 처리 중 화면이에요 (실서버에서는 1초 안에 넘어가요)'); return; }
  if (!code || state !== savedState) { App.toast('로그인 정보가 맞지 않아요. 다시 시도해 주세요', 'error'); App.go(App.screen('A1-login')); return; }

  const redirectUri = location.origin + '/oauth/callback';
  async function finishOAuth(body) {
    const r = await api.call('auth.oauth', { provider }, body);
    App.setLogin(r, false);
    App.go(App.returnTo(App.screen('01-1-landing-logged-in')));
  }
  function askAgreements() {
    return new Promise((resolve) => {
      App.dialog('약관에 동의해 주세요', `
        <div style="text-align:left;margin:14px 0 4px;display:grid;gap:10px">
          <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-req="terms" checked><span><b>[필수]</b> 이용약관 동의</span></label>
          <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-req="privacy" checked><span><b>[필수]</b> 개인정보 수집·이용 동의</span></label>
          <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-req="marketing"><span>[선택] 새 기능·이벤트 소식 받기</span></label>
        </div>
      `, [
        { label: '취소', cls: 'gray', onClick: () => { resolve(null); } },
        {
          label: '동의하고 계속하기', onClick: () => {
            const val = (name) => document.querySelector(`[data-req="${name}"]`).checked;
            if (!val('terms') || !val('privacy')) { App.toast('필수 약관에 동의해야 가입할 수 있어요'); return false; }
            resolve({ terms: val('terms'), privacy: val('privacy'), marketing: val('marketing') });
          },
        },
      ]);
    });
  }

  try {
    await finishOAuth({ code, redirectUri });
  } catch (err) {
    if (err.code === 'AGREEMENT_REQUIRED') {
      const agreements = await askAgreements();
      if (!agreements) { App.go(App.screen('A1-login')); return; }
      // code는 1회용이라 이미 위에서 써버렸다 — 재시도는 서버가 돌려준 pendingToken으로 이어간다
      // (code를 또 보내면 구글이 invalid_grant로 거절함).
      const pendingToken = err.details && err.details.pendingToken;
      try { await finishOAuth(pendingToken ? { pendingToken, agreements } : { code, redirectUri, agreements }); }
      catch (err2) { App.toast(err2.message || '가입에 실패했어요', 'error'); App.go(App.screen('A1-login')); }
      return;
    }
    App.toast(err.message || '소셜 로그인에 실패했어요', 'error'); App.go(App.screen('A1-login'));
  }
})();
