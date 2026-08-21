/* =========================================================================
   FIT CASINO — Local data layer
   Everything here runs client-side in localStorage. This is a play-money
   demo: there is no real payment processing and no way to withdraw funds.
   The FIRST account ever registered on a given browser/site deployment
   becomes the administrator automatically.
========================================================================= */

const DB_KEY = 'fitcasino_db_v1';
const SESSION_KEY = 'fitcasino_session_v1';
const START_BALANCE = 5000;

function loadDB(){
  try{
    const raw = localStorage.getItem(DB_KEY);
    if(!raw) return { users: {}, adminExists: false };
    return JSON.parse(raw);
  }catch(e){
    return { users: {}, adminExists: false };
  }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

// Simple non-cryptographic hash — fine for a client-only demo, NOT for real auth.
function simpleHash(str){
  let h = 2166136261;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h>>>0).toString(16);
}

const DB = {
  register(username, password){
    username = username.trim();
    if(username.length < 3) return { ok:false, msg:'Логин должен быть не короче 3 символов' };
    if(password.length < 4) return { ok:false, msg:'Пароль должен быть не короче 4 символов' };
    const db = loadDB();
    const key = username.toLowerCase();
    if(db.users[key]) return { ok:false, msg:'Такой логин уже занят' };
    const isFirst = !db.adminExists;
    db.users[key] = {
      username, passHash: simpleHash(password),
      balance: START_BALANCE,
      isAdmin: isFirst,
      createdAt: Date.now(),
      history: [],
      stats: { spins:0, wagered:0, won:0 }
    };
    if(isFirst) db.adminExists = true;
    saveDB(db);
    this.setSession(key);
    return { ok:true, isAdmin:isFirst };
  },

  login(username, password){
    const db = loadDB();
    const key = username.trim().toLowerCase();
    const u = db.users[key];
    if(!u || u.passHash !== simpleHash(password)){
      return { ok:false, msg:'Неверный логин или пароль' };
    }
    this.setSession(key);
    return { ok:true };
  },

  setSession(key){ localStorage.setItem(SESSION_KEY, key); },
  logout(){ localStorage.removeItem(SESSION_KEY); },

  currentUser(){
    const key = localStorage.getItem(SESSION_KEY);
    if(!key) return null;
    const db = loadDB();
    return db.users[key] ? { key, ...db.users[key] } : null;
  },

  requireAuth(){
    const u = this.currentUser();
    if(!u){ location.href = 'index.html'; return null; }
    return u;
  },

  updateUser(key, mutator){
    const db = loadDB();
    if(!db.users[key]) return null;
    mutator(db.users[key]);
    saveDB(db);
    return db.users[key];
  },

  recordSpin(key, {betTotal, win, slotName, feature}){
    return this.updateUser(key, (u)=>{
      u.balance = Math.max(0, +(u.balance - betTotal + win).toFixed(2));
      u.stats.spins += 1;
      u.stats.wagered = +(u.stats.wagered + betTotal).toFixed(2);
      u.stats.won = +(u.stats.won + win).toFixed(2);
      u.history.unshift({ t: Date.now(), slot: slotName, bet: betTotal, win, feature: feature||null });
      if(u.history.length > 60) u.history.length = 60;
    });
  },

  allUsers(){
    const db = loadDB();
    return Object.entries(db.users).map(([key,u])=>({key,...u}))
      .sort((a,b)=>b.createdAt - a.createdAt);
  },

  adminAdjustBalance(targetKey, delta, actorKey){
    const db = loadDB();
    const target = db.users[targetKey];
    const actor = db.users[actorKey];
    if(!target || !actor || !actor.isAdmin) return { ok:false, msg:'Нет доступа' };
    target.balance = Math.max(0, +(target.balance + delta).toFixed(2));
    target.history.unshift({ t: Date.now(), slot: 'Админ-корректировка', bet:0, win: delta, feature:'admin' });
    if(target.history.length > 60) target.history.length = 60;
    saveDB(db);
    return { ok:true, balance: target.balance };
  },

  globalStats(){
    const db = loadDB();
    const users = Object.values(db.users);
    return {
      totalUsers: users.length,
      totalWagered: users.reduce((s,u)=>s+u.stats.wagered,0),
      totalWon: users.reduce((s,u)=>s+u.stats.won,0),
      totalSpins: users.reduce((s,u)=>s+u.stats.spins,0),
    };
  }
};
