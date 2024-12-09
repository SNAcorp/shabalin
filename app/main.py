import random
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
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

@app.get("/puzzle", response_class=HTMLResponse)
async def index(request: Request):
    """
    Главная страница игры
    """
    return templates.TemplateResponse(
        "puzzle.html",
        {"request": request, "difficulty_levels": DIFFICULTY_LEVELS}
    )


DIFFICULTY_LEVELS = {
    'easy': {
        'image': 'epuzzle.jpg',
        'description': 'Легкий уровень'
    },
    'medium': {
        'image': 'puzzle.jpg',
        'description': 'Средний уровень'
    },
    'hard': {
        'image': 'hpuzzle.jpg',
        'description': 'Сложный уровень'
    }
}


class GameState(BaseModel):
    grid: list[int]
    difficulty: str


@app.get("/api/game/new")
async def new_game(difficulty: Optional[str] = 'easy'):
    """
    Создание новой игры
    Args:
        difficulty (str): Уровень сложности (easy, medium, hard)
    Returns:
        dict: Состояние игры с перемешанными тайлами
    """
    if difficulty not in DIFFICULTY_LEVELS:
        difficulty = 'easy'

    # Создаем сетку 9x6
    grid = list(range(54))  # 54 тайла (9x6)

    # Перемешиваем тайлы
    random.shuffle(grid)

    return {
        "grid": grid,
        "size": {"width": 9, "height": 6},
        "tileSize": 50,
        "imageSize": {"width": 450, "height": 300},
        "difficulty": difficulty,
        "image": DIFFICULTY_LEVELS[difficulty]['image']
    }


@app.post("/api/game/check")
async def check_solution(game_state: GameState):
    """
    Проверка решения пазла
    Args:
        game_state: Текущее состояние игры
    Returns:
        dict: Результат проверки
    """
    # Проверяем, соответствует ли текущее расположение правильному
    correct_grid = list(range(54))
    is_solved = game_state.grid == correct_grid

    return {
        "solved": is_solved,
        "difficulty": game_state.difficulty
    }