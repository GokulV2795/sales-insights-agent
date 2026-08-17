"""Generates a near-realistic sales dataset (regions, stores, categories,
products, customers, and ~18 months of orders with seasonality/growth) and
loads it into the SQLite database used by the app.

Run with:  python -m app.seed_data
"""

import random
from datetime import date, datetime, timedelta

from faker import Faker

from app.database import Base, SessionLocal, engine
from app.models import Category, Customer, Product, Region, SalesOrder, Store

fake = Faker()
random.seed(42)
Faker.seed(42)

TODAY = date(2026, 8, 17)
START_DATE = date(2025, 1, 1)  # ~19.5 months of history

REGIONS = ["North America", "Europe", "APAC", "LATAM", "MEA"]

STORES = [
    # (name, channel, region)
    ("Online Storefront - Global", "Online", "North America"),
    ("Retail Flagship - New York", "Retail", "North America"),
    ("Retail Store - San Francisco", "Retail", "North America"),
    ("Partner Reseller - Toronto", "Partner", "North America"),
    ("Online Storefront - EU", "Online", "Europe"),
    ("Retail Flagship - London", "Retail", "Europe"),
    ("Retail Store - Berlin", "Retail", "Europe"),
    ("Partner Reseller - Paris", "Partner", "Europe"),
    ("Online Storefront - APAC", "Online", "APAC"),
    ("Retail Store - Singapore", "Retail", "APAC"),
    ("Retail Store - Tokyo", "Retail", "APAC"),
    ("Partner Reseller - Sydney", "Partner", "APAC"),
    ("Online Storefront - LATAM", "Online", "LATAM"),
    ("Retail Store - Sao Paulo", "Retail", "LATAM"),
    ("Online Storefront - MEA", "Online", "MEA"),
    ("Retail Store - Dubai", "Retail", "MEA"),
]

CATALOG = {
    "Electronics": [
        ("Wireless Earbuds Pro", 129.99, 48.0),
        ("Noise Cancelling Headphones", 249.99, 95.0),
        ("4K Action Camera", 199.99, 78.0),
        ("Smart Home Hub", 89.99, 32.0),
        ("Portable Bluetooth Speaker", 59.99, 21.0),
        ("Smartwatch Series 5", 299.99, 110.0),
        ("Mechanical Keyboard", 119.99, 40.0),
        ("Wireless Charging Pad", 34.99, 11.0),
        ("27-inch 4K Monitor", 379.99, 160.0),
        ("USB-C Docking Station", 89.99, 33.0),
        ("Robot Vacuum Cleaner", 349.99, 140.0),
        ("Smart Video Doorbell", 149.99, 55.0),
    ],
    "Home & Kitchen": [
        ("Stainless Steel Air Fryer", 129.99, 46.0),
        ("Espresso Machine Deluxe", 249.99, 92.0),
        ("Cast Iron Dutch Oven", 89.99, 30.0),
        ("Cordless Stick Vacuum", 199.99, 74.0),
        ("Smart LED Light Strip", 29.99, 9.0),
        ("Ceramic Non-Stick Cookware Set", 159.99, 58.0),
        ("Electric Kettle", 39.99, 13.0),
        ("Memory Foam Pillow Set", 49.99, 16.0),
    ],
    "Apparel": [
        ("Men's Performance Running Jacket", 79.99, 26.0),
        ("Women's Merino Wool Sweater", 89.99, 30.0),
        ("Unisex Everyday Sneakers", 99.99, 34.0),
        ("Classic Denim Jacket", 69.99, 22.0),
        ("Thermal Base Layer Set", 44.99, 15.0),
        ("Slim Fit Chino Pants", 54.99, 18.0),
    ],
    "Sports & Outdoors": [
        ("Yoga Mat Pro", 34.99, 11.0),
        ("Adjustable Dumbbell Set", 249.99, 95.0),
        ("2-Person Camping Tent", 159.99, 60.0),
        ("Insulated Water Bottle", 24.99, 7.0),
        ("Trail Running Backpack", 79.99, 27.0),
        ("Resistance Bands Kit", 19.99, 6.0),
    ],
    "Beauty & Personal Care": [
        ("Vitamin C Serum", 29.99, 9.0),
        ("Electric Facial Cleansing Brush", 49.99, 17.0),
        ("Hair Dryer Ionic Pro", 69.99, 24.0),
        ("Premium Skincare Gift Set", 89.99, 31.0),
        ("Electric Shaver", 79.99, 28.0),
    ],
    "Office Supplies": [
        ("Ergonomic Office Chair", 219.99, 84.0),
        ("Standing Desk Converter", 189.99, 70.0),
        ("Wireless Mouse & Keyboard Combo", 49.99, 17.0),
        ("Desk Organizer Set", 24.99, 8.0),
        ("LED Desk Lamp", 34.99, 12.0),
    ],
}

SEGMENTS = ["Enterprise", "SMB", "Consumer"]
SEGMENT_WEIGHTS = [0.15, 0.30, 0.55]

# Relative demand weighting per category, to make some categories bestsellers.
CATEGORY_WEIGHTS = {
    "Electronics": 0.34,
    "Home & Kitchen": 0.18,
    "Apparel": 0.16,
    "Sports & Outdoors": 0.13,
    "Beauty & Personal Care": 0.11,
    "Office Supplies": 0.08,
}

STATUS_WEIGHTS = [("Completed", 0.90), ("Refunded", 0.06), ("Cancelled", 0.04)]


def month_seasonality(d: date) -> float:
    """Return a demand multiplier for a given date to simulate seasonality:
    a holiday-shopping spike in Nov/Dec, a summer dip, and steady base demand.
    """
    m = d.month
    seasonal = {
        1: 0.85, 2: 0.85, 3: 0.95, 4: 1.0, 5: 1.0, 6: 0.9,
        7: 0.85, 8: 0.9, 9: 1.05, 10: 1.15, 11: 1.45, 12: 1.65,
    }[m]
    # Weekend bump for retail/online browsing behavior
    weekday_mult = 1.15 if d.weekday() >= 5 else 1.0
    return seasonal * weekday_mult


def growth_multiplier(d: date) -> float:
    """Simulates ~2.5% month-over-month business growth since START_DATE."""
    months_elapsed = (d.year - START_DATE.year) * 12 + (d.month - START_DATE.month)
    return (1.025) ** months_elapsed


def weighted_choice(items_with_weights: list[tuple]) -> object:
    items, weights = zip(*items_with_weights)
    return random.choices(items, weights=weights, k=1)[0]


def build_dataset(session):
    # --- Regions ---
    region_objs = {name: Region(name=name) for name in REGIONS}
    session.add_all(region_objs.values())
    session.flush()

    # --- Stores ---
    store_objs = []
    for name, channel, region_name in STORES:
        store = Store(name=name, channel=channel, region_id=region_objs[region_name].id)
        store_objs.append(store)
    session.add_all(store_objs)
    session.flush()

    # --- Categories & Products ---
    category_objs = {}
    product_objs = []
    sku_counter = 1000
    for cat_name, items in CATALOG.items():
        cat = Category(name=cat_name)
        session.add(cat)
        session.flush()
        category_objs[cat_name] = cat
        for prod_name, price, cost in items:
            sku_counter += 1
            launch = START_DATE - timedelta(days=random.randint(30, 400))
            product_objs.append(
                Product(
                    name=prod_name,
                    sku=f"SKU-{sku_counter}",
                    category_id=cat.id,
                    unit_price=price,
                    unit_cost=cost,
                    launch_date=launch,
                )
            )
    session.add_all(product_objs)
    session.flush()

    products_by_category = {}
    for p in product_objs:
        products_by_category.setdefault(p.category_id, []).append(p)

    # --- Customers ---
    customer_objs = []
    num_customers = 650
    for _ in range(num_customers):
        region = random.choice(list(region_objs.values()))
        segment = weighted_choice(list(zip(SEGMENTS, SEGMENT_WEIGHTS)))
        signup = fake.date_between(start_date=START_DATE - timedelta(days=700), end_date=TODAY)
        customer_objs.append(
            Customer(
                name=fake.name() if segment == "Consumer" else fake.company(),
                segment=segment,
                region_id=region.id,
                signup_date=signup,
            )
        )
    session.add_all(customer_objs)
    session.flush()

    # Group stores by region for locality-weighted purchase behavior
    stores_by_region = {}
    for s in store_objs:
        stores_by_region.setdefault(s.region_id, []).append(s)

    # --- Sales Orders ---
    orders = []
    order_id = 1
    d = START_DATE
    cat_names = list(CATEGORY_WEIGHTS.keys())
    cat_weights = list(CATEGORY_WEIGHTS.values())

    while d <= TODAY:
        base_daily_orders = 22
        mult = month_seasonality(d) * growth_multiplier(d)
        num_orders_today = max(1, int(random.gauss(base_daily_orders * mult, base_daily_orders * mult * 0.15)))

        for _ in range(num_orders_today):
            customer = random.choice(customer_objs)
            if customer.signup_date > d:
                continue  # can't order before signing up

            region_stores = stores_by_region.get(customer.region_id) or store_objs
            store = random.choice(region_stores) if random.random() < 0.8 else random.choice(store_objs)

            cat_name = random.choices(cat_names, weights=cat_weights, k=1)[0]
            cat_id = category_objs[cat_name].id
            product = random.choice(products_by_category[cat_id])
            if product.launch_date > d:
                continue

            quantity = random.choices([1, 2, 3, 4, 5], weights=[0.55, 0.22, 0.12, 0.07, 0.04], k=1)[0]
            discount_pct = random.choices([0, 5, 10, 15, 20], weights=[0.55, 0.15, 0.15, 0.1, 0.05], k=1)[0]
            unit_price = product.unit_price
            total = round(unit_price * quantity * (1 - discount_pct / 100), 2)
            status = weighted_choice(STATUS_WEIGHTS)

            order_time = datetime.combine(d, datetime.min.time()) + timedelta(
                hours=random.randint(0, 23), minutes=random.randint(0, 59)
            )

            orders.append(
                SalesOrder(
                    order_date=d,
                    customer_id=customer.id,
                    product_id=product.id,
                    store_id=store.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    discount_pct=float(discount_pct),
                    total_amount=total,
                    status=status,
                    created_at=order_time,
                )
            )
            order_id += 1

        d += timedelta(days=1)

    session.bulk_save_objects(orders)
    session.commit()
    return len(orders)


def main():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        count = build_dataset(session)
        print(f"Seeded database with {count} sales orders across "
              f"{len(REGIONS)} regions, {len(STORES)} stores, "
              f"{sum(len(v) for v in CATALOG.values())} products, "
              f"650 customers.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
