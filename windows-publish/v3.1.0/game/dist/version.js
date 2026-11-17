'use strict';
const GAME_VERSION='2.2.7'; // balance V6 uses the new 2.2.6 multiplayer protocol
const APP_VERSION='3.1.0';  // web and newly packaged desktop content
const IS_DESKTOP=!!window.chrome?.webview;
const REPORTED_DESKTOP_VERSION=window.__KEYBOARDHEROES_DESKTOP_VERSION||'';
const LEGACY_DESKTOP=IS_DESKTOP&&!/^\d+\.\d+\.\d+$/.test(REPORTED_DESKTOP_VERSION);
const DESKTOP_VERSION=LEGACY_DESKTOP?'0.0.0':IS_DESKTOP?REPORTED_DESKTOP_VERSION:APP_VERSION;
const CLIENT_VERSION=LEGACY_DESKTOP?'0.0.0':GAME_VERSION;
const clientVersionLabel=LEGACY_DESKTOP?'eski EXE':DESKTOP_VERSION;
const versionStatus=document.getElementById('version-status');
const versionDownload=document.getElementById('version-download');
// The live game release is independent of the Android APK version.
// Android's native WebView passes its installed APK version in /play?apk=...
// so the two different numbers cannot be confused. Never hard-code them in HTML.
const gameFooterBuild=document.getElementById('game-footer-build');
if(gameFooterBuild){
 const query=String(window.location?.search||'');
 const apkMatch=query.match(/(?:\?|&)apk=(\d+\.\d+\.\d+(?:-beta)?)(?:&|$)/);
 gameFooterBuild.textContent='Developer: Ozancan Aksu · Oyun v'+APP_VERSION+(apkMatch?' · APK v'+apkMatch[1]:'');
}
function compareVersions(left,right){
 const a=String(left).split('.').map(Number),b=String(right).split('.').map(Number);
 if(a.length!==3||b.length!==3||[...a,...b].some(n=>!Number.isSafeInteger(n)||n<0))return null;
 for(let i=0;i<3;i++)if(a[i]!==b[i])return a[i]>b[i]?1:-1;
 return 0;
}
function updateVersionStatus(serverProtocol,serverRelease){
 const protocolCheck=compareVersions(serverProtocol,CLIENT_VERSION);
 const releaseCheck=compareVersions(serverRelease||serverProtocol,DESKTOP_VERSION);
 const updateAvailable=IS_DESKTOP&&releaseCheck===1;
 versionDownload.classList.toggle('hidden',!updateAvailable);
 if(protocolCheck===1){versionStatus.textContent='Yeni sürüm '+serverProtocol+' gerekli · multiplayer protokolü';versionStatus.dataset.state='update';}
 else if(protocolCheck===-1){versionStatus.textContent='Sunucu protokolü '+serverProtocol+' eski · Bağlantı bekletildi';versionStatus.dataset.state='old-server';}
 else if(protocolCheck===0){
  versionStatus.textContent=updateAvailable?'Yeni masaüstü sürümü v'+serverRelease+' hazır · Sende v'+clientVersionLabel:'Keyboard Heroes v'+(IS_DESKTOP?DESKTOP_VERSION:APP_VERSION)+' · Uyumlu';
  versionStatus.dataset.state='ready';
 }else{versionStatus.textContent='Sunucu sürümü doğrulanamadı';versionStatus.dataset.state='unknown';}
 return protocolCheck===0;
}
versionStatus.textContent='Sürüm '+clientVersionLabel+' · Sunucu kontrol ediliyor…';
versionStatus.dataset.state='checking';
if(typeof fetch==='function')fetch('/version',{cache:'no-store'}).then(response=>{
 if(!response.ok)throw Error('version endpoint unavailable');
 return response.json();
}).then(info=>updateVersionStatus(info.version,info.release)).catch(()=>{
 versionStatus.textContent='Sürüm '+clientVersionLabel+' · Sunucu sürümü alınamadı';
 versionStatus.dataset.state='unknown';
});
