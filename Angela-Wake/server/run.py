"""
Angela Wake Word Server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import APP_TITLE, APP_VERSION, HOST, PORT
from .routes import router


app = FastAPI(title = APP_TITLE, version = APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host = HOST, port = PORT)
