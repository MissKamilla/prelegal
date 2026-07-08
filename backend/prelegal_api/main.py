from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .db import create_or_replace_fake_user, database_is_ready, initialize_database


def get_database_path() -> Path:
    return Path(os.environ.get("PRELEGAL_DB_PATH", "/tmp/prelegal/prelegal.sqlite3"))


def get_static_dir() -> Path:
    default_static_dir = Path(__file__).resolve().parents[2] / "static"
    return Path(os.environ.get("PRELEGAL_STATIC_DIR", default_static_dir))


@asynccontextmanager
async def lifespan(app: FastAPI):
    database_path = get_database_path()
    initialize_database(database_path)
    yield


app = FastAPI(title="Prelegal API", version="0.1.0", lifespan=lifespan)


class FakeLoginRequest(BaseModel):
    email: str = Field(default="demo@prelegal.example", min_length=3, max_length=320)
    display_name: str = Field(default="Demo User", min_length=1, max_length=120)


@app.get("/api/health")
def health(database_path: Annotated[Path, Depends(get_database_path)]):
    return {
        "ok": True,
        "databaseReady": database_is_ready(database_path),
    }


@app.post("/api/fake-login")
def fake_login(
    payload: FakeLoginRequest,
    database_path: Annotated[Path, Depends(get_database_path)],
):
    user = create_or_replace_fake_user(
        database_path,
        email=str(payload.email),
        display_name=payload.display_name,
    )

    return {
        "user": user,
        "auth": "fake",
    }


@app.get("/{path:path}", include_in_schema=False)
def frontend(path: str):
    static_dir = get_static_dir()
    requested_path = (static_dir / path).resolve()

    if static_dir.exists() and requested_path.is_file() and static_dir.resolve() in requested_path.parents:
        return FileResponse(requested_path)

    index_path = static_dir / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    return {
        "service": "prelegal-api",
        "message": "Frontend build was not found. Build the frontend or run Next.js in development.",
    }
