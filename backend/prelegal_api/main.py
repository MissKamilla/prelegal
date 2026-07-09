from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

import sqlite3

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .db import (
    authenticate_user,
    create_document,
    create_or_replace_fake_user,
    create_user,
    database_is_ready,
    get_user_document,
    initialize_database,
    list_user_documents,
)


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


class SignupRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    display_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=6, max_length=200)


class SigninRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=6, max_length=200)


class CreateDocumentRequest(BaseModel):
    user_id: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=200)
    document_type: str = Field(min_length=1, max_length=120)
    content: str = Field(min_length=1)
    values: dict[str, str] = Field(default_factory=dict)


@app.get("/api/health")
def health(database_path: Annotated[Path, Depends(get_database_path)]):
    return {
        "ok": True,
        "databaseReady": database_is_ready(database_path),
    }


@app.post("/api/signup")
def signup(
    payload: SignupRequest,
    database_path: Annotated[Path, Depends(get_database_path)],
):
    try:
        user = create_user(
            database_path,
            email=payload.email,
            display_name=payload.display_name,
            password=payload.password,
        )
    except sqlite3.IntegrityError as error:
        raise HTTPException(status_code=409, detail="Email is already registered") from error

    return {
        "user": user,
        "auth": "password",
    }


@app.post("/api/signin")
def signin(
    payload: SigninRequest,
    database_path: Annotated[Path, Depends(get_database_path)],
):
    user = authenticate_user(
        database_path,
        email=payload.email,
        password=payload.password,
    )

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "user": user,
        "auth": "password",
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


@app.get("/api/users/{user_id}/documents")
def documents(
    user_id: int,
    database_path: Annotated[Path, Depends(get_database_path)],
):
    return {
        "documents": list_user_documents(database_path, user_id=user_id),
    }


@app.post("/api/documents")
def save_document(
    payload: CreateDocumentRequest,
    database_path: Annotated[Path, Depends(get_database_path)],
):
    document = create_document(
        database_path,
        user_id=payload.user_id,
        title=payload.title,
        document_type=payload.document_type,
        content=payload.content,
        values=payload.values,
    )

    return {
        "document": document,
    }


@app.get("/api/users/{user_id}/documents/{document_id}")
def document(
    user_id: int,
    document_id: int,
    database_path: Annotated[Path, Depends(get_database_path)],
):
    saved_document = get_user_document(
        database_path,
        user_id=user_id,
        document_id=document_id,
    )

    if saved_document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "document": saved_document,
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
