(function(){
  const user = guardAuth();
  if(!user) return;
  if(!user.isAdmin){
    location.href = 'lobby.html';
    return;
  }

  renderWalletChip(user);
  document.getElementById('navSlot').innerHTML = navHTML('admin', true);

  const adjBackdrop = document.getElementById('adjBackdrop');
  const adjSheet = document.getElementById('adjSheet');
  let targetKey = null;

  function refresh(){
    const stats = DB.globalStats();
    document.getElementById('stUsers').textContent = stats.totalUsers;
    document.getElementById('stSpins').textContent = stats.totalSpins;
    document.getElementById('stWagered').textContent = fmtCompact(stats.totalWagered);
    document.getElementById('stWon').textContent = fmtCompact(stats.totalWon);

    const users = DB.allUsers();
    document.getElementById('userCount').textContent = users.length + ' аккаунтов';
    document.getElementById('userList').innerHTML = users.map(u=>`
      <div class="user-row">
        <div class="user-avatar">${u.username.slice(0,2).toUpperCase()}</div>
        <div class="uinfo">
          <div class="uname">${u.username} ${u.isAdmin?'<span class="tag-admin">Admin</span>':''}</div>
          <div class="ubal">Баланс: ${fmtCompact(u.balance)} · ${u.stats.spins} вращений</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-key="${u.key}">Баланс</button>
      </div>
    `).join('');

    document.querySelectorAll('#userList button').forEach(btn=>{
      btn.onclick = ()=>{
        targetKey = btn.dataset.key;
        const u = users.find(x=>x.key===targetKey);
        document.getElementById('adjWho').textContent = `${u.username} · текущий баланс: ${fmt(u.balance)}`;
        document.getElementById('adjAmount').value = '';
        adjBackdrop.classList.add('show'); adjSheet.classList.add('show');
      };
    });
  }

  document.getElementById('btnCancelAdj').onclick = ()=>{
    adjBackdrop.classList.remove('show'); adjSheet.classList.remove('show');
  };
  adjBackdrop.onclick = ()=>{
    adjBackdrop.classList.remove('show'); adjSheet.classList.remove('show');
  };

  document.getElementById('btnApplyAdj').onclick = ()=>{
    const val = parseFloat(document.getElementById('adjAmount').value);
    if(isNaN(val) || val===0){ showToast('Введите число, отличное от нуля', 'err'); return; }
    const cur = DB.currentUser();
    const res = DB.adminAdjustBalance(targetKey, val, cur.key);
    if(res.ok){
      showToast('Баланс обновлён', 'ok');
      adjBackdrop.classList.remove('show'); adjSheet.classList.remove('show');
      refresh();
    } else {
      showToast(res.msg, 'err');
    }
  };

  refresh();
})();
