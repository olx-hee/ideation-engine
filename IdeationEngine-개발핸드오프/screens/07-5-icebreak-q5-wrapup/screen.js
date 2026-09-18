/* 7-5 마무리 */
App.$('.comp input').disabled = true;
if (App.state.role === 'host') App.chat.hostLink();   // 진행자도 인터뷰를 한 뒤 7-6으로
async function load() {
  const r = await api.call('ice.myMaterials');
  const box = App.$('.mats'); box.querySelectorAll('.mrow').forEach(n => n.remove());
  r.items.forEach(it => {
    const d = document.createElement('div'); d.className = 'mrow' + (it.avoid ? ' av' : '');
    d.innerHTML = (it.avoid ? '<span class="avoid">피할 것</span>' : '') + App.escape(it.text); box.appendChild(d);
  });
}
if (!IE_CONFIG.useMock) load();
