import yfinance as yf
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document
from model_layer.stock_universe import NSE_UNIVERSE
import random

# print("Loading HuggingFace Embeddings... ")
# embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
embeddings = None
vector_store = None

def init_rag_pipeline():
    global vector_store, embeddings
    
    if embeddings is None:
        print("Loading HuggingFace Embeddings... ")
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    tickers = list(NSE_UNIVERSE.keys())
    
    print(f"Generating optimized Mock 1-Year history vector store for {len(tickers)} assets (fast boot)...")

    # Add Mutual Funds to Vector DB
    mutual_funds = [
        {"ticker": "NIPPON-SC", "type": "mutual_fund", "risk": "high", "desc": "Nippon India Small Cap Fund.", "price": 500, "r1d": 1.2, "r1w": 3.4, "r1m": 8.5, "r1y": 48.6},
        {"ticker": "KOTAK-EMERGING", "type": "mutual_fund", "risk": "high", "desc": "Kotak Emerging Equity Fund.", "price": 1000, "r1d": 0.8, "r1w": 2.1, "r1m": 6.2, "r1y": 45.2},
        {"ticker": "HDFC-MC", "type": "mutual_fund", "risk": "medium", "desc": "HDFC Mid-Cap Opportunities Fund.", "price": 500, "r1d": 0.5, "r1w": 1.5, "r1m": 5.1, "r1y": 41.1},
        {"ticker": "ICICI-VALUE", "type": "mutual_fund", "risk": "low", "desc": "ICICI Prudential Value Discovery.", "price": 100, "r1d": 0.3, "r1w": 1.0, "r1m": 3.5, "r1y": 38.6}
    ]
    
    docs = []
    
    # 1. Embed Stocks with Exact Historical Yields
    for ticker in tickers:
        meta = NSE_UNIVERSE[ticker]
        
        # Fast generation of simulated FAISS yields instead of blocking 79 Network requests
        price = random.uniform(100.0, 5000.0)
        
        # High Risk = Higher simulated yields in this mock
        risk = "high" if meta["sector"] in ["Auto", "Telecom", "IT", "Crypto", "Commodity"] else "low" if meta["sector"] in ["FMCG", "Banking"] else "medium"
        base_yield = 25.0 if risk == "high" else 15.0 if risk == "medium" else 8.0
        
        r1y = base_yield + random.uniform(-10.0, 15.0)
        r1m = (r1y / 12) + random.uniform(-2.0, 3.0)
        r1w = (r1m / 4) + random.uniform(-1.0, 1.0)
        r1d = (r1w / 5) + random.uniform(-0.5, 0.5)
            
        # Forex Conversion for Global Assets
        if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
            price = price * 83.0
            
        content = f"Ticker: {ticker}. Type: stock. Sector: {meta['sector']}. Risk: {risk}. Name: {meta['name']}. 1D Return: {r1d:.2f}%. 1W Return: {r1w:.2f}%. 1M Return: {r1m:.2f}%. 1Y Return: {r1y:.2f}%."
        
        docs.append(Document(page_content=content, metadata={"ticker": ticker, "type": "stock", "risk": risk, "price": price, "r1m": r1m, "r1y": r1y}))
            
    # 2. Embed Mutual Funds Call
    for mf in mutual_funds:
        content = f"Ticker: {mf['ticker']}. Type: {mf['type']}. Risk: {mf['risk']}. Min SIP: {mf['price']}. 1D Return: {mf['r1d']:.2f}%. 1W Return: {mf['r1w']:.2f}%. 1M Return: {mf['r1m']:.2f}%. 1Y Return: {mf['r1y']:.2f}%. Desc: {mf['desc']}"
        docs.append(Document(page_content=content, metadata={"ticker": mf["ticker"], "type": mf["type"], "risk": mf["risk"], "price": mf["price"], "r1m": mf["r1m"], "r1y": mf["r1y"]}))

    if docs:
        vector_store = FAISS.from_documents(docs, embeddings)
        print("Global Universe RAG Indexed with Yield Timelines.")

def retrieve_context(risk_profile: str, max_budget: float):
    if not vector_store:
        return {"stocks": [], "mutual_funds": []}
        
    query = f"Find the absolute highest-yielding investment options with maximum 1-Month and 1-Year historical return momentum, suitable for a {risk_profile} risk appetite."
    
    # Retrieve top 40 potential matches to allow room to guarantee 9 final matches after strict budget filtering
    all_results = vector_store.similarity_search(query, k=50)
    
    affordable_stocks = []
    affordable_mfs = []
    seen_stocks = set()
    seen_mfs = set()
    
    for doc in all_results:
        price = doc.metadata.get("price", 999999)
        if price <= max_budget:
            if doc.metadata.get("type") == "stock" and doc.metadata["ticker"] not in seen_stocks:
                seen_stocks.add(doc.metadata["ticker"])
                # Combine 1Y and 1M momentum for a unified rank score
                rank_score = doc.metadata.get("r1y", 0) + doc.metadata.get("r1m", 0)
                affordable_stocks.append({
                    "ticker": doc.metadata["ticker"], 
                    "score": rank_score,
                    "price": price
                })
            elif doc.metadata.get("type") == "mutual_fund" and doc.metadata["ticker"] not in seen_mfs:
                seen_mfs.add(doc.metadata["ticker"])
                rank_score = doc.metadata.get("r1y", 0) + doc.metadata.get("r1m", 0)
                affordable_mfs.append({
                    "ticker": doc.metadata["ticker"], 
                    "score": rank_score,
                    "price": price
                })
                
    # Sort distinctly by mathematical yield and momentum
    affordable_stocks.sort(key=lambda x: x["score"], reverse=True)
    affordable_mfs.sort(key=lambda x: x["score"], reverse=True)
                
    # Goal: Tiered Budget Maximization
    final_stocks = []
    
    if len(affordable_stocks) > 0:
        third = max(1, len(affordable_stocks) // 3)
        high_tier = affordable_stocks[:third]
        med_tier = affordable_stocks[third:third*2]
        low_tier = affordable_stocks[third*2:]
        
        # Sort each tier by highest price to utilize maximum budget
        if high_tier:
            high_tier.sort(key=lambda x: x["price"], reverse=True)
            for item in high_tier[:2]:
                item["tier"] = "High Return"
                final_stocks.append(item)
            
        if med_tier:
            med_tier.sort(key=lambda x: x["price"], reverse=True)
            for item in med_tier[:1]:
                item["tier"] = "Medium Return"
                final_stocks.append(item)
            
        if low_tier:
            low_tier.sort(key=lambda x: x["price"], reverse=True)
            for item in low_tier[:5]:
                item["tier"] = "Normal Return"
                final_stocks.append(item)

    return {
        "stocks": [s["ticker"] for s in final_stocks],  
        "stock_tiers": {s["ticker"]: s["tier"] for s in final_stocks},
        "mutual_funds": [m["ticker"] for m in affordable_mfs[:2]]
    }

def get_wealth_creators():
    """Returns a list of historically top-performing 'Wealth Creator' stocks."""
    # List of iconic wealth creators (India + Global)
    creators = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "TITAN.NS", "ASIANPAINT.NS",
        "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "BTC-USD"
    ]
    return creators
