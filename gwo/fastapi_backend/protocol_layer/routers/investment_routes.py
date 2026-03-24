from fastapi import APIRouter
import yfinance as yf
import pandas as pd
import asyncio
from protocol_layer.schemas import AssetModel
from model_layer.rag_service import get_wealth_creators

router = APIRouter(prefix="/api/investments", tags=["Investments"])


@router.get("/portfolio")
async def get_portfolio():
    tickers = ["RELIANCE.NS", "TCS.NS", "^NSEI"]
    live_prices = {}
    try:
        # Wrap blocking call in a thread with a 5-second timeout
        data = await asyncio.wait_for(
            asyncio.to_thread(yf.download, tickers, period="1d", progress=False),
            timeout=5.0
        )
        data = data['Close']
        for t in tickers:
            live_prices[t] = float(data[t].iloc[-1]) if not data[t].empty else 1000.0
    except Exception as e:
        print(f"yfinance portfolio fetch failed or timed out: {e}")
        live_prices = {"RELIANCE.NS": 2800.0, "TCS.NS": 3900.0, "^NSEI": 22000.0}

    reliance_val = live_prices.get("RELIANCE.NS", 2800.0) * 45.2
    tcs_val = live_prices.get("TCS.NS", 3900.0) * 15.8
    nifty_val = live_prices.get("^NSEI", 22000.0) * 125.4
    
    total = reliance_val + tcs_val + nifty_val

    return [
        AssetModel(name="NIFTY 50 ETF (NSEI)", type="Index ETF", value=round(nifty_val, 2), allocationPercent=round((nifty_val/total)*100, 1)),
        AssetModel(name="Reliance Ind.", type="Equity", value=round(reliance_val, 2), allocationPercent=round((reliance_val/total)*100, 1)),
        AssetModel(name="TCS", type="Equity", value=round(tcs_val, 2), allocationPercent=round((tcs_val/total)*100, 1)),
    ]

import time
from model_layer.stock_universe import NSE_UNIVERSE

market_cache = {
    "timestamp": 0,
    "data": []
}
_market_fetch_lock = asyncio.Lock()

async def refresh_market_cache_task():
    global market_cache
    if _market_fetch_lock.locked():
        return
    
    async with _market_fetch_lock:
        print("Starting background market refresh...")
        tickers = list(NSE_UNIVERSE.keys())
        result = []
        batch_size = 25
        for i in range(0, len(tickers), batch_size):
            batch = tickers[i:i + batch_size]
            try:
                # 20s timeout per batch
                df = await asyncio.wait_for(
                    asyncio.to_thread(yf.download, batch, period="1mo", interval="1d", progress=False),
                    timeout=20.0
                )
                
                if df.empty:
                    continue
                    
                for t in batch:
                    meta = NSE_UNIVERSE[t]
                    try:
                        if isinstance(df.columns, pd.MultiIndex):
                            if t not in df.columns.get_level_values(1):
                                continue
                            t_data = df.xs(t, axis=1, level=1)
                        else:
                            if len(batch) == 1:
                                t_data = df
                            else:
                                if t in df.columns.get_level_values(0):
                                    t_data = df
                                else:
                                    continue

                        if t_data.empty:
                            continue
                            
                        closes = t_data['Close'].ffill().bfill()
                        valid_closes = closes.dropna()
                        if valid_closes.empty:
                            continue
                            
                        curr = float(valid_closes.iloc[-1])
                        prev = float(valid_closes.iloc[-2]) if len(valid_closes) > 1 else curr
                        
                        if not t.endswith(".NS") and not t.endswith(".BO"):
                            curr *= 83.0
                            prev *= 83.0
                        
                        chg = curr - prev
                        chg_p = (chg / prev * 100) if prev != 0 else 0

                        result.append({
                            "symbol": t.replace(".NS", ""),
                            "name": meta["name"],
                            "sector": meta["sector"],
                            "market_cap": meta.get("market_cap", "Large Cap"),
                            "region": "global" if not t.endswith(".NS") and not t.endswith(".BO") else "indian",
                            "price": round(curr, 2),
                            "change": round(chg, 2),
                            "changePercent": round(chg_p, 2),
                            "sparkline": [round(float(x), 2) for x in valid_closes.tail(10).tolist()]
                        })
                    except Exception as e:
                        print(f"Error processing {t}: {e}")
            except Exception as e:
                print(f"Batch fetch failed: {e}")

        if result:
            market_cache["data"] = result
            market_cache["timestamp"] = time.time()
            print(f"Market Cache background updated with {len(result)} stocks.")

@router.get("/market")
async def get_market_data():
    global market_cache
    
    # Trigger background refresh if stale (older than 60s)
    if not market_cache["data"] or time.time() - market_cache["timestamp"] > 300: # Increased TTL for less load
        asyncio.create_task(refresh_market_cache_task())
        
    return {
        "data": market_cache["data"],
        "wealth_creators": get_wealth_creators()
    }


import random as _random

import datetime as _dt
import pytz as _pytz

_IST = _pytz.timezone("Asia/Kolkata")

def _is_market_open():
    """Returns True only during NSE trading hours: Mon–Fri 09:15–15:30 IST."""
    now = _dt.datetime.now(_IST)
    if now.weekday() >= 5:          # Saturday=5, Sunday=6
        return False
    market_open  = now.replace(hour=9,  minute=15, second=0, microsecond=0)
    market_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
    return market_open <= now <= market_close

def _next_market_open():
    """Returns the next market open time as a readable string."""
    now = _dt.datetime.now(_IST)
    days_ahead = 1
    # If it's Saturday bump to Monday, Sunday bump to Monday
    if now.weekday() == 5:   days_ahead = 2
    elif now.weekday() == 6: days_ahead = 1
    elif now.hour >= 15 and now.minute >= 30:
        days_ahead = 3 if now.weekday() == 4 else 1  # Friday → Monday
    nxt = now + _dt.timedelta(days=days_ahead)
    nxt = nxt.replace(hour=9, minute=15, second=0, microsecond=0)
    return nxt.strftime("%a, %d %b %Y at 9:15 AM IST")


_tick_state: dict = {}   # symbol -> {"price": float, "base_price": float}

@router.get("/market/live-tick")
async def get_live_tick():
    """
    Lightweight endpoint called every second by the frontend.
    Only generates micro-fluctuations during NSE market hours.
    Returns market_open flag so the frontend can show correct status.
    """
    global _tick_state, market_cache

    market_open = _is_market_open()

    if not market_open:
        return {
            "market_open": False,
            "next_open": _next_market_open(),
            "ticks": []
        }

    # Seed tick state from the full market cache whenever it refreshes
    cached = market_cache.get("data", [])
    for stock in cached:
        sym = stock["symbol"]
        if sym not in _tick_state or abs(_tick_state[sym]["base_price"] - stock["price"]) > 1:
            _tick_state[sym] = {
                "price": stock["price"],
                "base_price": stock["price"],
                "prev_close": stock.get("prevClose", stock["price"]),
            }

    ticks = []
    for sym, state in _tick_state.items():
        # Increased noise for more visible movement
        noise_pct = _random.gauss(0, 0.001)
        new_price = round(state["price"] * (1 + noise_pct), 2)
        new_price = round(new_price * 0.999 + state["base_price"] * 0.001, 2)
        state["price"] = new_price

        prev = state["prev_close"]
        chg = round(new_price - prev, 2)
        chg_p = round((chg / prev) * 100 if prev > 0 else 0, 2)

        ticks.append({
            "symbol": sym,
            "price": new_price,
            "change": chg,
            "changePercent": chg_p,
        })

    return {
        "market_open": True, 
        "next_open": None, 
        "ticks": ticks,
        "wealth_creators": get_wealth_creators()
    }


@router.post("/buy")
async def simulate_buy(asset: AssetModel):
    return {"status": "success", "message": f"Successfully simulated buying {asset.value} of {asset.name}"}

@router.get("/market/{ticker}/history")
async def get_stock_history(ticker: str, period: str = "1y"):
    """
    Returns historical price data for the chart.
    Valid periods: 1d, 5d, 1mo, 1y, 5y
    """
    # Map API periods to valid yfinance intervals
    interval_map = {
        "1d": "5m",
        "5d": "15m",
        "1mo": "1d",
        "1y": "1d",
        "5y": "1wk"
    }
    interval = interval_map.get(period, "1d")
    
    # Re-apply .NS suffix for Indian stocks if missing
    suffix = ""
    # Quick heuristc: if it's one of the known global tech symbols, don't append .NS
    if ticker not in ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "BTC-USD", "ETH-USD"]:
        if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
            suffix = ".NS"
            
    query_ticker = f"{ticker}{suffix}"
    
    try:
        data = yf.download(query_ticker, period=period, interval=interval, progress=False)
        if data.empty:
            return []
            
        def _get_col(row, col_name):
            """Safely get a column value from a row, handling multi-index columns."""
            try:
                v = row[col_name]
                if isinstance(v, pd.Series):
                    v = v.iloc[0]
                return float(v) if not pd.isna(v) else None
            except Exception:
                return None

        history = []
        is_global = not (query_ticker.endswith(".NS") or query_ticker.endswith(".BO"))
        fx = 83.0 if is_global else 1.0

        for index, row in data.iterrows():
            close = _get_col(row, 'Close')
            if close is None:
                continue

            open_  = _get_col(row, 'Open')  or close
            high   = _get_col(row, 'High')  or close
            low    = _get_col(row, 'Low')   or close

            # Apply FX rate for non-INR tickers
            close *= fx; open_ *= fx; high *= fx; low *= fx

            if period in ["1d", "5d"]:
                time_str = index.strftime("%H:%M")
            else:
                time_str = index.strftime("%b %d")

            history.append({
                "time":  time_str,
                "price": round(close, 2),   # alias for area chart
                "open":  round(open_,  2),
                "high":  round(high,   2),
                "low":   round(low,    2),
                "close": round(close,  2),
            })

        return history

    except Exception as e:
        print(f"History fetch error for {query_ticker}: {e}")
        return []

from geopy.geocoders import Nominatim
import random
import math
import requests as _requests

geolocator = Nominatim(user_agent="wealth_optimizer_live")

def _haversine_m(lat1, lon1, lat2, lon2):
    """Return distance in metres between two GPS points."""
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

# ─── Overpass API: fetch real nearby POIs ────────────────────────────────────
PHOTO_SEEDS = {
    "dining":    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
    "groceries": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
    "clothing":  "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400&q=80",
    "stays":     "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
}

def fetch_overpass_pois(lat: float, lng: float, radius_m: int = 2000):
    """
    Query OSM Overpass API for VERIFIED businesses within radius_m metres.
    Only returns places with at least one of: phone, website, street address.
    This filters out ghost/unknown OSM entries with just a name.
    """
    # Quality-filtered Overpass queries — each sub-query also requires a verifiable field
    # This drastically cuts unknown/ghost entries
    def _lines(tag_key, tag_val):
        base = f'(around:{radius_m},{lat},{lng})'
        quality = '["phone"~"."],["website"~"."],["addr:street"~"."]'
        # Build sub-lines that union the three quality checks per tag
        return (
            f'  node["{tag_key}"~"{tag_val}"]["phone"]{base};\n'
            f'  node["{tag_key}"~"{tag_val}"]["website"]{base};\n'
            f'  node["{tag_key}"~"{tag_val}"]["addr:street"]{base};\n'
            f'  way["{tag_key}"~"{tag_val}"]["phone"]{base};\n'
            f'  way["{tag_key}"~"{tag_val}"]["website"]{base};\n'
            f'  way["{tag_key}"~"{tag_val}"]["addr:street"]{base};\n'
        )

    dining_tags  = "restaurant|cafe|fast_food|food_court|bar|dhaba|juice_bar|bakery|ice_cream|canteen"
    grocery_tags = "supermarket|convenience|marketplace|grocery|provisions"
    shop_food    = "supermarket|grocery|convenience|department_store|mall|food|provisions|kirana"
    shop_cloth   = "clothes|fashion|boutique|garments|textiles|tailor"
    hotel_tags   = "hotel|hostel|guest_house|motel|lodge|resort"

    query = (
        "[out:json][timeout:30];\n"
        "(\n"
        + _lines("amenity", dining_tags)
        + _lines("amenity", grocery_tags)
        + _lines("shop", shop_food)
        + _lines("shop", shop_cloth)
        + _lines("tourism", hotel_tags)
        + _lines("amenity", "hotel|lodge")
        + ");\n"
        "out center 60;\n"
    )

    mirrors = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    ]
    elements = []
    for url in mirrors:
        try:
            resp = _requests.post(url, data={"data": query}, timeout=32)
            resp.raise_for_status()
            elements = resp.json().get("elements", [])
            print(f"Overpass OK ({url}): {len(elements)} quality-filtered elements")
            break
        except Exception as e:
            print(f"Overpass mirror {url} failed: {e}")

    pois = []
    seen_ids   = set()
    seen_names = set()
    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name") or tags.get("name:en")
        if not name:
            continue

        # ── Quality gate: must have at least one verified contact/address field ──
        phone   = tags.get("phone", tags.get("contact:phone", "")).strip()
        website = tags.get("website", tags.get("contact:website", "")).strip()
        street  = tags.get("addr:street", "").strip()
        if not phone and not website and not street:
            continue   # skip ghost entries with only a name

        amenity = tags.get("amenity", "")
        shop    = tags.get("shop", "")
        tourism = tags.get("tourism", "")

        if amenity in ("restaurant","cafe","fast_food","food_court","bar",
                       "dhaba","juice_bar","bakery","ice_cream","sweets",
                       "sweet_shop","canteen"):
            category, icon = "dining", "Coffee"
        elif (amenity in ("supermarket","convenience","marketplace","grocery",
                          "general","provisions")
              or shop in ("supermarket","grocery","convenience","general",
                          "department_store","mall","food","provisions","kirana")):
            category, icon = "groceries", "ShoppingBag"
        elif shop in ("clothes","fashion","boutique","garments","textiles",
                      "tailor","sari"):
            category, icon = "clothing", "Tag"
        elif (tourism in ("hotel","hostel","guest_house","motel","lodge","resort")
              or amenity in ("hotel","lodge")):
            category, icon = "stays", "Home"
        else:
            continue

        # way elements store coords under "center"; nodes have direct lat/lon
        el_lat = el.get("lat") or (el.get("center") or {}).get("lat")
        el_lon = el.get("lon") or (el.get("center") or {}).get("lon")

        # Skip if no valid coordinates
        if not el_lat or not el_lon:
            continue

        # Distance sanity check — Overpass can return boundary elements slightly outside radius
        dist = _haversine_m(lat, lng, el_lat, el_lon)
        if dist > radius_m * 1.1:   # allow 10% buffer for map projection rounding
            continue

        addr_parts = [
            tags.get("addr:housenumber", ""),
            tags.get("addr:street", ""),
            tags.get("addr:suburb", tags.get("addr:neighbourhood", "")),
            tags.get("addr:city", tags.get("addr:town", "")),
            tags.get("addr:state", ""),
        ]
        osm_address = ", ".join(p for p in addr_parts if p)

        # URL that opens the exact business profile on Google Maps
        # Using the place search with pinned coords at high zoom opens the listing panel directly
        name_enc = name.replace(' ', '+').replace('&', '%26')
        gmaps_search = (
            f"https://www.google.com/maps/search/{name_enc}/@{el_lat},{el_lon},18z"
        )
        gmaps_dir = (
            f"https://www.google.com/maps/dir/?api=1&destination={el_lat},{el_lon}"
            if el_lat and el_lon else ""
        )

        # Deduplicate: same OSM element or same business name+category already added
        osm_id = el.get("id")
        dedup_key = (name.strip().lower(), category)
        if osm_id in seen_ids or dedup_key in seen_names:
            continue
        seen_ids.add(osm_id)
        seen_names.add(dedup_key)

        pois.append({
            "id":               f"osm_{osm_id}",
            "name":             name,
            "category":         category,
            "icon":             icon,
            "cuisine":          tags.get("cuisine", "").replace(";", ", "),
            "phone":            tags.get("phone", tags.get("contact:phone", "")),
            "opening_hours":    tags.get("opening_hours", ""),
            "website":          tags.get("website", tags.get("contact:website", "")),
            "address":          osm_address,
            "lat":              el_lat,
            "lon":              el_lon,
            "gmaps_search":     gmaps_search,
            "gmaps_directions": gmaps_dir,
            "photo":            PHOTO_SEEDS.get(category, ""),
            "distance_m":       round(dist),
        })
    # Sort results by distance so closest places appear first
    pois.sort(key=lambda p: p["distance_m"])
    return pois


def pois_to_deals(pois: list, resolved_addr: str):
    """Convert raw OSM POIs to app-standard deal cards with Google Maps links."""
    deals = []
    for p in pois:
        name      = p["name"]
        cat       = p["category"]
        hours     = p.get("opening_hours", "")
        address   = p.get("address", "") or (resolved_addr or "")
        cuisine   = p.get("cuisine", "")
        phone     = p.get("phone", "")
        website   = p.get("website", "")
        distance_m = p.get("distance_m")

        subtitle_parts = []
        if cuisine:  subtitle_parts.append(cuisine.title())
        if hours:    subtitle_parts.append(hours[:40])
        if phone:    subtitle_parts.append(phone)
        # Only add the "Located near" fallback when we actually have an address
        if not subtitle_parts and resolved_addr:
            subtitle_parts.append(f"Located near {resolved_addr}")
        subtitle = " · ".join(subtitle_parts) if subtitle_parts else ""

        deals.append({
            "id":              p["id"],
            "category":        cat,
            "title":           name,
            "description":     subtitle,
            "address":         address if address else None,
            "icon":            p["icon"],
            "badge":           "Open 24h" if "24" in hours else "Nearby",
            "action":          "Get Directions",
            "photo":           p.get("photo", ""),
            "gmaps_search":    p.get("gmaps_search", ""),
            "gmaps_directions":p.get("gmaps_directions", ""),
            "website":         website if website else None,
            "lat":             p.get("lat"),
            "lon":             p.get("lon"),
            "distance_m":      distance_m,
        })
    return deals


# ─── Online / Platform Deals ─────────────────────────────────────────────────
import xml.etree.ElementTree as _ET
import html as _html
import re as _re
import time as _time
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

# ── Curated platform hub cards (always-on, link to official deals pages) ──────
PLATFORM_HUB = [
    # Fashion
    {"brand": "Myntra",    "category": "fashion",     "color": "#ff3f6c", "title": "Myntra Sale",           "desc": "Latest fashion deals & discounts on top brands",      "badge": "Ongoing", "link": "https://www.myntra.com/sale"},
    {"brand": "Ajio",      "category": "fashion",     "color": "#d4421c", "title": "Ajio Sale",             "desc": "Trending styles up to 80% off",                        "badge": "Ongoing", "link": "https://www.ajio.com/sale"},
    {"brand": "H&M",       "category": "fashion",     "color": "#e50010", "title": "H&M Season Sale",       "desc": "Seasonal discounts on fashion & home",                  "badge": "Ongoing", "link": "https://www2.hm.com/en_in/sale.html"},
    # Electronics
    {"brand": "Amazon",    "category": "electronics", "color": "#ffb900", "title": "Amazon Daily Deals",    "desc": "Lightning deals, daily offers & discounts",            "badge": "Live",    "link": "https://www.amazon.in/deals"},
    {"brand": "Flipkart",  "category": "electronics", "color": "#2874f0", "title": "Flipkart Offers",       "desc": "Great deals across all categories",                    "badge": "Live",    "link": "https://www.flipkart.com/offers-store"},
    {"brand": "Croma",     "category": "electronics", "color": "#1a6d3c", "title": "Croma Offers",          "desc": "Electronics discounts, exchange & bundle deals",        "badge": "Ongoing", "link": "https://www.croma.com/offers"},
    # Food & Groceries
    {"brand": "Swiggy",    "category": "food",        "color": "#fc8019", "title": "Swiggy Offers",         "desc": "Food & restaurant deals near you",                     "badge": "Live",    "link": "https://www.swiggy.com/offers"},
    {"brand": "Zomato",    "category": "food",        "color": "#cb202d", "title": "Zomato Promo Codes",    "desc": "Restaurant offers, free delivery & promo codes",       "badge": "Live",    "link": "https://www.zomato.com/promo-codes"},
    {"brand": "Blinkit",   "category": "food",        "color": "#1ab44c", "title": "Blinkit Deals",         "desc": "Groceries in 10 minutes — daily deals",                "badge": "Live",    "link": "https://blinkit.com"},
    {"brand": "BigBasket", "category": "food",        "color": "#84c225", "title": "BigBasket Offers",      "desc": "Fresh grocery deals, cashback & discounts",            "badge": "Ongoing", "link": "https://www.bigbasket.com/offers/"},
    {"brand": "Zepto",     "category": "food",        "color": "#8b3dff", "title": "Zepto Deals",           "desc": "Instant grocery delivery — live offers",               "badge": "Live",    "link": "https://www.zeptonow.com"},
    # Recharge
    {"brand": "Jio",       "category": "recharge",    "color": "#006eff", "title": "Jio Recharge Offers",   "desc": "Latest Jio prepaid & postpaid plans with benefits",    "badge": "Ongoing", "link": "https://www.jio.com/en-in/offers"},
    {"brand": "Airtel",    "category": "recharge",    "color": "#e40000", "title": "Airtel Offers",         "desc": "Airtel prepaid/postpaid offers & extra benefits",       "badge": "Ongoing", "link": "https://www.airtel.in/airtel-offers"},
    {"brand": "Vi",        "category": "recharge",    "color": "#8e0cf5", "title": "Vi Recharge Plans",     "desc": "Vodafone Idea offers & recharge deals",                "badge": "Ongoing", "link": "https://www.myvi.in/offers"},
    # Travel
    {"brand": "OYO",       "category": "travel",      "color": "#ff0000", "title": "OYO Hotel Deals",       "desc": "Budget hotel offers & last-minute discounts",          "badge": "Live",    "link": "https://www.oyorooms.com/collection/offers/"},
    {"brand": "MakeMyTrip","category": "travel",      "color": "#00b6f0", "title": "MakeMyTrip Offers",     "desc": "Flight & hotel deals, holiday packages",               "badge": "Ongoing", "link": "https://www.makemytrip.com/offers/"},
    {"brand": "Goibibo",   "category": "travel",      "color": "#e8354d", "title": "Goibibo Offers",        "desc": "Book flights, hotels, buses & get great deals",        "badge": "Ongoing", "link": "https://www.goibibo.com/offers/"},
    # Beauty
    {"brand": "Nykaa",     "category": "beauty",      "color": "#fc2779", "title": "Nykaa Beauty Offers",   "desc": "Skincare, makeup & beauty deals of the day",           "badge": "Ongoing", "link": "https://www.nykaa.com/offers"},
    # Finance
    {"brand": "Paytm",     "category": "finance",     "color": "#07a8e0", "title": "Paytm Cashback Deals",  "desc": "UPI cashback, recharge & shopping offers",            "badge": "Live",    "link": "https://paytm.com/offers"},
]

# ── Brand keyword map: RSS item → which platform it belongs to ────────────────
_BRAND_KEYWORDS = {
    "myntra":     ("Myntra",     "https://www.myntra.com/sale",                            "#ff3f6c", "fashion"),
    "ajio":       ("Ajio",       "https://www.ajio.com/sale",                              "#d4421c", "fashion"),
    "h&m":        ("H&M",        "https://www2.hm.com/en_in/sale.html",                   "#e50010", "fashion"),
    "amazon":     ("Amazon",     "https://www.amazon.in/deals",                            "#ffb900", "electronics"),
    "flipkart":   ("Flipkart",   "https://www.flipkart.com/offers-store",                  "#2874f0", "electronics"),
    "croma":      ("Croma",      "https://www.croma.com/offers",                           "#1a6d3c", "electronics"),
    "swiggy":     ("Swiggy",     "https://www.swiggy.com/offers",                          "#fc8019", "food"),
    "zomato":     ("Zomato",     "https://www.zomato.com/promo-codes",                     "#cb202d", "food"),
    "blinkit":    ("Blinkit",    "https://blinkit.com",                                    "#1ab44c", "food"),
    "bigbasket":  ("BigBasket",  "https://www.bigbasket.com/offers/",                      "#84c225", "food"),
    "zepto":      ("Zepto",      "https://www.zeptonow.com",                               "#8b3dff", "food"),
    "jio":        ("Jio",        "https://www.jio.com/en-in/offers",                       "#006eff", "recharge"),
    "airtel":     ("Airtel",     "https://www.airtel.in/airtel-offers",                    "#e40000", "recharge"),
    " vi ":       ("Vi",         "https://www.myvi.in/offers",                             "#8e0cf5", "recharge"),
    "vodafone":   ("Vi",         "https://www.myvi.in/offers",                             "#8e0cf5", "recharge"),
    "oyo":        ("OYO",        "https://www.oyorooms.com/collection/offers/",            "#ff0000", "travel"),
    "makemytrip": ("MakeMyTrip", "https://www.makemytrip.com/offers/",                     "#00b6f0", "travel"),
    "goibibo":    ("Goibibo",    "https://www.goibibo.com/offers/",                        "#e8354d", "travel"),
    "nykaa":      ("Nykaa",      "https://www.nykaa.com/offers",                           "#fc2779", "beauty"),
    "paytm":      ("Paytm",      "https://paytm.com/offers",                               "#07a8e0", "finance"),
}

def _strip_html(raw: str) -> str:
    clean = _re.sub(r"<[^>]+>", " ", raw or "")
    return _html.unescape(clean).strip()

def _days_old(date_str: str) -> float:
    """Return how many days ago the RSS pubDate was. Returns 999 on parse failure."""
    try:
        dt = parsedate_to_datetime(date_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - dt).total_seconds() / 86400
    except Exception:
        return 999

def _fetch_live_rss_deals() -> list:
    """
    Fetch DealsHeaven RSS, keep items from the last 3 days,
    map each to its platform's official hub link.
    """
    try:
        from bs4 import BeautifulSoup as _BS
        r = _requests.get("https://www.dealsheaven.in/feed/", timeout=10,
                          headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        soup = _BS(r.content, "xml")
        items = soup.find_all("item")

        seen_brands: set = set()
        results = []

        for item in items:
            title_el = item.find("title")
            title = _strip_html(title_el.text if title_el else "")
            date_el = item.find("pubDate")
            date_str = (date_el.text if date_el else "").strip()

            if _days_old(date_str) > 3:
                continue  # skip deals older than 3 days

            tl = title.lower()
            for kw, (brand, hub_link, color, cat) in _BRAND_KEYWORDS.items():
                if kw in tl and brand not in seen_brands:
                    seen_brands.add(brand)
                    results.append({
                        "brand":    brand,
                        "category": cat,
                        "color":    color,
                        "title":    title[:70] + "..." if len(title) > 70 else title,
                        "desc":     f"Deal spotted on {date_str[:16] if date_str else 'today'}",
                        "badge":    "🔥 Hot Deal",
                        "link":     hub_link,
                    })
                    break  # one match per RSS item

        return results
    except Exception as e:
        print(f"RSS live-deals fetch error: {e}")
        return []

_live_offers_cache = {"ts": 0, "hub": [], "rss": None, "scraped": None}

import concurrent.futures

@router.get("/live-offers")
def get_live_offers():
    """
    Returns:
      brand_offers  — always-on curated platform hub links (19 platforms, 8 categories)
      live_deals    — recent deals spotted in the DealsHeaven RSS + scraped platform deals
    """
    global _live_offers_cache

    now = _time.time()
    cache_age = now - _live_offers_cache["ts"]

    # Cache for 10 minutes (600s) to prevent rate limiting
    if cache_age < 600 and _live_offers_cache["rss"] is not None and _live_offers_cache["scraped"] is not None:
        return {
            "status":       "success",
            "brand_offers": PLATFORM_HUB,
            "live_deals":   _live_offers_cache["rss"] + _live_offers_cache["scraped"],
        }

    # Refresh RSS layer
    rss_deals = _fetch_live_rss_deals()
    
    # Scrape dynamic brands concurrently
    fresh_brands = []
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_brand = {executor.submit(_scrape_dealsheaven_brand, config): config for config in PLATFORM_HUB}
            for future in concurrent.futures.as_completed(future_to_brand):
                try:
                    brand_deals = future.result()
                    fresh_brands.extend(brand_deals)
                except Exception as e:
                    print(f"Concurrent scraping error: {e}")
    except Exception as e:
        print(f"Live offers aggregate error: {e}")

    _live_offers_cache["rss"] = rss_deals
    _live_offers_cache["scraped"] = fresh_brands
    _live_offers_cache["ts"]  = now

    return {
        "status":       "success",
        "brand_offers": PLATFORM_HUB,
        "live_deals":   rss_deals + fresh_brands,
    }


_deals_cache: dict = {"ts": 0, "data": []}
_DEALS_CACHE_TTL = 120  # 2 minutes

_RSS_FEEDS = [
    # DealsHeaven — curated Indian coupons & offers (confirmed working)
    "https://www.dealsheaven.in/feed/",
    # Google News RSS — India deals/offers/discount news (free, no key needed)
    "https://news.google.com/rss/search?q=online+deals+discount+offer+india&hl=en-IN&gl=IN&ceid=IN:en",
    "https://news.google.com/rss/search?q=myntra+flipkart+amazon+india+sale+offer&hl=en-IN&gl=IN&ceid=IN:en",
]

_CATEGORY_KEYWORDS = {
    "fashion":     ["fashion","clothing","clothes","shirt","dress","shoes","h&m","zara","myntra","ajio","westside","adidas","nike","puma","bewakoof","max fashion","lifestyle","footwear","bag","watch","perfume","apparel"],
    "food":        ["food","restaurant","dominos","pizza","burger","zomato","swiggy","blinkit","mcdonalds","kfc","subway","cafe","tea","coffee","eat","dining","biryani","meal","grocery","bigbasket","zepto","dunzo","instamart","supermart"],
    "electronics": ["electronics","mobile","phone","laptop","tv","tablet","headphone","earphone","camera","apple","samsung","oneplus","realme","oppo","vivo","xiaomi","redmi","boat","noise","jbl","sony","lg","lenovo","dell","hp","asus","flipkart","amazon","croma","reliance digital"],
    "travel":      ["travel","hotel","flight","irctc","makemytrip","goibibo","yatra","oyo","zostel","cleartrip","easemytrip","holiday","trip","tour","booking","airbnb","redbus","bus","train","cab","uber","ola","rapido"],
    "beauty":      ["beauty","skincare","makeup","cosmetic","nykaa","mamaearth","lakme","loreal","himalaya","wow","plum","minimalist","dot & key","derma","hair","salon","spa","face","moisturizer","serum","lipstick","perfume","kayali","fragrance"],
    "finance":     ["cashback","credit card","debit card","upi","paytm","phonepe","gpay","google pay","amazon pay","wallet","loan","insurance","invest","zerodha","groww","upstox","bank","hdfc","icici","sbi","axis","kotak","emi","offer"],
    "education":   ["course","learning","udemy","coursera","unacademy","byju","vedantu","skill","certification","education","book","test","exam","toppr","chegg","tutoring"],
    "recharge":    ["recharge","prepaid","postpaid","airtel","jio","vi","vodafone","idea","bsnl","dth","broadband","internet","data","sim"],
}

def _categorize_deal(text: str) -> str:
    t = text.lower()
    for cat, kws in _CATEGORY_KEYWORDS.items():
        if any(k in t for k in kws):
            return cat
    return "offers"

def _strip_html(raw: str) -> str:
    clean = _re.sub(r"<[^>]+>", " ", raw or "")
    return _html.unescape(clean).strip()

def _extract_discount(text: str) -> str:
    m = _re.search(r"(\d+)\s*%\s*(?:off|discount|cashback|back)", text, _re.I)
    if m: return f"{m.group(1)}% OFF"
    m = _re.search(r"(?:flat|upto|up to|save)\s*₹?\s*(\d+)", text, _re.I)
    if m: return f"₹{m.group(1)} OFF"
    m = _re.search(r"(?:buy\s*\d+\s*get\s*\d+|b\d+g\d+)", text, _re.I)
    if m: return m.group(0).upper()
    return "Deal"

def _fetch_rss_deals(feed_url: str, limit: int = 40) -> list:
    try:
        from bs4 import BeautifulSoup as _BeautifulSoup
        r = _requests.get(feed_url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        soup = _BeautifulSoup(r.content, "xml")
        items = soup.find_all("item")
        deals = []
        for item in items[:limit]:
            title_el = item.find("title")
            title = _strip_html(title_el.text if title_el else "")
            
            link_el = item.find("link")
            link  = (link_el.text if link_el else "").strip()
            
            desc_el = item.find("description")
            desc  = _strip_html(desc_el.text if desc_el else "")
            
            date_el = item.find("pubDate")
            date  = str(date_el.text if date_el else "").strip()
            
            if not title or not link:
                continue
            full_text = f"{title} {desc}"
            cat = _categorize_deal(full_text)
            disc = _extract_discount(full_text)
            deals.append({
                "id":          f"rss_{abs(hash(link))}",
                "title":       title,
                "description": desc[:160] if desc else None,
                "category":    cat,
                "discount":    disc,
                "link":        link,
                "date":        date,
                "source":      feed_url.split("/")[2],
            })
        return deals
    except Exception as e:
        print(f"RSS fetch error {feed_url}: {e}")
        return []

def _scrape_dealsheaven_brand(config: dict) -> list:
    import requests
    from bs4 import BeautifulSoup
    import re

    brand_name = config["brand"]
    brand_slug = brand_name.lower().replace("&", "n")
    url = f"https://dealsheaven.in/store/{brand_slug}"

    try:
        r = requests.get(url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/100.0.4896.127 Safari/537.36"
        })
        r.raise_for_status()
        soup = BeautifulSoup(r.content, "html.parser")
        
        deals = []
        items = soup.find_all("div", class_="product-item-detail")
        
        for item in items:
            a_tag = item.find("a", href=True)
            if not a_tag: continue
            
            link = a_tag["href"]
            if link.startswith("/"): link = "https://dealsheaven.in" + link
            
            img_tag = item.find("img", alt=True)
            title = img_tag["alt"] if img_tag else ""
            
            if not title:
                title_el = item.find(["h3", "h4", "p", "a"], string=True)
                title = title_el.text.strip() if title_el else ""
                
            title = _strip_html(title)
            if not title or len(title) < 5: continue
            
            discount_tag = item.find("div", class_="discount")
            discount = discount_tag.text.strip() if discount_tag else "Live Offer"

            if brand_name.lower() in title.lower() or brand_name.lower() in link.lower() or len(deals) < 3:
                deals.append({
                    "brand": brand_name,
                    "title": title[:55] + "..." if len(title) > 55 else title,
                    "desc": discount,
                    "badge": "Live",
                    "color": config["color"],
                    "link": link,
                    "category": config["category"]
                })
                
        seen = set()
        dedup = []
        for d in deals:
             if d["title"] not in seen:
                  seen.add(d["title"])
                  dedup.append(d)
                  
        if dedup:
            return dedup[:3]
        return []
        
    except Exception as e:
        print(f"Error fetching for {brand_name}: {e}")
        return []






@router.get("/local-deals")
async def get_local_deals(lat: float = None, lng: float = None, address: str = None):
    resolved_addr = ""
    query_lat = lat
    query_lng = lng

    # ── 1. Resolve coordinates ───────────────────────────────────────────────
    if lat and lng:
        try:
            location = geolocator.reverse(f"{lat}, {lng}", exactly_one=True)
            if location and location.raw.get("address"):
                a = location.raw["address"]
                city   = a.get("city", a.get("town", a.get("village", "")))
                suburb = a.get("suburb", a.get("neighbourhood", ""))
                state  = a.get("state", "")
                # Do NOT include postcode — Nominatim returns wrong pincodes frequently
                resolved_addr = ", ".join(filter(None, [suburb or city, state]))
            else:
                resolved_addr = f"{round(lat,3)}°N, {round(lng,3)}°E"
        except Exception as e:
            print(f"Reverse geocode error: {e}")
            resolved_addr = f"{round(lat,3)}°N, {round(lng,3)}°E"

    elif address:
        try:
            # country_codes="in" forces Nominatim to search within India only
            location = geolocator.geocode(address, addressdetails=True, country_codes="in")
            if location:
                query_lat = location.latitude
                query_lng = location.longitude
                a = location.raw.get("address", {})
                city   = a.get("city", a.get("town", a.get("village", "")))
                suburb = a.get("suburb", a.get("neighbourhood", ""))
                state  = a.get("state", "")
                resolved_addr = ", ".join(filter(None, [suburb or city, state]))
            else:
                resolved_addr = address.title()
        except Exception as e:
            resolved_addr = address.title()

    # ── 2. Query real POIs from Overpass (5km radius) ────────────────────────
    if query_lat and query_lng:
        pois = fetch_overpass_pois(query_lat, query_lng, radius_m=5000)
        if pois:
            deals = pois_to_deals(pois, resolved_addr or "your area")
            return {
                "status": "success",
                "location_based": True,
                "resolved_address": resolved_addr,
                "source": "OpenStreetMap",
                "deals": deals
            }
        # Overpass returned results for valid coordinates but nothing matched
        return {
            "status": "success",
            "location_based": True,
            "resolved_address": resolved_addr,
            "source": "OpenStreetMap",
            "empty_reason": f"No tagged businesses found within 5 km of {resolved_addr} in OpenStreetMap. Try a nearby city center.",
            "deals": []
        }

    # ── 3. No coordinates available at all ───────────────────────────────────
    return {
        "status": "success",
        "location_based": False,
        "resolved_address": "",
        "source": "none",
        "empty_reason": "no_location",
        "deals": []
    }


# Region-specific storefront mock dictionary
INDIAN_STORES = {
    "Tamil Nadu": {
        "dining": ["Saravana Bhavan", "A2B (Adyar Ananda Bhavan)", "Murugan Idli Shop", "Junior Kuppanna"],
        "groceries": ["Nilgiris", "Pazhamudir Nilayam", "Kannan Departmental", "Grace Super Market"],
        "clothing": ["Pothys", "Chennai Silks", "RMKV", "Nalli"],
        "stays": ["Taj Coromandel", "ITC Grand Chola", "Residency Towers", "Zostel Ooty"]
    },
    "Karnataka": {
        "dining": ["MTR", "Nandini", "Vidyarthi Bhavan", "Truffles"],
        "groceries": ["Namdhari's Fresh", "Hopcoms", "More Supermarket", "Star Bazaar"],
        "clothing": ["Commercial Street Boutiques", "Soch", "Lifestyle", "Max"],
        "stays": ["ITC Gardenia", "Taj West End", "St. Mark's Hotel", "Zostel Gokarna"]
    },
    "Maharashtra": {
        "dining": ["Britannia & Co.", "Bademiya", "Gajalee", "Kyani & Co."],
        "groceries": ["Sahakari Bhandar", "D-Mart", "Nature's Basket", "Reliance Fresh"],
        "clothing": ["Fashion Street Stalls", "Shoppers Stop", "Westside", "Zudio"],
        "stays": ["Taj Mahal Palace", "Trident", "ITC Maratha", "Zostel Panchgani"]
    },
    "Delhi": {
        "dining": ["Karim's", "Bukhara", "Haldiram's", "Big Chill Cafe"],
        "groceries": ["Modern Bazaar", "Le Marche", "Easyday", "Spencers"],
        "clothing": ["Sarojini Nagar Market", "FabIndia", "Biba", "W"],
        "stays": ["ITC Maurya", "Taj Palace", "The Leela", "Zostel Delhi"]
    },
    "Default": {
        "dining": ["Barbeque Nation", "Mainland China", "Domino's", "Local Thali"],
        "groceries": ["Reliance Smart", "Big Bazaar", "Spencer's Retail", "Local Mandi"],
        "clothing": ["Zudio", "Trends", "Max Fashion", "Pantaloons"],
        "stays": ["Oyo Rooms", "Treebo Hotels", "FabHotels", "Lemon Tree"]
    }
}

def get_regional_stores(state: str, category: str):
    # Try exact match, partial match, or fallback to national default
    stores = INDIAN_STORES.get("Default")[category]
    for key in INDIAN_STORES.keys():
        if key in state:
            stores = INDIAN_STORES[key][category]
            break
    return random.choice(stores)

@router.get("/local-deals")
async def get_local_deals(lat: float = None, lng: float = None, address: str = None):
    resolved_addr = ""
    detected_state = "Default"
    hyper_local_area = ""
    
    if lat and lng:
        try:
            # Use real Reverse Geocoding
            location = geolocator.reverse(f"{lat}, {lng}", exactly_one=True)
            if location and location.raw.get('address'):
                addr_dict = location.raw['address']
                city = addr_dict.get('city', addr_dict.get('town', addr_dict.get('village', 'Unknown Area')))
                state = addr_dict.get('state', 'Unknown State')
                pincode = addr_dict.get('postcode', '')
                
                hyper_local_area = addr_dict.get('suburb', addr_dict.get('neighbourhood', city))
                
                resolved_addr = f"{city}, {state} {pincode}".strip()
                detected_state = state
            else:
                resolved_addr = "Location coordinates logged"
        except Exception as e:
            print(f"Geocoding failed: {e}")
            resolved_addr = f"Coordinates: {round(lat, 2)}, {round(lng, 2)}"
            
    elif address:
        # Use real Forward Geocoding to standardize formatting
        try:
            location = geolocator.geocode(address, addressdetails=True)
            if location:
                addr_dict = location.raw.get('address', {})
                # Extract granular neighborhood if available from typing
                hyper_local_area = addr_dict.get('suburb', addr_dict.get('neighbourhood', addr_dict.get('city', address.split(',')[0])))
                
                resolved_addr = location.address.split(',')[0] + ", " + location.address.split(',')[-2].strip()  # Shorten to City, State approx
                detected_state = location.address
            else:
                resolved_addr = address.title()
                hyper_local_area = address.split(',')[0].title()
        except Exception as e:
            resolved_addr = address.title()
            hyper_local_area = address.split(',')[0].title()
            
    if resolved_addr:
        # State-wide prominent stores
        stay_store = get_regional_stores(detected_state, "stays")
        food_store1 = get_regional_stores(detected_state, "dining")
        groc_store = get_regional_stores(detected_state, "groceries")
        cloth_store = get_regional_stores(detected_state, "clothing")
        
        # Hyper-Local Dynamically Generated Micro Stores
        local_food_store = f"The {hyper_local_area} Kitchen" if random.choice([True, False]) else f"{hyper_local_area} Spice Restaurant"
        local_groc_store = f"{hyper_local_area} Fresh Mart"
        local_cloth_store = f"{hyper_local_area} Boutique"
        local_stay_store = f"Hotel {hyper_local_area} Grand"
        
        return {
            "status": "success",
            "location_based": True,
            "resolved_address": resolved_addr,
            "deals": [
                {
                    "id": f"deal_stay_{random.randint(100,999)}",
                    "category": "stays",
                    "title": f"Stay at {local_stay_store}",
                    "description": f"Planning a trip within {resolved_addr}? Book '{local_stay_store}' today and get 25% off your booking using your affiliated card.",
                    "action": "Check Dates",
                    "icon": "Home",
                    "badge": f"Valid for {random.randint(2, 12)} hours"
                },
                {
                    "id": f"deal_food_{random.randint(100,999)}",
                    "category": "dining",
                    "title": f"Lunch at {local_food_store}",
                    "description": f"Craving local flavors? '{local_food_store}' right in {hyper_local_area} has a Happy Hour Special! Flat 15% off total bill.",
                    "action": "Get Coupon",
                    "icon": "Coffee",
                    "badge": "Live Offer"
                },
                {
                    "id": f"deal_grocery_{random.randint(100,999)}",
                    "category": "groceries",
                    "title": f"Stock up at {local_groc_store}",
                    "description": f"'{local_groc_store}' is currently running an end-of-month sale. Essential grains are 12% below market average in your neighborhood.",
                    "action": "View Catalog",
                    "icon": "ShoppingBag",
                    "badge": f"Ends in {random.randint(1, 5)} days"
                },
                {
                    "id": f"deal_cloth_{random.randint(100,999)}",
                    "category": "clothing",
                    "title": f"Festive Wear at {local_cloth_store}",
                    "description": f"Visit '{local_cloth_store}' near {hyper_local_area} square. Buy 2 Get 1 Free on all regional ethnic wear.",
                    "action": "Find Stores",
                    "icon": "Tag",
                    "badge": "Today Only"
                },
                {
                    "id": f"deal_dining_{random.randint(100,999)}",
                    "category": "dining",
                    "title": f"Premium Dining: {food_store1}",
                    "description": f"Use your Platinum Credit Card to get complimentary desserts at '{food_store1}' located optimally near you.",
                    "action": "Reserve Table",
                    "icon": "Coffee",
                    "badge": "Limited Seats"
                },
                {
                    "id": f"deal_grocery_regional_{random.randint(100,999)}",
                    "category": "groceries",
                    "title": f"Bulk Savings: {groc_store}",
                    "description": f"Visit your nearest '{groc_store}' outlet. Flat 5% cashback on all UPI payments over ₹1000.",
                    "action": "View Deals",
                    "icon": "ShoppingBag",
                    "badge": ""
                }
            ]
        }
    else:
        # Fallback static deals if location is denied or missing
        return {
            "status": "success",
            "location_based": False,
            "resolved_address": "General Access",
            "deals": [
                {
                    "id": "static_stay",
                    "category": "stays",
                    "title": "National Hotel Chain",
                    "description": "Standard 15% discount on city center hotels booked 3 days in advance across India.",
                    "action": "View Hotels",
                    "icon": "Home",
                    "badge": ""
                },
                {
                    "id": "static_dining",
                    "category": "dining",
                    "title": "Budget Dining",
                    "description": "Nationwide lunch specials averaging ₹250 per meal at partner venues.",
                    "action": "See Restaurants",
                    "icon": "Coffee",
                    "badge": ""
                },
                {
                    "id": "static_grocery",
                    "category": "groceries",
                    "title": "Affordable Groceries",
                    "description": "Reliance Smart general offers: Up to 12% off on essential and bulk items.",
                    "action": "View Catalog",
                    "icon": "ShoppingBag",
                    "badge": ""
                },
                {
                    "id": "static_clothing",
                    "category": "clothing",
                    "title": "Retail Offers",
                    "description": "General clothing discounts available at major metropolitan shopping malls (Trends, Zudio).",
                    "action": "Explore Brands",
                    "icon": "Tag",
                    "badge": ""
                }
            ]
        }
