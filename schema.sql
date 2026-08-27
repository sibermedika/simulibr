-- ================================================================
-- EDUHUB & SIMULATOR CURATOR - MYSQL / MARIADB SCHEMA
-- Versi Kosongan (Clean Production Database with Default Super Admin)
-- ================================================================

CREATE DATABASE IF NOT EXISTS `edusim` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `edusim`;

-- 1. Tabel Clusters (Institusi & Sekolah SaaS)
CREATE TABLE IF NOT EXISTS `clusters` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(64) UNIQUE NOT NULL,
  `description` TEXT,
  `subscriptionTier` VARCHAR(32) DEFAULT 'PRO',
  `subscriptionStatus` VARCHAR(32) DEFAULT 'ACTIVE',
  `maxSimulators` INT DEFAULT 50,
  `maxTeachers` INT DEFAULT 15,
  `primaryColor` VARCHAR(32) DEFAULT '#0284c7',
  `createdAt` VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Users (Otentikasi Multi-Role)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `username` VARCHAR(64) UNIQUE NOT NULL,
  `name` VARCHAR(255),
  `email` VARCHAR(255),
  `passwordHash` TEXT NOT NULL,
  `role` VARCHAR(32) NOT NULL, -- 'SUPER_ADMIN', 'ADMIN_CLUSTER', 'TEACHER_CLUSTER', 'STUDENT_CLUSTER'
  `clusterId` VARCHAR(64) NULL,
  `createdAt` VARCHAR(64) NOT NULL,
  INDEX `idx_users_cluster` (`clusterId`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Categories (Kategori Modul Simulator)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(64) UNIQUE NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(64) DEFAULT 'Atom',
  `color` VARCHAR(32) DEFAULT 'blue'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Simulators (Koleksi Simulator Single-File HTML)
CREATE TABLE IF NOT EXISTS `simulators` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `categoryId` VARCHAR(64) NOT NULL,
  `clusterId` VARCHAR(64) NULL,
  `filePath` TEXT NULL,
  `htmlContent` LONGTEXT NULL,
  `thumbnailUrl` TEXT NULL,
  `isPublished` TINYINT(1) DEFAULT 1,
  `viewsCount` INT DEFAULT 0,
  `author` VARCHAR(255) DEFAULT 'Pengajar EduHub',
  `tags` TEXT,
  `createdAt` VARCHAR(64) NOT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  INDEX `idx_sim_cat` (`categoryId`),
  INDEX `idx_sim_cluster` (`clusterId`),
  INDEX `idx_sim_published` (`isPublished`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- INITIAL SEED (KOSONGAN: HANYA SUPER ADMIN & KATEGORI DASAR)
-- ================================================================

-- Default Super Admin (Username: superadmin, Password: superadmin123)
-- Hash bcrypt 10 rounds: $2a$10$wE0P6xWj.5rXQdM9aJ9FvOF9q0VnI9sP2r9L.3oGj7WnBvC3xKxSe
INSERT INTO `users` (`id`, `username`, `name`, `email`, `passwordHash`, `role`, `clusterId`, `createdAt`)
VALUES (
  'usr-superadmin',
  'superadmin',
  'Super Administrator',
  'superadmin@edusim.hub',
  '$2a$10$3Ym2u9b8T5W8n2B9eJ0gce3x5N2j9wE1Q8l3k2m1n0o9p8q7r6s5t', -- Diganti / di-hash otomatis saat server start
  'SUPER_ADMIN',
  NULL,
  NOW()
) ON DUPLICATE KEY UPDATE `id`=`id`;

-- Kategori STEM Standar
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`, `color`) VALUES
('cat-physics', 'Fisika & Mekanika', 'fisika-mekanika', 'Simulasi gerak partikel, osilasi pegas, optika gelombang, dan termodinamika', 'Atom', 'blue'),
('cat-electronics', 'Elektronika & Sirkuit', 'elektronika-sirkuit', 'Rangkaian gerbang logika digital, breadboard virtual, resistor, dan osiloskop', 'Cpu', 'amber'),
('cat-chemistry', 'Kimia & Atom', 'kimia-atom', 'Struktur molekul 3D, reaksi stoikiometri asam basa, dan tabel periodik interaktif', 'FlaskConical', 'emerald'),
('cat-astronomy', 'Astronomi & Antariksa', 'astronomi-antariksa', 'Orbit tata surya gravitasi Newton, mekanika orbital satelit, dan konstelasi bintang', 'Sparkles', 'purple'),
('cat-math-comp', 'Matematika & Komputasi', 'matematika-komputasi', 'Kalkulus visual, visualisasi algoritma graf, geometri fraktal, dan probabilitas', 'Layers', 'rose')
ON DUPLICATE KEY UPDATE `id`=`id`;
