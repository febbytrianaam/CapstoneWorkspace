# Backend Capstone Workspace

Backend dibuat ringan dengan PHP PDO + MySQL agar mudah dijalankan di XAMPP/Laragon.

## Setup Database

1. Buka phpMyAdmin atau MySQL client.
2. Jalankan file `database/schema.sql`.
3. Sesuaikan kredensial di `backend/config.php` jika MySQL lokal tidak memakai `root` tanpa password.

Default koneksi:

- host: `127.0.0.1`
- database: `capstone_workspace`
- username: `root`
- password: kosong

## Endpoint Awal

- `GET backend/api/index.php?resource=snapshot`
- `GET backend/api/index.php?resource=tasks`
- `POST backend/api/index.php?resource=tasks`
- `PUT backend/api/index.php?resource=tasks&id=t-101`
- `DELETE backend/api/index.php?resource=tasks&id=t-101`
- `POST backend/api/index.php?resource=meetings`
- `DELETE backend/api/index.php?resource=meetings&id=m-101-1` (soft delete; ditolak jika sudah ada berita acara)
- `PUT backend/api/index.php?resource=meetings&id=m-101-1` dengan body `{"action":"mark_berita_acara"}` untuk mengunci pertemuan
- `GET backend/api/index.php?resource=users`
- `POST backend/api/index.php?resource=auth` dengan body `{"username":"febby","password":"123"}` untuk login

## Matrix RBAC

- `superadmin`: akses penuh dashboard, CRUD tugas/pengguna/pertemuan, berita acara, dan audit.
- `koordinator`: CRUD tugas dan pertemuan, baca pengguna/audit, serta buat berita acara.
- `member`: baca dashboard/tugas/pertemuan, ubah progres tugas, dan tidak dapat menghapus data atau membuka menu pengguna/audit.
- `GET backend/api/index.php?resource=audit-logs`
- `POST backend/api/index.php?resource=audit-logs` untuk menyimpan aktivitas dari frontend ke MySQL
- `DELETE backend/api/index.php?resource=audit-logs` untuk mengosongkan log audit

