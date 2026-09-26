CREATE TABLE "KAMERA" (
    id_kamera SERIAL PRIMARY KEY,
    nama_kamera VARCHAR(100) NOT NULL,
    merk VARCHAR(100) NOT NULL,
    jenis VARCHAR(50) NOT NULL,
    harga_sewa_per_hari NUMERIC(12,2) NOT NULL CHECK (harga_sewa_per_hari > 0),
    status_kamera VARCHAR(20) NOT NULL CHECK (status_kamera IN ('Tersedia', 'Disewa'))
);

CREATE TABLE "PELANGGAN" (
    id_pelanggan SERIAL PRIMARY KEY,
    nama_pelanggan VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(20) NOT NULL UNIQUE,
    alamat TEXT NOT NULL
);

CREATE TABLE "TRANSAKSI_SEWA" (
    id_transaksi SERIAL PRIMARY KEY,
    id_kamera INT NOT NULL,
    id_pelanggan INT NOT NULL,
    tanggal_sewa DATE NOT NULL,
    tanggal_kembali DATE NOT NULL,
    lama_sewa INT NOT NULL CHECK (lama_sewa > 0),
    harga_per_hari NUMERIC(12,2) NOT NULL CHECK (harga_per_hari > 0),
    total_pendapatan NUMERIC(12,2) NOT NULL CHECK (total_pendapatan >= 0),
    status_transaksi VARCHAR(20) NOT NULL CHECK (status_transaksi IN ('Aktif', 'Selesai', 'Batal')),
    CONSTRAINT fk_transaksi_kamera
        FOREIGN KEY (id_kamera)
        REFERENCES "KAMERA"(id_kamera)
        ON DELETE RESTRICT,
    CONSTRAINT fk_transaksi_pelanggan
        FOREIGN KEY (id_pelanggan)
        REFERENCES "PELANGGAN"(id_pelanggan)
        ON DELETE RESTRICT
);

INSERT INTO "KAMERA" (nama_kamera, merk, jenis, harga_sewa_per_hari, status_kamera)
VALUES
    ('Canon EOS R6', 'Canon', 'Mirrorless', 450000, 'Tersedia'),
    ('Sony A7 III', 'Sony', 'Mirrorless', 500000, 'Tersedia'),
    ('Canon 70D', 'Canon', 'DSLR', 300000, 'Disewa'),
    ('Fujifilm X-T4', 'Fujifilm', 'Mirrorless', 420000, 'Tersedia');

INSERT INTO "PELANGGAN" (nama_pelanggan, no_telepon, alamat)
VALUES
    ('Ayu Lestari', '081234567890', 'Jl. Merdeka No. 12, Bandung'),
    ('Budi Santoso', '082345678901', 'Jl. Cendana No. 45, Jakarta'),
    ('Citra Dewi', '083456789012', 'Jl. Melati No. 8, Surabaya');

INSERT INTO "TRANSAKSI_SEWA" (id_kamera, id_pelanggan, tanggal_sewa, tanggal_kembali, lama_sewa, harga_per_hari, total_pendapatan, status_transaksi)
VALUES
    (3, 1, '2026-09-10', '2026-09-12', 3, 300000, 900000, 'Selesai'),
    (1, 2, '2026-09-18', '2026-09-21', 4, 450000, 1800000, 'Aktif'),
    (2, 3, '2026-09-15', '2026-09-17', 3, 500000, 1500000, 'Selesai');
