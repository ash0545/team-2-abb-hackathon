import uvicorn
from fastapi import FastAPI
from routes import dataset_routes

app = FastAPI(title="ML Microservice - ABB Hackathon")

app.include_router(dataset_routes.router)


@app.get("/")
def root():
    return {"message": "ML Service is alive"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
