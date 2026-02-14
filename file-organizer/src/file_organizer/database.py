"""
SQLite database layer — the brain of the file organizer system.

Provides full CRUD operations for FileRecords, MoveRecords, Corrections,
and supports full-text search via FTS5.
"""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime
from typing import Any

from .models import ClassificationResult, Correction, FileRecord, MoveRecord


class Database:
    """SQLite database with FTS5 full-text search."""

    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA foreign_keys=ON")
        self._create_tables()

    def _create_tables(self) -> None:
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_path TEXT UNIQUE NOT NULL,
                filename TEXT NOT NULL,
                extension TEXT DEFAULT '',
                file_size INTEGER DEFAULT 0,
                sha256 TEXT DEFAULT '',
                content_hash TEXT DEFAULT '',
                created_at TEXT DEFAULT '',
                modified_at TEXT DEFAULT '',
                accessed_at TEXT DEFAULT '',
                extracted_text TEXT DEFAULT '',
                extraction_method TEXT DEFAULT '',
                tags TEXT DEFAULT '',
                category TEXT DEFAULT '',
                subcategory TEXT DEFAULT '',
                entities TEXT DEFAULT '',
                document_type TEXT DEFAULT '',
                date_relevance TEXT DEFAULT '',
                status TEXT DEFAULT 'active',
                confidentiality TEXT DEFAULT 'general',
                summary TEXT DEFAULT '',
                source TEXT DEFAULT '',
                confidence REAL DEFAULT 0.0,
                classified_by TEXT DEFAULT '',
                classified_at TEXT DEFAULT '',
                needs_review INTEGER DEFAULT 0,
                new_path TEXT DEFAULT '',
                new_filename TEXT DEFAULT '',
                scanned_at TEXT DEFAULT '',
                last_rescanned_at TEXT DEFAULT ''
            );

            CREATE INDEX IF NOT EXISTS idx_files_sha256 ON files(sha256);
            CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
            CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
            CREATE INDEX IF NOT EXISTS idx_files_document_type ON files(document_type);
            CREATE INDEX IF NOT EXISTS idx_files_extension ON files(extension);
            CREATE INDEX IF NOT EXISTS idx_files_needs_review ON files(needs_review);
            CREATE INDEX IF NOT EXISTS idx_files_content_hash ON files(content_hash);

            CREATE TABLE IF NOT EXISTS moves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_record_id INTEGER,
                old_path TEXT NOT NULL,
                new_path TEXT NOT NULL,
                old_filename TEXT DEFAULT '',
                new_filename TEXT DEFAULT '',
                moved_at TEXT NOT NULL,
                reverted INTEGER DEFAULT 0,
                reverted_at TEXT DEFAULT '',
                FOREIGN KEY (file_record_id) REFERENCES files(id)
            );

            CREATE TABLE IF NOT EXISTS corrections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_record_id INTEGER,
                file_path TEXT NOT NULL,
                agent_decision TEXT DEFAULT '{}',
                user_decision TEXT DEFAULT '{}',
                corrected_at TEXT NOT NULL,
                feedback_note TEXT DEFAULT '',
                FOREIGN KEY (file_record_id) REFERENCES files(id)
            );

            CREATE TABLE IF NOT EXISTS scan_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at TEXT NOT NULL,
                completed_at TEXT DEFAULT '',
                directories TEXT DEFAULT '',
                total_files INTEGER DEFAULT 0,
                total_size INTEGER DEFAULT 0,
                profile_json TEXT DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS agent_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                files_processed INTEGER DEFAULT 0,
                files_correct INTEGER DEFAULT 0,
                files_corrected INTEGER DEFAULT 0,
                accuracy REAL DEFAULT 0.0
            );
        """)

        # FTS5 virtual table for full-text search
        try:
            self.conn.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
                    file_path,
                    filename,
                    extracted_text,
                    tags,
                    category,
                    subcategory,
                    entities,
                    document_type,
                    summary,
                    content='files',
                    content_rowid='id',
                    tokenize='porter unicode61'
                );
            """)
            # Triggers to keep FTS in sync
            self.conn.executescript("""
                CREATE TRIGGER IF NOT EXISTS files_ai AFTER INSERT ON files BEGIN
                    INSERT INTO files_fts(rowid, file_path, filename, extracted_text, tags,
                        category, subcategory, entities, document_type, summary)
                    VALUES (new.id, new.file_path, new.filename, new.extracted_text, new.tags,
                        new.category, new.subcategory, new.entities, new.document_type, new.summary);
                END;

                CREATE TRIGGER IF NOT EXISTS files_ad AFTER DELETE ON files BEGIN
                    INSERT INTO files_fts(files_fts, rowid, file_path, filename, extracted_text,
                        tags, category, subcategory, entities, document_type, summary)
                    VALUES ('delete', old.id, old.file_path, old.filename, old.extracted_text,
                        old.tags, old.category, old.subcategory, old.entities, old.document_type,
                        old.summary);
                END;

                CREATE TRIGGER IF NOT EXISTS files_au AFTER UPDATE ON files BEGIN
                    INSERT INTO files_fts(files_fts, rowid, file_path, filename, extracted_text,
                        tags, category, subcategory, entities, document_type, summary)
                    VALUES ('delete', old.id, old.file_path, old.filename, old.extracted_text,
                        old.tags, old.category, old.subcategory, old.entities, old.document_type,
                        old.summary);
                    INSERT INTO files_fts(rowid, file_path, filename, extracted_text, tags,
                        category, subcategory, entities, document_type, summary)
                    VALUES (new.id, new.file_path, new.filename, new.extracted_text, new.tags,
                        new.category, new.subcategory, new.entities, new.document_type, new.summary);
                END;
            """)
        except sqlite3.OperationalError:
            pass  # FTS5 triggers may already exist
        self.conn.commit()

    # ------------------------------------------------------------------ #
    # File CRUD
    # ------------------------------------------------------------------ #

    def upsert_file(self, record: FileRecord) -> int:
        """Insert or update a file record. Returns the row ID."""
        d = record.to_dict()
        d.pop("id", None)
        d["needs_review"] = 1 if d["needs_review"] else 0
        columns = ", ".join(d.keys())
        placeholders = ", ".join(["?"] * len(d))
        update_clause = ", ".join(f"{k}=excluded.{k}" for k in d if k != "file_path")
        sql = f"""
            INSERT INTO files ({columns}) VALUES ({placeholders})
            ON CONFLICT(file_path) DO UPDATE SET {update_clause}
        """
        cur = self.conn.execute(sql, list(d.values()))
        self.conn.commit()
        return cur.lastrowid or self._get_file_id(record.file_path)

    def get_file(self, file_path: str) -> FileRecord | None:
        """Get a file record by path."""
        row = self.conn.execute(
            "SELECT * FROM files WHERE file_path = ?", (file_path,)
        ).fetchone()
        if row:
            return FileRecord.from_dict(dict(row))
        return None

    def get_file_by_id(self, file_id: int) -> FileRecord | None:
        row = self.conn.execute(
            "SELECT * FROM files WHERE id = ?", (file_id,)
        ).fetchone()
        if row:
            return FileRecord.from_dict(dict(row))
        return None

    def get_all_files(self, limit: int = 0, offset: int = 0) -> list[FileRecord]:
        sql = "SELECT * FROM files ORDER BY modified_at DESC"
        if limit > 0:
            sql += f" LIMIT {limit} OFFSET {offset}"
        rows = self.conn.execute(sql).fetchall()
        return [FileRecord.from_dict(dict(r)) for r in rows]

    def get_files_needing_review(self) -> list[FileRecord]:
        rows = self.conn.execute(
            "SELECT * FROM files WHERE needs_review = 1 ORDER BY scanned_at DESC"
        ).fetchall()
        return [FileRecord.from_dict(dict(r)) for r in rows]

    def delete_file(self, file_path: str) -> None:
        self.conn.execute("DELETE FROM files WHERE file_path = ?", (file_path,))
        self.conn.commit()

    def _get_file_id(self, file_path: str) -> int:
        row = self.conn.execute(
            "SELECT id FROM files WHERE file_path = ?", (file_path,)
        ).fetchone()
        return row["id"] if row else 0

    def file_count(self) -> int:
        row = self.conn.execute("SELECT COUNT(*) as cnt FROM files").fetchone()
        return row["cnt"] if row else 0

    # ------------------------------------------------------------------ #
    # Search
    # ------------------------------------------------------------------ #

    def full_text_search(self, query: str, limit: int = 50) -> list[FileRecord]:
        """Full-text search across all indexed fields using FTS5."""
        rows = self.conn.execute(
            """
            SELECT f.* FROM files f
            JOIN files_fts fts ON f.id = fts.rowid
            WHERE files_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (query, limit),
        ).fetchall()
        return [FileRecord.from_dict(dict(r)) for r in rows]

    def search_by_tags(self, tags: list[str], match_all: bool = True) -> list[FileRecord]:
        """Search files that have all (or any) of the given tags."""
        if not tags:
            return []
        if match_all:
            conditions = " AND ".join(
                "tags LIKE ?" for _ in tags
            )
            params = [f"%{t}%" for t in tags]
        else:
            conditions = " OR ".join(
                "tags LIKE ?" for _ in tags
            )
            params = [f"%{t}%" for t in tags]
        rows = self.conn.execute(
            f"SELECT * FROM files WHERE {conditions} ORDER BY modified_at DESC",
            params,
        ).fetchall()
        return [FileRecord.from_dict(dict(r)) for r in rows]

    def search_by_category(self, category: str, subcategory: str = "") -> list[FileRecord]:
        sql = "SELECT * FROM files WHERE category = ?"
        params: list[str] = [category]
        if subcategory:
            sql += " AND subcategory = ?"
            params.append(subcategory)
        sql += " ORDER BY modified_at DESC"
        rows = self.conn.execute(sql, params).fetchall()
        return [FileRecord.from_dict(dict(r)) for r in rows]

    def search_by_entity(self, entity: str) -> list[FileRecord]:
        rows = self.conn.execute(
            "SELECT * FROM files WHERE entities LIKE ? ORDER BY modified_at DESC",
            (f"%{entity}%",),
        ).fetchall()
        return [FileRecord.from_dict(dict(r)) for r in rows]

    def search_by_status(self, status: str) -> list[FileRecord]:
        rows = self.conn.execute(
            "SELECT * FROM files WHERE status = ? ORDER BY modified_at DESC",
            (status,),
        ).fetchall()
        return [FileRecord.from_dict(dict(r)) for r in rows]

    def search_by_date_range(
        self, start_date: str, end_date: str, date_field: str = "date_relevance"
    ) -> list[FileRecord]:
        if date_field not in ("date_relevance", "created_at", "modified_at", "scanned_at"):
            date_field = "date_relevance"
        rows = self.conn.execute(
            f"SELECT * FROM files WHERE {date_field} BETWEEN ? AND ? ORDER BY {date_field} DESC",
            (start_date, end_date),
        ).fetchall()
        return [FileRecord.from_dict(dict(r)) for r in rows]

    def search_by_document_type(self, doc_type: str) -> list[FileRecord]:
        rows = self.conn.execute(
            "SELECT * FROM files WHERE document_type = ? ORDER BY modified_at DESC",
            (doc_type,),
        ).fetchall()
        return [FileRecord.from_dict(dict(r)) for r in rows]

    def search_advanced(
        self,
        query: str = "",
        tags: list[str] | None = None,
        category: str = "",
        subcategory: str = "",
        entity: str = "",
        document_type: str = "",
        status: str = "",
        date_start: str = "",
        date_end: str = "",
        extension: str = "",
        limit: int = 50,
    ) -> list[FileRecord]:
        """Combined search with multiple filter criteria."""
        conditions: list[str] = []
        params: list[Any] = []

        if query:
            # Use FTS
            conditions.append(
                "f.id IN (SELECT rowid FROM files_fts WHERE files_fts MATCH ?)"
            )
            params.append(query)
        if tags:
            for tag in tags:
                conditions.append("f.tags LIKE ?")
                params.append(f"%{tag}%")
        if category:
            conditions.append("f.category = ?")
            params.append(category)
        if subcategory:
            conditions.append("f.subcategory = ?")
            params.append(subcategory)
        if entity:
            conditions.append("f.entities LIKE ?")
            params.append(f"%{entity}%")
        if document_type:
            conditions.append("f.document_type = ?")
            params.append(document_type)
        if status:
            conditions.append("f.status = ?")
            params.append(status)
        if date_start:
            conditions.append("f.date_relevance >= ?")
            params.append(date_start)
        if date_end:
            conditions.append("f.date_relevance <= ?")
            params.append(date_end)
        if extension:
            conditions.append("f.extension = ?")
            params.append(extension.lower().lstrip("."))

        where = " AND ".join(conditions) if conditions else "1=1"
        sql = f"""
            SELECT f.* FROM files f
            WHERE {where}
            ORDER BY f.modified_at DESC
            LIMIT ?
        """
        params.append(limit)
        rows = self.conn.execute(sql, params).fetchall()
        return [FileRecord.from_dict(dict(r)) for r in rows]

    # ------------------------------------------------------------------ #
    # Duplicate detection
    # ------------------------------------------------------------------ #

    def find_duplicates_by_hash(self) -> dict[str, list[FileRecord]]:
        """Find files with identical SHA-256 hashes."""
        rows = self.conn.execute(
            """
            SELECT sha256 FROM files
            WHERE sha256 != ''
            GROUP BY sha256 HAVING COUNT(*) > 1
            """
        ).fetchall()
        dupes: dict[str, list[FileRecord]] = {}
        for row in rows:
            h = row["sha256"]
            files = self.conn.execute(
                "SELECT * FROM files WHERE sha256 = ?", (h,)
            ).fetchall()
            dupes[h] = [FileRecord.from_dict(dict(f)) for f in files]
        return dupes

    def find_near_duplicates(self) -> dict[str, list[FileRecord]]:
        """Find files with identical content hashes (extracted text)."""
        rows = self.conn.execute(
            """
            SELECT content_hash FROM files
            WHERE content_hash != ''
            GROUP BY content_hash HAVING COUNT(*) > 1
            """
        ).fetchall()
        dupes: dict[str, list[FileRecord]] = {}
        for row in rows:
            h = row["content_hash"]
            files = self.conn.execute(
                "SELECT * FROM files WHERE content_hash = ?", (h,)
            ).fetchall()
            dupes[h] = [FileRecord.from_dict(dict(f)) for f in files]
        return dupes

    # ------------------------------------------------------------------ #
    # Move records
    # ------------------------------------------------------------------ #

    def log_move(self, move: MoveRecord) -> int:
        cur = self.conn.execute(
            """
            INSERT INTO moves (file_record_id, old_path, new_path, old_filename,
                new_filename, moved_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                move.file_record_id,
                move.old_path,
                move.new_path,
                move.old_filename,
                move.new_filename,
                move.moved_at or datetime.now().isoformat(),
            ),
        )
        self.conn.commit()
        return cur.lastrowid or 0

    def get_moves(self, limit: int = 100) -> list[MoveRecord]:
        rows = self.conn.execute(
            "SELECT * FROM moves ORDER BY moved_at DESC LIMIT ?", (limit,)
        ).fetchall()
        result = []
        for r in rows:
            result.append(MoveRecord(
                id=r["id"],
                file_record_id=r["file_record_id"],
                old_path=r["old_path"],
                new_path=r["new_path"],
                old_filename=r["old_filename"],
                new_filename=r["new_filename"],
                moved_at=r["moved_at"],
                reverted=bool(r["reverted"]),
                reverted_at=r["reverted_at"],
            ))
        return result

    def revert_move(self, move_id: int) -> None:
        self.conn.execute(
            "UPDATE moves SET reverted = 1, reverted_at = ? WHERE id = ?",
            (datetime.now().isoformat(), move_id),
        )
        self.conn.commit()

    # ------------------------------------------------------------------ #
    # Corrections
    # ------------------------------------------------------------------ #

    def log_correction(self, correction: Correction) -> int:
        cur = self.conn.execute(
            """
            INSERT INTO corrections (file_record_id, file_path, agent_decision,
                user_decision, corrected_at, feedback_note)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                correction.file_record_id,
                correction.file_path,
                json.dumps(correction.agent_decision),
                json.dumps(correction.user_decision),
                correction.corrected_at or datetime.now().isoformat(),
                correction.feedback_note,
            ),
        )
        self.conn.commit()
        return cur.lastrowid or 0

    def get_recent_corrections(self, limit: int = 10) -> list[Correction]:
        rows = self.conn.execute(
            "SELECT * FROM corrections ORDER BY corrected_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        result = []
        for r in rows:
            result.append(Correction(
                id=r["id"],
                file_record_id=r["file_record_id"],
                file_path=r["file_path"],
                agent_decision=json.loads(r["agent_decision"]) if r["agent_decision"] else {},
                user_decision=json.loads(r["user_decision"]) if r["user_decision"] else {},
                corrected_at=r["corrected_at"],
                feedback_note=r["feedback_note"],
            ))
        return result

    # ------------------------------------------------------------------ #
    # Scan runs
    # ------------------------------------------------------------------ #

    def log_scan_start(self, directories: list[str]) -> int:
        cur = self.conn.execute(
            "INSERT INTO scan_runs (started_at, directories) VALUES (?, ?)",
            (datetime.now().isoformat(), json.dumps(directories)),
        )
        self.conn.commit()
        return cur.lastrowid or 0

    def log_scan_complete(
        self, scan_id: int, total_files: int, total_size: int, profile_json: str
    ) -> None:
        self.conn.execute(
            """
            UPDATE scan_runs
            SET completed_at = ?, total_files = ?, total_size = ?, profile_json = ?
            WHERE id = ?
            """,
            (datetime.now().isoformat(), total_files, total_size, profile_json, scan_id),
        )
        self.conn.commit()

    # ------------------------------------------------------------------ #
    # Agent metrics
    # ------------------------------------------------------------------ #

    def log_agent_metrics(
        self, files_processed: int, files_correct: int, files_corrected: int
    ) -> None:
        accuracy = (
            files_correct / files_processed * 100 if files_processed > 0 else 0.0
        )
        self.conn.execute(
            """
            INSERT INTO agent_metrics (date, files_processed, files_correct,
                files_corrected, accuracy)
            VALUES (?, ?, ?, ?, ?)
            """,
            (datetime.now().strftime("%Y-%m-%d"), files_processed, files_correct,
             files_corrected, accuracy),
        )
        self.conn.commit()

    def get_agent_accuracy(self, days: int = 30) -> list[dict[str, Any]]:
        rows = self.conn.execute(
            """
            SELECT * FROM agent_metrics
            ORDER BY date DESC LIMIT ?
            """,
            (days,),
        ).fetchall()
        return [dict(r) for r in rows]

    # ------------------------------------------------------------------ #
    # Statistics
    # ------------------------------------------------------------------ #

    def get_stats(self) -> dict[str, Any]:
        """Get summary statistics for the dashboard."""
        total = self.conn.execute("SELECT COUNT(*) as cnt FROM files").fetchone()["cnt"]
        by_cat = self.conn.execute(
            "SELECT category, COUNT(*) as cnt FROM files GROUP BY category ORDER BY cnt DESC"
        ).fetchall()
        by_ext = self.conn.execute(
            "SELECT extension, COUNT(*) as cnt FROM files GROUP BY extension ORDER BY cnt DESC LIMIT 20"
        ).fetchall()
        by_status = self.conn.execute(
            "SELECT status, COUNT(*) as cnt FROM files GROUP BY status"
        ).fetchall()
        review_count = self.conn.execute(
            "SELECT COUNT(*) as cnt FROM files WHERE needs_review = 1"
        ).fetchone()["cnt"]
        total_size = self.conn.execute(
            "SELECT COALESCE(SUM(file_size), 0) as total FROM files"
        ).fetchone()["total"]
        recent = self.conn.execute(
            "SELECT * FROM files ORDER BY scanned_at DESC LIMIT 10"
        ).fetchall()

        return {
            "total_files": total,
            "total_size": total_size,
            "by_category": {r["category"]: r["cnt"] for r in by_cat},
            "by_extension": {r["extension"]: r["cnt"] for r in by_ext},
            "by_status": {r["status"]: r["cnt"] for r in by_status},
            "review_count": review_count,
            "recent_files": [dict(r) for r in recent],
        }

    # ------------------------------------------------------------------ #
    # Utilities
    # ------------------------------------------------------------------ #

    def get_all_tags(self) -> list[tuple[str, int]]:
        """Get all tags with their counts."""
        rows = self.conn.execute("SELECT tags FROM files WHERE tags != ''").fetchall()
        tag_counts: dict[str, int] = {}
        for row in rows:
            for tag in row["tags"].split(","):
                tag = tag.strip()
                if tag:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
        return sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)

    def get_all_entities(self) -> list[tuple[str, int]]:
        rows = self.conn.execute(
            "SELECT entities FROM files WHERE entities != ''"
        ).fetchall()
        entity_counts: dict[str, int] = {}
        for row in rows:
            for entity in row["entities"].split(","):
                entity = entity.strip()
                if entity:
                    entity_counts[entity] = entity_counts.get(entity, 0) + 1
        return sorted(entity_counts.items(), key=lambda x: x[1], reverse=True)

    def get_recent_files(self, limit: int = 20) -> list[FileRecord]:
        rows = self.conn.execute(
            "SELECT * FROM files ORDER BY scanned_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [FileRecord.from_dict(dict(r)) for r in rows]

    def close(self) -> None:
        self.conn.close()
