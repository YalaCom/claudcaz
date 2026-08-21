(function(){
  const user = guardAuth();
  if(!user) return;

  const params = new URLSearchParams(location.search);
  const slot = getSlot(params.get('slot'));
  if(!slot){ location.href = 'lobby.html'; return; }

  const engine = new SlotEngine(slot);

  renderWalletChip(user);
  document.getElementById('navSlot').innerHTML = navHTML('lobby', user.isAdmin);
  document.getElementById('gameName').textContent = slot.name;
  document.getElementById('gameRtp').textContent = `RTP ${THEORETICAL_RTP}% · ${VOLATILITY_MAP[slot.theme]} волатильность`;
  document.getElementById('hitFreqLbl').textContent = `Частота выплат ${HIT_FREQUENCY}%`;

  // ---------- state ----------
  let bet = 10;
  const BET_STEPS = [1,2,5,10,20,50,100,250,500,1000];
  let busy = false;
  let autospin = { active:false, remaining:0, selected:25 };
  let freeSpins = { active:false, remaining:0, totalWin:0, bet:0 };

  const reelsEl = document.getElementById('reels');
  const betValEl = document.getElementById('betVal');
  const btnSpin = document.getElementById('btnSpin');
  const fsPill = document.getElementById('fsPill');
  const fsCount = document.getElementById('fsCount');

  // ---------- build grid DOM ----------
  function buildReels(){
    reelsEl.innerHTML = '';
    for(let r=0;r<5;r++){
      const col = document.createElement('div');
      col.className = 'reel-col';
      for(let row=0; row<3; row++){
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.reel = r; cell.dataset.row = row;
        cell.innerHTML = renderSymbolSVG(randomName(), slot.theme);
        col.appendChild(cell);
      }
      reelsEl.appendChild(col);
    }
  }
  function randomName(){ return engine.names[Math.floor(Math.random()*engine.names.length)]; }
  buildReels();

  function updateBetUI(){ betValEl.textContent = fmt(bet); }
  updateBetUI();

  document.getElementById('betMinus').onclick = ()=>{
    if(busy) return;
    const i = BET_STEPS.indexOf(bet);
    if(i>0) bet = BET_STEPS[i-1];
    updateBetUI();
  };
  document.getElementById('betPlus').onclick = ()=>{
    if(busy) return;
    const i = BET_STEPS.indexOf(bet);
    if(i>=0 && i<BET_STEPS.length-1) bet = BET_STEPS[i+1];
    updateBetUI();
  };

  function setSpinUI(isBusy){
    document.getElementById('betMinus').disabled = isBusy;
    document.getElementById('betPlus').disabled = isBusy;
    document.getElementById('btnBonusBuy').style.pointerEvents = isBusy ? 'none' : 'auto';
    document.getElementById('btnAutoOpen').style.pointerEvents = isBusy ? 'none' : 'auto';
    if(!autospin.active) btnSpin.disabled = isBusy;
  }

  function updateFsPill(){
    if(freeSpins.active){
      fsPill.style.display = 'inline-block';
      fsCount.textContent = freeSpins.remaining;
    } else {
      fsPill.style.display = 'none';
    }
  }

  // ---------- reel animation ----------
  function animateAndReveal(grid, onDone){
    reelsEl.classList.add('spin-blur');
    const cols = reelsEl.querySelectorAll('.reel-col');
    cols.forEach((col, i)=>{
      const cells = col.querySelectorAll('.cell');
      const flicker = setInterval(()=>{
        cells.forEach(c=> c.innerHTML = renderSymbolSVG(randomName(), slot.theme));
      }, 55);
      setTimeout(()=>{
        clearInterval(flicker);
        cells.forEach((c,row)=>{
          c.innerHTML = renderSymbolSVG(grid[i][row], slot.theme);
          c.style.transform = 'scale(1.08)';
          setTimeout(()=> c.style.transform = 'scale(1)', 130);
        });
        if(i===cols.length-1){
          reelsEl.classList.remove('spin-blur');
          setTimeout(onDone, 100);
        }
      }, 360 + i*130);
    });
  }

  function applyWinHighlights(posSet){
    reelsEl.querySelectorAll('.cell').forEach(c=>{
      const key = c.dataset.reel+'_'+c.dataset.row;
      c.classList.toggle('win', posSet.has(key));
    });
    if(posSet.size>0){
      setTimeout(()=> reelsEl.querySelectorAll('.cell.win').forEach(c=>c.classList.remove('win')), 1500);
    }
  }

  function showWinBanner(amount, totalBet){
    const banner = document.getElementById('winBanner');
    const lbl = document.getElementById('winLbl');
    const amt = document.getElementById('winAmt');
    const mult = amount/totalBet;
    lbl.textContent = mult>=25 ? 'Мега выигрыш' : (mult>=10 ? 'Крупный выигрыш' : 'Выигрыш');
    amt.textContent = fmt(amount);
    banner.classList.add('show');
    setTimeout(()=> banner.classList.remove('show'), 1300);
  }

  function spawnCoinBurst(n){
    const layer = document.getElementById('burstLayer');
    const rect = reelsEl.getBoundingClientRect();
    const cx = rect.width/2, cy = rect.height/2;
    for(let i=0;i<n;i++){
      const coin = document.createElement('div');
      coin.className = 'coin';
      const angle = Math.random()*Math.PI*2;
      const dist = 60 + Math.random()*90;
      coin.style.left = cx+'px'; coin.style.top = cy+'px';
      coin.style.setProperty('--tx', `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist - 30}px)`);
      coin.style.animation = `coinburst ${600+Math.random()*400}ms ease-out forwards`;
      layer.appendChild(coin);
      setTimeout(()=> coin.remove(), 1100);
    }
  }

  // Purely cosmetic "cascade" flourish for tumble-tagged slots — winning
  // cells are redrawn with a fresh icon after the win is already paid.
  // This does NOT trigger a new evaluation or additional payout.
  function cosmeticTumble(posSet){
    if(posSet.size===0) return;
    setTimeout(()=>{
      posSet.forEach(key=>{
        const [r,row] = key.split('_');
        const cell = reelsEl.querySelector(`.cell[data-reel="${r}"][data-row="${row}"]`);
        if(!cell) return;
        cell.style.transition = 'opacity .18s ease';
        cell.style.opacity = '0';
        setTimeout(()=>{
          cell.innerHTML = renderSymbolSVG(randomName(), slot.theme);
          cell.style.opacity = '1';
        }, 180);
      });
    }, 550);
  }

  function revealAndSettle(result, totalBet){
    return new Promise(resolve=>{
      const posSet = new Set();
      result.lineWins.forEach(w=> w.positions.forEach(([r,c])=> posSet.add(r+'_'+c)));
      result.scatter.positions.forEach(([r,c])=> posSet.add(r+'_'+c));
      animateAndReveal(result.grid, ()=>{
        applyWinHighlights(posSet);
        if(result.totalWin>0){
          showWinBanner(result.totalWin, totalBet);
          spawnCoinBurst(Math.min(28, 6+Math.floor(result.totalWin/Math.max(totalBet,0.01))));
          if(slot.tumble) cosmeticTumble(posSet);
        }
        resolve();
      });
    });
  }

  // ---------- spin flow ----------
  async function doSpin(opts){
    opts = opts || {};
    if(busy) return;
    let cur = DB.currentUser();
    if(!cur){ location.href='index.html'; return; }

    if(opts.bonusBuy){
      const cost = engine.bonusBuyCost(bet);
      if(cur.balance < cost){ showToast('Недостаточно фишек для покупки бонуса', 'err'); return; }
      busy = true; setSpinUI(true);
      DB.recordSpin(cur.key, {betTotal:cost, win:0, slotName:slot.name, feature:'bonus_buy'});
      renderWalletChip(DB.currentUser());
      const result = engine.spinBonusBuyTrigger(bet);
      await revealAndSettle(result, bet);
      if(result.totalWin>0){
        DB.recordSpin(cur.key, {betTotal:0, win:result.totalWin, slotName:slot.name, feature:'bonus_buy_hit'});
        renderWalletChip(DB.currentUser());
      }
      busy = false; setSpinUI(false);
      showToast(`Бонус куплен: ${result.scatter.freeSpins} фриспинов`, 'ok');
      await runFreeSpins(result.scatter.freeSpins, bet);
      return;
    }

    const isFree = !!opts.free;
    const totalBet = isFree ? freeSpins.bet : bet;

    if(!isFree && cur.balance < bet){
      showToast('Недостаточно фишек. Пополните баланс в профиле.', 'err');
      stopAutospin();
      return;
    }

    busy = true; setSpinUI(true);
    const result = engine.spin(totalBet);

    if(isFree){
      DB.recordSpin(cur.key, {betTotal:0, win:result.totalWin, slotName:slot.name, feature:'free_spin'});
      freeSpins.totalWin += result.totalWin;
    } else {
      DB.recordSpin(cur.key, {betTotal:totalBet, win:result.totalWin, slotName:slot.name, feature:null});
    }
    renderWalletChip(DB.currentUser());

    await revealAndSettle(result, totalBet);

    if(result.scatter.count>=3){
      if(isFree){
        freeSpins.remaining += result.scatter.freeSpins;
        updateFsPill();
        showToast(`Ретригер! +${result.scatter.freeSpins} фриспинов`, 'ok');
      } else {
        busy = false; setSpinUI(false);
        showToast(`Бонус! ${result.scatter.freeSpins} фриспинов`, 'ok');
        await runFreeSpins(result.scatter.freeSpins, totalBet);
        return;
      }
    }

    busy = false; setSpinUI(false);

    if(isFree){
      freeSpins.remaining -= 1;
      updateFsPill();
      if(freeSpins.remaining > 0){
        setTimeout(()=> doSpin({free:true}), 650);
      } else {
        endFreeSpins();
      }
    } else if(autospin.active){
      continueAutospin();
    }
  }

  async function runFreeSpins(count, atBet){
    freeSpins = { active:true, remaining:count, totalWin:0, bet:atBet };
    updateFsPill();
    setTimeout(()=> doSpin({free:true}), 500);
  }

  function endFreeSpins(){
    const total = freeSpins.totalWin;
    freeSpins.active = false;
    updateFsPill();
    showToast(`Фриспины завершены. Общий выигрыш: ${fmt(total)}`, 'ok');
    if(autospin.active) continueAutospin();
  }

  // ---------- autospin ----------
  const autoBackdrop = document.getElementById('autoBackdrop');
  const autoSheet = document.getElementById('autoSheet');
  document.getElementById('btnAutoOpen').onclick = ()=> openSheet(autoBackdrop, autoSheet);
  autoBackdrop.onclick = ()=> closeSheet(autoBackdrop, autoSheet);
  document.querySelectorAll('.autospin-grid button').forEach(b=>{
    b.onclick = ()=>{
      document.querySelectorAll('.autospin-grid button').forEach(x=>x.classList.remove('sel'));
      b.classList.add('sel');
      autospin.selected = parseInt(b.dataset.n,10);
    };
  });
  document.getElementById('btnStartAuto').onclick = ()=>{
    closeSheet(autoBackdrop, autoSheet);
    autospin.active = true;
    autospin.remaining = autospin.selected;
    btnSpin.textContent = 'Стоп (' + autospin.remaining + ')';
    btnSpin.classList.add('autospin');
    btnSpin.disabled = false;
    if(!busy) doSpin();
  };
  function continueAutospin(){
    autospin.remaining -= 1;
    if(autospin.remaining<=0 || DB.currentUser().balance < bet){
      stopAutospin();
      return;
    }
    btnSpin.textContent = 'Стоп (' + autospin.remaining + ')';
    setTimeout(()=>{ if(autospin.active) doSpin(); }, 550);
  }
  function stopAutospin(){
    autospin.active = false;
    btnSpin.textContent = 'Крутить';
    btnSpin.classList.remove('autospin');
  }

  btnSpin.onclick = ()=>{
    if(autospin.active){ stopAutospin(); return; }
    doSpin();
  };

  // ---------- bonus buy ----------
  const bbBackdrop = document.getElementById('bbBackdrop');
  const bbSheet = document.getElementById('bbSheet');
  document.getElementById('btnBonusBuy').onclick = ()=>{
    const cost = engine.bonusBuyCost(bet);
    document.getElementById('bbDesc').textContent =
      `Мгновенный запуск бонусной игры (фриспины) без обычного вращения. Стоимость: ${fmt(cost)} фишек (×${BONUS_BUY_MULTIPLIER} от текущей ставки). RTP функции покупки соответствует общему RTP игры — ${THEORETICAL_RTP}%.`;
    openSheet(bbBackdrop, bbSheet);
  };
  bbBackdrop.onclick = ()=> closeSheet(bbBackdrop, bbSheet);
  document.getElementById('btnCancelBB').onclick = ()=> closeSheet(bbBackdrop, bbSheet);
  document.getElementById('btnConfirmBB').onclick = ()=>{
    closeSheet(bbBackdrop, bbSheet);
    doSpin({bonusBuy:true});
  };

  // ---------- paytable ----------
  const ptBackdrop = document.getElementById('ptBackdrop');
  const ptSheet = document.getElementById('ptSheet');
  document.getElementById('btnPaytable').onclick = ()=>{
    const roles = ['scat','wild','high','mid3','mid2','mid1','low4','low3','low2','low1'];
    document.getElementById('ptList').innerHTML = roles.map(role=>{
      const p = PAYTABLE[role];
      return `<div class="paytable-row">
        ${renderSymbolSVG(role, slot.theme)}
        <div class="pt-name">${slot.labels[role]}</div>
        <div class="pt-vals">×${p[0]} · ×${p[1]} · ×${p[2]}</div>
      </div>`;
    }).join('');
    openSheet(ptBackdrop, ptSheet);
  };
  ptBackdrop.onclick = ()=> closeSheet(ptBackdrop, ptSheet);

  function openSheet(bd, sh){ bd.classList.add('show'); sh.classList.add('show'); }
  function closeSheet(bd, sh){ bd.classList.remove('show'); sh.classList.remove('show'); }
})();
