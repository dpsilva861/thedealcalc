"""
Phase 6 — Lightweight Web Dashboard (Flask).

Provides:
- Browse files by tags, category, entity, or date
- Search across everything with natural language
- Stats: file counts by category, recent files, storage usage
- Review and bulk-edit tags/categories
- Launch/open any file directly from the dashboard
"""

from __future__ import annotations

import json
import os
from typing import Any

from flask import Flask, jsonify, redirect, render_template, request, url_for

from ..config import Config
from ..database import Database
from ..models import FileRecord
from ..search import SearchEngine

# Template and static file directories
_DIR = os.path.dirname(os.path.abspath(__file__))
_TEMPLATES = os.path.join(_DIR, "templates")
_STATIC = os.path.join(_DIR, "static")


def create_app(config: Config | None = None) -> Flask:
    """Create and configure the Flask dashboard application."""
    config = config or Config.load()
    db = Database(config.db_path)
    search_engine = SearchEngine(db)

    app = Flask(
        __name__,
        template_folder=_TEMPLATES,
        static_folder=_STATIC,
    )
    app.config["SECRET_KEY"] = "file-organizer-dashboard-local"

    # ------------------------------------------------------------------ #
    # Routes
    # ------------------------------------------------------------------ #

    @app.route("/")
    def index():
        """Dashboard home — shows stats and recent files."""
        stats = db.get_stats()
        recent = db.get_recent_files(limit=20)
        review_files = db.get_files_needing_review()
        all_tags = db.get_all_tags()[:20]
        accuracy = db.get_agent_accuracy(days=30)
        return render_template(
            "index.html",
            stats=stats,
            recent=recent,
            review_files=review_files,
            tags=all_tags,
            accuracy=accuracy,
        )

    @app.route("/search")
    def search():
        """Search page with natural language and filtered search."""
        query = request.args.get("q", "")
        tags = request.args.get("tags", "")
        category = request.args.get("category", "")
        entity = request.args.get("entity", "")
        doc_type = request.args.get("type", "")
        status = request.args.get("status", "")
        date_start = request.args.get("date_start", "")
        date_end = request.args.get("date_end", "")

        results = []
        if query or tags or category or entity or doc_type or status:
            if query and not any([tags, category, entity, doc_type, status]):
                results = search_engine.natural_language_search(query)
            else:
                results = search_engine.search(
                    query,
                    tags=tags,
                    category=category,
                    entity=entity,
                    document_type=doc_type,
                    status=status,
                    date_start=date_start,
                    date_end=date_end,
                )

        all_tags = db.get_all_tags()[:30]
        categories = list(config.categories.keys())
        return render_template(
            "search.html",
            results=results,
            query=query,
            tags_filter=tags,
            category_filter=category,
            entity_filter=entity,
            type_filter=doc_type,
            status_filter=status,
            all_tags=all_tags,
            categories=categories,
            result_count=len(results),
        )

    @app.route("/browse")
    def browse():
        """Browse files by various facets."""
        view = request.args.get("view", "category")  # category, tags, entity, date
        stats = db.get_stats()
        files = []

        if view == "category":
            selected = request.args.get("selected", "")
            if selected:
                files = db.search_by_category(selected)
        elif view == "tags":
            selected = request.args.get("selected", "")
            if selected:
                files = db.search_by_tags([selected])
        elif view == "entity":
            selected = request.args.get("selected", "")
            if selected:
                files = db.search_by_entity(selected)
        elif view == "status":
            selected = request.args.get("selected", "")
            if selected:
                files = db.search_by_status(selected)

        all_tags = db.get_all_tags()[:50]
        all_entities = db.get_all_entities()[:50]
        categories = list(config.categories.keys())
        return render_template(
            "browse.html",
            view=view,
            files=files,
            stats=stats,
            all_tags=all_tags,
            all_entities=all_entities,
            categories=categories,
            selected=request.args.get("selected", ""),
        )

    @app.route("/review")
    def review():
        """Review queue — files needing manual classification."""
        files = db.get_files_needing_review()
        categories = list(config.categories.keys())
        doc_types = config.document_types
        return render_template(
            "review.html",
            files=files,
            categories=categories,
            doc_types=doc_types,
            brands=config.brands,
        )

    @app.route("/api/file/<int:file_id>", methods=["GET"])
    def api_get_file(file_id: int):
        """API: Get file details."""
        record = db.get_file_by_id(file_id)
        if not record:
            return jsonify({"error": "File not found"}), 404
        return jsonify(record.to_dict())

    @app.route("/api/file/<int:file_id>", methods=["PUT"])
    def api_update_file(file_id: int):
        """API: Update file metadata (for review edits)."""
        record = db.get_file_by_id(file_id)
        if not record:
            return jsonify({"error": "File not found"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Track correction if classified by agent
        if record.classified_by in ("rule", "llm"):
            from ..agent.classifier import Classifier
            classifier = Classifier(config, db)
            classifier.log_correction(record, data, data.get("feedback_note", ""))

        # Apply updates
        for key in ("tags", "category", "subcategory", "entities", "document_type",
                     "status", "confidentiality", "summary", "source", "date_relevance"):
            if key in data:
                value = data[key]
                if key in ("tags", "entities") and isinstance(value, str):
                    value = [v.strip() for v in value.split(",") if v.strip()]
                setattr(record, key, value)

        record.needs_review = False
        record.classified_by = "manual"
        db.upsert_file(record)

        return jsonify({"status": "updated", "id": file_id})

    @app.route("/api/file/<int:file_id>/open", methods=["POST"])
    def api_open_file(file_id: int):
        """API: Open a file with the default application."""
        record = db.get_file_by_id(file_id)
        if not record:
            return jsonify({"error": "File not found"}), 404
        if os.path.exists(record.file_path):
            try:
                os.startfile(record.file_path)  # type: ignore[attr-defined]
                return jsonify({"status": "opened"})
            except AttributeError:
                # Non-Windows
                import subprocess
                subprocess.Popen(["xdg-open", record.file_path])
                return jsonify({"status": "opened"})
        return jsonify({"error": "File not found on disk"}), 404

    @app.route("/api/stats")
    def api_stats():
        """API: Get dashboard statistics."""
        return jsonify(db.get_stats())

    @app.route("/api/search")
    def api_search():
        """API: Search endpoint for programmatic access."""
        query = request.args.get("q", "")
        results = search_engine.natural_language_search(query)
        return jsonify({
            "query": query,
            "count": len(results),
            "results": [r.to_dict() for r in results],
        })

    @app.route("/api/tags")
    def api_tags():
        """API: Get all tags with counts."""
        return jsonify(db.get_all_tags())

    @app.route("/api/duplicates")
    def api_duplicates():
        """API: Get duplicate files."""
        dupes = db.find_duplicates_by_hash()
        result = {}
        for hash_val, files in dupes.items():
            result[hash_val] = [f.to_dict() for f in files]
        return jsonify(result)

    return app


def run_dashboard(config: Config | None = None) -> None:
    """Run the dashboard web server."""
    config = config or Config.load()
    app = create_app(config)
    app.run(
        host=config.dashboard_host,
        port=config.dashboard_port,
        debug=False,
    )
