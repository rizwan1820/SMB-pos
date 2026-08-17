from app.routes import businesses, categories, products, roles, suppliers, users
from fastapi import FastAPI

app = FastAPI()

app.include_router(businesses.router)
app.include_router(roles.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(suppliers.router)

@app.get("/")
def home():
    return {"message": "API is running"}
