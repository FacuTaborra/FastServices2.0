import logging
from fastapi import FastAPI
from routers import router

logging.basicConfig(level=logging.INFO)


def create_app():
    app = FastAPI()

    app.include_router(router.router)

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
