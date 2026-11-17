using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: System.Reflection.AssemblyTitle("Keyboard Heroes Updater")]
[assembly: System.Reflection.AssemblyVersion("3.0.8.0")]
internal sealed class UpdateWindow : Form
{
 readonly ProgressBar progress=new ProgressBar();
 readonly Label title=new Label(),message=new Label(),percent=new Label();
 readonly string install,zip,expected;readonly int oldPid;
 public UpdateWindow(string[] args)
 {
  if(args.Length!=5||args[0]!="--apply"||!int.TryParse(args[4],out oldPid))throw new ArgumentException("Invalid updater arguments.");
  install=Path.GetFullPath(args[1]);zip=Path.GetFullPath(args[2]);expected=args[3];
  if(!System.Text.RegularExpressions.Regex.IsMatch(expected,@"^[a-f0-9]{64}$",System.Text.RegularExpressions.RegexOptions.IgnoreCase))throw new ArgumentException("Invalid SHA256.");
  Text="Keyboard Heroes — Update";Size=new Size(560,240);MinimumSize=MaximumSize=Size;
  FormBorderStyle=FormBorderStyle.FixedDialog;ControlBox=false;StartPosition=FormStartPosition.CenterScreen;
  BackColor=Color.FromArgb(25,47,58);ForeColor=Color.FromArgb(241,224,190);Font=new Font("Segoe UI",11f);
  title.SetBounds(24,24,490,40);title.Text="KEYBOARD HEROES · UPDATE";title.Font=new Font("Segoe UI",16,FontStyle.Bold);
  message.SetBounds(24,84,490,30);message.Text="Preparing verified update…";
  progress.SetBounds(24,135,445,19);progress.Minimum=0;progress.Maximum=100;progress.Value=0;progress.Style=ProgressBarStyle.Continuous;
  percent.SetBounds(475,130,65,28);percent.Text="0%";
  Controls.AddRange(new Control[]{title,message,progress,percent});
  Shown+=async(s,e)=>await RunAsync();
 }
 void ShowProgress(int value,string detail)
 {
  if(IsDisposed||!IsHandleCreated)return;
  if(InvokeRequired){BeginInvoke((Action)(()=>ShowProgress(value,detail)));return;}
  progress.Value=Math.Max(0,Math.Min(100,value));percent.Text=progress.Value+"%";message.Text=detail;
 }
 static readonly string LogPath=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"KeyboardHeroes","Updates","updater-history.log");
 static void Log(string message)
 {
  try{Directory.CreateDirectory(Path.GetDirectoryName(LogPath));
   File.AppendAllText(LogPath,DateTime.UtcNow.ToString("u")+" "+message+Environment.NewLine);}catch{}
 }
 static string TargetVersion(string filename)
 {
  var match=Regex.Match(Path.GetFileName(filename),@"^KeyboardHeroes-Desktop-v(\d+\.\d+\.\d+)\.zip$",RegexOptions.IgnoreCase);
  if(!match.Success)throw new InvalidOperationException("Invalid update ZIP filename.");
  return match.Groups[1].Value;
 }
 static void VerifyManagedVersion(string executable,string version)
 {
  if(!File.Exists(executable))throw new InvalidOperationException("Update launcher executable is missing.");
  var actual=AssemblyName.GetAssemblyName(executable).Version;
  if(actual==null||!actual.Equals(new Version(version+".0")))
   throw new InvalidOperationException("Launcher version mismatch: required "+version+", found "+(actual==null?"unknown":actual.ToString())+".");
 }
 static string Hash(string file)
 {
  using(var sha=SHA256.Create())using(var stream=File.OpenRead(file))
   return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-","").ToLowerInvariant();
 }
 async Task RunAsync()
 {
  try
  {
   await Task.Run(()=>Apply());
   ShowProgress(100,"Update complete. Starting Keyboard Heroes…");
   await Task.Delay(500);
   using(var key=Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\KeyboardHeroes"))
   {
    var name=Path.GetFileNameWithoutExtension(zip);
    var v=name.Replace("KeyboardHeroes-Desktop-v","");
    if(new System.Text.RegularExpressions.Regex(@"^\d+\.\d+\.\d+$").IsMatch(v))key.SetValue("DisplayVersion",v);
   }
   Log("Completed update; starting "+Path.Combine(install,"KeyboardHeroes.exe"));

   Process.Start(new ProcessStartInfo(Path.Combine(install,"KeyboardHeroes.exe")){WorkingDirectory=install,UseShellExecute=true});
   Close();
  }
  catch(Exception ex)
  {
   Log("FAILED "+ex.GetType().Name+": "+ex.Message);

   MessageBox.Show(this,"Update failed. Existing game files were restored where possible.\n\n"+ex.Message+"\n\nIf this repeats, run the official KeyboardHeroesSetup.exe. Log: "+LogPath,"Keyboard Heroes",MessageBoxButtons.OK,MessageBoxIcon.Error);
   Close();
  }
 }
 void Apply()
 {
  if(!File.Exists(zip)||Hash(zip)!=expected)throw new InvalidOperationException("Update archive SHA-256 mismatch.");
  var targetVersion=TargetVersion(zip);
  Log("Applying version "+targetVersion+" to "+install+" from "+zip);
  var exe=Path.Combine(install,"KeyboardHeroes.exe");
  if(!File.Exists(exe))throw new InvalidOperationException("Installation directory is invalid.");
  ShowProgress(2,"Waiting for the game to close…");
  try{using(var p=Process.GetProcessById(oldPid)){if(!p.WaitForExit(30000))throw new InvalidOperationException("Close the game before updating.");}}catch(ArgumentException){}
  var workspace=Path.Combine(Path.GetDirectoryName(zip),"Stage-"+Guid.NewGuid().ToString("N"));
  var staging=Path.Combine(workspace,"staging");
  var backup=Path.Combine(workspace,"backup");
  Directory.CreateDirectory(staging);Directory.CreateDirectory(backup);
  var changed=new List<string>();var created=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
  bool success=false;
  try
  {
   var entries=new List<ZipArchiveEntry>();
   using(var archive=ZipFile.OpenRead(zip))
   {
    long total=0;var seen=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    foreach(var entry in archive.Entries)
    {
     if(entry.Name.Length==0)continue;
     string name=entry.FullName.Replace('/','\\');
     string path=Path.GetFullPath(Path.Combine(staging,name));
     if(!path.StartsWith(staging+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase)||
       name.IndexOf(':')>=0||name.StartsWith("\\")||!seen.Add(name))throw new InvalidOperationException("Unsafe update archive path.");
     total+=entry.Length;
     if(total>1000000000L||seen.Count>3500)throw new InvalidOperationException("Update archive exceeds safety limits.");
     entries.Add(entry);
    }
    if(!seen.Contains("KeyboardHeroes.exe")||!seen.Contains("KeyboardHeroesUpdater.exe")||!seen.Contains("dist\\index.html"))
     throw new InvalidOperationException("Incomplete game package.");
    int i=0;
    foreach(var entry in entries)
    {
     string dest=Path.Combine(staging,entry.FullName.Replace('/','\\'));
     Directory.CreateDirectory(Path.GetDirectoryName(dest));
     entry.ExtractToFile(dest);
     i++;if(i%10==0||i==entries.Count)ShowProgress(5+(int)(i*40.0/entries.Count),"Unpacking verified game files…");
    }
   }
   var stagedExe=Path.Combine(staging,"KeyboardHeroes.exe");
   VerifyManagedVersion(stagedExe,targetVersion);
   Log("Staged version verified "+targetVersion+" sha256="+Hash(stagedExe));
   int j=0;
   foreach(var source in Directory.GetFiles(staging,"*",SearchOption.AllDirectories))
   {
    string relative=source.Substring(staging.Length+1);
    string dest=Path.GetFullPath(Path.Combine(install,relative));
    if(!dest.StartsWith(install.TrimEnd('\\')+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))
     throw new InvalidOperationException("Invalid destination path.");
    if(File.Exists(dest)&&Hash(dest)==Hash(source)){j++;continue;}
    string old=Path.Combine(backup,relative);
    if(File.Exists(dest)){Directory.CreateDirectory(Path.GetDirectoryName(old));File.Copy(dest,old,true);}
    else created.Add(dest);
    changed.Add(dest);
    Directory.CreateDirectory(Path.GetDirectoryName(dest));
    File.Copy(source,dest,true);
    j++;ShowProgress(45+(int)(j*53.0/entries.Count),"Installing updated files…");
   }
   // The updater must never report success if the executable on disk is stale.
   VerifyManagedVersion(exe,targetVersion);
   if(Hash(exe)!=Hash(stagedExe))throw new InvalidOperationException("Installed launcher hash mismatch.");
   Log("Installed version verified "+targetVersion+" at "+exe);
   success=true;
  }
  catch
  {
   ShowProgress(40,"Restoring previous files…");
   foreach(var dest in changed.AsEnumerable().Reverse())
   {
    try{
     if(created.Contains(dest)){if(File.Exists(dest))File.Delete(dest);}
     else{
      var relative=dest.Substring(install.TrimEnd('\\').Length+1);
      var old=Path.Combine(backup,relative);
      if(File.Exists(old))File.Copy(old,dest,true);
     }
    }catch{}
   }
   throw;
  }
  finally
  {
   try{Directory.Delete(workspace,true);}catch{}
   if(success)try{File.Delete(zip);}catch{}
  }
 }
}
internal static class UpdaterProgram
{
 [STAThread] static void Main(string[] args)
 {
  Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);
  try{Application.Run(new UpdateWindow(args));}
  catch(Exception ex){MessageBox.Show(ex.Message,"Keyboard Heroes Updater",MessageBoxButtons.OK,MessageBoxIcon.Error);}
 }
}
