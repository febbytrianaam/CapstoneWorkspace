# Audit Alur dan Bug Capstone Workspace

Tanggal: 17 Oktober 2026 (WIB).

Status: analisis, bukan laporan perbaikan. Temuan di bawah belum diperbaiki dalam audit ini. Perbaikan seleksi judul modal BA dari permintaan sebelumnya sudah ada di working tree dan dipertahankan.

Tindak lanjut pada 17 Oktober: delapan improvement alur telah diimplementasikan setelah audit ini. Lihat [laporan implementasi](../../30_implemented/2026-10-17-team-workflow-improvements/implementation_report.md). Dokumen audit di bawah mempertahankan kondisi saat pemeriksaan awal; tidak semua temuannya masih terbuka dan tidak semuanya sudah selesai. Database live tidak dipakai dalam pengujian tindak lanjut.

## Kesimpulan

Belum dapat dinyatakan production-ready. Navigasi dasar berjalan, tetapi ada masalah keamanan, inisialisasi saat refresh, konfirmasi penyimpanan, integritas data, dan transisi review yang perlu diselesaikan. Terdapat 25 kelompok temuan: 9 P1 dan 16 P2.

- P1: berisiko pada akses, kehilangan data, atau alur utama yang gagal.
- P2: kesalahan alur, konsistensi, atau interaksi yang perlu dibenahi.
- Reproduksi: diamati pada browser dengan data sintetis atau cabang API terisolasi.
- Statis: ditelusuri dari kode; dampak pada database/deployment nyata belum diuji.

## Ruang Lingkup dan Batas Pengujian

- Dibaca: app shell, partial halaman/modal, ketiga file JavaScript, API, Repository, skema/migrasi, script seed/rekonsiliasi, dan dokumentasi saat ini.
- Browser: headless Chrome terpasang, HTML hasil render `index.php`, CSS/JavaScript aplikasi yang sebenarnya, serta snapshot dan respons API sintetis yang diintersep. Chart.js dan SweetAlert2 diganti stub untuk mengisolasi alur UI.
- Verifikasi akhir mencakup 40 kunjungan menu dengan identitas role yang diperiksa: 18 superadmin, 12 koordinator, dan 10 member, pada viewport 1365 x 900 dan 390 x 844. Tidak ada tujuan navigasi yang salah, error JavaScript, atau overflow halaman pada fixture dasar dengan snapshot diterima setelah inisialisasi. Uji timing terpisah menemukan startup error F25.
- Uji regresi BA sebelumnya juga mencakup viewport 360 piksel.
- Cabang endpoint tugas diuji dengan kode otorisasi API yang sebenarnya dan repository tiruan. Tidak ada koneksi atau penulisan ke database nyata.
- Semua 28 file PHP lolos lint; `node --check` lolos untuk `app.js`, `data.js`, dan `rbac.js`.
- Tidak mengakses endpoint seed melalui HTTP, menjalankan seed, mengganti akun/password nyata, mengunggah file nyata, atau mengubah Cloudflare.
- Tidak melakukan pengujian login dengan akun nyata, pemeriksaan konfigurasi Cloudflare secara live, pengujian SQL end-to-end, atau pengujian serentak terhadap database produksi. Local server port 4000 tidak tersedia saat pemeriksaan awal.
- Lolos uji navigasi dasar bukan bukti bahwa semua aksi berhasil disimpan atau semua layout dengan data nyata sudah benar.

## Temuan P1

### F01. Script seed lama dapat dijalankan tanpa login melalui web root

- Bukti: `database/seed_capstone_tasks.php:7`, `:247`, `:251`, `:253`. Script langsung terhubung ke database dan menghapus/membuat ulang tugas, tanpa pemeriksaan session, CLI-only, atau mode dry-run.
- Pemicu: bila deployment mengikuti `php -S localhost:4000` dari root repository tanpa router pembatas, request langsung ke script dapat mengeksekusinya sebelum pengguna login aplikasi.
- Dampak: tugas seed lama dan checklist dapat tertimpa; pertemuan terkait juga berisiko hilang karena cascade. Script dry-run lain juga dapat membocorkan informasi tugas jika diakses langsung.
- Verifikasi: statis. Endpoint tidak dipanggil untuk menghindari perubahan data. Keberadaan aturan pembatas tambahan di Cloudflare belum diverifikasi.
- Perbaikan: jadikan semua script administrasi CLI-only dan batasi file/direktori yang dapat dilayani web.

### F02. Isi notifikasi dieksekusi sebagai HTML

- Bukti: `js/app.js:307`; API menerima POST notifikasi dari member di `backend/api/index.php:119`, lalu `backend/Repository.php:737` menyimpan teks dari payload.
- Pemicu: teks notifikasi berisi markup dengan event handler, lalu dropdown notifikasi dirender menggunakan `innerHTML`.
- Dampak: stored XSS dalam origin aplikasi, termasuk saat notifikasi dibuka superadmin. Identitas pengirim dan target notifikasi juga dapat dikarang dari payload.
- Verifikasi: reproduksi browser; penanda JavaScript sintetis di notifikasi berhasil berjalan. Tidak dikirim ke server nyata.
- Perbaikan: render teks dengan `textContent`/escaping, gunakan identitas session di server, dan buat notifikasi dari peristiwa server yang tervalidasi.

### F03. File HTML dapat menyamar sebagai PDF lalu dibuka dalam origin aplikasi

- Bukti: `backend/api/index.php:170`, `:179`, `:186`, `:214`, `:217`, `:233`, `:244`, `:251`.
- Pemicu: nama file memakai ekstensi yang diperbolehkan, tetapi isi sebenarnya HTML. Server mendeteksi MIME HTML dan menyimpannya tanpa mencocokkan tipe dengan ekstensi. Aksi Lihat kemudian mengirim MIME tersebut secara inline.
- Dampak: konten aktif dari upload dapat berjalan sebagai halaman aplikasi. `nosniff` tidak mencegahnya karena server sendiri menyatakan tipe `text/html`.
- Verifikasi: jalur upload/stream dibaca statis; PHP `finfo` mengonfirmasi fixture bernama `qa.pdf` terdeteksi `text/html`. Tidak ada file diunggah ke database nyata.
- Perbaikan: validasi kombinasi ekstensi, MIME, dan format; izinkan inline hanya untuk tipe aman yang tervalidasi. Unduh tipe lain sebagai attachment atau gunakan origin preview terpisah.

### F04. UI menyatakan tersimpan sebelum API berhasil

- Bukti: `js/data.js:567`, `:913`, `:937`, `:950`, `:1097`, `:1169`, `:1208`, `:1238`, `:1279`; `js/app.js:4998`, `:5117`, `:3170`.
- Pemicu: simpan tugas/pengguna/pertemuan/catatan atau hapus data ketika API mengembalikan 403, 422, 500, atau koneksi putus.
- Dampak: modal ditutup, tampilan lokal berubah, bahkan pesan sukses muncul; data kembali seperti semula setelah reload. Notifikasi/audit dari browser dapat tercatat untuk aksi yang sebenarnya gagal.
- Verifikasi: reproduksi full UI dengan PUT tugas ditolak 422. Modal tetap menutup, deskripsi lokal berubah, dan tidak ada pesan gagal.
- Perbaikan: tunggu hasil API, validasi `ok`, gunakan data respons sebagai hasil resmi, pertahankan form saat gagal, dan cegah submit berulang. Jika memilih optimistic update, wajib rollback dan tampilkan kegagalannya.

### F05. `reviewAction` lama ikut terkirim pada edit berikutnya

- Bukti: `js/data.js:1177`, `:1193`, `:1202`; validasi state di `backend/api/index.php:373`, `:376`.
- Pemicu: approve atau batalkan review, kemudian edit tugas yang sama tanpa reload. Aksi disimpan di objek tugas, dan update berikutnya mengirim seluruh objek termasuk aksi lama.
- Dampak: edit biasa mengulang approve/cancel. API menolaknya karena state sudah berubah, tetapi UI terkena F04. Submit lama juga dapat mengubah waktu pengajuan kembali.
- Verifikasi: browser mengirim `reviewAction: approve` pada dua PUT berurutan, yang kedua hanya dimaksudkan mengedit deskripsi. Cabang API asli mengembalikan 422 untuk approve pada tugas yang sudah approved.
- Perbaikan: pisahkan command review dari state tugas; kirim aksi hanya untuk satu request dan ganti state lokal dengan respons server.

### F06. Pengaturan RBAC yang tersimpan tidak digunakan oleh gate API

- Bukti: `backend/Repository.php:37`, `backend/api/index.php:119`, `js/rbac.js:77`, `:106`.
- Pemicu: superadmin menonaktifkan permission di menu RBAC, atau mengaktifkan kemampuan member yang tidak ada dalam daftar hardcoded API.
- Dampak: permission yang dicabut hanya memengaruhi UI; request langsung masih bisa lolos berdasarkan role tetap. Sebaliknya, tombol yang diaktifkan lewat RBAC bisa tetap ditolak API. Flag baca/pertemuan tertentu juga dikunci lagi oleh role pada pembentuk snapshot.
- Verifikasi: statis. Daftar permission database dibaca untuk endpoint RBAC, tetapi otorisasi resource memakai array hardcoded dan tidak mengevaluasi permission tersimpan.
- Perbaikan: satu sumber policy di backend untuk endpoint dan snapshot, lalu kirim kemampuan efektif ke frontend. Perubahan RBAC harus menunggu konfirmasi server.

### F07. Menyimpan tugas dapat menimpa atau menghapus pertemuan dari snapshot lama

- Bukti: `js/data.js:1202`, `backend/Repository.php:563`, `:1041`, `:1043`; `database/schema.sql:81`.
- Pemicu: pengelola menyimpan task dengan daftar meeting cache lama; update mengirim seluruh task dan Repository menghapus/reinsert seluruh meeting aktif. Pertemuan yang baru dibuat pengguna lain tidak ada di snapshot tersebut.
- Dampak: agenda baru dapat terhapus permanen, termasuk yang memiliki BA. Menghapus task juga memakai cascade dan melewati perlindungan `deleteMeeting()` terhadap pertemuan ber-BA.
- Verifikasi: statis; tidak melakukan race test atau DELETE pada database nyata.
- Perbaikan: update hanya field tugas yang berubah; pisahkan CRUD meeting; jangan menghapus meeting lewat simpan task. Lindungi relasi BA saat delete task dan gunakan version check untuk perubahan bersamaan.

### F08. Perubahan beberapa tabel tidak atomik

- Bukti: `backend/Repository.php:479`, `:511`, `:1023`, `:1041`, `:405`.
- Pemicu: INSERT checklist/meeting atau validasi password gagal setelah perubahan lain sudah dijalankan. Checklist lama dihapus sebelum penggantinya selesai diinsert; `updateUser()` mengubah profil sebelum memvalidasi panjang password baru.
- Dampak: request gagal dapat meninggalkan task, profil, atau checklist dalam keadaan berubah sebagian. Pada MySQL strict mode, teks checklist melebihi kapasitas kolom dapat memicu kasus ini.
- Verifikasi: statis; tidak memicu kegagalan SQL pada data nyata. Metode-metode ini tidak memakai transaksi dan API tidak membungkusnya dalam transaksi.
- Perbaikan: validasi seluruh payload terlebih dahulu; gunakan transaksi untuk operasi task/checklist/meeting/audit dan update pengguna yang saling bergantung.

### F25. Snapshot cepat dapat menggagalkan inisialisasi dan membuat aplikasi blank

- Bukti: `js/app.js:85` menjalankan `initDocumentArchive()` sebelum deklarasi `const WIB_MONTHS` di `:2484`; `refreshDocumentArchiveMeetingSelect()` di `:1472` memformat tanggal meeting melalui `getWibDateParts()` di `:2521`.
- Pemicu: snapshot backend berisi meeting sudah tiba sebelum callback DOMContentLoaded selesai menginisialisasi kontrol. Dropdown arsip mencoba memformat tanggal sebelum konstanta tanggal diinisialisasi.
- Dampak: `ReferenceError: Cannot access 'WIB_MONTHS' before initialization` menghentikan bootstrap. Listener ready tidak selesai terpasang, class `data-ready` tidak muncul, dan halaman bisa tetap kosong. Kecepatan jaringan/cache dapat membuatnya tampak tidak konsisten.
- Verifikasi: direproduksi deterministik dengan menunda pengiriman `app.js` 250 ms sementara snapshot berisi meeting dikembalikan segera. Stack error berasal dari `initDocumentArchive -> refreshDocumentArchiveMeetingSelect -> buildDocumentArchiveMeetingOptions -> formatWibDateOnly -> getWibDateParts`; halaman masih `auth-pending` pada observasi awal.
- Perbaikan: deklarasikan seluruh konstanta yang dipakai helper sebelum memanggil inisialisasi UI; buat satu urutan bootstrap yang menunggu data dan permission, lalu baru render kontrol yang bergantung pada keduanya.

## Temuan P2

### F09. Member dapat mengubah struktur checklist lewat API

- Bukti: `backend/api/index.php:361` mengizinkan field `checklist`; `backend/Repository.php:559`, `:1023` mengganti isi item. UI sendiri menjadikan teks checklist read-only bagi member.
- Dampak: PIC dapat menambah, menghapus, atau mengganti item dengan request langsung meskipun seharusnya hanya mengubah centang.
- Verifikasi: cabang API asli menerima payload checklist baru dengan respons 200.
- Perbaikan: terima status centang berdasarkan ID item yang sudah ada; validasi panjang dan kepemilikan daftar di server.

### F10. Tugas arsip masih dapat diubah lewat API member

- Bukti: `backend/api/index.php:340` memeriksa PIC tetapi tidak menolak task yang `archivedAt` terisi. Penguncian berada di `js/app.js:4799` dan `:5030`.
- Dampak: PIC dapat mengubah progres/checklist tugas arsip melalui request langsung. Jika status arsip berubah dari Selesai, tombol pemulihan juga dapat hilang karena `canArchiveTask()` mengharuskan Selesai.
- Verifikasi: cabang API asli menerima perubahan status pada fixture task arsip dengan respons 200.
- Perbaikan: tolak edit task arsip di backend; sediakan transisi restore khusus superadmin yang tidak bergantung pada status task yang mungkin sudah tidak konsisten.

### F11. Ajukan Review membuang perubahan checklist yang belum disimpan

- Bukti: `js/app.js:4946`, `:4990` hanya menyusun payload review/note/link, bukan state checklist atau perubahan form lainnya.
- Pemicu: centang checklist di modal, lalu langsung klik Ajukan Review.
- Dampak: muncul pesan berhasil tetapi checklist yang direview masih versi lama.
- Verifikasi: full UI; checklist dicentang, PUT pengajuan masih berisi `[false, false]`, dan modal menutup dengan pesan sukses.
- Perbaikan: simpan dan validasi perubahan form sebelum transisi review, atau minta pengguna menyimpan perubahan dengan alur yang jelas. Berlakukan konsistensi yang sama untuk aksi review lain.

### F12. Mengganti nama atau menghapus pengguna merusak assignment

- Bukti: `backend/Repository.php:405`, `:445`; `backend/api/index.php:343` membandingkan PIC dengan nama. `tasks.pic`, `tasks.reviewer`, target notifikasi, dan host disimpan sebagai nama, bukan relasi ID pengguna.
- Pemicu: superadmin mengganti nama tampilan PIC/reviewer atau menghapus pengguna yang masih memiliki tanggung jawab.
- Dampak: tugas lama tidak lagi dianggap milik akun tersebut, reviewer kehilangan akses review, atau task tetap ditugaskan ke nama yang tidak ada. Tidak ada alur pengalihan assignment saat delete.
- Verifikasi: statis; tidak mengganti nama pengguna nyata.
- Perbaikan: gunakan user ID stabil untuk relasi. Sebagai perbaikan transisi, lakukan rename terkoordinasi dalam transaksi dan blokir delete sampai assignment dialihkan.

### F13. Notifikasi antar akun berbagi status dibaca dan sebagian pesan tidak terarah

- Bukti: `backend/Repository.php:713`, `:760`; `js/data.js:861`, `:1198`; `database/schema.sql` menyimpan satu `notifications.is_read` per pesan.
- Pemicu: superadmin menekan Tandai Dibaca, atau member membaca pesan global. Perubahan status task dibuat tanpa `targetUser`, sehingga dianggap pesan global.
- Dampak: notifikasi anggota lain ikut menjadi read; pesan status dapat muncul pada member yang bukan PIC/target. Scoping seed assignment sudah ada, tetapi belum konsisten untuk peristiwa lain.
- Verifikasi: statis. Query superadmin mengubah semua baris; query member juga mengubah baris global yang dipakai bersama.
- Perbaikan: pisahkan pesan dari receipt per pengguna, tetapkan penerima di server, dan buat notifikasi review untuk PIC/reviewer yang relevan.

### F14. Sesi berakhir masih meninggalkan modal dan cache akun lama

- Bukti: `js/app.js:695`, `js/data.js:1004`, `:1010`, `css/style.css:137`; modal berada di luar `.app-container` pada `index.php`.
- Pemicu: session expired ketika detail tugas/pengguna/BA terbuka. Logout juga mengabaikan status gagal request server dan hanya membersihkan penanda akun lokal.
- Dampak: modal lama tetap menutupi form login dan menampilkan data lama. Cache tugas/pengguna/audit tidak dibersihkan. Jika logout server gagal, reload dapat masuk lagi dengan session yang masih valid.
- Verifikasi: browser mengonfirmasi login dan modal tugas sama-sama visible setelah event auth-required; isi judul dan cache task masih ada. Kegagalan logout ditelusuri statis.
- Perbaikan: pusatkan pembersihan session UI, tutup semua modal/preview/dropdown, kosongkan state sensitif, dan pastikan hasil logout server diperiksa.

### F15. Bug seleksi teks menutup modal masih ada di modal lain

- Bukti: `js/app.js:4248`, `:4499`, `:5138`, `:774` memakai penutupan berdasarkan target klik backdrop saja.
- Pemicu: seleksi teks dimulai dalam form dan pointer dilepas di luar dialog.
- Dampak: modal tugas/pengguna/pertemuan/ganti password berpotensi menutup dan membuang input. Perbaikan sebelumnya baru diterapkan pada BA.
- Verifikasi: bug direproduksi pada judul task sebagai superadmin. Modal lainnya memiliki pola yang sama, tetapi belum semuanya direproduksi satu per satu.
- Perbaikan: terapkan aturan pointer awal/akhir yang sama dan pertimbangkan proteksi perubahan yang belum disimpan.

### F16. Foto BA terbawa ke pertemuan lain

- Bukti: `js/app.js:5617`; `baUploadedImages` hanya di-reset saat draft ditemukan di `:5613`, bukan setiap kali form dibuka.
- Pemicu: unggah foto pada BA pertemuan A, tutup form, lalu buka pertemuan B yang belum mempunyai draft.
- Dampak: dokumentasi pertemuan A tampil dan dapat tersimpan di BA pertemuan B.
- Verifikasi: full UI dengan dua meeting sintetis; meeting kedua tetap menampilkan satu gambar dari meeting pertama.
- Perbaikan: reset seluruh state BA sebelum mengisi data meeting dan merestorasi draft, termasuk gambar dan seleksi grid.

### F17. Grid BA masih memiliki masalah seleksi dan mode edit

- Bukti: `js/app.js:5788` memasang mouseup dengan `{ once: true }`; `:5869` selalu memproses Delete sebagai hapus isi range saat ada seleksi grid.
- Pemicu: seleksi cell kedua setelah listener mouseup pertama habis; atau tekan Delete untuk menghapus satu karakter dalam cell yang sedang diedit.
- Dampak: seleksi terus meluas saat mouse bergerak meskipun tombol sudah dilepas; Delete mengosongkan isi cell/range, bukan karakter yang dituju.
- Verifikasi: full UI; jumlah cell terpilih berubah dari 1 ke 3 hanya karena hover setelah klik selesai. Delete pada awal teks luaran menghapus seluruh teks.
- Perbaikan: kelola pointer selection sepanjang lifecycle modal dan bedakan mode pilih range dengan mode edit teks. Uji pula interaksi sentuh.

### F18. Mengganti pertemuan terkait dapat membuat BA muncul pada dua pertemuan

- Bukti: `js/app.js:1631`, `:1640`, `:1741`. Fallback mencari ID pada deskripsi walaupun `meetingId` eksplisit sudah menunjuk ke pertemuan baru.
- Pemicu: edit metadata BA manual, pindahkan dari pertemuan A ke B, biarkan deskripsi otomatis lama yang masih menyebut ID A.
- Dampak: dokumen dapat dianggap BA untuk A dan B sekaligus. Penanda BA pertemuan lama juga tidak direkonsiliasi saat dokumen dipindah/dihapus.
- Verifikasi: helper produksi dengan fixture terisolasi mengembalikan dokumen yang sama untuk ID meeting lama dan baru.
- Perbaikan: jadikan relasi eksplisit sumber utama; gunakan fallback deskripsi hanya bila relasi kosong. Rekonsiliasi penanda file di server dengan membedakan BA generated dan manual.

### F19. Update checklist tidak selalu memperbarui waktu update task

- Bukti: `backend/Repository.php:532`, `:559`, `:1023`; `tasks.updated_at` hanya memakai `ON UPDATE CURRENT_TIMESTAMP` pada skema.
- Pemicu: hanya centang checklist berubah, sementara semua kolom task tetap identik.
- Dampak: timestamp lokal terlihat baru karena `DataStore.update()` memakai `Date.now()`, lalu kembali ke waktu lama saat snapshot diambil. Waktu perubahan child row tidak otomatis menyentuh parent task.
- Verifikasi: statis berdasarkan SQL dan aturan timestamp parent/child; belum diuji dengan MySQL nyata.
- Perbaikan: sentuh `tasks.updated_at` secara eksplisit setelah perubahan checklist dalam transaksi dan pakai timestamp hasil server.

### F20. Aturan password tidak konsisten

- Bukti: `backend/api/index.php:311`, `partials/modals/change-password.php:16` menerima 3 karakter, sementara `backend/Repository.php:380`, `:432` mensyaratkan 8 untuk create/reset oleh admin.
- Dampak: anggota dapat melemahkan password yang semula memenuhi kebijakan admin. Tidak ditemukan rate limit/lockout pada login backend; proteksi tambahan Cloudflare belum diketahui.
- Verifikasi: statis; tidak mengubah password nyata atau mencoba brute force.
- Perbaikan: satu aturan password di semua jalur, lalu tambahkan rate limit login dan kebijakan session yang sesuai.

### F21. Metadata audit masih dapat berisi IP/perangkat palsu

- Bukti: `js/data.js:782` memilih IP dan device secara acak dari data dummy; `backend/Repository.php:822` menerima nilai payload tersebut. Jalur user activity juga menerima nilai kosong dari client sebagai pengganti metadata server.
- Dampak: log terlihat rinci tetapi tidak bisa dipercaya untuk mengetahui sumber aksi. Sebagian aksi juga tercatat dari browser sebelum aksi bisnis berhasil (F04).
- Verifikasi: statis; default logAudit aktif pada alur online, bukan hanya seed offline.
- Perbaikan: tentukan IP/device/waktu/aktor di server, gunakan informasi proxy hanya dari sumber tepercaya, dan catat keberhasilan setelah commit transaksi.

### F22. Deadline task dapat lebih awal dari tanggal mulai

- Bukti: `js/app.js:5052`, `:5087`; `partials/modals/task.php:68`, `:73`; `backend/Repository.php:496`, `:546`.
- Pemicu: pilih waktu mulai setelah deadline lalu simpan. Tidak ada perbandingan kedua tanggal pada form atau Repository.
- Dampak: jadwal dan indikator jatuh tempo menjadi tidak masuk akal. Validasi tanggal pertemuan sudah ada di UI, tetapi belum setara di API.
- Verifikasi: statis.
- Perbaikan: validasi urutan tanggal task dan pertemuan di server serta tampilkan kesalahan di field terkait.

### F23. Klik beban kerja selalu diarahkan ke Tugas 1

- Bukti: `js/app.js:2126`, `:2127` mengatur filter PIC lalu memanggil `setPage('tugas1')`.
- Pemicu: klik anggota yang tugas aktifnya berada di Tugas 2 atau Tugas 3.
- Dampak: angka beban kerja menghitung lintas tahap, tetapi tujuan klik hanya Tugas 1, sehingga task yang dimaksud bisa tidak terlihat.
- Verifikasi: statis. Ini berbeda dari smoke test navigasi sidebar yang seluruh tujuannya sesuai.
- Perbaikan: arahkan ke daftar tugas lintas tahap untuk PIC tersebut atau tampilkan pilihan tahap yang memang memiliki tugas aktif.

### F24. Draft/preview BA gagal tanpa penanganan ketika localStorage penuh

- Bukti: `js/app.js:5576`, `:6231`; seluruh gambar base64 dimasukkan ke draft lokal sebelum preview dibuka.
- Pemicu: kuota storage browser habis, misalnya setelah menambahkan foto berukuran besar atau banyak draft bergambar.
- Dampak: Simpan Sementara dan Preview berhenti dengan exception, tanpa pesan pemulihan yang dapat ditindaklanjuti pengguna.
- Verifikasi: browser dengan simulasi `QuotaExceededError` menghasilkan exception yang tidak ditangani saat Simpan Sementara.
- Perbaikan: tangani storage error, batasi/kompres ukuran gambar, dan gunakan penyimpanan draft yang sesuai; preview tidak seharusnya ikut diblokir kegagalan cache.

## Bagian yang Sudah Berjalan pada Pemeriksaan Ini

| Area | Hasil dan batas bukti |
| --- | --- |
| Sidebar dan fallback halaman | 40 kunjungan menu sesuai tujuan pada fixture desktop/mobile dengan identitas role terverifikasi; halaman terlarang tidak ditawarkan oleh role default. Startup tetap memiliki race F25. |
| Form login | Tidak memiliki nilai akun/password bawaan pada markup. Autofill milik browser di luar kontrol aplikasi. |
| Password storage | Repository memakai `password_hash` dan `password_verify`; hash tidak dipetakan ke snapshot pengguna. |
| Session | Regenerasi ID saat login dan cookie HttpOnly/SameSite tersedia; penanganan expiry/logout masih F14. |
| Member melihat task lain | Guard non-PIC menolak update progres dengan 403 pada cabang API asli. |
| Reviewer member | Reviewer yang ditunjuk bisa approve; PIC tidak bisa self-review; tugas ber-reviewer belum approved ditolak ketika dipaksa Selesai. |
| Ganti reviewer oleh member | Field reviewer dibuang oleh API. Perlu tetap dibenahi konsistensi RBAC dan relasi nama. |
| Audit/aktivitas dibaca member | Endpoint GET tidak diizinkan dan snapshot member mengosongkan audit/aktivitas. |
| Salin Tugas | Mengambil task dari store saat ini, mengikuti filter; bukan membaca template seed. Belum menjamin data database terbaru bila store tertinggal atau simpan gagal. |
| Filter kanban | Input memakai refresh board tanpa membangun ulang input pencarian pada setiap ketikan. |
| Task code | Kode diambil dari `task.id` dan ditampilkan di kartu. |
| Catatan progress | Konten di-escape dan mempertahankan baris; CRUD UI khusus superadmin. Penyimpanan tetap terkena F04. |
| Dokumen dan panduan | UI upload memeriksa respons sebelum sukses; edit metadata arsip menunggu respons. Masih ada risiko MIME F03 dan relasi F18. |
| Delete pertemuan individual | Backend menolak pertemuan yang ditandai sudah ber-BA, tetapi jalur task dapat melewatinya (F07). |
| Modal BA | Regresi seleksi judul yang diperbaiki sebelumnya lolos; masalah state/grid/draft lain dicatat terpisah. |

## Hal yang Belum Bisa Disimpulkan

- Apakah Cloudflare mempunyai rule yang menutup script administrasi atau rate limit login.
- Apakah seluruh migrasi dan backup aktual sudah lengkap; rollback/restore backup belum diuji.
- Apakah session lama harus diputus saat admin mereset password pengguna. Kode saat ini tidak menyimpan versi session untuk membatalkannya; kebijakan produk perlu ditentukan.
- Perilaku cetak panjang lintas halaman, PDF native pada berbagai browser, upload besar, perangkat mobile fisik, serta clipboard dari Excel dengan banyak variasi belum diuji penuh.
- Tidak ada pemeriksaan CSRF token pada request perubahan. Risiko perlu dievaluasi bersama metode request, cookie SameSite, dan trust antarsubdomain; tidak dinyatakan sebagai exploit yang sudah direproduksi.
- Snapshot tidak dipoll secara berkala; perubahan antar perangkat dapat memerlukan reload. Kebutuhan realtime belum dinyatakan sebagai persyaratan.

## Urutan Perbaikan yang Disarankan

1. Tutup script administrasi dari web, perbaiki notifikasi serta validasi/preview file, dan stabilkan bootstrap saat snapshot cepat (F01-F03, F25).
2. Jadikan penyimpanan menunggu server, hentikan pengiriman ulang command review, dan gunakan satu policy backend (F04-F06).
3. Pisahkan update task dari meeting dan tambahkan transaksi serta perlindungan arsip/assignment (F07-F10, F12).
4. Rapikan pengajuan review, receipt notifikasi, expiry/logout, dan seluruh modal (F11, F13-F15).
5. Benahi state foto, grid, relasi dokumen, serta batas penyimpanan BA (F16-F18, F24).
6. Konsistenkan timestamp, password, metadata audit, tanggal, dan navigasi workload (F19-F23).
7. Jalankan regresi end-to-end memakai database pengujian terpisah, termasuk dua sesi yang mengedit data bersamaan; verifikasi ulang akses publik setelah itu.

Tidak ada commit/push atau perbaikan tambahan pada kode aplikasi yang dilakukan sebagai bagian audit ini.
