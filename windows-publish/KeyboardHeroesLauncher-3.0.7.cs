using System;
using System.Drawing;
using System.IO;
using System.Net;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Win32;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System.Collections.Generic;
using System.Linq;

[assembly: System.Reflection.AssemblyTitle("Keyboard Heroes Launcher")]
[assembly: System.Reflection.AssemblyProduct("Keyboard Heroes")]
[assembly: System.Reflection.AssemblyCompany("Ozancan Aksu")]
[assembly: System.Reflection.AssemblyVersion("3.0.7.0")]
namespace KeyboardHeroesDesktop
{
 internal static class Program
 {
  [STAThread] static void Main()
  {
   // .NET Framework WebClient must negotiate TLS 1.2 with modern HTTPS hosts.
   ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
   Application.EnableVisualStyles();
   Application.SetCompatibleTextRenderingDefault(false);
   try { Application.Run(new LauncherWindow()); }
   catch(Exception ex){MessageBox.Show(ex.Message,"Keyboard Heroes",MessageBoxButtons.OK,MessageBoxIcon.Error);}
  }
 }
 internal sealed class ReleaseInfo
 {
  public string version {get;set;}
  public string url {get;set;}
  public string sha256 {get;set;}
  public long size {get;set;}
 }
 internal sealed class LauncherWindow : Form
 {
  const string Version = "3.0.7";
  const string Site = "https://keyboardheroes.com.tr/";
  readonly WebView2 view = new WebView2();
  readonly JavaScriptSerializer json = new JavaScriptSerializer();
  bool checking,updateReady,playing,launchPending,closing;
  string language=ReadLanguage();
  string languageScript;
  public LauncherWindow()
  {
   Text="Keyboard Heroes — Launcher";
   BackColor=Color.FromArgb(18,36,44);ForeColor=Color.FromArgb(239,222,185);
   var usable=Screen.PrimaryScreen.WorkingArea;
   MinimumSize=new Size(Math.Min(830,usable.Width),Math.Min(600,usable.Height));
   Size=new Size(Math.Min(1050,usable.Width),Math.Min(760,usable.Height));
   FormBorderStyle=FormBorderStyle.Sizable;MaximizeBox=false;StartPosition=FormStartPosition.CenterScreen;
   view.Dock=DockStyle.Fill;Controls.Add(view);
   Shown+=async (s,e)=>await StartAsync();
   FormClosing+=(s,e)=>closing=true;
   KeyPreview=true;
   KeyDown+=(s,e)=>{if(playing&&e.Alt&&e.KeyCode==Keys.Enter){ToggleFullscreen();e.Handled=true;}};
  }
  static string ReadLanguage()
  {
   try{using(var key=Registry.CurrentUser.OpenSubKey(@"Software\KeyboardHeroes"))
   {string value=key==null?null:key.GetValue("Language") as string;
    if(value=="tr"||value=="en"||value=="de")return value;}}catch{}
   return "tr";
  }
  void SaveLanguage(string code)
  {
   if(code!="tr"&&code!="en"&&code!="de")return;
   language=code;
   try{using(var key=Registry.CurrentUser.CreateSubKey(@"Software\KeyboardHeroes"))key.SetValue("Language",code,RegistryValueKind.String);}catch{}
  }
  async Task InjectLanguageAsync()
  {
   if(view.CoreWebView2==null)return;
   if(!String.IsNullOrEmpty(languageScript))view.CoreWebView2.RemoveScriptToExecuteOnDocumentCreated(languageScript);
   languageScript=await view.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(
    "Object.defineProperty(window,'__KEYBOARDHEROES_LANGUAGE',{value:'"+language+"',configurable:false});"+
    "Object.defineProperty(window,'__KEYBOARDHEROES_DESKTOP_VERSION',{value:'"+Version+"',configurable:false});");
  }
  async Task StartAsync()
  {
   try
   {
    var profile=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"KeyboardHeroes","WebView2");
    Directory.CreateDirectory(profile);
    var environment=await CoreWebView2Environment.CreateAsync(null,profile);
    await view.EnsureCoreWebView2Async(environment);
    view.CoreWebView2.Settings.UserAgent=view.CoreWebView2.Settings.UserAgent+" KeyboardHeroesDesktop/"+Version;
    await InjectLanguageAsync();
    view.CoreWebView2.NewWindowRequested+=(s,e)=>{e.Handled=true;};
    view.CoreWebView2.NavigationStarting+=(s,e)=>{
     Uri uri;
     if(!Uri.TryCreate(e.Uri,UriKind.Absolute,out uri)||uri.Scheme!="https"||uri.Host!="keyboardheroes.com.tr"||!(uri.AbsolutePath=="/launcher"||uri.AbsolutePath=="/play"||uri.AbsolutePath=="/launcher.html"))e.Cancel=true;
    };
    view.CoreWebView2.WebMessageReceived+=async (s,e)=>{
     string command;
     try{command=e.TryGetWebMessageAsString();}catch{return;}
     if(command=="launcher-ready"||command=="launcher-retry"){if(!playing)await CheckUpdatesAsync();}
     else if(command.StartsWith("launcher-language:",StringComparison.Ordinal)){
      string code=command.Substring("launcher-language:".Length);
      if(code=="tr"||code=="en"||code=="de"){SaveLanguage(code);await InjectLanguageAsync();}
     }
     else if(command=="launcher-play"&&updateReady&&!playing&&!launchPending)LaunchGame();
     else if(command=="toggle-fullscreen"&&playing)ToggleFullscreen();
     else if(command=="enter-fullscreen"&&playing)SetFullscreen(true);
     else if(command=="exit-fullscreen"&&playing)SetFullscreen(false);
    };
    view.CoreWebView2.NavigationCompleted+=async (s,e)=>{
     if(launchPending&&view.Source!=null&&view.Source.AbsolutePath=="/play")
     {
      bool gameLoaded=e.IsSuccess;
      if(gameLoaded)
      {
       try
       {
        string result=await view.CoreWebView2.ExecuteScriptAsync(
         "Boolean(document.querySelector('#arena') && document.querySelector('.game-shell') && typeof net !== 'undefined')");
        gameLoaded=result=="true";
       }
       catch{gameLoaded=false;}
      }
      launchPending=false;
      if(gameLoaded)
      {
       playing=true;
       SetFullscreen(true);
      }
      else
      {
       playing=false;
       // Never trap the player in a fullscreen error page when /play fails.
       view.CoreWebView2.Navigate(Site+"launcher");
       MessageBox.Show(this,
        "Oyun sayfası yüklenemedi. Hesabınla tekrar giriş yapmayı deneyin. Sorun devam ederse yeni kurulum paketini yükleyin.\n\nGame page could not be loaded. Please retry sign-in or reinstall the latest launcher.",
        "Keyboard Heroes — Game launch failed",MessageBoxButtons.OK,MessageBoxIcon.Warning);
      }
      return;
     }
     if(!playing&&view.Source!=null&&view.Source.AbsolutePath=="/launcher")
     {
      await RunJsAsync("window.khLauncher&&window.khLauncher.setNativeVersion("+json.Serialize(Version)+")");
     }
    };
    view.Source=new Uri(Site+"launcher");
   }
   catch(Exception ex){MessageBox.Show(this,ex.Message,"Keyboard Heroes — Launcher",MessageBoxButtons.OK,MessageBoxIcon.Error);}
  }
  async Task RunJsAsync(string script)
  {
   if(closing||view.CoreWebView2==null)return;
   try{await view.CoreWebView2.ExecuteScriptAsync(script);}catch{}
  }
  async Task ReportAsync(string state,int percent,string message=null)
  {
   await RunJsAsync("window.khLauncher&&window.khLauncher.setUpdate("+json.Serialize(state)+","+percent+","+json.Serialize(message)+")");
  }
  async Task<string> ReadServerReleaseAsync()
  {
   // WebView2 successfully loaded our HTTPS page even when .NET Framework's
   // separate WebClient TLS connection fails. Query the same-origin version.
   if(view.CoreWebView2==null||view.Source==null||view.Source.Host!="keyboardheroes.com.tr")return null;
   try
   {
    string result=await view.CoreWebView2.ExecuteScriptAsync(
     "fetch('/version',{cache:'no-store',credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(v=>v&&v.release||null).catch(()=>null)");
    string release=json.Deserialize<string>(result);
    return Regex.IsMatch(release??"", @"^\d+\.\d+\.\d+$")?release:null;
   }
   catch{return null;}
  }
  // Candidate launchers may be one hotfix patch ahead of production.
  // Allow only the SAME major/minor family, with installed patch >= server patch.
  // A newer server still requires a verified update, and an unknown server
  // version must never bypass the update gate.
  static bool InstalledBuildCanPlay(string serverRelease)
  {
   if(!Regex.IsMatch(serverRelease??"", @"^\d+\.\d+\.\d+$"))return false;
   var installed=new System.Version(Version);
   var live=new System.Version(serverRelease);
   return installed.Major==live.Major && installed.Minor==live.Minor
    && installed.CompareTo(live)>=0;
  }
  string CompatibleVersionMessage(string serverRelease)
  {
   if(serverRelease==Version)return null;
   if(language=="de")return "Launcher v"+Version+" installiert; Server v"+serverRelease+". Spielen ist möglich.";
   if(language=="en")return "Launcher v"+Version+" installed; server v"+serverRelease+". You can play.";
   return "Launcher v"+Version+" kurulu; sunucu v"+serverRelease+". Oyun başlatılabilir.";
  }
  async Task<string> DownloadManifestAsync()
  {
   Exception nativeError=null;
   try
   {
    using(var client=new WebClient())
    {
     client.Headers[HttpRequestHeader.UserAgent]="KeyboardHeroesDesktop/"+Version;
     return await client.DownloadStringTaskAsync(new Uri(Site+"api/launcher/manifest"));
    }
   }
   catch(Exception ex){nativeError=ex;}
   // A fallback to WebView2's Chromium network stack fixes machines whose
   // framework HTTPS stack is broken, without relaxing manifest verification.
   try
   {
    if(view.CoreWebView2!=null&&view.Source!=null&&view.Source.Host=="keyboardheroes.com.tr")
    {
     string result=await view.CoreWebView2.ExecuteScriptAsync(
      "fetch('/api/launcher/manifest',{cache:'no-store',credentials:'same-origin'}).then(r=>r.ok?r.text():null).catch(()=>null)");
     string body=json.Deserialize<string>(result);
     if(!String.IsNullOrWhiteSpace(body))return body;
    }
   }
   catch{}
   throw nativeError??new InvalidOperationException("Cannot read update manifest.");
  }
  async Task CheckUpdatesAsync()
  {
   if(checking||closing||playing)return;
   checking=true;updateReady=false;
   Exception updateError=null;
   try
   {
    await ReportAsync("checking",0);
    // The server's active release is authoritative. Avoid blocking play when
    // GitHub's public release API is unavailable but this build is current.
    string serverRelease=await ReadServerReleaseAsync();
    if(InstalledBuildCanPlay(serverRelease))
    {
     updateReady=true;
     await ReportAsync("ready",100,CompatibleVersionMessage(serverRelease));
     return;
    }
    ReleaseInfo info=json.Deserialize<ReleaseInfo>(await DownloadManifestAsync());
    if(info==null||!Regex.IsMatch(info.version??"", @"^\d+\.\d+\.\d+$")||
      !Regex.IsMatch(info.sha256??"", @"^[a-fA-F0-9]{64}$")||
      info.url!="https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v"+info.version+"/KeyboardHeroes-Desktop-v"+info.version+".zip"||
      info.size<1000000||info.size>350000000)throw new InvalidOperationException("Invalid update manifest.");
    if(new System.Version(info.version)<=new System.Version(Version))
    {
     updateReady=true;await ReportAsync("ready",100);return;
    }
    await ReportAsync("downloading",1);
    string folder=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"KeyboardHeroes","Updates");
    Directory.CreateDirectory(folder);
    string zip=Path.Combine(folder,"KeyboardHeroes-Desktop-v"+info.version+".zip");
    if(File.Exists(zip)&&!VerifySha(zip,info.sha256))File.Delete(zip);
    if(!File.Exists(zip))
    {
     string temp=zip+".part";
     if(File.Exists(temp))File.Delete(temp);
     try
     {
      using(var client=new WebClient())
      {
       client.Headers[HttpRequestHeader.UserAgent]="KeyboardHeroesDesktop/"+Version;
       client.DownloadProgressChanged+=(s,e)=>{
        if(closing)return;
        BeginInvoke((Action)(()=>{Task ignored=ReportAsync("downloading",Math.Min(90,Math.Max(1,(int)(e.ProgressPercentage*.9))));}));
       };
       await client.DownloadFileTaskAsync(new Uri(info.url),temp);
      }
      if(new FileInfo(temp).Length!=info.size||!VerifySha(temp,info.sha256))throw new InvalidOperationException("Update SHA-256 verification failed.");
      File.Move(temp,zip);
     }
     finally{if(File.Exists(temp))File.Delete(temp);}
    }
    await ReportAsync("installing",94);
    string helper=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"KeyboardHeroesUpdater.exe");
    if(!File.Exists(helper))throw new InvalidOperationException("Updater missing. Reinstall Keyboard Heroes once.");
    string helperCopy=Path.Combine(folder,"KeyboardHeroesUpdater-"+Guid.NewGuid().ToString("N")+".exe");
    File.Copy(helper,helperCopy);
    var args="--apply "+Quote(AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\'))+" "+Quote(zip)+" "+Quote(info.sha256)+" "+Process.GetCurrentProcess().Id;
    Process.Start(new ProcessStartInfo(helperCopy,args){UseShellExecute=false,WorkingDirectory=folder});
    closing=true;Close();
   }
   catch(Exception ex){updateError=ex;}
   finally{checking=false;}
   if(updateError!=null)await HandleUpdateErrorAsync(updateError);
  }
  async Task HandleUpdateErrorAsync(Exception error)
  {
   // If GitHub is unavailable, allow play only when the server confirms
   // this installation is compatible and not older than the live release.
   try
   {
    string serverRelease=await ReadServerReleaseAsync();
    if(InstalledBuildCanPlay(serverRelease))
    {
     updateReady=true;
     await ReportAsync("ready",100,CompatibleVersionMessage(serverRelease));
     return;
    }
    using(var fallback=new WebClient())
    {
     string body=await fallback.DownloadStringTaskAsync(new Uri(Site+"version"));
     var info=json.Deserialize<Dictionary<string,object>>(body);
     string checkedRelease=info.ContainsKey("release")?Convert.ToString(info["release"]):null;
     if(InstalledBuildCanPlay(checkedRelease))
     {
      updateReady=true;
      await ReportAsync("ready",100,CompatibleVersionMessage(checkedRelease));
      return;
     }
    }
   }
   catch{}
   await ReportAsync("error",0,error.Message);
  }
  static string Quote(string s){return "\"" + s.Replace("\"","") + "\"";}
  static bool VerifySha(string file,string expected)
  {
   using(var stream=File.OpenRead(file))using(var sha=SHA256.Create())
   {return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-","").Equals(expected,StringComparison.OrdinalIgnoreCase);}
  }
  void LaunchGame()
  {
   if(launchPending||playing)return;
   // Navigate while the launcher is still framed. Fullscreen is enabled only
   // after the authenticated /play document and game scripts actually load.
   launchPending=true;
   view.CoreWebView2.Navigate(Site+"play");
  }
  void ToggleFullscreen(){SetFullscreen(FormBorderStyle!=FormBorderStyle.None);}
  void SetFullscreen(bool fullscreen)
  {
   if(!playing)return;
   SuspendLayout();
   if(fullscreen)
   {
    WindowState=FormWindowState.Normal;
    FormBorderStyle=FormBorderStyle.None;
    Bounds=Screen.FromControl(this).Bounds;
    // A borderless maximized WinForms window can use working-area bounds at
    // laptop DPI scaling. Use explicit monitor bounds instead.
   }
   else
   {
    WindowState=FormWindowState.Normal;
    FormBorderStyle=FormBorderStyle.Sizable;
    var work=Screen.FromControl(this).WorkingArea;
    Size=new Size(Math.Min(1050,work.Width),Math.Min(760,work.Height));StartPosition=FormStartPosition.CenterScreen;
    CenterToScreen();
   }
   ResumeLayout();
  }
 }
}
