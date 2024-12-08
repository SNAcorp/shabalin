from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Подключение статики
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Настройка шаблонов
templates = Jinja2Templates(directory="app/templates")

@app.get("/manifest.json")
async def manifest():
    return {
        "name": "Todo List App",
        "short_name": "Todos",
        "start_url": "/tasks",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#4285f4",
        "icons": [
            {
                "src": "/static/icons/icon-192x192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "/static/icons/icon-512x512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    }

@app.get("/")
async def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/tasks")
async def read_index(request: Request):
    return templates.TemplateResponse("tasks.html", {"request": request})

@app.get("/mineswipper")
async def read_index(request: Request):
    return templates.TemplateResponse("mineswipper.html", {"request": request})

