/* =========================================================================
   FIT CASINO — Slot engine
   Pure math/state module (no DOM). One instance per game session.
========================================================================= */

class SlotEngine {
  constructor(slotDef){
    this.slot = slotDef;
    this.names = Object.keys(SYMBOL_WEIGHTS);
    this.weightTable = this.names.map(n=>SYMBOL_WEIGHTS[n]);
    this.totalWeight = this.weightTable.reduce((a,b)=>a+b,0);
  }

  _pick(){
    let r = Math.random() * this.totalWeight;
    for(let i=0;i<this.names.length;i++){
      r -= this.weightTable[i];
      if(r <= 0) return this.names[i];
    }
    return this.names[this.names.length-1];
  }

  // Draws a 5x3 grid: grid[reel][row]
  spinGrid(){
    const grid = [];
    for(let reel=0; reel<5; reel++){
      grid.push([this._pick(), this._pick(), this._pick()]);
    }
    return grid;
  }

  // Grid forced to contain an exact scatter count (used for Bonus Buy), scatters placed on random distinct cells.
  spinGridWithScatterCount(count){
    const grid = this.spinGrid();
    const cells = [];
    for(let reel=0; reel<5; reel++) for(let row=0; row<3; row++) cells.push([reel,row]);
    // shuffle
    for(let i=cells.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [cells[i],cells[j]]=[cells[j],cells[i]]; }
    // clear existing scatters first
    for(const [r,ro] of cells){ if(grid[r][ro]==='scat') grid[r][ro] = this.names[Math.floor(Math.random()*8)]; }
    for(let i=0;i<count;i++){ const [r,ro]=cells[i]; grid[r][ro]='scat'; }
    return grid;
  }

  // NOTE: `totalBet` is the full per-spin stake. Matching the tuned math
  // model, each of the 20 lines pays its multiplier against that same
  // total stake (lines are not required to be "activated" individually) —
  // this is exactly the model validated at 96.3% RTP in rtp_sim2.py.
  evaluateLines(grid, totalBet){
    const wins = [];
    PAYLINES.forEach((line, idx)=>{
      const syms = line.map((row,reel)=>grid[reel][row]);
      if(syms[0]==='scat') return;
      let target = syms[0];
      if(target === 'wild'){
        target = syms.find(s=>s!=='wild') || 'wild';
      }
      let count = 0;
      for(const s of syms){
        if(s===target || s==='wild') count++; else break;
      }
      if(count>=3){
        const amount = +(PAYTABLE[target][count-3] * totalBet).toFixed(2);
        const positions = line.slice(0,count).map((row,reel)=>[reel,row]);
        wins.push({ lineIndex:idx, symbol:target, count, amount, positions });
      }
    });
    return wins;
  }

  evaluateScatter(grid, totalBet){
    let count = 0; const positions = [];
    for(let reel=0; reel<5; reel++) for(let row=0; row<3; row++){
      if(grid[reel][row]==='scat'){ count++; positions.push([reel,row]); }
    }
    if(count>=3){
      const amount = +(PAYTABLE.scat[Math.min(count,5)-3] * totalBet).toFixed(2);
      return { count, amount, positions, freeSpins: FREE_SPINS_TABLE[Math.min(count,5)] };
    }
    return { count, amount:0, positions, freeSpins:0 };
  }

  // One full "spin" resolution: base grid + line wins + scatter (does not itself execute free spins)
  spin(totalBet){
    const grid = this.spinGrid();
    const lineWins = this.evaluateLines(grid, totalBet);
    const scatter = this.evaluateScatter(grid, totalBet);
    const lineTotal = lineWins.reduce((s,w)=>s+w.amount,0);
    const totalWin = +(lineTotal + scatter.amount).toFixed(2);
    return { grid, lineWins, scatter, totalWin };
  }

  // A single free-spin round draw (same paytable, no scatter->more-freespins retrigger handled by caller)
  freeSpin(totalBet){
    return this.spin(totalBet);
  }

  bonusBuyCost(totalBet){
    return +(totalBet * BONUS_BUY_MULTIPLIER).toFixed(2);
  }

  // Rolls a forced scatter-trigger grid per the documented distribution.
  spinBonusBuyTrigger(totalBet){
    const r = Math.random();
    let acc = 0, chosen = 3;
    for(const [n,p] of BONUS_BUY_SCATTER_DIST){ acc += p; if(r<=acc){ chosen = n; break; } }
    const grid = this.spinGridWithScatterCount(chosen);
    const lineWins = this.evaluateLines(grid, totalBet);
    const scatter = { count: chosen, amount:0, positions:[], freeSpins: FREE_SPINS_TABLE[chosen] };
    const totalWin = +(lineWins.reduce((s,w)=>s+w.amount,0)).toFixed(2);
    return { grid, lineWins, scatter, totalWin };
  }
}
