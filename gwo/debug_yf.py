import yfinance as yf
import pandas as pd

NSE_UNIVERSE = {
    "RELIANCE.NS": {"name": "Reliance Industries", "sector": "Energy", "market_cap": "Mega Cap"},
    "TCS.NS": {"name": "Tata Consultancy Services", "sector": "IT", "market_cap": "Mega Cap"},
    "AAPL": {"name": "Apple Inc.", "sector": "IT", "market_cap": "Mega Cap"},
    "BTC-USD": {"name": "Bitcoin (USD)", "sector": "Crypto", "market_cap": "Mega Cap"}
}

def debug_yf():
    tickers = list(NSE_UNIVERSE.keys())
    print(f"Fetching {len(tickers)} tickers...")
    try:
        df = yf.download(tickers, period="1mo", interval="1d", progress=False)
        print("\nDataFrame Info:")
        print(df.info())
        print("\nColumns:")
        print(df.columns)
        if isinstance(df.columns, pd.MultiIndex):
            print("\nLevels[1] (Tickers found):")
            print(df.columns.levels[1].tolist())
            
        for t in tickers:
            if isinstance(df.columns, pd.MultiIndex):
                if t in df.columns.levels[1]:
                    t_data = df.xs(t, axis=1, level=1)
                    print(f"\nData for {t}:")
                    print(t_data['Close'].tail(2))
                else:
                    print(f"\n{t} NOT in columns level 1")
            else:
                print(f"\nDataFrame is NOT MultiIndex. Columns: {df.columns.tolist()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_yf()
