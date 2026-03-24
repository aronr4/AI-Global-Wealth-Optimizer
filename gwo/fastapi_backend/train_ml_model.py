import yfinance as yf
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
import os

print("==================================================")
print("   INITIALIZING ML MODEL TRAINING PIPELINE")
print("==================================================")

TICKERS = ["^NSEI", "RELIANCE.NS", "TCS.NS"]
all_data = []

print(f"\n[1/4] Downloading 5-year historical metrics for {len(TICKERS)} tickers...")
for ticker in TICKERS:
    try:
        hist = yf.download(ticker, period="5y", progress=False)
        hist['Ticker'] = ticker
        
        # Calculate daily percentage return
        hist['Daily_Return'] = hist['Close'].pct_change()
        
        # Calculate moving averages
        hist['MA_50'] = hist['Close'].rolling(window=50).mean()
        hist['MA_200'] = hist['Close'].rolling(window=200).mean()
        
        # Calculate Annualized Volatility (Window: 30 days)
        hist['Volatility_30D'] = hist['Daily_Return'].rolling(window=30).std() * np.sqrt(252)
        
        # Target Array: What will the 1-year forward return boundary be? (Approx 252 trading days)
        hist['Future_1Y_Yield'] = (hist['Close'].shift(-252) / hist['Close']) - 1
        
        # Drop Nulls created by shift and windows
        clean_hist = hist.dropna()
        all_data.append(clean_hist)
        print(f"  -> Extracted {len(clean_hist)} robust features for {ticker}")
    except Exception as e:
        print(f"  -> Error fetching data for {ticker}: {e}")

# Aggregate Dataset
final_df = pd.concat(all_data)
print(f"\n[2/4] Aggregated Dataset Matrix structured to {len(final_df)} rows.")

# Feature selection for ML Model
X = final_df[['Volatility_30D', 'MA_50', 'MA_200']].values
y = final_df['Future_1Y_Yield'].values * 100 # Measure in strictly percentage basis

print("\n[3/4] Partitioning Data (80% Train, 20% Evaluate)...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("      [->] Invoking Hyper-threaded RandomForest Regressor Algorithm...")
model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# Evaluate
print("\n[4/4] Validating Model Intelligence Parameters:")
predictions = model.predict(X_test)
mse = mean_squared_error(y_test, predictions)
mae = mean_absolute_error(y_test, predictions)

print(f"      Mean Absolute Error (MAE): {mae:.2f}%")
print(f"      Mean Squared Error (MSE):  {mse:.2f}")

# Export weights via JobLib
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model_layer", "stock_ml_model.pkl")
joblib.dump(model, MODEL_PATH)
print(f"\n[SUCCESS] Model successfully trained and serialized into Protocol Memory!")
print(f"          Saved to: {MODEL_PATH}")
print("==================================================")
