"""The Forge - main FastAPI application."""
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse

from app.core.config import settings
from app.core.errors import forge_exception_handler, generic_exception_handler, ForgeError
from app.models.base import init_db
from app.api.routes import users, trees, skills, activities, obsidian, stats
from app.utils.seed import seed_default_tree


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from app.models.base import SessionLocal
    db = SessionLocal()
    try:
        seed_default_tree(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
)

app.add_exception_handler(ForgeError, forge_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes under /api prefix
app.include_router(users.router, prefix="/api")
app.include_router(trees.router, prefix="/api")
app.include_router(skills.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(obsidian.router, prefix="/api")
app.include_router(stats.router, prefix="/api")

# Health check
@app.get("/health")
def health():
    return {"status": "healthy"}

# Frontend static export directory
frontend_dir = Path(__file__).parent.parent.parent / "frontend" / "dist"


def serve_html(name: str):
    file_path = frontend_dir / f"{name}.html"
    if file_path.exists():
        return FileResponse(str(file_path))
    return HTMLResponse("Page not found", status_code=404)


# SPA page routes (clean URLs)
@app.get("/", response_class=HTMLResponse)
def root():
    return serve_html("index")


@app.get("/obsidian", response_class=HTMLResponse)
def obsidian_page():
    return serve_html("obsidian")


@app.get("/activities", response_class=HTMLResponse)
def activities_page():
    return serve_html("activities")


@app.get("/login", response_class=HTMLResponse)
def login_page():
    return serve_html("login")


@app.get("/tree/{tree_id}", response_class=HTMLResponse)
def tree_page(tree_id: int):
    file_path = frontend_dir / "tree" / "[id].html"
    if file_path.exists():
        return FileResponse(str(file_path))
    return HTMLResponse("Page not found", status_code=404)


# Serve static assets (_next chunks, css, js)
if frontend_dir.exists():
    app.mount("/_next", StaticFiles(directory=str(frontend_dir / "_next")), name="next_assets")
