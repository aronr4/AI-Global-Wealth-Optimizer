import requests

slugs = ["hnm", "h-m", "h-and-m", "hm", "h_m"]
for slug in slugs:
    url = f"https://dealsheaven.in/store/{slug}"
    r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    print(f"{slug}: {r.status_code}")
