# ⚡ SnapLink — URL Shortener

A fast, clean URL shortener built with **Python Flask**, **SQLite**, and **vanilla HTML/CSS/JS**.  
Designed as a full-stack portfolio project demonstrating REST API design, database management, and modern frontend techniques.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.1.2-black?style=flat-square&logo=flask)
![SQLite](https://img.shields.io/badge/SQLite-embedded-lightblue?style=flat-square&logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

- 🔗 **Shorten any URL** — paste a long link, get a clean 6-character short code
- 📊 **Click analytics** — tracks how many times each link is visited
- 🗂️ **Dashboard** — view, manage, and delete all your links in one place
- 📋 **Copy to clipboard** — one-click copy with toast notification feedback
- 🌑 **Dark glassmorphism UI** — premium dark theme with animated gradients
- 📱 **Responsive** — works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+, Flask 3.1.2 |
| Database | SQLite (via Python's built-in `sqlite3`) |
| Frontend | HTML5, Vanilla CSS, Vanilla JavaScript |
| Fonts | Google Fonts — Inter |

---

## 📁 Project Structure

```
url-shortener/
├── app.py              ← Flask app: all routes (pages + REST API)
├── database.py         ← SQLite connection + schema initialization
├── models.py           ← All SQL query functions (CRUD)
├── requirements.txt    ← Python dependencies
│
├── static/
│   ├── css/style.css   ← Dark glassmorphism stylesheet
│   └── js/main.js      ← Frontend: fetch, copy, dashboard, toasts
│
└── templates/
    ├── base.html        ← Shared layout (navbar, fonts, toast)
    ├── index.html       ← Home page + shorten form
    ├── dashboard.html   ← Links table + stats
    └── 404.html         ← Custom 404 error page
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/url-shortener.git
cd url-shortener
```

### 2. Create and activate a virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the app

```bash
python app.py
```

### 5. Open in your browser

```
http://127.0.0.1:5000
```

> The SQLite database (`shortener.db`) is created automatically on first run. No setup needed.

---

## 🔌 API Reference

All API endpoints return JSON.

### `POST /api/shorten`
Shorten a URL.

**Request body:**
```json
{ "url": "https://example.com/very/long/path" }
```

**Response `201`:**
```json
{
  "id": 1,
  "original_url": "https://example.com/very/long/path",
  "short_code": "aB3xYz",
  "short_url": "http://localhost:5000/aB3xYz",
  "clicks": 0,
  "created_at": "2026-10-23 16:00:00"
}
```

---

### `GET /api/links`
Get all shortened links.

**Response `200`:** Array of link objects (newest first).

---

### `DELETE /api/links/<id>`
Delete a link by ID.

**Response `200`:**
```json
{ "success": true, "deleted_id": 1 }
```

**Response `404`:** If the ID doesn't exist.

---

### `GET /<short_code>`
Redirect to the original URL (HTTP 302). Also increments the click counter.

---

## 🗄️ Database Schema

```sql
CREATE TABLE urls (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT    NOT NULL,
    short_code   TEXT    NOT NULL UNIQUE,
    clicks       INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

---

## 💡 Key Design Decisions

- **`models.py` is separate from `app.py`** — follows the Separation of Concerns principle; SQL logic is isolated from routing logic.
- **Short code collision detection** — `create_unique_short_code()` loops until it finds a code not already in the database (62⁶ ≈ 56 billion combinations).
- **Redirect route placed last** — `/<short_code>` is defined after all `/api/*` routes to prevent shadowing.
- **`row_factory = sqlite3.Row`** — rows behave like dicts (`row["column_name"]`), making the code more readable.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
