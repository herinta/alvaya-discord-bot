# 🌊 Dokumentasi & Rencana Sistem Rank & Leveling (Alvaya Bot)

Dokumen ini berisi rancangan lengkap, formula matematika XP progresif, konfigurasi database, dan panduan fitur leveling untuk bot **Alvaya**.

---

## 📌 1. Aturan Dasar & Cooldown Anti-Spam
* **Perolehan XP**: Pengguna mendapatkan **15 – 25 XP acak** setiap mengirim 1 pesan teks.
* **Cooldown 1 Menit (60 detik)**: Setiap member memiliki cooldown 60 detik agar tidak terjadi eksploitasi spam chat.
* **Filter Chat**: Pesan dari bot lain, pesan dengan prefix command (`!`, `/`, `.`), dan pesan di bawah 3 karakter diabaikan dari penambahan XP.

---

## 📊 2. Formula Matematika XP per Level (Max Level 10)

Formula perhitungan XP untuk naik dari **Level $L$** ke **Level $L+1$**:

$$\text{XP Dibutuhkan}(L) = 5 \times (L^2) + (50 \times L) + 100$$

### Tabel Level Lengkap (Level 1 – 10):

| Dari Level | Ke Level | XP Dibutuhkan | Total XP Akumulasi | Estimasi Chat (~20 XP) |
| :---: | :---: | :---: | :---: | :---: |
| Level 0 | **Level 1** | **100 XP** | 100 XP | ~5 chat |
| Level 1 | **Level 2** | **155 XP** | 255 XP | ~8 chat |
| Level 2 | **Level 3** | **220 XP** | 475 XP | ~11 chat |
| Level 3 | **Level 4** | **295 XP** | 770 XP | ~15 chat |
| Level 4 | **Level 5** | **380 XP** | 1.150 XP | ~19 chat |
| Level 5 | **Level 6** | **475 XP** | 1.625 XP | ~24 chat |
| Level 6 | **Level 7** | **580 XP** | 2.205 XP | ~29 chat |
| Level 7 | **Level 8** | **695 XP** | 2.900 XP | ~35 chat |
| Level 8 | **Level 9** | **820 XP** | 3.720 XP | ~41 chat |
| Level 9 | **Level 10 (MAX 👑)** | **955 XP** | **4.675 XP** | ~48 chat |

*Total obrolan chat untuk mencapai **Level 10 (MAX)**: sekitar **230 chat aktif**.*

---

## 🗄️ 3. Skema Database MySQL (`kerang_db`)

```sql
CREATE TABLE IF NOT EXISTS user_levels (
    guild_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    xp INT NOT NULL DEFAULT 0,
    level INT NOT NULL DEFAULT 0,
    total_xp INT NOT NULL DEFAULT 0,
    last_xp_gain BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (guild_id, user_id),
    INDEX idx_ranking (guild_id, total_xp DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Konfigurasi di `.env`:
```env
DB_HOST=alamat_host_panel
DB_PORT=3306
DB_USER=username_database
DB_PASSWORD=password_database
DB_NAME=kerang_db
```

---

## 🎮 4. Daftar Slash Commands

| Command | Akses | Deskripsi |
| :--- | :--- | :--- |
| **`/rank [user]`** | Semua Member | Menampilkan kartu profil Canvas (Avatar, Rank `#`, Level, Bar XP). Saat mencapai Level 10, tampilan berubah menjadi **Gold Edition (`10 👑`)**. |
| **`/leaderboard`** | Semua Member | Menampilkan **Top 10** member paling aktif di server. |
| **`/level-admin add-xp`** | Admin | Menambahkan sejumlah XP ke pengguna secara manual. |
| **`/level-admin set-level`** | Admin | Mengatur level pengguna secara langsung (Maksimal Level 10). |

---

## 📁 5. Lokasi File Kodingan Terkait
* **Kalkulator Formula**: `src/utils/levelCalculator.js`
* **Desain Kartu Canvas**: `src/utils/rankCard.js`
* **Query & Model Database**: `src/database/models/levelModel.js`
* **Koneksi Database MySQL**: `src/database/db.js`
* **Handler Chat & Cooldown**: `src/handlers/levelingHandler.js`
* **Command Files**: `src/commands/leveling/` & `src/commands/admin/level-admin.js`
