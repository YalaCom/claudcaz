(function(){
  const user = guardAuth();
  if(!user) return;

  function refresh(){
    const u = DB.currentUser();
    renderWalletChip(u);
    document.getElementById('navSlot').innerHTML = navHTML('profile', u.isAdmin);
    document.getElementById('pUsername').innerHTML = u.username + (u.isAdmin ? ' <span class="tag-admin">Admin</span>' : '');
    document.getElementById('avatarInit').textContent = u.username.slice(0,2).toUpperCase();
    document.getElementById('pSince').textContent = 'Регистрация: ' + new Date(u.createdAt).toLocaleDateString('ru-RU');
    document.getElementById('statBalance').textContent = fmtCompact(u.balance);
    document.getElementById('statSpins').textContent = u.stats.spins;
    document.getElementById('statWagered').textContent = fmtCompact(u.stats.wagered);
    document.getElementById('statWon').textContent = fmtCompact(u.stats.won);

    const hist = u.history || [];
    document.getElementById('histCount').textContent = hist.length + ' записей';
    const list = document.getElementById('histList');
    if(hist.length===0){
      list.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        <div>Пока нет вращений</div>
      </div>`;
    } else {
      list.innerHTML = hist.map(h=>{
        const net = h.win - h.bet;
        const cls = net>0 ? 'win' : 'loss';
        const sign = net>0 ? '+' : '';
        return `<div class="hist-row">
          <div>
            <div>${h.slot}</div>
            <div class="t">${timeAgo(h.t)}${h.feature==='free_spin'?' · фриспин':''}${h.feature==='bonus_buy'?' · покупка бонуса':''}${h.feature==='admin'?' · корректировка':''}</div>
          </div>
          <div class="${cls}">${sign}${fmt(net)}</div>
        </div>`;
      }).join('');
    }
  }

  document.getElementById('btnTopUp').onclick = ()=>{
    const u = DB.currentUser();
    DB.updateUser(u.key, (usr)=>{ usr.balance = +(usr.balance + 5000).toFixed(2); });
    showToast('Баланс пополнен на 5000 демо-фишек', 'ok');
    refresh();
  };

  document.getElementById('btnLogout').onclick = ()=>{
    DB.logout();
    location.href = 'index.html';
  };

  refresh();
})();
