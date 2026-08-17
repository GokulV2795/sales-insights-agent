from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Region(Base):
    __tablename__ = "regions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)

    stores: Mapped[list["Store"]] = relationship(back_populates="region")
    customers: Mapped[list["Customer"]] = relationship(back_populates="region")


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    channel: Mapped[str] = mapped_column(String(32))  # Online, Retail, Partner
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"))

    region: Mapped["Region"] = relationship(back_populates="stores")
    orders: Mapped[list["SalesOrder"]] = relationship(back_populates="store")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    sku: Mapped[str] = mapped_column(String(32), unique=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    unit_price: Mapped[float] = mapped_column(Float)
    unit_cost: Mapped[float] = mapped_column(Float)
    launch_date: Mapped[date] = mapped_column(Date)

    category: Mapped["Category"] = relationship(back_populates="products")
    orders: Mapped[list["SalesOrder"]] = relationship(back_populates="product")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    segment: Mapped[str] = mapped_column(String(32))  # Enterprise, SMB, Consumer
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"))
    signup_date: Mapped[date] = mapped_column(Date)

    region: Mapped["Region"] = relationship(back_populates="customers")
    orders: Mapped[list["SalesOrder"]] = relationship(back_populates="customer")


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_date: Mapped[date] = mapped_column(Date, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Float)
    discount_pct: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(16), default="Completed")  # Completed, Refunded, Cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    customer: Mapped["Customer"] = relationship(back_populates="orders")
    product: Mapped["Product"] = relationship(back_populates="orders")
    store: Mapped["Store"] = relationship(back_populates="orders")
