import requests
import warnings
from bs4 import BeautifulSoup

warnings.filterwarnings('ignore')

BRAND_OFFERS = [
        {"brand": "Myntra", "link": "https://www.myntra.com/sale"},
        {"brand": "H&M", "link": "https://www2.hm.com/en_in/sale.html"},
        {"brand": "AJIO", "link": "https://www.ajio.com/sale"},
        {"brand": "Westside", "link": "https://www.westside.com/pages/sale"},
        {"brand": "Flipkart", "link": "https://www.flipkart.com/offers-store"},
        {"brand": "Amazon", "link": "https://www.amazon.in/deals"},
        {"brand": "Croma", "link": "https://www.croma.com/offers"},
        {"brand": "Zomato", "link": "https://www.zomato.com/offers"},
        {"brand": "Swiggy", "link": "https://www.swiggy.com/offers"},
        {"brand": "BigBasket", "link": "https://www.bigbasket.com/offers/"},
        {"brand": "Blinkit", "link": "https://blinkit.com"},
        {"brand": "Nykaa", "link": "https://www.nykaa.com/offers"},
        {"brand": "Mamaearth", "link": "https://mamaearth.in/pages/offers"},
        {"brand": "Makemytrip", "link": "https://www.makemytrip.com/offers/"},
        {"brand": "OYO", "link": "https://www.oyorooms.com/offers"},
        {"brand": "Ola", "link": "https://www.olacabs.com/offers"},
        {"brand": "PhonePe", "link": "https://www.phonepe.com/offers/"},
        {"brand": "HDFC", "link": "https://www.hdfcbank.com/content/bbp/repositories/723fb80a-2dde-42a3-9793-7ae1be57c87f/"},
        {"brand": "Airtel", "link": "https://www.airtel.in/recharge-online/"},
        {"brand": "Jio", "link": "https://www.jio.com/en-in/plans/prepaid"}
]

for b in BRAND_OFFERS:
    url = b["link"]
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}, timeout=10, verify=False)
        soup = BeautifulSoup(r.content, 'html.parser')
        title = (soup.title.string if soup.title else 'No Title').strip().lower()
        if r.status_code != 200 or 'not found' in title or '404' in title or 'error' in title or 'page not' in title:
            print(f"BROKEN: {b['brand']} - {r.status_code} - {title} - {url}")
    except Exception as e:
        print(f"ERROR: {b['brand']} - {url}: {e}")
