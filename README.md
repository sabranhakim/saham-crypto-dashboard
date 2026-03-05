# Saham & Crypto Dashboard

Dashboard personal bergaya TradingView untuk memantau pasar **crypto** dan **saham Indonesia (IDX)** dalam satu tampilan.

## Gambaran Sistem

Aplikasi ini menampilkan data market real-time-ish dari TradingView Scanner melalui API internal Next.js, lalu merender:

- ringkasan market cap dan volume,
- kartu harga aset + perubahan harian,
- chart interaktif TradingView,
- watchlist per mode (crypto/saham),
- daftar top gainers/top losers,
- simulator portfolio (manual input posisi dan hitung unrealized PnL).

## Fitur Utama

- Toggle mode `crypto` dan `saham`.
- Auto refresh data setiap **10 detik** (React Query).
- Search simbol/nama aset.
- Watchlist tersimpan di `localStorage`.
- Toggle tema `dark/light` (state + `localStorage`).
- Portfolio simulator dengan perhitungan:
  - total invested,
  - current value,
  - unrealized PnL dan PnL%.

## Arsitektur Singkat

- Frontend: Next.js App Router (Client Component di `src/app/page.tsx`).
- Data layer: `@tanstack/react-query`.
- UI: Tailwind CSS v4 + komponen `src/components/ui/*` (shadcn-style).
- Server route: `src/app/api/tradingview/route.ts` sebagai proxy/fetcher ke TradingView Scanner.

Alur data:

1. Client memanggil `GET /api/tradingview?mode=crypto|saham`.
2. Route handler melakukan `POST` ke endpoint scanner TradingView sesuai mode.
3. Response dipetakan ke format aset yang dipakai UI.
4. Client update tampilan + auto refetch 10 detik.

## Struktur Proyek

```text
src/
  app/
    api/tradingview/route.ts   # API route untuk data scanner TradingView
    layout.tsx                 # Metadata dan root layout
    page.tsx                   # Dashboard utama
    globals.css                # Tema dan token style global
  components/ui/               # Komponen UI reusable
  lib/                         # Helper/utilitas shared
public/                        # Aset statis
```

## API Internal

### `GET /api/tradingview?mode=crypto|saham`

Parameter:

- `mode` (opsional): `crypto` (default) atau `saham`.

Response sukses:

```json
{
  "data": [
    {
      "symbol": "BTC",
      "tvSymbol": "BINANCE:BTCUSDT",
      "name": "Bitcoin",
      "price": 1450000000,
      "change24h": 1.9,
      "volume": 1950000000000,
      "marketCap": 28500000000000
    }
  ]
}
```

Response error:

- `502` jika request ke TradingView scanner gagal.
- `500` jika terjadi error saat proses fetch/parsing.

## Menjalankan Proyek

Prasyarat:

- Node.js 18+ (disarankan versi LTS terbaru).

Install dependency:

```bash
npm install
```

Menjalankan development server:

```bash
npm run dev
```

Akses di browser:

```text
http://localhost:3000
```

## Quality Gate

Sebelum merge/deploy, jalankan:

```bash
npm run lint
npm run build
```

## Catatan Teknis

- Tidak ada database; state watchlist/tema disimpan lokal di browser.
- API route menggunakan `cache: "no-store"` untuk data lebih segar.
- Jika API gagal, UI menampilkan fallback error card.
