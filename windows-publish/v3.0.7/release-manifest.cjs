'use strict';
const RELEASES='https://api.github.com/repos/OzancanAksu/KeyboardHeroes-Downloads/releases/latest';
const VERSION=/^\d+\.\d+\.\d+$/;
const CHANGES={
 '3.0.7':{
  tr:['Bağımsız Deneme Odası: 10.000 can ve saniyede 50 can yenileyen sabit eğitim hedefi','Hedef öldürülürse 5 saniye sonra yenisi gelir; süre, raund ve rekabetçi kayıt yok','Anlık can, son 5 saniye DPS, toplam hasar, en yüksek vuruş ve imha sayısı gösterilir','Mühür Kılıcı, Kıvılcım Topuzu ve Pusula Hançeri için dengeli ikinci el pasifleri eklendi; eski pasif can açıklamaları düzeltildi'],
  en:['Standalone training room: stationary 10,000 HP target regenerating 50 HP per second','Dummy respawns five seconds after a kill; no match clock, rounds or ranked records','Live HP, trailing 5-second DPS, total damage, best hit and kill counter','Added balanced offhand passives for Rune Blade, Spark Mace and Compass Dagger; corrected legacy offhand HP tooltips'],
  de:['Separater Testraum mit festem 10.000-LP-Ziel und 50 LP Regeneration pro Sekunde','Neues Ziel fünf Sekunden nach dem Abschuss; keine Runden, Zeitbegrenzung oder Rangliste','Live-LP, DPS der letzten fünf Sekunden, Gesamtschaden, bester Treffer und Abschüsse','Drei passende Nebenhand-Passive ergänzt und bisherige LP-Beschreibungen korrigiert']
 },
 '3.0.6':{
  tr:['Windows launcher gerçek C# kaynak kodundan yeniden derlendi; içeride 2.5.21 olarak kalan sürüm sabiti düzeltildi','Yayın kontrolü EXE başlık sürümü ile gerçek LauncherWindow.Version sabitinin ikisinin de 3.0.6 olduğunu doğruluyor','Tekrarlayan güncelleme döngüsü giderildi; bot maçı istatistik düzeltmesi ve multiplayer 2.2.7 korundu'],
  en:['Rebuilt Windows launcher from current C# source to fix native version constant left at 2.5.21','Release CI verifies both assembly version and actual LauncherWindow.Version constant equal 3.0.6','Stops repeated updates; retains bot-match statistics fix and multiplayer protocol 2.2.7'],
  de:['Windows-Launcher neu aus C#-Quellcode kompiliert und alte Versionskonstante 2.5.21 behoben','CI prüft sowohl Assembly-Version als auch LauncherWindow.Version auf 3.0.6','Update-Schleife behoben; Bot-Statistikkorrektur und Multiplayer-Protokoll 2.2.7 bleiben erhalten']
 },
 '3.0.5':{
  tr:['Kurulum açık kalan eski KeyboardHeroes ve Updater işlemlerini algılar, kapatmak için izin ister','Kopyalama sonrasında gerçek KeyboardHeroes.exe dosyasının 3.0.5 sürümünü doğrular, kısayolları düzeltir ve kurulum yolunu gösterir','Bot maçı istatistik düzeltmesi, Windows güncelleme doğrulaması ve multiplayer 2.2.7 korunur'],
  en:['Setup detects running KeyboardHeroes and Updater processes, asking for permission to close them','Verifies installed KeyboardHeroes.exe is really version 3.0.5, refreshes shortcuts and reports the installed path','Retains bot match statistics, updater checks and multiplayer protocol 2.2.7'],
  de:['Setup erkennt laufende alte KeyboardHeroes- und Updater-Prozesse und bittet um Erlaubnis zum Schließen','Prüft nach der Installation die tatsächliche Version 3.0.5 und korrigiert Verknüpfungen','Bot-Statistiken, Update-Prüfung und Multiplayer-Protokoll 2.2.7 bleiben erhalten']
 },
 '3.0.4':{
  tr:['Windows kurulumunda önceki Uninstall.exe dosyasına erişim reddedilirse mevcut dosya korunarak kurulum devam eder','Windows güncelleme doğrulaması ve bot istatistik düzeltmesi korunur'],
  en:['Windows setup now tolerates an existing locked Uninstall.exe while keeping the previous uninstaller','Retains verified updater and bot match statistics fixes'],
  de:['Windows-Setup setzt bei gesperrter vorhandener Uninstall.exe fort und erhält die bisherige Deinstallation','Updater-Prüfung und Bot-Statistikkorrektur bleiben erhalten']
 },
 '3.0.3':{
  tr:['Windows güncelleyicisinde indirme/kurulum döngüsü için kurulu EXE sürümü ve SHA-256 doğrulaması eklendi','Güncelleme hataları yerel tanılama günlüğüne kaydedilir; eski sürüm yanlışlıkla başarılı sayılmaz','Bot maçı istatistik düzeltmesi ve multiplayer 2.2.7 korunuyor'],
  en:['Verify installed launcher version and SHA-256 after Windows updates to detect failed installs and repeated downloads','Write updater failure diagnostics locally instead of silently declaring a stale update successful','Retain bot match statistics hotfix and multiplayer protocol 2.2.7'],
  de:['Installierte Launcher-Version und SHA-256 nach Updates prüfen, um fehlgeschlagene Installationen zu erkennen','Lokales Diagnoseprotokoll statt Erfolgsmeldung bei veralteter Version','Bot-Statistikkorrektur und Multiplayer-Protokoll 2.2.7 bleiben erhalten']
 },
 '3.0.2':{
  tr:['Bot maçlarında öldürme, ölüm, asist ve verilen hasarın sonuç ekranında sıfır görünmesi düzeltildi','Ekipman onayında yeniden oluşturulan oyuncunun istatistik kimliği artık korunuyor','Bot maçları kalıcı sıralamaya eklenmeye devam etmiyor; çok oyunculu kayıtlar ve protokol 2.2.7 değişmedi'],
  en:['Fixed bot-match result screen showing zero kills, deaths, assists and damage','Player statistics identity now survives actor replacement on gear confirmation','Bot games remain excluded from persistent rankings; multiplayer recording and protocol 2.2.7 are unchanged'],
  de:['Nullwerte für Kills, Tode, Assists und Schaden nach Bot-Kämpfen korrigiert','Spielerstatistik bleibt bei Charakter-Neuerstellung nach Ausrüstungswahl erhalten','Bot-Spiele zählen weiterhin nicht für Ranglisten; Multiplayer und Protokoll 2.2.7 bleiben unverändert']
 },
 '3.0.1':{
  tr:['Eski ve yeni 56 kıyafet tek bir Atelier tasarımına birleştirildi','Önceki silahlar ve yan silahlar yeni koleksiyonla aynı metal, kristal ve büyü motiflerini kullanıyor','Envanter, silah önizleme ve arena ortak önbellekli görselleri kullanır; sekiz özel silah atlası korunur','Ekipman dengesi, kayıtlar ve multiplayer 2.2.7 değişmedi'],
  en:['All 56 existing and new garments now share one detailed Atelier visual direction','Historical weapons and offhands use unified engraved metal, crystal and magic accents','Inventory, weapon previews and arena share cached art; eight bespoke weapon illustrations remain intact','Game balance, saves and multiplayer protocol 2.2.7 stay unchanged'],
  de:['Alle 56 alten und neuen Kleidungsstücke nutzen jetzt denselben Atelier-Stil','Frühere Waffen und Nebenhandobjekte erhalten gemeinsame Metall-, Kristall- und Zauberakzente','Inventar, Waffenvorschau und Arena verwenden Grafik-Caches; acht besondere Waffenbilder bleiben erhalten','Balance, Speicherstände und Multiplayer-Protokoll 2.2.7 bleiben unverändert']
 },
 '2.5.24':{
  tr:['50 başlık, göğüslük ve bot ile 6 pelerin için kapsamlı görsel yenileme','Kıyafetlerin isimlerine göre özgün malzeme, kristal, zırh, kumaş ve büyü desenleri','Envanter ve arena ortak önbellekli çizim sistemi; 4 mevcut atlas kıyafeti korunuyor','Ekipman istatistikleri, hesaplar, yetenekler ve multiplayer 2.2.7 değişmedi'],
  en:['Visual overhaul for 50 helmets, armors and boots plus 6 capes','Distinct themed engravings, armor plates, crystals and fabrics derived from item names','Inventory and arena share cached artwork; four existing atlas outfits remain intact','Equipment stats, accounts, skills and multiplayer protocol 2.2.7 are unchanged'],
  de:['Neue Illustrationen für 50 Kopfbedeckungen, Rüstungen und Stiefel sowie 6 Umhänge','Individuelle Stoff-, Kristall-, Metall- und Zaubermotive je nach Gegenstand','Inventar und Arena nutzen zwischengespeicherte Grafiken; vier Atlas-Outfits bleiben erhalten','Ausrüstungswerte, Konten, Fähigkeiten und Multiplayer-Protokoll 2.2.7 bleiben unverändert']
 },
 '2.5.23':{
  tr:['8 silah ve 4 kıyafet için yüksek detaylı özgün görseller envantere ve arenaya eklendi','Tek bir 640×480 WebP atlası önbellekleniyor ve Windows/Android ortak kullanıyor','Mevcut eşyaların istatistikleri, yetenekleri ve multiplayer protokolü 2.2.7 değiştirilmedi'],
  en:['Eight detailed weapon and four garment illustrations now appear in inventory and arena','One 640×480 WebP atlas is cached and shared by Windows and Android','Equipment stats, skills and multiplayer protocol 2.2.7 are unchanged'],
  de:['Acht detaillierte Waffen- und vier Kleidungsillustrationen erscheinen nun im Inventar und in der Arena','Ein gemeinsamer 640×480-WebP-Atlas wird von Windows und Android zwischengespeichert','Ausrüstungswerte, Fähigkeiten und Netzwerkprotokoll 2.2.7 bleiben unverändert']
 },
 '2.5.22':{
  tr:['Ana menü, lobi, maç sonuçları, web ana sayfası, Windows ve Android başlatıcılarında ortak Arcana teması','İsimlerine özel yeni özgün silah detayları ve yumuşak kenarlı başlık, zırh, çizme, pelerin çizimleri','Armağan Koridoru/Bayrak Yarışı botları çalınan bayrağı geri almaya, düşen bayrağı kurtarmaya ve teslimat yapmaya yönelir','Android ve Windows ortak oyun verileri; önbellekli envanter çizimleri ve protokol 2.2.7 uyumluluğu'],
  en:['Unified Arcana theme across home menu, lobbies, match results, website and Windows/Android launchers','Original named-weapon details and soft-edged hood, armor, boots and cape illustrations','Flag Race bots now intercept stolen flags, recover drops and deliver captures instead of remaining idle','Shared Android/Windows assets, cached inventory artwork and unchanged online protocol 2.2.7'],
  de:['Einheitliches Arcana-Design für Startmenü, Lobbys, Ergebnisse, Webseite und Windows-/Android-Launcher','Neue eigenständige Waffendetails und abgerundete Illustrationen von Helmen, Rüstung, Stiefeln und Umhängen','Im Flaggenrennen verfolgen Bots gestohlene Flaggen, holen fallengelassene zurück und liefern sie ab','Gemeinsame Android-/Windows-Assets, zwischengespeicherte Inventargrafiken und unverändertes Online-Protokoll 2.2.7']
 },

 '2.5.21':{
  tr:['Q silah yeteneklerinin yanlışlıkla iki kez ölçeklenen hasar açıklamaları düzeltildi (Üçlü Ok 113, Ağır Ok 171, Hilal Kesişi 130, Çember Biçiş 108)','Android envanterinde Geri ilk dokunuşta eşya listesine, sonraki dokunuşta ana ekrana döner','Yeni Arcana Arsenal: safir, koyu mor, petrol ve kehribar renkli premium eşya galerisi ve silah önizlemesi','Android ve Windows aynı ekipman ve hasar açıklamalarını kullanıyor; multiplayer 2.2.7 değişmedi'],
  en:['Fix legacy weapon Q tooltip double multiplier: Triple Arrow 113, Heavy Arrow 171, Crescent Slash 130 and Circle Sweep 108','Android item details now navigate Back to equipment list before closing inventory','New Arcana Arsenal dark jewel-tone equipment gallery and richer weapon art','Windows and Android share the same weapon stats and 2.2.7 online protocol'],
  de:['Doppelte Q-Schadensanzeige behoben: Dreifachpfeil 113, Schwerer Pfeil 171, Halbmondschnitt 130 und Rundhieb 108','Android Zurück geht erst zur Gegenstandsliste und dann aus dem Inventar','Neues dunkles Arcana-Arsenal mit farbigen Waffenillustrationen','Windows und Android nutzen dieselben Schadensangaben, Netzwerkprotokoll 2.2.7 bleibt']
 },

 '2.5.20':{
  tr:['Ölüm Maçı + Armağan: 2–8 kişilik gerçek herkes tek lobi, mavi/kırmızı takımlar kaldırıldı','Normal Deathmatch de aynı bireysel oyuncu listesi ve öldürme hedefini kullanıyor','Rekabetçi 3v3 / 4v4 / 5v5 takım lobileri ve tüm bağlantı kurtarma kuralları korunuyor','Windows ve Android aynı çevrimiçi Deathmatch mantığını kullanıyor'],
  en:['Deathmatch + Gifts: true 2–8 fighter free-for-all rooms, no blue/red teams','Plain Deathmatch now shows an individual roster and kill-based target','Ranked 3v3 / 4v4 / 5v5 team rooms and reconnect rules remain unchanged','Windows and Android share one authoritative multiplayer server'],
  de:['Deathmatch + Geschenke: echtes Jeder-gegen-jeden-Lobby mit 2–8 Spielern ohne rote/blaue Teams','Auch das normale Deathmatch zeigt Einzelspieler und Eliminierungsziel','Ranglisten-Teams 3v3 / 4v4 / 5v5 und Wiederverbindung bleiben erhalten','Windows und Android spielen gemeinsam auf demselben Server']
 },

 '2.5.19':{
  tr:['OXY özel panelinde oyuncuların kill/galibiyet puanlarını normal veya rekabetçi sıralamada sıfırla','İki aşamalı onay ve kayıt altına alınan oyuncu hesabı silme işlemi; OXY korumalı','Android telefonda ve tablette statik zemin için yerel Canvas önbelleği','Windows mevcut harita önbelleği ve 2.2.7 multiplayer protokolü korundu'],
  en:['OXY player administration: reset kills/wins per normal or ranked queue','Audited and double-confirmed account deletion with protected OXY identity','Mobile local static terrain cache instead of repeating Canvas geometry','Windows terrain cache retained; multiplayer protocol 2.2.7'],
  de:['OXY-Spielerverwaltung: Kills/Siege pro normaler oder Ranglisten-Kategorie zurücksetzen','Protokollierte und doppelt bestätigte Kontolöschung, OXY geschützt','Lokaler statischer Karten-Cache für Android Canvas','Windows-Kartencache und Netzwerkprotokoll 2.2.7 bleiben']
 },
 '2.5.18':{
  tr:['Rekabetçi 4v4 Hâkimiyet / Gezen Taht','OXY yönetimi ve ayrı skor tabloları','Windows LAN paketinde eksik sunucu modülü tamamlandı','Android ve Windows protokol 2.2.7 uyumu'],
  en:['Ranked 4v4 Domination / Moving Hill','OXY admin controls and separate scoreboards','Fixed missing local-server module in Windows installer','Android/Windows protocol 2.2.7'],
  de:['Ranglisten-4v4 Herrschaft / Wandernder Hügel','OXY-Adminsteuerung und getrennte Tabellen','Fehlendes Modul im Windows-LAN-Paket ergänzt','Android/Windows Protokoll 2.2.7']
 },
 '2.5.17':{
  tr:['Rekabetçi online 4v4: Alan Hâkimiyeti / Gezen Taht','Yalnızca tam 8 doğrulanmış hesapla rekabetçi maç başlatılır','Normal ve rekabetçi sıralamalar ayrıldı, 7 hesapla açık DEMO örnekleri gösteriliyor','OXY hesabına güvenli anlık sıralama yenileme ve onaylı sıfırlama araçları','Android ve Windows ortak oyun sürümü, protokol 2.2.7'],
  en:['Ranked online 4v4: Domination / Moving Hill','Ranked requires exactly eight authenticated players','Separate normal and competitive leaderboards with clearly marked DEMO examples','OXY-only verified refresh and reset controls','Shared Android/Windows game logic, protocol 2.2.7'],
  de:['Ranglisten-4v4 online: Herrschaft / Wandernder Hügel','Genau acht angemeldete Spieler für Ranglistenspiele nötig','Getrennte normale und kompetitive Tabellen, DEMO klar gekennzeichnet','Nur OXY: sofortiges Aktualisieren und bestätigtes Zurücksetzen','Android/Windows verwenden Protokoll 2.2.7']
 },
 '2.5.16':{
  tr:['Yeni mod: ÖLÜM MAÇI + ARMAĞAN — Herkes tek, 2–8 oyuncu, 7 sn yeniden doğma','Armağan Koridorları büyük haritasında her 20 saniyede bir rastgele armağan (en fazla 3)','Armağanlar can yenileme, %20 hasar, +300 zırh ve %12 hız sağlar; ölümde sıfırlanır','İlk 20 öldürme (1–100 seçilebilir) veya 10 dakikalık süre sonunda en yüksek skor kazanır','Bot, LAN ve online mod seçimi, sıralama ve sunucu tarafından doğrulanan armağan toplama','Android ve Windows aynı maç kurallarını ve 2.2.6 multiplayer protokolünü kullanır'],
  en:['New mode: DEATHMATCH + GIFTS — 2–8 player free-for-all and seven-second respawn','One random gift every 20 seconds on the connected large gift maze (maximum three uncollected)','Pickups provide full heal, 20% power, 300 armor durability, or 12% speed; reset on death','First to 20 kills (configurable 1–100) or most kills after ten minutes wins','Bot/LAN/online room selections, ranking and server-authoritative gift pickups','Android and Windows share game rules and the 2.2.6 multiplayer protocol'],
  de:['Neuer Modus: DEATHMATCH + GESCHENKE — 2–8 Spieler, jeder gegen jeden und sieben Sekunden Respawn','Alle 20 Sekunden ein Geschenk auf der großen Labyrinthkarte (maximal drei)','Geschenke: volle Heilung, 20 % Stärke, 300 Rüstung oder 12 % Tempo; Ende beim Tod','20 Eliminierungen (1–100 einstellbar) oder Führung nach zehn Minuten gewinnt','Bot-, LAN- und Onlineauswahl, Rangliste und serverseitige Geschenkvergabe','Android und Windows nutzen dieselben Regeln und das Netzwerkprotokoll 2.2.6']
 },

 '2.5.15':{
  tr:['PC için 120/144/165/240 Hz ekranlarda gereksiz tam sahne çizimini azaltan monitöre uyumlu kare zamanlaması','Orijinal ayrıntılı arena zeminini kamera hareketi boyunca önbellekte tutan akıllı çizim sistemi','Yüksek çözünürlükte ve düşük GPU performansında otomatik ayarlanan Canvas piksel bütçesi','F3 ile gerçek çizim FPS, kare süresi, arka tampon boyutu ve ekran yenileme hızını takip et','F8 ile manuel düşük detay geçişi korunuyor; tüm özgün sahne çizimleri varsayılan','Bot ve multiplayer simülasyon/giriş mekaniği değişmedi; 2.2.6 ağ protokolü uyumlu'],
  en:['Monitor-synchronized rendering reduces redundant full-scene work on 120/144/165/240 Hz PC displays','Original detailed arena terrain is cached and camera-panned instead of redrawn each refresh','Automatic Canvas pixel budget adapts on high-resolution or slower GPUs','F3 shows actual painted FPS, paint cost, backbuffer pixels and monitor refresh','Original detailed scene art remains default; manual F8 fast graphics mode is still available','Bot and multiplayer mechanics unchanged; compatible 2.2.6 network protocol'],
  de:['Monitorangepasstes Zeichnen reduziert überflüssige Vollbild-Frames bei 120/144/165/240 Hz','Original-Arenagelände wird beim Kameraschwenk aus einem Puffer dargestellt','Adaptive Canvas-Pixelzahl für große Auflösungen und langsamere Grafikkarten','F3 zeigt echte Zeichen-FPS, Rechenzeit, Puffergröße und Monitorfrequenz','Originalgrafik bleibt Standard, F8 kann weiterhin manuell schnellere Grafik aktivieren','Bot- und Multiplayer-Regeln unverändert, kompatibles Netzwerkprotokoll 2.2.6']
 },

 '2.5.14':{
  tr:['Avcı Hançeri ve eski temel silah Q hasarlarının korunması düzeltildi','Eski silahlardaki yanlış 4,5 kat Q hasar büyütmesi engellendi','Şafak Asası takım iyileştirme/kalkan; Kök Asası yavaşlatma ve zamanla can yenileme uzmanı','Tüm silah Q açıklamaları gerçek hesaplara göre güncellenir, kutulardan taşmaz','Grafik modu F4 yerine F8 ile değişir; orijinal grafikler varsayılandır'],
  en:['Hunter Dagger and classic base weapon Q damage restored to their intended balance','Removed unintended 4.5x amplification on later Q abilities','Holy Staff heals and shields allies; Nature Staff controls and regenerates health over time','All weapon Q descriptions use updated combat values and stay within their cards','Graphics toggle moved from F4 to F8; detailed graphics remain the default'],
  de:['Jägerdolch und ursprüngliche Q-Schäden der Basiswaffen bleiben unverändert','Unbeabsichtigte 4,5-fache Schadensverstärkung neuer Q-Fähigkeiten behoben','Heiliger Stab heilt und schützt; Naturstab verlangsamt und regeneriert LP','Q-Beschreibungen stimmen mit den Kampfwerten überein und bleiben in den Karten','Grafikmodus nun mit F8 statt F4, Originalgrafik bleibt Standard']
 },

 '2.5.13':{
  tr:['Şafak Asası artık takım iyileştirme ve kalkan, Kök Asası ise alan yavaşlatma ve 4 saniyelik can yenileme uzmanı','Eski Q yeteneklerinin ikinci kez 4,5 kat büyüyen hasar ölçeklemesi düzeltildi','Tüm silah Q açıklamaları aktif hasar dengesi, menzil, kontrol, şifa ve bekleme değerlerinden oluşturuluyor','Uzun skill açıklamaları kartlardan taşmıyor; tam açıklama üzerine gelince görülebilir','Grafik modu artık F8 ile değişiyor; F4 bu iş için kullanılmıyor','Orijinal detaylı grafikler varsayılan, önceki Avcı Hançeri dengesi korunuyor'],
  en:['Holy Staff focuses on team healing and shields; Nature Staff controls an area and regenerates HP over four seconds','Removed accidental extra 4.5x damage scaling from legacy Q abilities','All weapon Q tooltips now reflect live damage budgets, ranges, controls, healing and cooldowns','Long skill descriptions stay inside their cards; hover for full information','Press F8 instead of F4 to change graphics mode','Original detailed graphics remain default; Hunter Dagger is unchanged'],
  de:['Heiliger Stab heilt und schützt das Team; Naturstab kontrolliert Gegner und regeneriert LP über vier Sekunden','Fehlerhafte zusätzliche 4,5-fache Q-Schadensskalierung entfernt','Waffen-Q-Texte zeigen aktuelle Schadensgrenzen, Reichweiten, Kontrolle, Heilung und Abklingzeit','Lange Fähigkeitstexte bleiben innerhalb der Karten; komplette Details per Hover','Grafikmodus nun mit F8 statt F4 wechseln','Originalgrafik bleibt Standard; Jägerdolch bleibt unverändert']
 },

 '2.5.12':{
  tr:['Tek elli silahların temel saldırıları %13,5 hızlandı, hasarları iki ellilere göre biraz düşük kaldı','Q yeteneklerinin aşırı patlama hasarı sınırlandı; alan ve kontrol büyüleri dengelendi','Avcı Hançeri ailesinin mevcut davranışı korundu','Windows masaüstünde orijinal detaylı grafikler varsayılan; F4 ile manuel düşük grafik modu','Küçük laptop ekranlarında menüler kaydırılabilir, tam ekran arena ve arayüz ekrana sığar','Windows tam ekran ve launcher boyutlandırması ekran ölçeklendirmesine uyar'],
  en:['One-handed basic attacks are 13.5% faster, with slightly less damage than two-handed weapons','Q skill burst capped with lower budgets for area and control effects','Hunter Dagger family mechanics remain unchanged','Original full graphics are the Windows default; F4 can optionally toggle low detail','Smaller laptop screens gain scrollable menus and viewport-fitted combat UI','Windows fullscreen and launcher sizing account for display scaling'],
  de:['Einhändige Waffen greifen 13,5 % schneller an, verursachen aber etwas weniger Schaden als Zweihandwaffen','Q-Spitzenschaden begrenzt; Flächen- und Kontrolleffekte ausbalanciert','Jägerdolch-Mechanik bleibt unverändert','Originalgrafik ist unter Windows Standard; F4 schaltet optional geringe Details ein','Kleine Laptop-Displays zeigen scrollbare Menüs und eine angepasste Kampfoberfläche','Vollbild und Launcher-Größe berücksichtigen die Anzeige-Skalierung']
 },

 '2.5.11':{
  tr:['28 silah ve 50 kıyafet için hasar, can ve savunma bütçesi yeniden dengelendi','Kıvılcım Tılsımı ve Yıldız Kitabı ikinci elde aynı %5 bekleme indirimi için aynı 90 can bedelinde','Yüksek Q hasarlı eski silahlar da bütçe sistemine katıldı; ağır zırh yüksek saldırı gücünü sınırlar','Armağan Labirenti ve Muhafız Labirenti geçişleri genişletildi, duvara tıklama rotası düzeltildi','Windows WebView2 için daha hafif grafik modu varsayılan; F4 ile kalite değiştirilebilir','1516 kombinasyon, gerçek Chromium çizim ve 3v3 multiplayer regresyon testleri'],
  en:['Rebalanced HP, outgoing damage and armor tradeoffs across 28 weapons and 50 garments','Spark Talisman and Star Book now share the same -90 HP cost for the same -5% cooldown','Normalized legacy high-damage Q skills; heavy defense limits outgoing damage','Widened both maze corridors and fixed routing when clicking on blocked terrain','Windows WebView2 uses a lighter default graphics mode with F4 quality toggle','1516 equipment combinations plus Chromium rendering and multiplayer regression tests'],
  de:['LP-, Schaden- und Rüstungsbalance für 28 Waffen und 50 Kleidungsteile überarbeitet','Funken-Talisman und Sternenbuch kosten beide 90 LP für 5 % kürzere Abklingzeit','Frühere starke Q-Fähigkeiten normalisiert; schwere Rüstung reduziert den Angriff','Breitere Labyrinthkorridore und bessere Wege bei Klick auf Hindernisse','Windows WebView2 startet mit Grafikmodus für höhere FPS, per F4 umschaltbar','1516 Kombinationen sowie Chromium- und Multiplayer-Tests']
 },
 '2.5.10':{
  tr:['6 oyunculu maçlarda 20 Hz sunucu durum güncellemesi ve daha hızlı giriş iletimi','Labirent yol bulma optimizasyonu: CI p95 simülasyon 97,69 ms seviyesinden 6,56 ms seviyesine indi','İlk rota oluşturma takılması azaltıldı; çevrimdışı ve çevrimiçi performans iyileştirildi','Görünmeyen duvar, çevre süsleri ve dekorasyonların çizimi azaltıldı','F3 ile gerçek FPS ve WebSocket RTT göstergesi','Yeni oyun modları, ekipmanlar ve kayıtlı buildler korundu'],
  en:['Faster player input and 20 Hz server snapshots for six-player matches','Labyrinth pathfinding improvements: measured simulation p95 down from 97.69 ms to 6.56 ms in CI','Substantially reduced cold-start route calculation hitch','Offscreen wall, foliage and decorative tile culling reduces rendering workload','F3 toggles live FPS and WebSocket RTT monitor','All existing modes, gear and saved builds retained'],
  de:['Schnellere Eingaben und 20 Hz Server-Snapshots bei Sechsspieler-Matches','Labyrinth-Wegfindung: p95 von 97,69 ms auf 6,56 ms in CI-Tests gesenkt','Deutlich geringere Pause bei erster Routenberechnung','Nicht sichtbare Wände und Bodendekorationen werden seltener gezeichnet','F3 blendet FPS und WebSocket-RTT ein','Bestehende Modi und Ausrüstung bleiben unverändert']
 },
 '2.5.9':{
  tr:['Yeni Armağan Labirenti modu ve ayrı Armağan Koridorları haritası','Haritada her 20 saniyede rastgele hediye; aynı anda en fazla 3','4 hediye türü: tam can, %20 silah/yetenek gücü, +300 zırh dayanımı, %12 hız','Güçlendirmeler ölüme kadar sürer, parlayan aura ve anlık bildirimle görünür','Bot, LAN ve online odalarda sunucu kontrollü hediye toplama · 20 eleme hedefi','Çevrimiçi adalet için multiplayer protokolü 2.2.3'],
  en:['New Relic Maze match type with its own Relic Passages labyrinth map','A random gift every 20 seconds; at most three on the map','Four gifts: full health, +20% weapon/skill power, +300 consumable armor durability, +12% speed','Bonuses last until death, with colored auras and pickup notifications','Authoritative gifts in bots, LAN and online; first team to 20 eliminations','Multiplayer protocol 2.2.3 prevents mixed-version matches'],
  de:['Neuer Relikt-Labyrinth-Modus mit eigener Labyrinthkarte','Alle 20 Sekunden ein zufälliges Geschenk; höchstens drei gleichzeitig','Vier Geschenke: volle Gesundheit, +20 % Waffen-/Fähigkeitsstärke, +300 Rüstung, +12 % Tempo','Boni bleiben bis zum Tod, mit Aura und Benachrichtigung','Servergesteuerte Geschenke in Bot-, LAN- und Online-Spielen; 20 Kills','Multiplayer-Protokoll 2.2.3 verhindert gemischte Versionen']
 },
 '2.5.8':{
  tr:['Gear V5: 4 yeni silah, 6 yeni kıyafet ve yeniden dengelenmiş Q yetenekleri','Saat Asası, Akort Asası, Kök Bastonu ve tüm yeni silahlara gerçek siluet + silaha özel mermi efektleri','Kılıç, asa, yay, arbalet, tırpan ve hançer görselleri isimleriyle uyumlu','28 silah / 50 kıyafet; mevcut kayıtlı build ve multiplayer uyumluluğu'],
  en:['Gear V5: four new weapons, six garments and balanced Q skills','Correct held silhouettes and weapon-specific projectile elements including Clock Staff and Harmony Staff','Sword, staff, bow, crossbow, scythe and dagger models now match their names','28 weapons and 50 garments with saved-build and multiplayer compatibility'],
  de:['Gear V5: vier neue Waffen, sechs Rüstungsteile und ausgewogene Q-Fähigkeiten','Korrekte Waffenmodelle und passende Projektil-Effekte für Zeitstab und Harmoniestab','Schwert-, Stab-, Bogen-, Armbrust-, Sensen- und Dolchmodell stimmen mit Namen überein','28 Waffen und 50 Rüstungsteile mit Speicher- und Multiplayer-Kompatibilität']
 },
 '2.5.7':{
  tr:['Gear V5: Yeni 4 silah (Kıvılcım Topuzu, Gölge Arbaleti, Pusula Hançeri, Kök Bastonu)','6 yeni kıyafet (2 başlık, 2 göğüslük, 2 bot) ve her biri için iki beceri','Önceki 6 yeni silahın Q hasarı azaltıldı; artık güç artışı değil farklı oyun tarzları sunuyor','Saat Asası, Akort Asası ve diğer yeni silahların elde ve envanterde özgün görselleri','Silaha özel animasyonlar, işaretleme, sıçrama, kontrol ve destek becerileri','Yeni eşyalar kayıtlı build, LAN ve online oyunla uyumlu'],
  en:['Four new weapons: Spark Mace, Shadow Crossbow, Compass Dagger and Root Staff','Six new garments with two abilities each','Rebalanced Q damage for the six previous weapons to prevent power creep','Unique held-weapon silhouettes and inventory icons for all new weapons','Weapon-specific hit effects, mobility, control and support skills','All gear works with saved builds, LAN and online play'],
  de:['Vier neue Waffen: Funkenstreitkolben, Schattenarmbrust, Kompassdolch und Wurzelstab','Sechs neue Rüstungsteile mit je zwei Fähigkeiten','Q-Schaden der sechs vorherigen Waffen zur Balance reduziert','Eigenständige Waffenmodelle für Inventar und Arena','Waffenspezifische Effekte für Treffer, Mobilität, Kontrolle und Unterstützung','Neue Ausrüstung kompatibel mit gespeicherten Builds, LAN und Online']
 },
 '2.5.6':{
  tr:['6 yeni özgün silah: Yarık Tırpanı, Gök Mızrağı, Ayna Yayı, Saat Asası, Akort Asası, Mühür Kılıcı','9 yeni giyilebilir zırh: 3 başlık, 3 göğüslük, 3 bot; toplam 30 yeni aktif beceri','Zincirleme vuruş, konuma dönüş, işaretleme, karşı saldırı ve takım koruma mekanikleri','Karakter kartı tüm standart masaüstü ekranlara sığar; sayfa kaydırması kaldırıldı','Yeni kıyafetler kayıtlı build ve multiplayer ile uyumlu'],
  en:['Six new unique weapons with original abilities','Nine new garments: three heads, three chests and three boots; 30 new active skills','Chain hits, position rewind, target marking, counterstrike and team protection','Character sheet fits standard desktop screens without page scrolling','New gear is supported in saved builds and multiplayer'],
  de:['Sechs neue einzigartige Waffen mit originellen Fähigkeiten','Neun neue Rüstungsteile: drei Helme, drei Brustteile und drei Stiefel; 30 neue aktive Fähigkeiten','Kettentreffer, Positionsrücklauf, Markierung, Gegenangriff und Teamschutz','Charakterkarte passt ohne Seitenscrollen auf Desktop-Bildschirme','Neue Ausrüstung mit gespeicherten Builds und Multiplayer kompatibel']
 },
 '2.5.5':{
  tr:['Gear V3 test: 18 tekil silah modeli; Q1/Q2 seçimleri korunuyor','Altı pelerinde tetiklenen otomatik pasif beceriler','35 kıyafetin iki aktif yeteneği ve 3v3 hasar/şifa sınırları','Eski silah varyantları standart silaha dönüştürülür'],
  en:['Gear V3 test: 18 unique weapon models; Q1/Q2 remains','Six capes provide triggered combat passives','35 garments retain two active skills with 3v3 balance limits','Legacy variants migrate to canonical weapons'],
  de:['Gear-V3-Test: 18 einzigartige Waffen und Q1/Q2-Wahl','Sechs Umhänge mit auslösbaren Passiv-Effekten','35 Rüstungsteile mit je zwei Fertigkeiten und 3v3-Balance','Alte Waffenvarianten werden auf Standard umgestellt']
 },
 '2.5.4':{
  tr:['Maç başlarken harita ekranı tamamen kaplıyor','Oyun sırasında kenardaki menüler kapatılarak yanlış tıklamalar önleniyor','Bot ve çevrimiçi maçlarda tam ekran harita düzeni korunuyor','Maçtan çıkınca normal menüler geri geliyor'],
  en:['Match arena now fills the entire game window','Side panels are hidden during gameplay to prevent accidental clicks','Applies to bot and multiplayer matches','Normal menus return when leaving the match'],
  de:['Arena füllt während des Spiels das gesamte Fenster','Seitenleisten werden gegen Fehlklicks ausgeblendet','Gilt für Bot- und Online-Matches','Menüs kehren beim Verlassen des Spiels zurück']
 },
 '2.5.3':{
  tr:['Sürüm ve otomatik güncelleme yayın testi','Oynanışta veya çok oyunculu protokolde değişiklik yok'],
  en:['Version-only release and automatic update test','No gameplay or multiplayer protocol changes'],
  de:['Reiner Versionswechsel und Test des automatischen Updates','Keine Änderungen an Gameplay oder Mehrspielerprotokoll']
 },
 '2.5.2':{
  tr:['HTTPS güncelleme kontrolünde bağlantı hatası düzeltildi','Güncel kurulum sunucu üzerinden doğrulanıyor','Otomatik indirmeler herkese açık sürüm deposunu kullanıyor','Güvenli güncelleme ve giriş sistemi korunuyor'],
  en:['Fixed HTTPS update connection failures','Verify installed version against game server','Fetch signed release hashes from public download repository','Retain secure updates and account sign-in'],
  de:['HTTPS-Verbindungsfehler bei Updates behoben','Installierte Version mit Spielserver prüfen','Updates aus öffentlichem Download-Repository','Sichere Updates und Anmeldung bleiben erhalten']
 },
 '2.5.1':{
  tr:['Eski launcher tespit edilip yeni kuruluma yönlendiriliyor','Oyun sayfası doğrulanmadan tam ekran açılmıyor','Yükleme hatasında launcher ekranına güvenli dönüş','Otomatik güncelleme ve hesap sistemi korunuyor'],
  en:['Detect obsolete launcher and show upgrade instructions','Enter fullscreen only after game document is verified','Recover to launcher if game loading fails','Keep automatic updates and account sign-in'],
  de:['Veralteten Launcher erkennen und Update-Hinweise anzeigen','Vollbild erst nach erfolgreichem Laden des Spiels','Bei Ladefehler sicher zum Launcher zurückkehren','Automatische Updates und Anmeldung bleiben erhalten']
 },
 '2.5.0':{
  tr:['Yeni masaüstü başlatıcı ve zorunlu hesap girişi','Otomatik güncelleme ve kurulum ilerlemesi','Üç dilde başlatıcı: Türkçe, İngilizce, Almanca','Güncelleme notları ve günlük çevrimiçi ilk 10 sıralaması'],
  en:['New desktop launcher with required sign-in','Automatic updates with installation progress','Launcher language selection: Turkish, English, German','Release notes and daily top 10 online leaderboard'],
  de:['Neuer Desktop-Launcher mit verpflichtender Anmeldung','Automatische Updates mit Installationsfortschritt','Launcher-Sprachauswahl: Türkisch, Englisch, Deutsch','Versionshinweise und tägliche Online-Top-10']
 }
};
// Verified against the PUBLIC GitHub release asset's published SHA-256 and size.
// Pin an already-published release to avoid production setup/updates depending on
// GitHub API availability or API rate limits. Never disable client-side SHA checks.
const VERIFIED_RELEASES=Object.freeze({
 '3.0.6':Object.freeze({
  version:'3.0.6',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v3.0.6/KeyboardHeroes-Desktop-v3.0.6.zip',
  sha256:'05280f8b93609c6d5e526e760b7720e4cef919627499504ba511be1b687fc5ce',
  size:35457285
 }),
 '3.0.5':Object.freeze({
  version:'3.0.5',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v3.0.5/KeyboardHeroes-Desktop-v3.0.5.zip',
  sha256:'ebc1cdfda2bfe6abf54326ac7e5e5771b23b209e6a8b3e57ba5fd42c25783ad7',
  size:35469419
 }),
 '3.0.4':Object.freeze({
  version:'3.0.4',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v3.0.4/KeyboardHeroes-Desktop-v3.0.4.zip',
  sha256:'d8572eb5b109220c4e573a4b1eb088eff8483e46f42c4d48c462ccfb44b2399c',
  size:35469421
 }),
 '3.0.3':Object.freeze({
  version:'3.0.3',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v3.0.3/KeyboardHeroes-Desktop-v3.0.3.zip',
  sha256:'2fd3851211a00f1ebc81bf2dc67323b5c9dae02755543ff704ab9ef06acc63f7',
  size:35469490
 }),
 '3.0.2':Object.freeze({
  version:'3.0.2',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v3.0.2/KeyboardHeroes-Desktop-v3.0.2.zip',
  sha256:'349094444c59cd5dc57ade60b572dd4fe1aca0ad8891fe1ae06dcae30d4fe153',
  size:35480972
 }),
 '3.0.1':Object.freeze({
  version:'3.0.1',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v3.0.1/KeyboardHeroes-Desktop-v3.0.1.zip',
  sha256:'011ebb41437d50dd67bc4dc1e38577546a44ad6114dd36938f0ad1fc7651ea31',
  size:35480957
 }),
 '2.5.24':Object.freeze({
  version:'2.5.24',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.24/KeyboardHeroes-Desktop-v2.5.24.zip',
  sha256:'6df511d49235524ac6320fadc349fd2bc2c124e4b817ce48d7892b160fd64f8b',
  size:35478318
 }),
 '2.5.23':Object.freeze({
  version:'2.5.23',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.23/KeyboardHeroes-Desktop-v2.5.23.zip',
  sha256:'2e891fef6bade9aab3718225a85723178e18000c4ba5626d800afa7dd0241f70',
  size:35472038
 }),
 '2.5.22':Object.freeze({
  version:'2.5.22',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.22/KeyboardHeroes-Desktop-v2.5.22.zip',
  sha256:'2faaaad502255fa88d1ed3ca16914036c169851b9de3a30391992d7fc826b185',
  size:35386084
 }),
 '2.5.21':Object.freeze({
  version:'2.5.21',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.21/KeyboardHeroes-Desktop-v2.5.21.zip',
  sha256:'6f4be23154957406db1d1200d361b44d50aab2877f79db09fffcf26179538cef',
  size:35373982
 }),
 '2.5.20':Object.freeze({
  version:'2.5.20',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.20/KeyboardHeroes-Desktop-v2.5.20.zip',
  sha256:'6c13f15a98e2d4d0e8a3d309d5bcfc9e3d2c4b245b3aebf86bb1ef4ea0bb2a64',
  size:35369888
 }),
 '2.5.19':Object.freeze({
  version:'2.5.19',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.19/KeyboardHeroes-Desktop-v2.5.19.zip',
  sha256:'7bc5e9ff1f5d74bf92cc10cd635ff299ff83f1f872f864bef19b5b26b842c654',
  size:35364457
 }),
 '2.5.16':Object.freeze({
  version:'2.5.16',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.16/KeyboardHeroes-Desktop-v2.5.16.zip',
  sha256:'9ebf781134bb634a99d3507d701fb7cda776598315c8a3dce9e86247fcff2b1c',
  size:35345652
 }),
 '2.5.15':Object.freeze({
  version:'2.5.15',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.15/KeyboardHeroes-Desktop-v2.5.15.zip',
  sha256:'efe6a64c97e096059737196c44ccd6d28c0682e0a9553199759fcd87981be1ea',
  size:35344217
 }),
 '2.5.14':Object.freeze({
  version:'2.5.14',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.14/KeyboardHeroes-Desktop-v2.5.14.zip',
  sha256:'041e936e8241857c26de4f2af440d4ab9df755e84bbe2dfd7d5c106d0cf4bcf4',
  size:35322822
 }),
 '2.5.13':Object.freeze({
  version:'2.5.13',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.13/KeyboardHeroes-Desktop-v2.5.13.zip',
  sha256:'65c4aab4ef90b93213b3e9fb4e553c0d61b96c562e49a36d92034c18fc045957',
  size:35322264
 }),
 '2.5.12':Object.freeze({
  version:'2.5.12',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.12/KeyboardHeroes-Desktop-v2.5.12.zip',
  sha256:'7b79ee0f6c17901290d52154df83ecbc7126c667184c30f27e79cc0b488374ac',
  size:35316335
 }),
 '2.5.11':Object.freeze({
  version:'2.5.11',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.11/KeyboardHeroes-Desktop-v2.5.11.zip',
  sha256:'8555086cd77ad4078ba28da232e433030dcc4acc7e77dfaae8bcd2d4f955a427',
  size:35314436
 }),
 '2.5.10':Object.freeze({
  version:'2.5.10',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.10/KeyboardHeroes-Desktop-v2.5.10.zip',
  sha256:'a3f2ce3c2f43905a0036f13c3bcb52fa7e51423acf0ad9c96474f01b21a47666',
  size:35308402
 }),
 '2.5.9':Object.freeze({
  version:'2.5.9',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.9/KeyboardHeroes-Desktop-v2.5.9.zip',
  sha256:'d3c0b1f5ac20277734081525f13bf81a8f6ca035ab19ac5638d3cdc9586b2c4d',
  size:35305452
 }),
 '2.5.8':Object.freeze({
  version:'2.5.8',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.8/KeyboardHeroes-Desktop-v2.5.8.zip',
  sha256:'aea2859a84607ed95d7d525687d9da885f3090ce1addf7af74bb30aa506d5cc5',
  size:35296650
 }),
 '2.5.7':Object.freeze({
  version:'2.5.7',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.7/KeyboardHeroes-Desktop-v2.5.7.zip',
  sha256:'77239aa6ce83b0ff7992c5b22235b96f7b1b31988c4779c5260cd060285152c7',
  size:35296083
 }),

 '2.5.6':Object.freeze({
  version:'2.5.6',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.6/KeyboardHeroes-Desktop-v2.5.6.zip',
  sha256:'bcb57c0a7c1f66b8a2189587bac45a069a3f3381be975a57a3cb1e315ff0571d',
  size:35285676
 }),
 '2.5.5':Object.freeze({
  version:'2.5.5',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.5/KeyboardHeroes-Desktop-v2.5.5.zip',
  sha256:'9307eb2b9074f7ff7e7ab3ea268a8d17e81239fb41bd3c54b1d08c1c45c4018f',
  size:35272491
 }),
 '2.5.4':Object.freeze({
  version:'2.5.4',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.4/KeyboardHeroes-Desktop-v2.5.4.zip',
  sha256:'d3d96e7b464b1a2f800a1ecbf9788bef9c391fd78175231cc215a6a19eab5a13',
  size:35270541
 }),
 '2.5.3':Object.freeze({
  version:'2.5.3',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.3/KeyboardHeroes-Desktop-v2.5.3.zip',
  sha256:'a9c243653fd5ada7b714da4a2b4bc280908624d7493486cd30f201f2a1564035',
  size:35269523
 }),
 '2.5.2':Object.freeze({
  version:'2.5.2',
  url:'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.2/KeyboardHeroes-Desktop-v2.5.2.zip',
  sha256:'d6819b346fdef1effe5d304211218f635a585fa6b6befbfb124b314d35271a29',
  size:35268777
 })
});
function createReleaseManifest({request=fetch,ttlMs=300000,expectedVersion=null,pinnedRelease=null}={}){
 if(pinnedRelease){
  const version=String(pinnedRelease.version||'');
  const expectedUrl='https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v'+version+'/KeyboardHeroes-Desktop-v'+version+'.zip';
  if(!VERSION.test(version)||(expectedVersion&&version!==expectedVersion)||
    pinnedRelease.url!==expectedUrl||
    !/^[a-f0-9]{64}$/i.test(pinnedRelease.sha256||'')||
    !Number.isSafeInteger(pinnedRelease.size)||pinnedRelease.size<1000000||pinnedRelease.size>350000000)
   throw Error('Invalid pinned release manifest');
  const data=Object.freeze({...pinnedRelease,notes:CHANGES[version]||{tr:[],en:[],de:[]}});
  return async()=>data;
 }

 let cached=null,until=0,inflight=null;
 async function load(){
  // A running server must resolve its own release tag, not an unrelated
  // newer/latest release; the asset digest remains mandatory.
  const releaseApi=expectedVersion?RELEASES.replace('/releases/latest','/releases/tags/v'+expectedVersion):RELEASES;
  const response=await request(releaseApi,{headers:{'Accept':'application/vnd.github+json','User-Agent':'KeyboardHeroes-Update-Server'},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('GitHub releases unavailable');
  const release=await response.json();
  const version=String(release.tag_name||'').replace(/^v/,'');
  if(!VERSION.test(version)||release.draft||release.prerelease)throw Error('No stable release');
  if(expectedVersion&&version!==expectedVersion)throw Error('Public desktop release '+expectedVersion+' not published yet');
  const file='KeyboardHeroes-Desktop-v'+version+'.zip';
  const asset=(release.assets||[]).find(a=>a.name===file&&typeof a.digest==='string'&&/^sha256:[a-f0-9]{64}$/i.test(a.digest));
  if(!asset)throw Error('Verified update archive is not published yet');
  const url='https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v'+version+'/'+file;
  if(asset.browser_download_url!==url)throw Error('Unexpected release asset URL');
  return {version,url,sha256:asset.digest.slice(7).toLowerCase(),size:asset.size,notes:CHANGES[version]||{tr:[],en:[],de:[]}};
 }
 return async function manifest(){
  if(cached&&Date.now()<until)return cached;
  if(!inflight)inflight=load().then(value=>{cached=value;until=Date.now()+ttlMs;return value;}).finally(()=>{inflight=null;});
  return inflight;
 };
}
module.exports={createReleaseManifest,CHANGES,VERIFIED_RELEASES};
