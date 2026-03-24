import asyncio
import sys
import os
import requests
from bs4 import BeautifulSoup
import re
import html
import json

def strip_html(raw: str) -> str:
    clean = re.sub(r"<[^>]+>", " ", raw or "")
    return html.unescape(clean).strip()

def scrape_dealsheaven_brand(brand_name):
    # e.g., "Myntra" -> "myntra"
    brand_slug = brand_name.lower().replace("&", "n")
    url = f"https://dealsheaven.in/store/{brand_slug}"
    print(f"Fetching {brand_name} from: {url}")
    try:
        r = requests.get(url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/100.0.4896.127 Safari/537.36"
        })
        r.raise_for_status()
        soup = BeautifulSoup(r.content, "html.parser")
        
        with open(f"{brand_slug}_page.html", "w", encoding="utf-8") as f:
            f.write(soup.prettify())
            
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
                
            title = strip_html(title)
            if not title or len(title) < 5: continue
            
            discount_tag = item.find("div", class_="discount")
            discount = discount_tag.text.strip() if discount_tag else "Live Offer"
            
            deals.append({
                "brand": brand_name,
                "title": title[:70] + "..." if len(title) > 70 else title,
                "link": link,
                "discount": discount
            })
        # Remove duplicates
        seen = set()
        dedup = []
        for d in deals:
             if d["title"] not in seen:
                  seen.add(d["title"])
                  dedup.append(d)
                  
        return dedup[:3]
    except Exception as e:
        print(f"Error fetching for {brand_name}: {e}")
        return []

def test_dealsheaven_store():
    brands = ["Myntra", "H&M", "Amazon", "Flipkart"]
    all_deals = []
    for brand in brands:
        all_deals.extend(scrape_dealsheaven_brand(brand))
        
    with open("deals.json", "w", encoding="utf-8") as f:
        json.dump(all_deals, f, indent=4)
    print(f"Wrote {len(all_deals)} deals to deals.json")

if __name__ == "__main__":
    test_dealsheaven_store()




