from bs4 import BeautifulSoup

with open("myntra_page.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), "html.parser")

items = soup.find_all("div", class_="product-item-detail")
for i, item in enumerate(items[:5]):
    print(f"--- Item {i} ---")
    a_tag = item.find("a", href=True)
    link = a_tag["href"] if a_tag else "No link"
    
    img_tag = item.find("img", alt=True)
    title = img_tag["alt"] if img_tag else "No title"
    
    discount_tag = item.find("div", class_="discount")
    discount = discount_tag.text.strip() if discount_tag else "No discount"
    
    price_tag = item.find("p", class_="price", text=False) or item.find("div", class_="price")
    price = price_tag.text.strip() if price_tag else "No price"
    
    print(f"Title: {title}")
    print(f"Link: {link}")
    print(f"Discount: {discount}")
    print(f"Price: {price}")
