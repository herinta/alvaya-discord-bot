# 🌊 Alvaya Discord Bot

**Alvaya Bot** adalah bot Discord serbaguna yang dibangun menggunakan **Discord.js v14**, **Node.js**, **MySQL2**, dan **@napi-rs/canvas**. Bot ini dirancang khusus untuk komunitas dengan fitur interaktif modern seperti sistem level & rank berbasis chat, panel formulir perkenalan (Member Introduction), dynamic role buttons, voice lounge otomatis, confession anonim, kartu welcome kustom, dan pelacak YouTube Live.

---

## 📁 Struktur Proyek (Modular Architecture)

```text
alvaya-bot/
├── index.js                     # Root entry point (untuk hosting Pterodactyl / VPS)
├── package.json                 # Node.js dependencies & scripts
├── .env                         # Konfigurasi environment (Token, Database, API Keys)
├── LEVELING_PLAN.md             # Blueprint & formula matematika leveling
├── README.md                    # Dokumentasi lengkap bot
├── assets/                      # Asset gambar lokal
│   └── welcome.jpg              # Template background welcome card
└── src/
    ├── index.js                 # Inisialisasi client, HTTP server keepalive, dan loader
    │
    ├── config/                  # Konfigurasi terpusat
    │   └── config.js            # ID Channel, Role, Category, YouTube, dan Preset Game
    │
    ├── database/                # Database layer
    │   ├── db.js                # Koneksi MySQL pool & auto-create tables
    │   └── models/
    │       └── levelModel.js    # Query data level, XP, rank position, leaderboard
    │
    ├── commands/                # Slash Commands (/command)
    │   ├── admin/               # Khusus Staf & Admin
    │   │   ├── announce.js      # /announce (Modal form embed & text)
    │   │   ├── edit-message.js  # /edit-message (Edit pesan bot via ID)
    │   │   ├── add-roles.js     # /add-roles (Buat panel button select roles)
    │   │   ├── edit-roles.js    # /edit-roles (Edit panel role yang sudah ada)
    │   │   └── level-admin.js   # /level-admin (add-xp / set-level)
    │   └── leveling/            # Fitur Umum Leveling
    │       ├── rank.js          # /rank (Kartu profil canvas)
    │       └── leaderboard.js   # /leaderboard (Top 10 member teraktif)
    │
    ├── events/                  # Event Discord.js
    │   ├── ready.js             # Bot online, auto-deploy slash command, YT tracker
    │   ├── interactionCreate.js # Master router (Slash, Modal, Button, Select Menu)
    │   ├── messageCreate.js     # Chat message handler (XP leveling & text commands)
    │   ├── voiceStateUpdate.js  # Auto-delete voice lounge jika kosong
    │   ├── guildMemberAdd.js    # Welcome card generator (Canvas)
    │   └── guildCreate.js       # Auto-leave server asing (Whitelist protection)
    │
    ├── handlers/                # Pemroses Logika Fitur
    │   ├── commandHandler.js    # Otomatis load file slash commands
    │   ├── eventHandler.js      # Otomatis load file events
    │   ├── introHandler.js      # Logika modal perkenalan member & auto-scroll
    │   ├── customRoleHandler.js # Logika dynamic role buttons & single/multi select
    │   ├── confessHandler.js    # Logika modal confession & auto-scroll panel rules
    │   ├── gameVoiceHandler.js  # Logika dynamic temporary game voice channels
    │   └── levelingHandler.js   # Logika XP, cooldown 1 menit & level up notifications
    │
    └── utils/                   # Utilities & Helpers
        ├── permissions.js       # Helper verifikasi izin staf (Poseidon / Neptune)
        ├── levelCalculator.js   # Formula kalkulasi XP & batas Max Level 10
        └── rankCard.js          # Generator gambar Canvas untuk kartu /rank
```

---

## ✨ Fitur-Fitur Utama

### 1. 🪪 Formulir Member Introduction (Auto-Scroll)
* Member dapat mengisi biodata perkenalan singkat melalui formulir popup Modal:
  * **Nickname**
  * **Age**
  * **Hobby**
  * **Game**
* Hasil perkenalan ditampilkan dalam format Embed Cyan elegan lengkap dengan **foto profil (avatar) pengguna** di pojok thumbnail.
* Panel tombol perkenalan otomatis dipindahkan ke paling bawah setiap ada submit baru agar selalu mudah diakses (*Auto-scroll*).

### 2. 🏆 Sistem Rank & Leveling (Max Level 10)
* **Perolehan XP**: Mendapatkan **15 – 25 XP** acak tiap chat.
* **Anti-Spam Cooldown**: Batas 1 menit per user agar chat spamming tidak dihitung.
* **Max Level 10**: Formula progresif $\text{XP Dibutuhkan}(L) = 5L^2 + 50L + 100$.
* **Visual Rank Card**: Menggambar kartu rank mewah menggunakan Canvas (`/rank`). Pada Level 10, kartu berubah menjadi **Gold Edition (`10 👑`)**.
* **Papan Peringkat**: Menampilkan 10 member teratas (`/leaderboard`).

### 3. 🎭 Dynamic Select Roles Panel (`/add-roles` & `/edit-roles`)
* Membuat panel pilihan role interaktif melalui popup formulir Modal.
* Mendukung format kustom: `Emoji | Nama Role`.
* Mendukung **Multi-Select** (bisa ambil banyak role) atau **Single-Select** (hanya boleh pilih 1 role eksklusif).

### 4. 📢 Sistem Pengumuman Interaktif (`/announce` & `/edit-message`)
* **Pengumuman Embed**: Menampilkan form modal judul, isi pesan multi-baris, gambar URL, dan otomatis ping `@everyone` / `@here`.
* **Pengumuman Teks Biasa**: Mengirim pesan biasa atas nama bot.
* **Edit Pesan**: Mengedit kembali pesan bot yang sudah terkirim cukup dengan memasukkan Message ID.

### 5. 🎮 Dynamic Game Voice Lounge
* Menggunakan dropdown menu untuk membuat ruang voice game otomatis (Valorant, Dota 2, Apex Legends, ML, PUBG, FF).
* Otomatis membatasi kapasitas maksimal orang di voice channel dan menghapus channel jika sudah kosong.

### 6. 💬 Confession Anonim
* Member bisa mengirim curhatan rahasia secara anonim atau menampilkan nama lewat formulir Modal dengan auto-scroll panel peraturan.

### 7. 🖼️ Custom Welcome Canvas Card
* Member baru yang bergabung akan disambut dengan gambar kartu canvas khusus berisi avatar bulat dan nama mereka.

### 8. 🔴 YouTube Live Tracker
* Mengecek live stream YouTube setiap 5 menit secara otomatis menggunakan YouTube Data API v3.

### 9. 🛡️ Server Whitelist Protection
* Bot otomatis keluar (*auto-leave*) jika diundang ke server Discord selain server resmi yang terdaftar di whitelist.

---

## ⚙️ Panduan Setup & Konfigurasi

### 1. Prasyarat
* **Node.js** versi 20.x atau lebih baru.
* Server database **MySQL** (lokal atau Pterodactyl hosting).

### 2. File `.env`
```env
# Token Bot Discord (Wajib)
DISCORD_TOKEN=your_discord_bot_token_here

# Server Whitelist
ALLOWED_GUILD_IDS=1472819152979886133

# YouTube Data API v3 (Opsional)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Database MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=kerang_db
```

---

## 📋 Daftar Perintah (Commands)

### Slash Commands (`/`)
| Command | Hak Akses | Deskripsi |
| :--- | :--- | :--- |
| `/rank [user]` | Semua Member | Menampilkan kartu profil level, progress bar XP, dan posisi rank. |
| `/leaderboard` | Semua Member | Menampilkan daftar 10 member dengan level tertinggi di server. |
| `/announce` | Poseidon / Neptune / Admin | Membuka popup form untuk membuat pengumuman (Embed / Teks biasa). |
| `/edit-message` | Poseidon / Neptune / Admin | Mengedit pesan yang pernah dikirim oleh bot melalui Message ID. |
| `/add-roles` | Poseidon / Neptune / Admin | Membuka popup form untuk membuat panel tombol role. |
| `/edit-roles` | Poseidon / Neptune / Admin | Mengedit isi judul, deskripsi, atau tombol pada panel role yang ada. |
| `/level-admin add-xp` | Admin | Menambahkan sejumlah XP ke pengguna secara manual. |
| `/level-admin set-level` | Admin | Mengatur level pengguna secara instan (0 – 10). |

### Text Commands (`!`)
| Command | Hak Akses | Deskripsi |
| :--- | :--- | :--- |
| `!setupintro` | Administrator | Mengirim panel tombol awal formulir Member Introduction. |
| `!setupconfess` | Administrator | Mengirim panel awal tombol formulir Confession. |
| `!setupvoice` | Administrator | Mengirim panel menu dropdown Game Lounge. |
| `!testwelcome` | Semua Member | Uji coba kartu welcome card canvas. |
| `!ping` | Semua Member | Tes respon bot (`pong 🏓`). |
