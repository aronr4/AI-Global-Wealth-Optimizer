import requests
import xml.etree.ElementTree as ET

r = requests.get("https://www.dealsheaven.in/feed/")
root = ET.fromstring(r.content)
items = root.findall(".//item")
for item in items[:2]:
    title = item.findtext("title")
    link = item.findtext("link")
    desc = item.findtext("description")
    full = f"{title} | {link} | {desc[:100]}"
    print(full)
