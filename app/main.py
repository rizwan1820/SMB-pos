from app.routes import businesses, roles, users
from fastapi import FastAPI

app = FastAPI()

app.include_router(businesses.router)
app.include_router(roles.router)
app.include_router(users.router)

@app.get("/")
def home():
    return {"message": "API is running"}
