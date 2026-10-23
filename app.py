"""
app.py
------
Main Flask application.
Defines all routes (pages + API endpoints).
Run with:  python app.py
"""

from flask import Flask, request, jsonify, redirect, render_template, abort
from database import init_db
import models

app = Flask(__name__)


# ──────────────────────────────────────────
# Database Initialization
# ──────────────────────────────────────────

# Called once when the app starts — creates the table if it doesn't exist
with app.app_context():
    init_db()


# ──────────────────────────────────────────
# Page Routes (return HTML)
# ──────────────────────────────────────────

@app.route("/")
def index():
    """Home page — contains the URL shortening form."""
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    """Dashboard page — lists all shortened URLs with stats."""
    return render_template("dashboard.html")


# ──────────────────────────────────────────
# API Routes (return JSON)
# ──────────────────────────────────────────

@app.route("/api/shorten", methods=["POST"])
def api_shorten():
    """
    POST /api/shorten
    Body: { "url": "https://example.com/very/long/url" }
    Returns: { "short_code": "aB3xYz", "short_url": "http://localhost:5000/aB3xYz", ... }
    """
    data = request.get_json()

    # Validate input
    if not data or not data.get("url"):
        return jsonify({"error": "A 'url' field is required."}), 400

    original_url = data["url"].strip()

    # Basic URL validation — must start with http:// or https://
    if not original_url.startswith(("http://", "https://")):
        return jsonify({"error": "URL must start with http:// or https://"}), 400

    # Create the short URL record in the database
    row = models.create_short_url(original_url)

    # Build the full short URL using the current request's host
    short_url = request.host_url.rstrip("/") + "/" + row["short_code"]

    return jsonify({
        "id":           row["id"],
        "original_url": row["original_url"],
        "short_code":   row["short_code"],
        "short_url":    short_url,
        "clicks":       row["clicks"],
        "created_at":   row["created_at"],
    }), 201


@app.route("/api/links", methods=["GET"])
def api_get_links():
    """
    GET /api/links
    Returns all shortened URLs as a JSON array, newest first.
    """
    all_urls = models.get_all_urls()

    # Attach the full short_url to each record
    result = []
    for row in all_urls:
        row["short_url"] = request.host_url.rstrip("/") + "/" + row["short_code"]
        result.append(row)

    return jsonify(result), 200


@app.route("/api/links/<int:url_id>", methods=["DELETE"])
def api_delete_link(url_id):
    """
    DELETE /api/links/<id>
    Deletes the link with the given ID.
    Returns 404 if the ID doesn't exist.
    """
    deleted = models.delete_url(url_id)
    if not deleted:
        return jsonify({"error": f"No link found with id {url_id}"}), 404
    return jsonify({"success": True, "deleted_id": url_id}), 200


# ──────────────────────────────────────────
# Redirect Route — MUST be last!
# Matches /<short_code> and redirects to the original URL.
# Placed last so it doesn't shadow /api/* or /dashboard.
# ──────────────────────────────────────────

@app.route("/<short_code>")
def redirect_to_original(short_code):
    """
    GET /<short_code>
    Looks up the short code, increments its click counter,
    then issues an HTTP 302 redirect to the original URL.
    """
    row = models.get_url_by_code(short_code)
    if not row:
        abort(404)

    models.increment_clicks(short_code)
    return redirect(row["original_url"], code=302)


# ──────────────────────────────────────────
# Custom 404 Error Page
# ──────────────────────────────────────────

@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


# ──────────────────────────────────────────
# Entry Point
# ──────────────────────────────────────────

if __name__ == "__main__":
    # debug=True enables auto-reload when you save a file
    app.run(debug=True, port=5000)
