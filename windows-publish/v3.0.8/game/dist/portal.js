'use strict';
(()=>{
 const $=id=>document.getElementById(id),isLauncher=document.body.dataset.page==='launcher';
 const androidLauncher=isLauncher&&/^\/android-launcher(?:\.html)?\/?$/.test(location.pathname);
 const labels={
 tr:{language:'DİL',eyebrow:'◈ ARENA · MASAÜSTÜ',title:'Efsaneni <em>başlat.</em>',intro:'Oyuna girmek için hesabınla oturum aç. Güncellemeler giriş yapmadan otomatik yüklenir.',account:'01 / OYUNCU HESABI',loginTitle:'Arenaya geri dön.',registerTitle:'Efsaneni başlat.',login:'GİRİŞ YAP',register:'KAYIT OL',username:'KULLANICI ADI',password:'ŞİFRE',noEmail:'E-posta gerekmez. Yalnızca kullanıcı adı ve şifre.',readyToPlay:'Hesabın doğrulandı. Arenaya hazırsın.',play:'▶ OYUNU BAŞLAT',logout:'ÇIKIŞ YAP',whatsNew:'Son yenilikler',windows:'WINDOWS MASAÜSTÜ · GÜVENLİ HESAP',checking:'Güncellemeler kontrol ediliyor…',retry:'TEKRAR DENE',ready:'Oyun güncel. Giriş yapıp oynayabilirsin.',download:'Güncelleme indiriliyor…',install:'Dosyalar hazırlanıyor…',error:'Güncelleme kontrolü başarısız. Tekrar dene.',welcome:'Hoş geldin, ',pending:'İşlem yapılıyor…',bad:'İşlem başarısız.',offline:'Hesap servisine erişilemiyor.'},
 en:{language:'LANGUAGE',eyebrow:'◈ ARENA · DESKTOP',title:'Begin your <em>legend.</em>',intro:'Sign in to play. Updates download and install automatically before you sign in.',account:'01 / PLAYER ACCOUNT',loginTitle:'Welcome back to the arena.',registerTitle:'Begin your legend.',login:'SIGN IN',register:'REGISTER',username:'USERNAME',password:'PASSWORD',noEmail:'No email required. Only a username and password.',readyToPlay:'Account verified. You are ready for the arena.',play:'▶ LAUNCH GAME',logout:'SIGN OUT',whatsNew:'What’s new',windows:'WINDOWS DESKTOP · SECURE ACCOUNT',checking:'Checking for updates…',retry:'TRY AGAIN',ready:'Game is up to date. Sign in to play.',download:'Downloading update…',install:'Preparing files…',error:'Update check failed. Please retry.',welcome:'Welcome, ',pending:'Please wait…',bad:'Request failed.',offline:'Account service is unavailable.'},
 de:{language:'SPRACHE',eyebrow:'◈ ARENA · DESKTOP',title:'Beginne deine <em>Legende.</em>',intro:'Melde dich an, um zu spielen. Updates werden schon vor der Anmeldung automatisch heruntergeladen und installiert.',account:'01 / SPIELERKONTO',loginTitle:'Willkommen zurück in der Arena.',registerTitle:'Beginne deine Legende.',login:'ANMELDEN',register:'REGISTRIEREN',username:'BENUTZERNAME',password:'PASSWORT',noEmail:'Keine E-Mail erforderlich. Nur Benutzername und Passwort.',readyToPlay:'Konto bestätigt. Du bist bereit für die Arena.',play:'▶ SPIEL STARTEN',logout:'ABMELDEN',whatsNew:'Neuigkeiten',windows:'WINDOWS DESKTOP · SICHERES KONTO',checking:'Updates werden gesucht…',retry:'ERNEUT VERSUCHEN',ready:'Spiel ist aktuell. Melde dich an.',download:'Update wird heruntergeladen…',install:'Dateien werden vorbereitet…',error:'Updateprüfung fehlgeschlagen. Bitte erneut versuchen.',welcome:'Willkommen, ',pending:'Bitte warten…',bad:'Anfrage fehlgeschlagen.',offline:'Kontodienst nicht verfügbar.'}
 };
 if(window.KeyboardHeroesAndroid){
  Object.assign(labels.tr,{eyebrow:'◈ ARENA · ANDROID TABLET',intro:'Tabletten oynamak için hesabınla giriş yap. Oyun verileri güncel sunucudan yüklenir.',windows:'ANDROID TABLET · GÜVENLİ HESAP'});
  Object.assign(labels.en,{eyebrow:'◈ ARENA · ANDROID TABLET',intro:'Sign in to play on your tablet. Game content loads from the live server.',windows:'ANDROID TABLET · SECURE ACCOUNT'});
  Object.assign(labels.de,{eyebrow:'◈ ARENA · ANDROID TABLET',intro:'Melde dich für das Tablet-Spiel an. Spieldaten werden vom aktiven Server geladen.',windows:'ANDROID-TABLET · SICHERES KONTO'});
 }
 const androidNotes={
  tr:['Android APK güncelleme kontrolü ve sürüm bildirimi','Güvenli SHA-256 doğrulaması ve Android kurulum onayı','Maç sonu: Tekrar Oyna, Ana Menü ve istatistikler','Rekabetçi 3v3, 4v4, 5v5 · 120 sn maça dönüş','Gerçek Q hasarı: Üçlü Ok 113, Ağır Ok 171 · Yeni Arcana envanter teması','Eşya detayı → eşya listesi → ana ekran: iki aşamalı Geri'],
  en:['Android APK update checks and version alerts','Safe SHA-256 verification and Android installer confirmation','Match results: Replay, Main Menu and statistics','Ranked 3v3, 4v4, 5v5 · 120s reconnect','Correct Q damage: Triple Arrow 113, Heavy Arrow 171 · Arcana inventory gallery','Two-stage Back: item details → item list → home'],
  de:['Android-APK-Updateprüfung und Versionshinweise','Sichere SHA-256-Prüfung und Android-Installationsbestätigung','Spielergebnis: Erneut spielen, Hauptmenü und Statistik','Rangliste 3v3, 4v4, 5v5 · Wiederbeitritt in 120 Sek.','Korrekte Q-Werte: Dreifachpfeil 113, Schwerer Pfeil 171 · Arcana-Inventar','Zurück: Gegenstandsdetails → Liste → Startseite']
 };
 const defaultNotes={
 tr:['Masaüstü başlatıcı ve zorunlu hesap girişi','Otomatik güncelleme ve ilerleme çubuğu','Türkçe, İngilizce ve Almanca dil seçimi','Günlük çevrimiçi ilk 10 sıralaması'],
 en:['Desktop launcher with required sign-in','Automatic updates and progress bar','Turkish, English and German language selection','Daily top 10 online leaderboard'],
 de:['Desktop-Launcher mit verpflichtender Anmeldung','Automatische Updates mit Fortschrittsbalken','Sprachauswahl: Türkisch, Englisch, Deutsch','Tägliche Online-Top-10']
 };
 let lang=['tr','en','de'].includes(window.__KEYBOARDHEROES_LANGUAGE)?window.__KEYBOARDHEROES_LANGUAGE:(localStorage.getItem('kh-language')||'tr');
 if(!labels[lang])lang='tr';
 let mode='login',user=null,ready=!isLauncher,manifest=null,updateState='checking',updatePercent=0,updateDetail=null,autoLaunch=false;
 const native=message=>{try{if(window.KeyboardHeroesAndroid?.postMessage)window.KeyboardHeroesAndroid.postMessage(message);else window.chrome?.webview?.postMessage(message);}catch{}};
 // HTML release notes are NOT the installed EXE version. If the same
 // native launcher returns after we hand off an update, stop automatic
 // repeated downloads. The player can explicitly retry or repair shortcuts.
 const nativeVersion=typeof window.__KEYBOARDHEROES_DESKTOP_VERSION==='string'
  && /^\d+\.\d+\.\d+$/.test(window.__KEYBOARDHEROES_DESKTOP_VERSION)
  ? window.__KEYBOARDHEROES_DESKTOP_VERSION:null;
 const installAttemptKey=isLauncher&&!androidLauncher&&nativeVersion?'kh-desktop-install-attempt-'+nativeVersion:null;
 function installAttemptAge(){
  if(!installAttemptKey)return Infinity;
  try{
   const stamp=Number(localStorage.getItem(installAttemptKey));
   return Number.isFinite(stamp)&&stamp>0?Date.now()-stamp:Infinity;
  }catch{return Infinity;}
 }
 function markNativeInstallAttempt(){
  if(!installAttemptKey)return;
  try{localStorage.setItem(installAttemptKey,String(Date.now()));}catch{}
 }
 function showStaleLauncherWarning(){
  ready=false;updateState='error';updatePercent=0;
  updateDetail=lang==='en'
   ?'Repeated update detected: Windows still runs launcher v'+nativeVersion+'. Close all Keyboard Heroes windows, then open %LOCALAPPDATA%\\Programs\\KeyboardHeroes\\KeyboardHeroes.exe directly. Unpin any older taskbar icon.'
   :lang==='de'
   ?'Update-Schleife: Launcher v'+nativeVersion+' läuft weiterhin. Alle Fenster schließen, %LOCALAPPDATA%\\Programs\\KeyboardHeroes\\KeyboardHeroes.exe direkt öffnen und alte Taskleistenverknüpfung lösen.'
   :'Güncelleme döngüsü algılandı: Windows hâlâ v'+nativeVersion+' çalıştırıyor. Tüm Keyboard Heroes pencerelerini kapatıp %LOCALAPPDATA%\\Programs\\KeyboardHeroes\\KeyboardHeroes.exe dosyasını doğrudan aç. Eski görev çubuğu sabitlemesini kaldır.';
  $('update-message').textContent=updateDetail;
  $('update-percent').textContent='0%';$('update-fill').style.width='0%';
  $('update-track').setAttribute('aria-valuenow','0');
  $('retry-update').hidden=false;
  updateAccount();
 }
 const msg=key=>labels[lang][key]||labels.tr[key];
 function translate(){
  if(!isLauncher)return;
  document.documentElement.lang=lang;
  for(const el of document.querySelectorAll('[data-i18n]')){
   const key=el.dataset.i18n;
   if(el.id==='update-message')continue;
   if(key==='title')el.innerHTML=msg(key);else if(el.id==='auth-submit'&&mode==='register')el.textContent=msg('register');else el.textContent=msg(key);
  }
  $('launcher-lang').value=lang;
  $('welcome').textContent=user?msg('welcome')+user.username:msg(mode==='register'?'registerTitle':'loginTitle');
  $('tab-login').classList.toggle('primary',mode==='login');
  $('tab-register').classList.toggle('primary',mode==='register');
  $('auth-submit').textContent=msg(mode==='register'?'register':'login');
  renderNotes();
  if($('update-message'))$('update-message').textContent=updateDetail||msg(({ready:'ready',downloading:'download',installing:'install',error:'error',checking:'checking'})[updateState]||'checking');
 }
 function renderNotes(){
  const target=$('release-notes');if(!target)return;
  const notes=androidLauncher?androidNotes[lang]:(manifest?.notes?.[lang]?.length?manifest.notes[lang]:defaultNotes[lang]);
  target.replaceChildren(...notes.slice(0,7).map(value=>{const li=document.createElement('li');li.textContent=value;return li;}));
  if(manifest&&!androidLauncher&&$('release-version'))$('release-version').textContent='v'+manifest.version;
 }
 async function json(path,options){
  const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
   const err=new Error(path.startsWith('/api/leaderboard')&&typeof data.message==='string'?data.message:data.error||msg('bad'));
   err.code=typeof data.error==='string'?data.error:'';
   throw err;
  }
  return data;
 }
 async function auth(action,body){
  return json('/api/account/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 }
 function updateAccount(){
  if(isLauncher){
   $('signed-in').hidden=!user;$('signed-out').hidden=!!user;
   $('player-name').textContent=user?user.username:'';
   $('play').disabled=!ready||!user;
   translate();
  }else{
   $('account-status').hidden=!user;
   $('account-status').textContent=user?user.username:'';
   $('open-login').hidden=!!user;$('open-register').hidden=!!user;$('logout').hidden=!user;
  }
 }
 function setMode(value){
  mode=value;$('auth-error').textContent='';
  $('auth-password').autocomplete=value==='register'?'new-password':'current-password';
  $('tab-login').classList.toggle('primary',value==='login');$('tab-register').classList.toggle('primary',value==='register');
  if(isLauncher)translate();
  else{$('auth-heading').textContent=value==='register'?'Yeni hesap oluştur':'Hesabına giriş yap';$('auth-submit').textContent=value==='register'?'KAYIT OL':'GİRİŞ YAP';}
 }
 async function loadAccount(){
  try{
   const config=await json('/api/account/config');
   if(!config.loginRequired)throw Error(msg('offline'));
   const data=await json('/api/account/me');
   user=data.user||null;
  }catch(e){user=null;if(isLauncher)$('auth-error').textContent=e.message;}
  updateAccount();
  if(!isLauncher)refreshAdminAccess();
 }
 function initAuth(){
  $('tab-login').onclick=()=>setMode('login');$('tab-register').onclick=()=>setMode('register');
  $('auth-form').onsubmit=async event=>{
   event.preventDefault();const button=$('auth-submit');button.disabled=true;$('auth-error').textContent=msg('pending');
   try{
    const result=await auth(mode,{username:$('auth-name').value.trim(),password:$('auth-password').value});
    user=result.user;$('auth-password').value='';$('auth-error').textContent='';
    if(!isLauncher)$('auth-modal').hidden=true;
    else autoLaunch=true;
    updateAccount();
    if(!isLauncher)refreshAdminAccess();
    if(isLauncher&&ready&&autoLaunch){autoLaunch=false;native('launcher-play');}
   }catch(e){$('auth-error').textContent=e.message;}
   finally{button.disabled=false;}
  };
  $('logout').onclick=async()=>{
   try{await auth('logout',{});user=null;updateAccount();if(!isLauncher)refreshAdminAccess();}
   catch(e){if(isLauncher)$('auth-error').textContent=e.message;}
  };
  if(isLauncher){
   $('launcher-lang').value=lang;
   $('launcher-lang').onchange=()=>{lang=$('launcher-lang').value;localStorage.setItem('kh-language',lang);native('launcher-language:'+lang);translate();};
   $('play').onclick=()=>{if(ready&&user)native('launcher-play');};
   $('retry-update').onclick=()=>{window.khLauncher.setUpdate('checking',0);native('launcher-retry');};
   translate();
  }else{
   const open=tab=>{$('auth-modal').hidden=false;setMode(tab);$('auth-name').focus();};
   $('open-login').onclick=()=>open('login');$('open-register').onclick=()=>open('register');
   $('close-auth').onclick=()=>{$('auth-modal').hidden=true;};
   $('auth-modal').onclick=e=>{if(e.target===$('auth-modal'))$('auth-modal').hidden=true;};
   document.addEventListener('keydown',e=>{if(e.key==='Escape')$('auth-modal').hidden=true;});
  }
  loadAccount();
 }
 async function loadManifest(){
  try{manifest=await json('/api/launcher/manifest');renderNotes();}
  catch{renderNotes();}
 }
 async function loadAndroidRelease(){
  if(!androidLauncher&&!$('download-android'))return;
  try{
   const data=await json('/api/android/latest');
   if(!/^\d+\.\d+\.\d+$/.test(data.version)||!['beta','stable'].includes(data.channel))return;
   const label='v'+data.version+(data.channel==='beta'?'-beta':'');
   if(androidLauncher){
    if($('release-version'))$('release-version').textContent='Android '+label;
   }else{
    const button=$('download-android'),status=$('download-status');
    if(button)button.textContent='↓ ANDROID APK '+label+' · TELEFON/TABLET';
    if(status)status.textContent='Windows 64-bit · Android 8.0+ telefon/tablet · Android '+label+' · '+(data.channel==='stable'?'Kararlı sürüm':'Beta sürüm')+' · APK güncelleme kontrolü · Ücretsiz';
   }
  }catch{
   // Retain the verified, published stable APK fallback already shown by HTML.
  }
 }
 const boardLoading=new Set(),boardLastSuccess=new Map();
 const BOARD_REFRESH_MS=60000,BOARD_FETCH_TIMEOUT_MS=15000;
 function boardTime(value,includeDate=false){
  const date=value instanceof Date?value:new Date(value);
  if(!Number.isFinite(date.getTime()))return '';
  return new Intl.DateTimeFormat('tr-TR',{
   timeZone:'Europe/Istanbul',
   ...(includeDate?{day:'2-digit',month:'2-digit',year:'numeric'}:{}),
   hour:'2-digit',minute:'2-digit'
  }).format(date);
 }
 async function loadQueue(queue){
  const ranked=queue==='competitive',key=ranked?'competitive':'normal';
  const target=$(ranked?'competitive-body':'leaderboard-body');
  const status=$(ranked?'competitive-updated':'board-updated');
  const demoBadge=$(key+'-demo');
  if(!target||!status||!demoBadge||boardLoading.has(key))return;
  boardLoading.add(key);
  const controller=new AbortController();
  const deadline=setTimeout(()=>controller.abort(),BOARD_FETCH_TIMEOUT_MS);
  try{
   const data=await json('/api/leaderboard?queue='+queue,{signal:controller.signal});
   if(!Array.isArray(data.players))throw Error('Sıralama yanıtı geçersiz.');
   target.replaceChildren();
   demoBadge.hidden=data.demo!==true;
   if(!data.players.length){
    const tr=document.createElement('tr'),td=document.createElement('td');
    td.colSpan=5;td.textContent='Henüz tamamlanmış '+(ranked?'rekabetçi':'online')+' maç kaydı yok.';
    tr.append(td);target.append(tr);
   }else for(const player of data.players){
    const tr=document.createElement('tr');
    for(const value of [player.rank,player.username,player.wins,player.kills,player.matches]){
     const td=document.createElement('td');td.textContent=String(value);tr.append(td);
    }
    target.append(tr);
   }
   const checkedAt=Date.now();
   boardLastSuccess.set(key,checkedAt);
   const checkedLabel='Son kontrol: '+boardTime(checkedAt);
   if(data.demo===true){
    status.textContent=checkedLabel+' · DEMO · Gerçek skor değil · Türkiye saati';
   }else{
    const lastMatch=data.asOf?boardTime(data.asOf,true):'';
    status.textContent=checkedLabel+' · '+(lastMatch?'Son gerçek maç: '+lastMatch:'Henüz gerçek maç yok')+' · Türkiye saati';
   }
  }catch(error){
   // A temporary timeout or network error must not replace the last known-good table.
   const lastSuccess=boardLastSuccess.get(key);
   if(lastSuccess){
    status.textContent='Yenileme başarısız · Son başarılı kontrol: '+boardTime(lastSuccess)+
     ' · Tekrar deneyin';
   }else{
    target.replaceChildren();demoBadge.hidden=true;
    const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=5;cell.textContent=[
     'leaderboard_not_configured','leaderboard_schema_missing',
     'leaderboard_schema_outdated','leaderboard_database_access_denied',
     'leaderboard_unavailable'
    ].includes(error.code)?error.message:
     'Sıralama yüklenemedi. YENİLE düğmesine basarak tekrar dene.';
    row.append(cell);target.append(row);
    status.textContent='Bağlantı hatası · sonuçlar gösterilemiyor';
   }
  }finally{
   clearTimeout(deadline);
   boardLoading.delete(key);
  }
 }
 function loadBoard(){return Promise.all([loadQueue('normal'),loadQueue('competitive')]);}
 async function refreshAdminAccess(){
  const panel=$('admin-tools');
  if(!panel)return;
  panel.hidden=true;
  if(!user)return;
  try{
   const response=await json('/api/leaderboard/admin/me');
   if(response.admin&&user){panel.hidden=false;loadAdminPlayers();}
  }catch{}
 }
 async function adminCommand(action,body={}){
  const status=$('admin-status'),refresh=$('admin-refresh'),reset=$('admin-reset');
  if(!status)return;
  refresh.disabled=reset.disabled=true;
  status.textContent='İşlem sunucuda doğrulanıyor…';
  try{
   const response=await json('/api/leaderboard/admin/'+action,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
   });
   if(!response.ok)throw Error('İşlem tamamlanamadı.');
   const removed=response.removed||{};
   status.textContent=action==='reset'?
    'Sıralamalar sıfırlandı: '+(Number(removed.match_rows_deleted)||0)+
    ' gerçek maç kaydı ve '+(Number(removed.demo_rows_deleted)||0)+
    ' DEMO kaydı silindi. Oyuncu hesapları ve kayıtlı buildler korundu.':
    'İki sıralama şimdi yeniden hesaplandı.';
   await loadBoard();await loadAdminPlayers();
  }catch(err){status.textContent=err.message||'İşlem başarısız';}
  finally{refresh.disabled=reset.disabled=false;}
 }
 let adminPlayersLoading=false,adminPlayerBusy=false;
 async function loadAdminPlayers(){
  const table=$('admin-players-body'),panel=$('admin-tools');
  if(!table||!panel||panel.hidden||adminPlayersLoading)return;
  adminPlayersLoading=true;
  try{
   const data=await json('/api/leaderboard/admin/players');
   if(!Array.isArray(data.players))throw Error('Oyuncu listesi alınamadı');
   table.replaceChildren();
   if(!data.players.length){
    const tr=document.createElement('tr'),td=document.createElement('td');
    td.colSpan=4;td.textContent='Henüz kayıtlı oyuncu yok.';tr.append(td);table.append(tr);
   }
   const makeCell=(tr,value)=>{
    const td=document.createElement('td');td.textContent=value;tr.append(td);return td;
   };
   const stats=(player,queue)=>{
    const real=player[queue]||{wins:0,kills:0,matches:0};
    const demo=player.demo?.[queue];
    let label=real.wins+'G / '+real.kills+'K · '+real.matches+' maç';
    if(demo&&(real.matches===0))label+=' | DEMO '+demo.wins+'G '+demo.kills+'K';
    return label;
   };
   for(const player of data.players){
    const tr=document.createElement('tr');
    makeCell(tr,player.username);
    makeCell(tr,stats(player,'normal'));
    makeCell(tr,stats(player,'competitive'));
    const actions=document.createElement('td'),row=document.createElement('div');
    row.className='kh-player-actions';
    const protectedUser=player.username.toLowerCase()==='oxy';
    if(protectedUser){row.textContent='Yönetici hesap korunuyor';}
    else for(const [action,label] of [
     ['kills','KILL SIFIRLA'],['wins','GALİBİYET SIFIRLA'],
     ['both','İKİSİNİ SIFIRLA'],['delete','HESAP SİL']
    ]){
     const b=document.createElement('button');
     b.type='button';b.textContent=label;b.dataset.playerAction=action;
     b.dataset.id=player.id;b.dataset.username=player.username;
     b.className='pill kh-player-action'+(action==='delete'?' kh-player-delete':'');
     row.append(b);
    }
    actions.append(row);tr.append(actions);table.append(tr);
   }
  }catch(error){
   table.replaceChildren();
   const tr=document.createElement('tr'),td=document.createElement('td');
   td.colSpan=4;td.textContent='Oyuncular yüklenemedi: '+error.message;
   tr.append(td);table.append(tr);
  }finally{adminPlayersLoading=false;}
 }
 async function managePlayer(button){
  if(adminPlayerBusy||!button)return;
  const id=button.dataset.id,username=button.dataset.username;
  const metric=button.dataset.playerAction,deleting=metric==='delete';
  const queue=deleting?'all':$('admin-player-queue').value;
  const action=deleting?'delete_account':'reset_stats';
  if(!/^[a-f0-9-]{36}$/i.test(id)||!username||!['all','normal','competitive'].includes(queue))return;
  const intro=deleting?
   username+' hesabını KALICI OLARAK SİLECEKSİN. Oturumları, build kayıtları, tüm maç sonuçları ve DEMO puanları silinir. Geri alınamaz.':
   username+' için '+(metric==='kills'?'KILL':metric==='wins'?'GALİBİYET':'KILL VE GALİBİYET')+
    ' istatistiklerini '+(queue==='all'?'NORMAL + REKABETÇİ':queue.toUpperCase())+
    ' sıralamasında sıfırlayacaksın. Maç adedi korunur, işlem kaydedilir.';
  if(!confirm(intro+'\n\nDevam etmek istiyor musun?'))return;
  const expected=(deleting?'SIL ':'SIFIRLA ')+username;
  // Double confirmation without Android's keyboard-covering prompt dialog.
  if(!confirm('SON ONAY: '+expected+'\n\n'+(deleting?
   'Hesap, oturumlar, buildler ve tüm skorlar kalıcı silinecek.':
   'Seçilen istatistikler geri alınamayacak biçimde sıfırlanacak.')+
   '\n\nİşlemi onaylıyor musun?'))return;
  adminPlayerBusy=true;
  const status=$('admin-status');
  status.textContent='Oyuncu işlemi gerçekleştiriliyor…';
  try{
   const result=await json('/api/leaderboard/admin/manage',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     targetId:id,username,action,queue,metric:deleting?'all':metric,
     confirmation:expected
    })
   });
   if(!result.ok)throw Error('Sunucu işlemi reddetti');
   status.textContent=deleting?username+' hesabı silindi.':
    username+' istatistikleri sıfırlandı ('+(queue==='all'?'iki sıralama':queue)+').';
   await loadBoard();await loadAdminPlayers();
  }catch(error){status.textContent='İşlem başarısız: '+error.message;}
  finally{adminPlayerBusy=false;}
 }
 function installAdminActions(){
  const refresh=$('admin-refresh'),reset=$('admin-reset');
  if(!refresh||!reset)return;
  refresh.onclick=()=>adminCommand('refresh');
  if($('admin-players-reload'))$('admin-players-reload').onclick=loadAdminPlayers;
  if($('admin-players-body'))$('admin-players-body').onclick=event=>{
   const button=event.target.closest('button[data-player-action]');
   if(button)managePlayer(button);
  };
  reset.onclick=()=>{
   if(!confirm('Normal ve rekabetçi GERÇEK maç istatistikleri kalıcı silinecek. Hesaplar ve build kayıtları korunur. Devam edilsin mi?'))return;
   // An explicit second confirmation protects destructive operations on mobile.
   if(!confirm('SON ONAY: HER İKİ SIRALAMADAKİ TÜM MAÇ VE DEMO SONUÇLARI KALICI SİLİNECEK.\n\nKesin olarak sıfırlamak istiyor musun?'))return;
   adminCommand('reset',{confirmation:'SIFIRLA'});
  };
 }

 if(!isLauncher && window.chrome?.webview && !window.__KEYBOARDHEROES_DESKTOP_VERSION){
  const legacy=$('legacy-upgrade');
  if(legacy)legacy.hidden=false;
 }
 if(isLauncher){
  window.khLauncher={
   setNativeVersion(v){if(/^\d+\.\d+\.\d+$/.test(v))$('installed-version').textContent='v'+v;},
   setUpdate(state,percent,detail){
    const p=Math.max(0,Math.min(100,Number(percent)||0));
    ready=state==='ready';updateState=state;updatePercent=p;updateDetail=detail;
    if(state==='installing')markNativeInstallAttempt();
    if(ready&&user&&autoLaunch){autoLaunch=false;native('launcher-play');}
    $('update-fill').style.width=p+'%';$('update-track').setAttribute('aria-valuenow',String(p));$('update-percent').textContent=Math.round(p)+'%';
    $('update-message').textContent=detail||msg(({ready:'ready',downloading:'download',installing:'install',error:'error',checking:'checking'})[state]||'checking');
    $('retry-update').hidden=state!=='error';
    updateAccount();
   },
   setManifest(data){if(data&&typeof data==='object'){manifest=data;renderNotes();}}
  };
  initAuth();loadManifest();loadAndroidRelease();
  if(installAttemptAge()<30*60*1000)showStaleLauncherWarning();
  else native('launcher-ready');
 }else{
  initAuth();loadManifest();loadAndroidRelease();loadBoard();
  if($('leaderboard-retry'))$('leaderboard-retry').onclick=loadBoard;
  if($('competitive-retry'))$('competitive-retry').onclick=loadBoard;
  installAdminActions();
  // Background tabs and sleeping laptops can throttle timers. Refresh as soon
  // as the page becomes visible again if the previous check is a minute old.
  function refreshBoardOnReturn(){
   if(document.hidden)return;
   const oldest=Math.min(boardLastSuccess.get('normal')||0,boardLastSuccess.get('competitive')||0);
   if(Date.now()-oldest>=BOARD_REFRESH_MS)loadBoard();
  }
  document.addEventListener('visibilitychange',refreshBoardOnReturn);
  window.addEventListener('focus',refreshBoardOnReturn);
  window.addEventListener('pageshow',refreshBoardOnReturn);
  setInterval(loadBoard,60000);
 }
})();
