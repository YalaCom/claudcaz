function showToast(msg, type){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' '+type : '');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> el.classList.remove('show'), 2400);
}

function fmt(n){
  return (Math.round(n*100)/100).toLocaleString('ru-RU', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function fmtCompact(n){
  n = Math.round(n*100)/100;
  return n % 1 === 0 ? n.toLocaleString('ru-RU') : fmt(n);
}

function guardAuth(){
  const u = DB.currentUser();
  if(!u){ location.href = 'index.html'; return null; }
  return u;
}

function timeAgo(ts){
  const s = Math.floor((Date.now()-ts)/1000);
  if(s<60) return 'только что';
  const m = Math.floor(s/60);
  if(m<60) return m+' мин назад';
  const h = Math.floor(m/60);
  if(h<24) return h+' ч назад';
  const d = Math.floor(h/24);
  return d+' дн назад';
}

function renderWalletChip(user){
  const el = document.querySelector('.wallet-chip .val');
  if(el) el.textContent = fmtCompact(user.balance);
}

function setActiveTab(name){
  document.querySelectorAll('.tabnav a').forEach(a=>{
    a.classList.toggle('active', a.dataset.tab === name);
  });
}

function navHTML(active, isAdmin){
  return `
  <nav class="tabnav">
    <a href="lobby.html" data-tab="lobby" class="${active==='lobby'?'active':''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
      Лобби
    </a>
    <a href="rtp.html" data-tab="rtp" class="${active==='rtp'?'active':''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>
      RTP
    </a>
    <a href="profile.html" data-tab="profile" class="${active==='profile'?'active':''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
      Профиль
    </a>
    ${isAdmin ? `<a href="admin.html" data-tab="admin" class="${active==='admin'?'active':''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>
      Админ
    </a>` : ''}
  </nav>`;
}
