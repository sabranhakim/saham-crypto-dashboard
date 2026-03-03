import { NextResponse } from "next/server";

type Mode = "saham" | "crypto";

type AssetSeed = {
  symbol: string;
  tvSymbol: string;
  name: string;
};

type TradingViewRow = {
  s: string;
  d: Array<number | string | null>;
};

const cryptoAssets: AssetSeed[] = [
  { symbol: "BTC", tvSymbol: "BINANCE:BTCUSDT", name: "Bitcoin" },
  { symbol: "ETH", tvSymbol: "BINANCE:ETHUSDT", name: "Ethereum" },
  { symbol: "SOL", tvSymbol: "BINANCE:SOLUSDT", name: "Solana" },
  { symbol: "XRP", tvSymbol: "BINANCE:XRPUSDT", name: "XRP" },
  { symbol: "ADA", tvSymbol: "BINANCE:ADAUSDT", name: "Cardano" },
  { symbol: "DOGE", tvSymbol: "BINANCE:DOGEUSDT", name: "Dogecoin" },
  { symbol: "AVAX", tvSymbol: "BINANCE:AVAXUSDT", name: "Avalanche" },
  { symbol: "BNB", tvSymbol: "BINANCE:BNBUSDT", name: "BNB" },
];

const sahamAssets: AssetSeed[] = [
  { symbol: "BBCA.JK", tvSymbol: "IDX:BBCA", name: "Bank Central Asia" },
  { symbol: "BBRI.JK", tvSymbol: "IDX:BBRI", name: "Bank Rakyat Indonesia" },
  { symbol: "TLKM.JK", tvSymbol: "IDX:TLKM", name: "Telkom Indonesia" },
  { symbol: "BMRI.JK", tvSymbol: "IDX:BMRI", name: "Bank Mandiri" },
  { symbol: "ASII.JK", tvSymbol: "IDX:ASII", name: "Astra International" },
  { symbol: "ICBP.JK", tvSymbol: "IDX:ICBP", name: "Indofood CBP" },
  { symbol: "GOTO.JK", tvSymbol: "IDX:GOTO", name: "GoTo Gojek Tokopedia" },
  { symbol: "ANTM.JK", tvSymbol: "IDX:ANTM", name: "Aneka Tambang" },
];

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") ?? "crypto") as Mode;

  const isSaham = mode === "saham";
  const assets = isSaham ? sahamAssets : cryptoAssets;
  const endpoint = isSaham
    ? "https://scanner.tradingview.com/indonesia/scan"
    : "https://scanner.tradingview.com/crypto/scan";

  const body = {
    symbols: {
      tickers: assets.map((asset) => asset.tvSymbol),
      query: { types: [] as string[] },
    },
    columns: ["name", "description", "close", "change", "volume", "market_cap_basic"],
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "TradingView scanner request failed" },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as {
      data?: TradingViewRow[];
    };

    const mapByTvSymbol = new Map(assets.map((asset) => [asset.tvSymbol, asset]));

    const data = (payload.data ?? [])
      .map((row) => {
        const seed = mapByTvSymbol.get(row.s);
        if (!seed) {
          return null;
        }

        return {
          symbol: seed.symbol,
          tvSymbol: seed.tvSymbol,
          name: (row.d?.[1] as string) || seed.name,
          price: toNumber(row.d?.[2]),
          change24h: toNumber(row.d?.[3]),
          volume: toNumber(row.d?.[4]),
          marketCap: toNumber(row.d?.[5]),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch TradingView scanner" },
      { status: 500 },
    );
  }
}
