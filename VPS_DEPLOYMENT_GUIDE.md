# Panduan Instalasi & Deployment VPS (Versi Final Produksi)

Aplikasi **Educational HTML Simulator Hub & Curator** telah disiapkan dalam versi final kosongan (clean production), mendukung database **SQLite** (bawaan zero-config) maupun **MySQL / MariaDB**, serta hanya menyertakan 1 akun default **Super Administrator**.

---

## 🔑 Kredensial Default Super Admin

| Parameter | Nilai Bawaan | Keterangan |
| :--- | :--- | :--- |
| **Username** | `superadmin` | Dapat dikonfigurasi via `SUPERADMIN_USERNAME` di `.env` |
| **Password** | `superadmin123` | Dapat dikonfigurasi via `SUPERADMIN_PASSWORD` di `.env` |
| **Role** | `SUPER_ADMIN` | Hak akses penuh membuat Cluster Institusi, Sekolah, dan Pengguna |

*Catatan: Tidak ada akun demo atau sample user lain di database. Database siap diisi cluster dan simulator sekolah Anda.*

---

## 🚀 Metode 1: Instalasi Cepat dengan Node.js & PM2 di VPS (Rekomendasi)

### 1. Persiapan Server VPS (Ubuntu / Debian)
```bash
# Update repository
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS & Git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# Install PM2 Process Manager secara global
sudo npm install -g pm2
```

### 2. Upload / Clone Source Code ke VPS
```bash
# Masuk ke direktori web
cd /var/www
git clone <URL_REPOSITORY_ANDA> edusim
cd edusim

# Install dependensi
npm install

# Buat berkas environment
cp .env.example .env
nano .env
```

### 3. Build & Jalankan Aplikasi
```bash
# Build frontend Vite dan backend server
npm run build

# Jalankan dengan PM2 (Auto restart saat crash / reboot)
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 🗄️ Konfigurasi Database (SQLite vs MySQL)

### Pilihan A: SQLite (Default Zero-Config — Paling Praktis)
Tidak perlu menginstal server MySQL. Cukup pastikan di berkas `.env`:
```env
DB_TYPE=sqlite
```
Data otomatis tersimpan di direktori `./data/edusim.db`.

### Pilihan B: MySQL / MariaDB (Untuk Skala Besar)
1. Buat database dan user di MySQL:
```sql
CREATE DATABASE edusim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'edusim_user'@'localhost' IDENTIFIED BY 'password_aman_anda';
GRANT ALL PRIVILEGES ON edusim.* TO 'edusim_user'@'localhost';
FLUSH PRIVILEGES;
```
2. Sesuaikan berkas `.env`:
```env
DB_TYPE=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=edusim_user
MYSQL_PASSWORD=password_aman_anda
MYSQL_DATABASE=edusim
```
*(Tabel dan akun Super Admin akan dibuat secara otomatis saat server dinyalakan).*

---

## 🐳 Metode 2: Instalasi Menggunakan Docker & Docker Compose

Jika VPS Anda sudah terpasang Docker:
```bash
# 1. Jalankan aplikasi via Docker Compose
docker compose up -d --build

# 2. Periksa status container
docker compose ps
```
Aplikasi langsung berjalan di `http://IP_VPS_ANDA:3000`.

---

## 🌐 Konfigurasi Nginx Reverse Proxy & SSL HTTPS (Domain Anda)

### 1. Buat Konfigurasi Nginx
```bash
sudo nano /etc/nginx/sites-available/edusim.conf
```
Isi dengan konfigurasi berikut:
```nginx
server {
    server_name simulasi.domain-anda.com;

    # Batas ukuran upload file HTML simulator (hingga 30MB)
    client_max_body_size 30M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Aktifkan Site & Pasang SSL Gratis (Let's Encrypt)
```bash
sudo ln -s /etc/nginx/sites-available/edusim.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Pasang SSL Certbot otomatis
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d simulasi.domain-anda.com
```

---

## 🎯 Langkah Selanjutnya Setelah Terpasang:
1. Buka domain/IP Anda di browser.
2. Klik tombol **Masuk / Login** di pojok kanan atas.
3. Masukkan `superadmin` / `superadmin123`.
4. Masuk ke menu **SaaS Institusi / Kelola Cluster** untuk membuat cluster sekolah pertama Anda dan menambahkan akun Guru / Pengajar.
5. Guru dapat mulai mengunggah file single-file `.html` simulasi fisika, kimia, matematika, maupun sirkuit elektronika.
