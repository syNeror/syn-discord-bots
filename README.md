# Syn Discord Bot Paketi

Bir Discord topluluğunu ayakta tutmak için gereken işleri beş ayrı bota bölen, Türkçe geliştirilmiş bir bot paketi. Moderasyon, sunucu koruma, destek talepleri, ekip yönetimi ve genel kullanım — her biri kendi işine odaklanmış, birbirinden bağımsız çalışan botlar.

Hepsi [discord.js v14](https://discord.js.org) üzerine kurulu ve slash komutlarıyla çalışıyor.

---

## Paketteki botlar

### syna-moderasyon-bot

Paketin en kapsamlı botu. Ceza sistemi, kayıt akışı, destek talepleri ve ayrıntılı sunucu günlüğü bir arada.

- **Ceza yönetimi** — ban, unban, perma-ban, mute, unmute, allmute, uyarı ver / bak / sil, kademeli uyarı rolleri
- **Kara liste** — blacklist ve blacklist affı, ban affı
- **Destek talepleri** — ticket kurulumu, isim değiştirme, kullanıcı ekleme/çıkarma, talep sayacı ve sıralama
- **Ekip araçları** — yetkili ve yetkili ses takibi, ekip oluşturma, rol dağıtımı, davet takibi
- **Çekiliş sistemi** — çekiliş başlatma ve kazanan çekme
- **22 farklı olay günlüğü** — kanal, rol, sunucu, üye, mesaj (silme/düzenleme), ses kanalı hareketleri, ban giriş-çıkışları
- Bakım modu, DM duyuru, kullanıcı bilgi kartı ve IP sorgulama gibi yardımcı komutlar

### syna-ticket-bot

Yalnızca destek talebi ve sipariş akışına odaklanmış sade bot. Talep kategorileri, satın alanlar için ayrı kategori, yetkili rol kontrolü ve talep günlüğü. Ayrılan üyenin açık talebini otomatik kapatır.

### syna-ekip-bot

Ekip içi süreçleri yürüten bot.

- **Başvuru sistemi** — form akışı ve değerlendirme
- **Aktiflik takibi** — ses kanalı sürelerini kaydeder
- **Uyarı sistemi** — ekip içi uyarılar
- **Karşılama** — giriş/çıkış kartları (canvafy ile görsel üretim)
- Mesaj düzenleme/silme ve kullanıcı adı değişikliği günlükleri

### syna-public-bot

Herkesin kullanabileceği hafif komutlar: avatar görüntüleme, sunucu bilgisi, FiveM sunucu durumu sorgulama, otomatik rol, rol taşıma, automod, ban/unban/forceban ve toplu kanal silme.

---

## Kurulum

Node.js 16.11 veya üzeri gerekiyor.

Her bot kendi klasöründe bağımsız çalışır. Kurmak istediğiniz botun klasörüne girin:

```bash
cd syna-moderasyon-bot
npm install
```

### Yapılandırma

Repoda gerçek `config.json` dosyaları **bulunmaz** — bunlar bot token'ı içerdiği için kasıtlı olarak dışarıda tutulmuştur. Her klasördeki örnek dosyayı kopyalayıp doldurun:

```bash
copy config.example.json config.json     # Windows
cp config.example.json config.json       # Linux / macOS
```

Doldurmanız gerekenler:

| Alan | Nereden alınır |
| --- | --- |
| `token` | [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Reset Token |
| `clientId` | Aynı sayfada General Information → Application ID |
| `guildId` | Sunucunuza sağ tık → Sunucu Kimliğini Kopyala |
| Rol / kanal ID'leri | İlgili role veya kanala sağ tık → Kimliği Kopyala |

> Kimlik kopyalamak için Discord ayarlarından **Gelişmiş → Geliştirici Modu**'nu açmanız gerekir.

Bot'un Developer Portal'da **Server Members Intent** ve **Message Content Intent** izinleri açık olmalı.

### Çalıştırma

Slash komutlarını Discord'a bir kez tanıtın, sonra botu başlatın:

```bash
node deploy-commands.js
npm start
```

---

## Kendi sunucunuzda barındırın

Bu botlar için aylık ücret ödemenize gerek yok.

Discord bot'u satan ya da "premium" paket adı altında aylık abonelik isteyen pek çok hizmet var. Oysa bir Discord botu, çalışması için yalnızca Node.js kurulu bir makineye ve kesintisiz internete ihtiyaç duyar. Bu paketteki botların hepsi kaynak kodu açık, tamamı sizin kontrolünüzde ve dilediğiniz yerde çalıştırabileceğiniz halde.

Elinizde zaten bir hosting varsa oraya kurun; yoksa aylık birkaç dolara aldığınız en küçük VPS bu botların beşini birden rahatlıkla kaldırır. Eski bir bilgisayar, bir Raspberry Pi, hatta evdeki bir mini PC bile yeter. Süreci ayakta tutmak için `pm2` gibi bir araç kullanmanız yeterlidir:

```bash
npm install -g pm2
pm2 start index.js --name moderasyon-bot
pm2 save
pm2 startup
```

Bu kadarı, botun makine yeniden başlasa bile kendiliğinden ayağa kalkması için yeterli.

Kendi sunucunuzda barındırmanın asıl kazancı paradan tasarruf da değil: verileriniz sizde kalır, botu istediğiniz gibi değiştirirsiniz, bir hizmet kapandığında ya da fiyat artırdığında elinizde kalan bir şey olmaz. Kod burada, kurulumu yukarıda — gerisi size kalmış.

---

## Katkı ve kullanım

Kodu dilediğiniz gibi inceleyebilir, kendi sunucunuza uyarlayabilir ve geliştirebilirsiniz. Hata bulur veya bir şeyi iyileştirirseniz issue açmaktan çekinmeyin.

## Güvenlik notu

Bot token'ınızı hiçbir koşulda paylaşmayın ve depoya eklemeyin. Token'ı yanlışlıkla bir yere yapıştırdıysanız Developer Portal'dan **Reset Token** ile hemen sıfırlayın — token'ı ele geçiren biri botunuzun yetkilerinin tamamını kullanabilir.

Aynı şekilde `data/` klasörleri sunucunuza ait yedekleri ve kayıtları tuttuğu için depo dışında bırakılmıştır.
