/* 7-1 질문 1 — 공통 채팅 동작은 assets/js/icebreak-chat.js */
realtime.connect(App.sessionId(), (ev) => {
  if (ev.type === 'icebreak.news.ready') App.go(App.screen('07-2-icebreak-q2-news')); // 실제로는 같은 화면에서 카드만 추가하면 됨
});
