Penjelasan Singkat Tentang Project

Project ini adalah personal dashboard web (single-page application) yang dibangun dengan React + Next.js 15 (App Router), TypeScript, Tailwind CSS + shadcn/ui. Tujuannya: memberikan tampilan cepat, modern, dan real-time untuk memantau harga saham (terutama IDX) dan cryptocurrency dalam satu tempat, dengan fokus pada pengalaman pengguna yang responsif (mobile-first), dark mode, serta visualisasi data yang menarik.

Dashboard ini cocok sebagai portfolio project frontend yang kuat (menunjukkan skill real-time data, charting, state management, API integration, UI/UX modern), atau bisa dikembangkan lebih lanjut menjadi tools pribadi untuk trading/investasi harian. Data diambil dari sumber gratis seperti CoinGecko, Indodax Public API, dan Yahoo Finance (tanpa perlu API key berbayar di tahap awal).

Fitur Utama yang Akan Dibuat

Berikut fitur-fitur inti (core features) yang realistis, scalable, dan sering dicari di dashboard serupa tahun 2025–2026:

Tab Switch Saham vs Crypto

Dua mode utama: Saham (IDX-focused) dan Crypto.

User bisa switch dengan mudah via tabs atau toggle.

Search & Quick Lookup Symbol

Kotak pencarian untuk cari symbol (contoh: BBCA.JK, BTC/IDR, ETH, SOL).

Auto-suggest atau hasil instan dari API.

Watchlist / Favorites

Tambah/hapus aset yang dipantau.

Simpan di localStorage (atau nanti di database jika ada auth).

Tampil di bagian atas dashboard.

Real-time Price Cards / Ticker

Grid atau list card menampilkan harga saat ini, % change 24 jam, volume, market cap (untuk crypto).

Warna hijau/merah untuk gain/loss.

Auto-refresh setiap 5–15 detik menggunakan TanStack Query.

Interactive Chart (Candlestick / Line)

Menggunakan TradingView Lightweight Charts (gratis & powerful).

Tampilkan candlestick, volume, timeframe (1m, 5m, 1h, 1d, dll).

Bisa zoom, pan, tambah indikator sederhana (MA, RSI nanti).

Top Gainers / Losers & Market Overview

Daftar 5–10 aset dengan perubahan harga terbesar (naik/turun).

Ringkasan market: total market cap crypto, indeks utama IDX (jika tersedia).

Portfolio Value Simulator (Opsional tapi Powerful)

Input manual holding (jumlah aset + harga beli).

Hitung total nilai portfolio saat ini, unrealized PNL, % return.

Chart pie atau bar breakdown alokasi aset.

Responsive Design & UX Modern

Mobile-friendly (sidebar collapse di HP).

Dark/light mode toggle.

Loading skeleton, error handling, toast notification.

Fitur Tambahan Potensial (Phase 2)

News feed ringkas (crypto/saham).

Alert harga (browser notification).

Export data (CSV).

Multi-currency display (IDR/USD default).

untuk tema aplikasi web gunakan warna utama Deep charcoal hex #262424 dan light almond hex #EEE5DA