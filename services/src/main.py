import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router

logging.basicConfig(level=logging.INFO)


def create_app():
    app = FastAPI()

    # Configurar CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router.router)

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
