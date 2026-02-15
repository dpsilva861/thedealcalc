"""
Core tests for the file organizer system.

Tests database, models, search, classification, taxonomy, and organizer.
"""

import json
import os
import sqlite3
import tempfile
from datetime import datetime
from pathlib import Path

import pytest

from file_organizer.config import Config
from file_organizer.database import Database
from file_organizer.models import (
    ClassificationResult,
    FileRecord,
    MoveRecord,
    ScanProfile,
    compute_sha256,
)
from file_organizer.search import SearchEngine
from file_organizer.taxonomy import TaxonomyEngine, TaxonomyNode


@pytest.fixture
def tmp_db(tmp_path):
    """Create a temporary database."""
    db_path = str(tmp_path / "test.db")
    db = Database(db_path)
    yield db
    db.close()


@pytest.fixture
def config(tmp_path):
    """Create a test config."""
    cfg = Config(
        db_path=str(tmp_path / "test.db"),
        organized_base=str(tmp_path / "organized"),
        review_dir=str(tmp_path / "review"),
    )
    return cfg


@pytest.fixture
def sample_record():
    """Create a sample file record."""
    return FileRecord(
        file_path="/test/docs/lease_24hour.pdf",
        filename="lease_24hour.pdf",
        extension="pdf",
        file_size=102400,
        sha256="abc123",
        created_at="2025-01-15T10:00:00",
        modified_at="2025-03-22T14:30:00",
        extracted_text="This lease agreement is between 24 Hour Fitness and the landlord...",
        tags=["lease", "24-hour-fitness", "2025"],
        category="Legal",
        subcategory="Leases",
        entities=["24 Hour Fitness"],
        document_type="Lease",
        date_relevance="2025-01-15",
        status="active",
        confidentiality="business-confidential",
        summary="Lease agreement for 24 Hour Fitness facility.",
        source="email-attachment",
        confidence=0.85,
        classified_by="rule",
        classified_at="2025-06-01T12:00:00",
        scanned_at="2025-06-01T12:00:00",
    )


# ------------------------------------------------------------------ #
# Model Tests
# ------------------------------------------------------------------ #

class TestFileRecord:
    def test_to_dict(self, sample_record):
        d = sample_record.to_dict()
        assert d["filename"] == "lease_24hour.pdf"
        assert d["category"] == "Legal"
        assert "lease" in d["tags"]

    def test_from_dict(self, sample_record):
        d = sample_record.to_dict()
        restored = FileRecord.from_dict(d)
        assert restored.filename == sample_record.filename
        assert restored.category == sample_record.category
        assert restored.tags == sample_record.tags

    def test_from_dict_string_tags(self):
        d = {"tags": "lease,contract,2025", "entities": "24 Hour Fitness"}
        record = FileRecord.from_dict(d)
        assert record.tags == ["lease", "contract", "2025"]
        assert record.entities == ["24 Hour Fitness"]


class TestClassificationResult:
    def test_round_trip(self):
        result = ClassificationResult(
            category="Legal",
            document_type="Lease",
            tags=["lease", "test"],
            confidence=0.9,
        )
        d = result.to_dict()
        restored = ClassificationResult.from_dict(d)
        assert restored.category == "Legal"
        assert restored.confidence == 0.9


class TestScanProfile:
    def test_to_dict(self):
        profile = ScanProfile(total_files=100, total_size_bytes=1048576)
        d = profile.to_dict()
        assert d["total_files"] == 100
        assert d["total_size_human"] == "1.0 MB"


# ------------------------------------------------------------------ #
# Database Tests
# ------------------------------------------------------------------ #

class TestDatabase:
    def test_upsert_and_get(self, tmp_db, sample_record):
        row_id = tmp_db.upsert_file(sample_record)
        assert row_id > 0

        retrieved = tmp_db.get_file(sample_record.file_path)
        assert retrieved is not None
        assert retrieved.filename == "lease_24hour.pdf"
        assert retrieved.category == "Legal"

    def test_upsert_updates(self, tmp_db, sample_record):
        tmp_db.upsert_file(sample_record)
        sample_record.category = "Finance"
        tmp_db.upsert_file(sample_record)

        retrieved = tmp_db.get_file(sample_record.file_path)
        assert retrieved.category == "Finance"

    def test_file_count(self, tmp_db, sample_record):
        assert tmp_db.file_count() == 0
        tmp_db.upsert_file(sample_record)
        assert tmp_db.file_count() == 1

    def test_full_text_search(self, tmp_db, sample_record):
        tmp_db.upsert_file(sample_record)
        results = tmp_db.full_text_search("lease")
        assert len(results) >= 1
        assert results[0].filename == "lease_24hour.pdf"

    def test_search_by_tags(self, tmp_db, sample_record):
        tmp_db.upsert_file(sample_record)
        results = tmp_db.search_by_tags(["lease"])
        assert len(results) == 1

    def test_search_by_category(self, tmp_db, sample_record):
        tmp_db.upsert_file(sample_record)
        results = tmp_db.search_by_category("Legal")
        assert len(results) == 1

    def test_search_by_entity(self, tmp_db, sample_record):
        tmp_db.upsert_file(sample_record)
        results = tmp_db.search_by_entity("24 Hour Fitness")
        assert len(results) == 1

    def test_search_by_status(self, tmp_db, sample_record):
        tmp_db.upsert_file(sample_record)
        results = tmp_db.search_by_status("active")
        assert len(results) == 1

    def test_find_duplicates(self, tmp_db, sample_record):
        tmp_db.upsert_file(sample_record)

        dup = FileRecord(
            file_path="/test/docs/lease_copy.pdf",
            filename="lease_copy.pdf",
            sha256="abc123",
        )
        tmp_db.upsert_file(dup)

        dupes = tmp_db.find_duplicates_by_hash()
        assert len(dupes) == 1
        assert len(dupes["abc123"]) == 2

    def test_move_log(self, tmp_db):
        move = MoveRecord(
            old_path="/old/file.pdf",
            new_path="/new/file.pdf",
            old_filename="file.pdf",
            new_filename="file.pdf",
        )
        move_id = tmp_db.log_move(move)
        assert move_id > 0

        moves = tmp_db.get_moves()
        assert len(moves) == 1

    def test_files_needing_review(self, tmp_db):
        record = FileRecord(
            file_path="/test/unknown.pdf",
            filename="unknown.pdf",
            needs_review=True,
        )
        tmp_db.upsert_file(record)

        review_files = tmp_db.get_files_needing_review()
        assert len(review_files) == 1

    def test_stats(self, tmp_db, sample_record):
        tmp_db.upsert_file(sample_record)
        stats = tmp_db.get_stats()
        assert stats["total_files"] == 1
        assert "Legal" in stats["by_category"]


# ------------------------------------------------------------------ #
# Search Engine Tests
# ------------------------------------------------------------------ #

class TestSearchEngine:
    def test_basic_search(self, tmp_db, sample_record):
        tmp_db.upsert_file(sample_record)
        engine = SearchEngine(tmp_db)
        results = engine.search("lease")
        assert len(results) >= 1

    def test_natural_language_search(self, tmp_db, sample_record):
        tmp_db.upsert_file(sample_record)
        engine = SearchEngine(tmp_db)
        results = engine.natural_language_search("all leases for 24 Hour Fitness")
        assert len(results) >= 1

    def test_filtered_search(self, tmp_db, sample_record):
        tmp_db.upsert_file(sample_record)
        engine = SearchEngine(tmp_db)
        results = engine.search("", category="Legal", status="active")
        assert len(results) >= 1


# ------------------------------------------------------------------ #
# Taxonomy Tests
# ------------------------------------------------------------------ #

class TestTaxonomy:
    def test_propose(self, config, tmp_db):
        engine = TaxonomyEngine(config, tmp_db)
        root = engine.propose()
        assert root.name
        assert len(root.children) > 0

        # Should have Business, Personal, Reference, _System
        child_names = [c.name for c in root.children]
        assert "Business" in child_names
        assert "Personal" in child_names

    def test_render_tree(self, config, tmp_db):
        engine = TaxonomyEngine(config, tmp_db)
        root = engine.propose()
        tree_str = engine.render_tree(root)
        assert "Business" in tree_str
        assert "Personal" in tree_str

    def test_create_directories(self, config, tmp_db, tmp_path):
        config.organized_base = str(tmp_path / "organized")
        engine = TaxonomyEngine(config, tmp_db)
        root = engine.propose()
        created = engine.create_directories(root)
        assert len(created) > 0
        assert os.path.isdir(str(tmp_path / "organized"))

    def test_node_to_dict(self):
        node = TaxonomyNode(name="Test", description="A test node")
        child = node.add_child("Child", "A child node")
        d = node.to_dict()
        assert d["name"] == "Test"
        assert len(d["children"]) == 1

    def test_naming_convention(self, config, tmp_db):
        engine = TaxonomyEngine(config, tmp_db)
        doc = engine.get_naming_convention_doc()
        assert "MMDDYYYY" in doc
        assert "underscore" in doc.lower() or "_" in doc


# ------------------------------------------------------------------ #
# Classifier Tests
# ------------------------------------------------------------------ #

class TestClassifier:
    def test_rule_based_classify_lease(self, config, tmp_db):
        from file_organizer.agent.classifier import Classifier

        classifier = Classifier(config, tmp_db)
        record = FileRecord(
            file_path="/test/docs/lease_24hour.pdf",
            filename="lease_24hour.pdf",
            extension="pdf",
            file_size=102400,
            extracted_text="This lease agreement is between 24 Hour Fitness and the landlord for the premises.",
            modified_at="2025-03-22T14:30:00",
        )
        tmp_db.upsert_file(record)
        result = classifier.classify(record)
        assert result.document_type == "Lease"
        assert result.category == "Legal"
        assert result.confidence > 0

    def test_rule_based_classify_invoice(self, config, tmp_db):
        from file_organizer.agent.classifier import Classifier

        classifier = Classifier(config, tmp_db)
        record = FileRecord(
            file_path="/test/docs/uber_invoice.pdf",
            filename="uber_invoice.pdf",
            extension="pdf",
            file_size=50000,
            extracted_text="Invoice #12345. Bill to: Company. Amount due: $150.00. Uber trip receipt.",
            modified_at="2025-06-01T10:00:00",
        )
        tmp_db.upsert_file(record)
        result = classifier.classify(record)
        assert result.document_type == "Invoice"
        assert result.confidence > 0

    def test_unclassified_file_skipped_by_organizer(self, config, tmp_db):
        """Verify that unclassified files are skipped by organizer (the original bug)."""
        from file_organizer.organizer import Organizer

        record = FileRecord(
            file_path="/test/docs/mystery.pdf",
            filename="mystery.pdf",
            extension="pdf",
            file_size=1024,
            # No category or document_type set
        )
        tmp_db.upsert_file(record)

        organizer = Organizer(config, tmp_db)
        moves = organizer.organize(dry_run=True)
        assert len(moves) == 0  # Confirms the original bug behavior

    def test_classified_file_organized(self, config, tmp_db):
        """Verify that classified files get organized."""
        from file_organizer.organizer import Organizer

        record = FileRecord(
            file_path="/test/docs/lease_24hour.pdf",
            filename="lease_24hour.pdf",
            extension="pdf",
            file_size=102400,
            category="Legal",
            subcategory="Leases",
            document_type="Lease",
            entities=["24 Hour Fitness"],
            modified_at="2025-03-22T14:30:00",
        )
        tmp_db.upsert_file(record)

        organizer = Organizer(config, tmp_db)
        moves = organizer.organize(dry_run=True)
        assert len(moves) == 1
        assert "24-Hour-Fitness" in moves[0].new_path or "24" in moves[0].new_path

    def test_classify_then_organize_pipeline(self, config, tmp_db):
        """Test the full classify-then-organize pipeline (the fix)."""
        from file_organizer.agent.classifier import Classifier
        from file_organizer.organizer import Organizer

        # Insert an unclassified file with content that can be classified
        record = FileRecord(
            file_path="/test/docs/marriott_lease.pdf",
            filename="marriott_lease.pdf",
            extension="pdf",
            file_size=102400,
            extracted_text="This lease agreement is between Marriott International and the landlord.",
            modified_at="2025-03-22T14:30:00",
        )
        tmp_db.upsert_file(record)

        # Before classification, organize should yield 0 moves
        organizer = Organizer(config, tmp_db)
        moves = organizer.organize(dry_run=True)
        assert len(moves) == 0

        # Classify the file
        classifier = Classifier(config, tmp_db)
        classifier.classify(record)

        # After classification, organize should yield moves
        moves = organizer.organize(dry_run=True)
        assert len(moves) == 1
        assert "Marriott" in moves[0].new_path
