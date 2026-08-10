from fastapi import FastAPI, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import test_connection

app = FastAPI()


@app.get("/test-database")
def test_database():
    try:
        result = test_connection()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {exc.__class__.__name__}",
        ) from exc

    return {
        "database": "connected",
        "result": result
    }

@app.get("/")
def home():
    return {"message": "API is running"}
