(function(){
  // if already logged in, skip straight to lobby
  if(DB.currentUser()){ location.href = 'lobby.html'; return; }

  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  tabLogin.onclick = ()=>{
    tabLogin.classList.add('active'); tabRegister.classList.remove('active');
    loginForm.style.display='flex'; registerForm.style.display='none';
  };
  tabRegister.onclick = ()=>{
    tabRegister.classList.add('active'); tabLogin.classList.remove('active');
    registerForm.style.display='flex'; loginForm.style.display='none';
  };

  function setMsg(el, text, ok){
    el.textContent = text;
    el.className = 'form-msg show ' + (ok?'ok':'error');
  }

  loginForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const msg = document.getElementById('loginMsg');
    const res = DB.login(user, pass);
    if(res.ok){ location.href = 'lobby.html'; }
    else setMsg(msg, res.msg, false);
  });

  registerForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const user = document.getElementById('regUser').value;
    const pass = document.getElementById('regPass').value;
    const msg = document.getElementById('registerMsg');
    const res = DB.register(user, pass);
    if(res.ok){
      setMsg(msg, res.isAdmin ? 'Аккаунт создан. Вам присвоены права администратора!' : 'Аккаунт создан!', true);
      setTimeout(()=> location.href = 'lobby.html', 500);
    } else setMsg(msg, res.msg, false);
  });
})();
