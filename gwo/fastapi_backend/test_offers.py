import requests
from bs4 import BeautifulSoup
url = "https://www.dealsheaven.in/feed/"
try:
    r = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    print(f"Status Code: {r.status_code}")
    
    soup = BeautifulSoup(r.content, "xml")
    items = soup.find_all("item")
    print(f"Found items: {len(items)}")
    
    if items:
        link = items[0].find("link")
        print(f"First link: {link.text if link else 'None'}")
except Exception as e:
    print(f"Error: {e}")
