from app.routes import businesses, categories, products, roles, suppliers, users, inventory, customers, orders, invoices, returns, reports

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(businesses.router)
app.include_router(roles.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(suppliers.router)
app.include_router(inventory.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(invoices.router)
app.include_router(returns.router)
app.include_router(reports.router)

@app.get("/")
def home():
    return {"message": "API is running"}
