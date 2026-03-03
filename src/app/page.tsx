"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Moon,
  RefreshCw,
  Search,
  Star,
  Sun,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Mode = "saham" | "crypto";
type Timeframe = "1D" | "1W" | "1M";

type Asset = {
  symbol: string;
  tvSymbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
};

type Position = {
  id: string;
  symbol: string;
  units: number;
  buyPrice: number;
};

const watchlistStorageKey = "market-watchlist-v1";
const themeStorageKey = "market-theme-v1";

const cryptoSeed: Asset[] = [
  { symbol: "BTC", tvSymbol: "BINANCE:BTCUSDT", name: "Bitcoin", price: 1450000000, change24h: 1.9, volume: 1950000000000, marketCap: 28500000000000 },
  { symbol: "ETH", tvSymbol: "BINANCE:ETHUSDT", name: "Ethereum", price: 78000000, change24h: 2.2, volume: 890000000000, marketCap: 9400000000000 },
  { symbol: "SOL", tvSymbol: "BINANCE:SOLUSDT", name: "Solana", price: 3500000, change24h: -0.7, volume: 180000000000, marketCap: 1700000000000 },
  { symbol: "XRP", tvSymbol: "BINANCE:XRPUSDT", name: "XRP", price: 9400, change24h: 1.1, volume: 79000000000, marketCap: 520000000000 },
  { symbol: "ADA", tvSymbol: "BINANCE:ADAUSDT", name: "Cardano", price: 13200, change24h: -1.2, volume: 42000000000, marketCap: 470000000000 },
  { symbol: "DOGE", tvSymbol: "BINANCE:DOGEUSDT", name: "Dogecoin", price: 5400, change24h: 3.8, volume: 32000000000, marketCap: 290000000000 },
  { symbol: "AVAX", tvSymbol: "BINANCE:AVAXUSDT", name: "Avalanche", price: 650000, change24h: -0.3, volume: 21000000000, marketCap: 250000000000 },
  { symbol: "BNB", tvSymbol: "BINANCE:BNBUSDT", name: "BNB", price: 9200000, change24h: 0.6, volume: 91000000000, marketCap: 1260000000000 },
];

const sahamSeed: Asset[] = [
  { symbol: "BBCA.JK", tvSymbol: "IDX:BBCA", name: "Bank Central Asia", price: 10850, change24h: 0.8, volume: 2100000000, marketCap: 1300000000000000 },
  { symbol: "BBRI.JK", tvSymbol: "IDX:BBRI", name: "Bank Rakyat Indonesia", price: 5780, change24h: -0.4, volume: 2600000000, marketCap: 875000000000000 },
  { symbol: "TLKM.JK", tvSymbol: "IDX:TLKM", name: "Telkom Indonesia", price: 3860, change24h: 1.2, volume: 1200000000, marketCap: 382000000000000 },
  { symbol: "BMRI.JK", tvSymbol: "IDX:BMRI", name: "Bank Mandiri", price: 7890, change24h: 0.3, volume: 1750000000, marketCap: 736000000000000 },
  { symbol: "ASII.JK", tvSymbol: "IDX:ASII", name: "Astra International", price: 5150, change24h: -1.4, volume: 820000000, marketCap: 209000000000000 },
  { symbol: "ICBP.JK", tvSymbol: "IDX:ICBP", name: "Indofood CBP", price: 11150, change24h: 0.9, volume: 450000000, marketCap: 130000000000000 },
  { symbol: "GOTO.JK", tvSymbol: "IDX:GOTO", name: "GoTo Gojek Tokopedia", price: 84, change24h: 2.7, volume: 3900000000, marketCap: 102000000000000 },
  { symbol: "ANTM.JK", tvSymbol: "IDX:ANTM", name: "Aneka Tambang", price: 2140, change24h: -0.2, volume: 710000000, marketCap: 51000000000000 },
];

function formatCurrency(value: number, mode: Mode) {
  const currency = mode === "crypto" ? "USD" : "IDR";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: mode === "crypto" ? 2 : 2,
  }).format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

async function fetchMarket(mode: Mode) {
  const response = await fetch(`/api/tradingview?mode=${mode}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data TradingView");
  }

  const payload = (await response.json()) as { data?: Asset[] };
  if (!payload.data || !Array.isArray(payload.data) || payload.data.length === 0) {
    throw new Error("Data TradingView kosong");
  }

  return payload.data;
}

function TradingViewChart({ asset, timeframe }: { asset: Asset; timeframe: Timeframe }) {
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const interval = timeframe === "1D" ? "30" : timeframe === "1W" ? "120" : "D";

  useEffect(() => {
    const container = widgetRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: asset.tvSymbol,
      interval,
      timezone: "Asia/Jakarta",
      theme: "dark",
      style: "1",
      locale: "id",
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      backgroundColor: "#262424",
      gridColor: "rgba(238,229,218,0.15)",
      withdateranges: true,
      studies: ["MASimple@tv-basicstudies"],
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [asset.tvSymbol, interval]);

  return (
    <div className="tradingview-widget-container h-[420px] w-full">
      <div ref={widgetRef} className="h-full w-full" />
    </div>
  );
}

function Dashboard() {
  const [mode, setMode] = useState<Mode>("crypto");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const storedTheme = localStorage.getItem(themeStorageKey);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
  });
  const [search, setSearch] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<string>(cryptoSeed[0].symbol);
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [watchlist, setWatchlist] = useState<Record<Mode, string[]>>(() => {
    if (typeof window === "undefined") {
      return { crypto: [], saham: [] };
    }

    const storedWatchlist = localStorage.getItem(watchlistStorageKey);
    if (!storedWatchlist) {
      return { crypto: [], saham: [] };
    }

    try {
      const parsed = JSON.parse(storedWatchlist) as Record<Mode, string[]>;
      return {
        crypto: parsed.crypto ?? [],
        saham: parsed.saham ?? [],
      };
    } catch {
      return { crypto: [], saham: [] };
    }
  });
  const [notice, setNotice] = useState<string | null>(null);

  const [positionSymbol, setPositionSymbol] = useState(cryptoSeed[0].symbol);
  const [positionUnits, setPositionUnits] = useState("1");
  const [positionBuyPrice, setPositionBuyPrice] = useState("0");
  const [positions, setPositions] = useState<Position[]>([]);

  const { data: assets, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["market", mode],
    queryFn: () => fetchMarket(mode),
    initialData: mode === "crypto" ? cryptoSeed : sahamSeed,
    refetchInterval: 10000,
    retry: 1,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(watchlistStorageKey, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => setNotice(null), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return assets
      .filter((asset) => {
        return asset.symbol.toLowerCase().includes(query) || asset.name.toLowerCase().includes(query);
      })
      .slice(0, 6);
  }, [assets, search]);

  const safeSelectedSymbol =
    assets.find((asset) => asset.symbol === selectedSymbol)?.symbol ?? assets[0]?.symbol ?? "";
  const safePositionSymbol =
    assets.find((asset) => asset.symbol === positionSymbol)?.symbol ?? assets[0]?.symbol ?? "";
  const selectedAsset = assets.find((asset) => asset.symbol === safeSelectedSymbol) ?? assets[0];

  const gainers = useMemo(() => [...assets].sort((a, b) => b.change24h - a.change24h).slice(0, 5), [assets]);
  const losers = useMemo(() => [...assets].sort((a, b) => a.change24h - b.change24h).slice(0, 5), [assets]);

  const marketCapTotal = useMemo(() => assets.reduce((acc, curr) => acc + curr.marketCap, 0), [assets]);
  const volumeTotal = useMemo(() => assets.reduce((acc, curr) => acc + curr.volume, 0), [assets]);

  const watchlistAssets = useMemo(() => {
    const map = new Set(watchlist[mode]);
    return assets.filter((asset) => map.has(asset.symbol));
  }, [assets, watchlist, mode]);

  const portfolioRows = useMemo(() => {
    return positions.map((position) => {
      const currentPrice = assets.find((asset) => asset.symbol === position.symbol)?.price ?? 0;
      const invested = position.buyPrice * position.units;
      const now = currentPrice * position.units;
      const pnl = now - invested;
      const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

      return {
        ...position,
        currentPrice,
        invested,
        now,
        pnl,
        pnlPct,
      };
    });
  }, [positions, assets]);

  const portfolioSummary = useMemo(() => {
    const invested = portfolioRows.reduce((acc, curr) => acc + curr.invested, 0);
    const current = portfolioRows.reduce((acc, curr) => acc + curr.now, 0);
    const pnl = current - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

    return { invested, current, pnl, pnlPct };
  }, [portfolioRows]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem(themeStorageKey, nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  function toggleWatchlist(symbol: string) {
    setWatchlist((prev) => {
      const current = new Set(prev[mode]);
      if (current.has(symbol)) {
        current.delete(symbol);
        setNotice(`${symbol} dihapus dari watchlist`);
      } else {
        current.add(symbol);
        setNotice(`${symbol} ditambahkan ke watchlist`);
      }

      return { ...prev, [mode]: Array.from(current) };
    });
  }

  function addPosition() {
    const symbol = safePositionSymbol;
    const units = Number(positionUnits);
    const buyPrice = Number(positionBuyPrice);

    if (!symbol || Number.isNaN(units) || units <= 0 || Number.isNaN(buyPrice) || buyPrice <= 0) {
      setNotice("Isi data portfolio tidak valid");
      return;
    }

    setPositions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        symbol,
        units,
        buyPrice,
      },
    ]);
    setNotice(`Posisi ${symbol} ditambahkan`);
  }

  function removePosition(id: string) {
    setPositions((prev) => prev.filter((position) => position.id !== id));
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#3d3434_0,_#262424_45%,_#211f1f_100%)] text-[#EEE5DA]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <header className="flex flex-col gap-3 rounded-xl border border-[#EEE5DA33] bg-[#312b2b]/80 px-4 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#EEE5DABB]">Saham + Crypto Dashboard</p>
            <h1 className="text-2xl font-semibold">TradingView Style Personal Board</h1>
            <p className="text-sm text-[#EEE5DABB]">Auto refresh 10 detik, watchlist tersimpan, dan chart interaktif.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} className="border-[#EEE5DA44] bg-transparent text-[#EEE5DA] hover:bg-[#EEE5DA22]">
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={toggleTheme} className="border-[#EEE5DA44] bg-transparent text-[#EEE5DA] hover:bg-[#EEE5DA22]">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
          </div>
        </header>

        <Tabs value={mode} onValueChange={(val) => setMode(val as Mode)} className="w-full">
          <TabsList className="w-full justify-start bg-[#EEE5DA22] p-1 md:w-fit">
            <TabsTrigger value="crypto" className="data-[state=active]:bg-[#EEE5DA] data-[state=active]:text-[#262424]">Crypto</TabsTrigger>
            <TabsTrigger value="saham" className="data-[state=active]:bg-[#EEE5DA] data-[state=active]:text-[#262424]">Saham</TabsTrigger>
          </TabsList>

          <TabsContent value="crypto" className="mt-4">
            <section className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
              <Card className="border-[#EEE5DA33] bg-[#2f2929]/85 text-[#EEE5DA]">
                <CardHeader>
                  <CardTitle>Search & Quick Lookup</CardTitle>
                  <CardDescription className="text-[#EEE5DABB]">Cari simbol seperti BTC, ETH, atau SOL.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-[#EEE5DAA0]" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Cari simbol atau nama aset..."
                      className="border-[#EEE5DA44] bg-[#262424]/60 pl-8 text-[#EEE5DA] placeholder:text-[#EEE5DA90]"
                    />
                  </div>

                  {search && (
                    <div className="grid gap-2">
                      {filteredAssets.length === 0 && (
                        <p className="text-sm text-[#EEE5DABB]">Aset tidak ditemukan.</p>
                      )}
                      {filteredAssets.map((asset) => (
                        <button
                          key={asset.symbol}
                          type="button"
                          onClick={() => {
                            setSelectedSymbol(asset.symbol);
                            setSearch("");
                          }}
                          className="flex items-center justify-between rounded-md border border-[#EEE5DA33] bg-[#262424]/60 px-3 py-2 text-left hover:bg-[#EEE5DA22]"
                        >
                          <span>
                            <span className="font-medium">{asset.symbol}</span>
                            <span className="ml-2 text-sm text-[#EEE5DABB]">{asset.name}</span>
                          </span>
                          <span className="text-sm">{formatCurrency(asset.price, mode)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-[#EEE5DA33] bg-[#2f2929]/85 text-[#EEE5DA]">
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                  <CardDescription className="text-[#EEE5DABB]">Ringkasan kapitalisasi dan volume pasar.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <div className="rounded-lg border border-[#EEE5DA33] bg-[#262424]/60 p-3">
                    <p className="text-[#EEE5DABB]">Total Market Cap</p>
                    <p className="mt-1 text-lg font-semibold">{formatCurrency(marketCapTotal, mode)}</p>
                  </div>
                  <div className="rounded-lg border border-[#EEE5DA33] bg-[#262424]/60 p-3">
                    <p className="text-[#EEE5DABB]">Total Volume</p>
                    <p className="mt-1 text-lg font-semibold">{formatCurrency(volumeTotal, mode)}</p>
                  </div>
                  <div className="rounded-lg border border-[#EEE5DA33] bg-[#262424]/60 p-3">
                    <p className="text-[#EEE5DABB]">Watchlist Count</p>
                    <p className="mt-1 text-lg font-semibold">{watchlist[mode].length} aset</p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="saham" className="mt-4">
            <section className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
              <Card className="border-[#EEE5DA33] bg-[#2f2929]/85 text-[#EEE5DA]">
                <CardHeader>
                  <CardTitle>Search & Quick Lookup</CardTitle>
                  <CardDescription className="text-[#EEE5DABB]">Cari simbol seperti BBCA.JK, BBRI.JK, atau TLKM.JK.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-[#EEE5DAA0]" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Cari simbol atau nama emiten..."
                      className="border-[#EEE5DA44] bg-[#262424]/60 pl-8 text-[#EEE5DA] placeholder:text-[#EEE5DA90]"
                    />
                  </div>

                  {search && (
                    <div className="grid gap-2">
                      {filteredAssets.length === 0 && (
                        <p className="text-sm text-[#EEE5DABB]">Aset tidak ditemukan.</p>
                      )}
                      {filteredAssets.map((asset) => (
                        <button
                          key={asset.symbol}
                          type="button"
                          onClick={() => {
                            setSelectedSymbol(asset.symbol);
                            setSearch("");
                          }}
                          className="flex items-center justify-between rounded-md border border-[#EEE5DA33] bg-[#262424]/60 px-3 py-2 text-left hover:bg-[#EEE5DA22]"
                        >
                          <span>
                            <span className="font-medium">{asset.symbol}</span>
                            <span className="ml-2 text-sm text-[#EEE5DABB]">{asset.name}</span>
                          </span>
                          <span className="text-sm">{formatCurrency(asset.price, mode)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-[#EEE5DA33] bg-[#2f2929]/85 text-[#EEE5DA]">
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                  <CardDescription className="text-[#EEE5DABB]">Ringkasan kapitalisasi dan volume pasar.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <div className="rounded-lg border border-[#EEE5DA33] bg-[#262424]/60 p-3">
                    <p className="text-[#EEE5DABB]">Total Market Cap</p>
                    <p className="mt-1 text-lg font-semibold">{formatCurrency(marketCapTotal, mode)}</p>
                  </div>
                  <div className="rounded-lg border border-[#EEE5DA33] bg-[#262424]/60 p-3">
                    <p className="text-[#EEE5DABB]">Total Volume</p>
                    <p className="mt-1 text-lg font-semibold">{formatCurrency(volumeTotal, mode)}</p>
                  </div>
                  <div className="rounded-lg border border-[#EEE5DA33] bg-[#262424]/60 p-3">
                    <p className="text-[#EEE5DABB]">Watchlist Count</p>
                    <p className="mt-1 text-lg font-semibold">{watchlist[mode].length} aset</p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>
        </Tabs>

        {isError ? (
          <Card className="border-red-400/50 bg-red-900/20 text-red-100">
            <CardHeader>
              <CardTitle>Gagal memuat data market</CardTitle>
              <CardDescription className="text-red-100/80">Silakan coba refresh manual.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Card key={`skeleton-${index}`} className="border-[#EEE5DA33] bg-[#2f2929]/85">
                    <CardHeader>
                      <Skeleton className="h-4 w-20 bg-[#EEE5DA33]" />
                      <Skeleton className="h-6 w-32 bg-[#EEE5DA33]" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-5 w-24 bg-[#EEE5DA33]" />
                    </CardContent>
                  </Card>
                ))
              : assets.slice(0, 4).map((asset) => {
                  const rising = asset.change24h >= 0;

                  return (
                    <Card key={asset.symbol} className="border-[#EEE5DA33] bg-[#2f2929]/85 text-[#EEE5DA]">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{asset.symbol}</CardTitle>
                          <button type="button" onClick={() => toggleWatchlist(asset.symbol)}>
                            <Star
                              className={`size-4 ${watchlist[mode].includes(asset.symbol) ? "fill-[#EEE5DA] text-[#EEE5DA]" : "text-[#EEE5DABB]"}`}
                            />
                          </button>
                        </div>
                        <CardDescription className="text-[#EEE5DABB]">{asset.name}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-xl font-semibold">{formatCurrency(asset.price, mode)}</p>
                        <Badge
                          className={`${rising ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-200"}`}
                        >
                          {rising ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {asset.change24h.toFixed(2)}%
                        </Badge>
                        <p className="text-xs text-[#EEE5DABB]">Vol {formatCompact(asset.volume)}</p>
                      </CardContent>
                    </Card>
                  );
                })}
          </section>
        )}

        {selectedAsset && (
          <section className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <Card className="border-[#EEE5DA33] bg-[#2f2929]/85 text-[#EEE5DA]">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl">{selectedAsset.symbol} Chart</CardTitle>
                    <CardDescription className="text-[#EEE5DABB]">{selectedAsset.name} - Powered by TradingView</CardDescription>
                  </div>
                  <div className="flex gap-1 rounded-lg bg-[#262424]/80 p-1">
                    {(["1D", "1W", "1M"] as Timeframe[]).map((frame) => (
                      <Button
                        key={frame}
                        variant="ghost"
                        size="sm"
                        onClick={() => setTimeframe(frame)}
                        className={timeframe === frame ? "bg-[#EEE5DA] text-[#262424]" : "text-[#EEE5DA] hover:bg-[#EEE5DA22]"}
                      >
                        {frame}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TradingViewChart asset={selectedAsset} timeframe={timeframe} />
              </CardContent>
            </Card>

            <Card className="border-[#EEE5DA33] bg-[#2f2929]/85 text-[#EEE5DA]">
              <CardHeader>
                <CardTitle>Watchlist</CardTitle>
                <CardDescription className="text-[#EEE5DABB]">Aset favorit Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {watchlistAssets.length === 0 ? (
                  <p className="text-sm text-[#EEE5DABB]">Belum ada aset di watchlist.</p>
                ) : (
                  watchlistAssets.map((asset) => (
                    <button
                      key={asset.symbol}
                      type="button"
                      onClick={() => setSelectedSymbol(asset.symbol)}
                      className="flex w-full items-center justify-between rounded-md border border-[#EEE5DA33] bg-[#262424]/60 px-3 py-2 text-left hover:bg-[#EEE5DA22]"
                    >
                      <span className="text-sm font-medium">{asset.symbol}</span>
                      <span className={`text-sm ${asset.change24h >= 0 ? "text-emerald-300" : "text-red-200"}`}>
                        {asset.change24h.toFixed(2)}%
                      </span>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-[#EEE5DA33] bg-[#2f2929]/85 text-[#EEE5DA]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="size-4" /> Top Gainers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {gainers.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between rounded-md border border-[#EEE5DA22] bg-[#262424]/60 px-3 py-2">
                  <span>{asset.symbol}</span>
                  <span className="text-emerald-300">+{asset.change24h.toFixed(2)}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#EEE5DA33] bg-[#2f2929]/85 text-[#EEE5DA]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><TrendingDown className="size-4" /> Top Losers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {losers.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between rounded-md border border-[#EEE5DA22] bg-[#262424]/60 px-3 py-2">
                  <span>{asset.symbol}</span>
                  <span className="text-red-200">{asset.change24h.toFixed(2)}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="border-[#EEE5DA33] bg-[#2f2929]/85 text-[#EEE5DA]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="size-5" /> Portfolio Simulator</CardTitle>
            <CardDescription className="text-[#EEE5DABB]">Input manual holding untuk hitung nilai saat ini dan unrealized PnL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-4">
              <select
                value={safePositionSymbol}
                onChange={(event) => setPositionSymbol(event.target.value)}
                className="h-9 rounded-md border border-[#EEE5DA44] bg-[#262424]/60 px-3 text-sm"
              >
                {assets.map((asset) => (
                  <option key={asset.symbol} value={asset.symbol} className="bg-[#262424]">
                    {asset.symbol}
                  </option>
                ))}
              </select>
              <Input
                value={positionUnits}
                onChange={(event) => setPositionUnits(event.target.value)}
                type="number"
                min={0}
                step="any"
                placeholder="Jumlah aset"
                className="border-[#EEE5DA44] bg-[#262424]/60 text-[#EEE5DA]"
              />
              <Input
                value={positionBuyPrice}
                onChange={(event) => setPositionBuyPrice(event.target.value)}
                type="number"
                min={0}
                step="any"
                placeholder="Harga beli"
                className="border-[#EEE5DA44] bg-[#262424]/60 text-[#EEE5DA]"
              />
              <Button onClick={addPosition} className="bg-[#EEE5DA] text-[#262424] hover:bg-[#EEE5DACC]">
                Tambah Posisi
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[#EEE5DA33] bg-[#262424]/60 p-3">
                <p className="text-sm text-[#EEE5DABB]">Total Invested</p>
                <p className="mt-1 font-semibold">{formatCurrency(portfolioSummary.invested, mode)}</p>
              </div>
              <div className="rounded-lg border border-[#EEE5DA33] bg-[#262424]/60 p-3">
                <p className="text-sm text-[#EEE5DABB]">Current Value</p>
                <p className="mt-1 font-semibold">{formatCurrency(portfolioSummary.current, mode)}</p>
              </div>
              <div className="rounded-lg border border-[#EEE5DA33] bg-[#262424]/60 p-3">
                <p className="text-sm text-[#EEE5DABB]">Unrealized PnL</p>
                <p className={`mt-1 font-semibold ${portfolioSummary.pnl >= 0 ? "text-emerald-300" : "text-red-200"}`}>
                  {formatCurrency(portfolioSummary.pnl, mode)} ({portfolioSummary.pnlPct.toFixed(2)}%)
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-[#EEE5DA22]">
                  <TableHead>Asset</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Buy Price</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>PnL</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioRows.length === 0 && (
                  <TableRow className="border-[#EEE5DA22]">
                    <TableCell colSpan={6} className="text-center text-[#EEE5DABB]">Belum ada posisi.</TableCell>
                  </TableRow>
                )}
                {portfolioRows.map((row) => (
                  <TableRow key={row.id} className="border-[#EEE5DA22]">
                    <TableCell>{row.symbol}</TableCell>
                    <TableCell>{row.units}</TableCell>
                    <TableCell>{formatCurrency(row.buyPrice, mode)}</TableCell>
                    <TableCell>{formatCurrency(row.currentPrice, mode)}</TableCell>
                    <TableCell className={row.pnl >= 0 ? "text-emerald-300" : "text-red-200"}>
                      {formatCurrency(row.pnl, mode)} ({row.pnlPct.toFixed(2)}%)
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePosition(row.id)}
                        className="text-red-200 hover:bg-red-500/20 hover:text-red-100"
                      >
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <footer className="grid gap-2 rounded-xl border border-[#EEE5DA22] bg-[#2b2626]/80 px-4 py-3 text-sm text-[#EEE5DABB] md:grid-cols-3">
          <p className="flex items-center gap-2"><BarChart3 className="size-4" /> Trading-style dashboard UI</p>
          <p>Mode aktif: <span className="font-medium text-[#EEE5DA]">{mode.toUpperCase()}</span></p>
          <p>Auto refresh: <span className="font-medium text-[#EEE5DA]">10 detik</span></p>
        </footer>
      </main>

      {notice && (
        <div className="fixed right-4 bottom-4 rounded-md border border-[#EEE5DA44] bg-[#262424] px-3 py-2 text-sm text-[#EEE5DA] shadow-lg">
          {notice}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
