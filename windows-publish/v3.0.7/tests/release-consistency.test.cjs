'use strict';
// Fail CI if the website, launcher, release notes or build pipeline diverge.
// The source repository's historical GitHub Releases are intentionally ignored.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const pkg=JSON.parse(read('package.json'));
const version=pkg.version;
const escaped=version.replace(/\./g,'\\.');
const match=(file,re,label)=>assert.match(read(file),re,label||file);
assert.match(version,/^\d+\.\d+\.\d+$/);
match('server.cjs',new RegExp("const APP_VERSION='"+escaped+"'"),'server must advertise package release');
match('desktop-launcher/KeyboardHeroesLauncher.cs',new RegExp('const string Version = "'+escaped+'"'),'launcher must match server release');
match('desktop-launcher/KeyboardHeroesLauncher.cs',new RegExp('AssemblyVersion\\("'+escaped+'\\.0"\\)'),'native EXE assembly version must match real C# launcher Version constant');
match('desktop-launcher/KeyboardHeroesSetup.cs',new RegExp('new Version\\("'+escaped+'\\.0"\\)'),'installer must validate the installed native EXE version rather than only the Control Panel registry');

match('dist/launcher.html',new RegExp('v'+escaped),'website launcher must show current release');
match('dist/home.html',new RegExp('v'+escaped),'website home must show current release');
match('dist/version.js',new RegExp(escaped),'website version must match');
match('.github/workflows/publish-desktop.yml',new RegExp('v'+escaped),'publisher must target current release');
match('.github/workflows/publish-desktop.yml',new RegExp('build-'+escaped.replace(/\\\./g,'\\.')+'\\.ps1'),'publisher must build current release');
match('release-manifest.cjs',/api\.github\.com\/repos\/OzancanAksu\/KeyboardHeroes-Downloads\/releases\/latest/,'update feed must use public releases only');
match('server.cjs',/KeyboardHeroes-Downloads\/releases\/download\/v/,'downloads must use public releases only');
const workflow=read('.github/workflows/publish-desktop.yml');
assert.ok(!workflow.includes('--repo "${{ github.repository }}"'),'never publish to private source repository');
assert.ok(!workflow.includes('--clobber'),'published immutable update packages must never be overwritten');
const manifest=require('./release-manifest.cjs');
const pinned=manifest.VERIFIED_RELEASES[version];
if(pinned){
 assert.equal(pinned.version,version);
 assert.equal(pinned.url,'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v'+version+'/KeyboardHeroes-Desktop-v'+version+'.zip');
 assert.match(pinned.sha256,/^[a-f0-9]{64}$/);
 assert.ok(pinned.size>1000000);
}
console.log('PASS: one public download source; server, website, launcher and publisher aligned at v'+version);
