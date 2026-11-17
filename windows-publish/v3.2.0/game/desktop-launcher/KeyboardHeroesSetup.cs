using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using Microsoft.Win32;
[assembly: AssemblyTitle("KeyboardHeroes Setup")]
[assembly: AssemblyProduct("KeyboardHeroes")]
[assembly: AssemblyCompany("Ozancan Aksu")]
[assembly: AssemblyVersion("3.2.0.0")]
internal sealed class SetupLanguageDialog : Form
{
    internal string SelectedCode { get { return choices[language.SelectedIndex]; } }
    private readonly ComboBox language = new ComboBox();
    private readonly Label description = new Label();
    private readonly Button confirm = new Button();
    private readonly Button cancel = new Button();
    private readonly string[] choices = { "tr", "en", "de" };
    private static string TextFor(string code, string tr, string en, string de)
    {
        return code == "de" ? de : code == "en" ? en : tr;
    }
    internal SetupLanguageDialog(string initial)
    {
        Text = "KeyboardHeroes — Setup / Kurulum / Installation";
        Size = new Size(490, 260);
        MinimumSize = MaximumSize = Size;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = MinimizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(28, 48, 61);
        ForeColor = Color.FromArgb(247, 232, 202);
        Font = new Font("Segoe UI", 10f, FontStyle.Regular);
        var header = new Label { Left = 24, Top = 19, Width = 420, Height = 31,
            Font = new Font("Segoe UI", 16, FontStyle.Bold),
            Text = "KEYBOARD HEROES" };
        var languageLabel = new Label { Left = 24, Top = 65, Width = 420, Height = 21,
            Text = "Language / Dil / Sprache" };
        language.Left = 24; language.Top = 90; language.Width = 420;
        language.DropDownStyle = ComboBoxStyle.DropDownList;
        language.Items.AddRange(new object[] { "Türkçe", "English", "Deutsch" });
        int idx = Array.IndexOf(choices, initial);
        language.SelectedIndex = idx < 0 ? 0 : idx;
        description.Left = 24; description.Top = 128; description.Width = 420; description.Height = 32;
        confirm.Left = 238; confirm.Top = 172; confirm.Width = 118; confirm.Height = 37;
        cancel.Left = 361; cancel.Top = 172; cancel.Width = 84; cancel.Height = 37;
        confirm.DialogResult = DialogResult.OK; cancel.DialogResult = DialogResult.Cancel;
        confirm.BackColor = Color.FromArgb(211, 155, 138); confirm.ForeColor = Color.FromArgb(28, 42, 53);
        cancel.BackColor = Color.FromArgb(48, 73, 87); cancel.ForeColor = Color.White;
        language.SelectedIndexChanged += delegate { UpdateLanguage(); };
        Controls.AddRange(new Control[] { header, languageLabel, language, description, confirm, cancel });
        AcceptButton = confirm; CancelButton = cancel;
        UpdateLanguage();
    }
    private void UpdateLanguage()
    {
        string code = SelectedCode;
        description.Text = TextFor(code, "Oyun ve kurulum dilini seçin.",
            "Choose the language for the game and installer.",
            "Wählen Sie die Sprache für das Spiel und die Installation.");
        confirm.Text = TextFor(code, "DEVAM ET", "CONTINUE", "WEITER");
        cancel.Text = TextFor(code, "İPTAL", "CANCEL", "ABBRECHEN");
    }
}
internal static class Setup
{
    private const string Preferences = @"Software\KeyboardHeroes";
    private static string Localized(string code, string tr, string en, string de)
    { return code == "de" ? de : code == "en" ? en : tr; }
    private static string ReadLanguage()
    {
        try { using (RegistryKey key = Registry.CurrentUser.OpenSubKey(Preferences))
        {
            string value = key == null ? null : key.GetValue("Language") as string;
            if (value == "tr" || value == "de" || value == "en") return value;
        }} catch {}
        string culture = System.Globalization.CultureInfo.CurrentUICulture.TwoLetterISOLanguageName;
        return culture == "tr" || culture == "de" ? culture : "en";
    }
    private static void CloseOldLaunchers(string code)
    {
        // A running old launcher can prevent replacing the EXE and keep the
        // ancient UI active even after an update appears to have completed.
        var running = new System.Collections.Generic.List<Process>();
        foreach (var name in new[] { "KeyboardHeroes", "KeyboardHeroesUpdater" })
            foreach (Process p in Process.GetProcessesByName(name))
                running.Add(p);
        if (running.Count == 0) return;
        if (MessageBox.Show(Localized(code,
             "Keyboard Heroes hâlâ çalışıyor. Kurulum için açık oyun ve güncelleyiciyi kapatmam gerekiyor. Devam edilsin mi? Kaydedilmemiş maç ilerlemesi kaybolabilir.",
             "Keyboard Heroes is running. Setup needs to close the game and updater. Continue? Unsaved match progress may be lost.",
             "Keyboard Heroes läuft noch. Setup muss das Spiel und den Updater schließen. Nicht gespeicherter Fortschritt kann verloren gehen."),
             "Keyboard Heroes — Setup", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) != DialogResult.Yes)
            throw new OperationCanceledException("Please close all Keyboard Heroes windows before installing.");
        foreach (var p in running)
        {
            try
            {
                if (p.HasExited) continue;
                p.CloseMainWindow();
                if (!p.WaitForExit(4500))
                {
                    p.Kill();
                    if (!p.WaitForExit(10000))
                        throw new IOException("Cannot close old Keyboard Heroes process: " + p.Id);
                }
            }
            catch (InvalidOperationException) { /* process already exited */ }
            finally { p.Dispose(); }
        }
    }
    private static string VerifiedLauncherPath(string target)
    {
        string executable = Path.Combine(target, "KeyboardHeroes.exe");
        if (!File.Exists(executable))
            throw new IOException("KeyboardHeroes.exe missing at " + executable);
        Version actual = AssemblyName.GetAssemblyName(executable).Version;
        if (actual == null || !actual.Equals(new Version("3.2.0.0")))
            throw new IOException("Installed launcher version mismatch at " + executable +
              ". Expected 3.2.0.0, found " + (actual == null ? "unknown" : actual.ToString()));
        return executable;
    }
    [STAThread]
    private static void Main(string[] args)
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        string target = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "KeyboardHeroes");
        string shortcut = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "KeyboardHeroes.lnk");
        string menu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "KeyboardHeroes.lnk");
        string key = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\KeyboardHeroes";
        string selected = ReadLanguage();
        try
        {
            if (args.Length > 0 && args[0] == "/uninstall")
            {
                if (MessageBox.Show(Localized(selected, "KeyboardHeroes kaldırılsın mı?", "Uninstall KeyboardHeroes?", "KeyboardHeroes deinstallieren?"),
                    "KeyboardHeroes", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
                foreach (string path in new[] { shortcut, menu }) if (File.Exists(path)) File.Delete(path);
                Registry.CurrentUser.DeleteSubKeyTree(key, false);
                string script = Path.Combine(Path.GetTempPath(), "KeyboardHeroes-remove-" + Guid.NewGuid().ToString("N") + ".cmd");
                File.WriteAllText(script, "@echo off\r\ntimeout /t 3 /nobreak >nul\r\nrmdir /s /q \"" + target + "\"\r\ndel \"%~f0\"\r\n");
                Process.Start(new ProcessStartInfo("cmd.exe", "/c \"" + script + "\"")
                { CreateNoWindow = true, UseShellExecute = false, WindowStyle = ProcessWindowStyle.Hidden });
                return;
            }
            using (var dialog = new SetupLanguageDialog(selected))
            {
                if (dialog.ShowDialog() != DialogResult.OK) return;
                selected = dialog.SelectedCode;
            }
            string folderMessage = Localized(selected, "Kurulum klasörü:", "Installation folder:", "Installationsordner:");
            string installPrompt = Localized(selected, "Kurulumu başlat?", "Start installation?", "Installation starten?");
            if (MessageBox.Show("KeyboardHeroes\nDeveloper: Ozancan Aksu\n\n" + folderMessage + "\n" + target + "\n\n" + installPrompt,
                "KeyboardHeroes", MessageBoxButtons.OKCancel, MessageBoxIcon.Question) != DialogResult.OK) return;
            CloseOldLaunchers(selected);
            Directory.CreateDirectory(target);
            using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("payload"))
            {
                if (stream == null) throw new InvalidOperationException("Missing installer payload.");
                using (var zip = new ZipArchive(stream, ZipArchiveMode.Read))
                {
                    foreach (var entry in zip.Entries)
                    {
                        string dest = Path.GetFullPath(Path.Combine(target, entry.FullName));
                        if (!dest.StartsWith(target + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                            throw new InvalidOperationException("Invalid package entry.");
                        if (entry.Name.Length == 0) { Directory.CreateDirectory(dest); continue; }
                        Directory.CreateDirectory(Path.GetDirectoryName(dest));
                        entry.ExtractToFile(dest, true);
                    }
                }
            }
            string verifiedLauncher = VerifiedLauncherPath(target);
            // Uninstall.exe may still be running or held open by antivirus or
            // an older installation. It is not needed to launch the updated game.
            // Do not abort an otherwise successful install solely because the
            // existing uninstaller cannot be replaced right now.
            string uninstallPath = Path.Combine(target, "Uninstall.exe");
            try
            {
                if (!String.Equals(Path.GetFullPath(Application.ExecutablePath),
                    Path.GetFullPath(uninstallPath), StringComparison.OrdinalIgnoreCase))
                    File.Copy(Application.ExecutablePath, uninstallPath, true);
            }
            catch (IOException)
            {
                if (!File.Exists(uninstallPath)) throw;
            }
            catch (UnauthorizedAccessException)
            {
                if (!File.Exists(uninstallPath)) throw;
            }
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            dynamic shell = Activator.CreateInstance(shellType);
            foreach (string link in new[] { shortcut, menu })
            {
                dynamic item = shell.CreateShortcut(link);
                item.TargetPath = verifiedLauncher;
                item.WorkingDirectory = target;
                item.IconLocation = Path.Combine(target, "KeyboardHeroes.exe") + ",0";
                item.Description = "KeyboardHeroes — Ozancan Aksu";
                item.Save();
            }
            using (RegistryKey reg = Registry.CurrentUser.CreateSubKey(key))
            {
                reg.SetValue("DisplayName", "KeyboardHeroes");
                reg.SetValue("Publisher", "Ozancan Aksu");
                reg.SetValue("DisplayVersion", "3.2.0");
                reg.SetValue("InstallLocation", target);
                reg.SetValue("DisplayIcon", verifiedLauncher);
                reg.SetValue("UninstallString", "\"" + Path.Combine(target, "Uninstall.exe") + "\" /uninstall");
            }
            // Persist installation language before starting the desktop launcher.
            using (RegistryKey preferences = Registry.CurrentUser.CreateSubKey(Preferences))
                preferences.SetValue("Language", selected, RegistryValueKind.String);
            string done = Localized(selected,
                "3.2.0 kurulumu doğrulandı. Kurulan dosya: " + verifiedLauncher + "\n\nOyunu şimdi buradan açalım mı? Görev çubuğunda eski 2.5.x simgesi varsa sabitlemesini kaldır.",
                "3.2.0 install verified. Launcher: " + verifiedLauncher + "\n\nOpen this copy now? Unpin an old 2.5.x taskbar shortcut if needed.",
                "3.2.0 installiert. Launcher: " + verifiedLauncher + "\n\nJetzt öffnen? Alte Taskleistenverknüpfung lösen.");
            if (MessageBox.Show(done, "Keyboard Heroes v3.2.0", MessageBoxButtons.YesNo, MessageBoxIcon.Information) == DialogResult.Yes)
                Process.Start(new ProcessStartInfo(verifiedLauncher) { WorkingDirectory = target, UseShellExecute = true });
        }
        catch (Exception error)
        {
            MessageBox.Show(Localized(selected, "İşlem tamamlanamadı: ", "Operation failed: ", "Vorgang fehlgeschlagen: ") + error.Message,
                "KeyboardHeroes", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
