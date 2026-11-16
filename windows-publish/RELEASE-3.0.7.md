# Keyboard Heroes Windows v3.0.7 — Deneme Odası, Ekipman Dengesi ve Harita Karartı Düzeltmesi

- 10.000 HP, 50 HP/sn iyileşen, ölürse 5 saniyede yeniden doğan süresiz deneme hedefi.
- Burç Sabatonları ve Darbe Botları ayrıştırıldı: yüksek alan hasarı/yavaşlatma vs uzun atılma/sabitleme ve koruma.
- Faz Çizmeleri / Gök Sandaletleri; Kök Dokuma Ceket / Gözcü Paltosu; Burç Zırhı / Çelik Zırhı; Ayna Vizörü / Yankı Tacı yeteneklerinin avantaj–bedel dengesi iyileştirildi.
- Windows WebView2 önbellekli haritasında çizim sonrası Canvas boyut değişikliği engellendi. GPU önbellek kaybında harita aynı karede yeniden çizilir.
- Android WebView oyun dosyaları aynı değişiklikleri HTTPS üzerinden alır; paket içindeki statik harita optimizasyonu korunur.
- İlk Windows v3.0.7 ZIP'i v3.0.6'dan SHA-256 doğrulanarak oluşturulur; değişen kaynak kodu, testler ve C# native launcher yeniden derlenir. Yayın öncesinde beş gameplay/renderer test dosyası ve yerel server /version kontrolü zorunludur.
- Multiplayer protokolü 2.2.7 ve mevcut bulut hesap / skor verileri değişmez.

## Update
v3.0.6 ve önceki Windows başlatıcıları yeni sürümü /api/launcher/manifest üzerinden SHA-256 denetimli olarak indirir; paket ile canlı sunucu sürümü eşlenmeden otomatik güncelleme zorlanmaz.
