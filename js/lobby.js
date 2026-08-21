(function(){
  const user = guardAuth();
  if(!user) return;
  renderWalletChip(user);
  document.getElementById('navSlot').innerHTML = navHTML('lobby', user.isAdmin);

  const grid = document.getElementById('slotGrid');
  const countLbl = document.getElementById('countLbl');

  function matches(slot, filter){
    if(filter==='all') return true;
    if(filter==='hit') return slot.tag === 'Хит недели';
    if(filter==='new') return slot.tag === 'Новинка';
    if(filter==='tumble') return slot.tumble;
    return true;
  }

  function render(filter){
    const list = SLOT_CATALOG.filter(s=>matches(s,filter));
    countLbl.textContent = list.length + ' игр';
    grid.innerHTML = list.map(slot=>`
      <div class="slot-card" data-id="${slot.id}">
        <div class="slot-art" style="background:linear-gradient(160deg, ${themeBg(slot.theme)})">
          <span class="slot-badge">${slot.tag}</span>
          ${renderSymbolSVG('high', slot.theme)}
        </div>
        <div class="slot-meta">
          <div class="name">${slot.name}</div>
          <div class="sub"><span>RTP ${THEORETICAL_RTP}%</span><span>${VOLATILITY_MAP[slot.theme]}</span></div>
        </div>
      </div>
    `).join('');
    grid.querySelectorAll('.slot-card').forEach(card=>{
      card.onclick = ()=> location.href = 'play.html?slot=' + card.dataset.id;
    });
  }

  function themeBg(theme){
    const map = {
      pharaoh:'#3a2a0f, #1a1330', thunder:'#2a1a4a, #120d22', candy:'#4a1a35, #1a1330',
      frontier:'#3a2410, #1a1330', dragon:'#4a1414, #1a1330', pirate:'#0f2a3a, #120d22', fruit:'#1f3a1a, #120d22'
    };
    return map[theme] || '#241a40, #120d22';
  }

  document.querySelectorAll('.filter-chip').forEach(chip=>{
    chip.onclick = ()=>{
      document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      render(chip.dataset.f);
    };
  });

  render('all');
})();
