"""
Classification Pipeline — combines rule-based and LLM classification.

1. First attempts rule-based classification (fast, no LLM needed)
2. Falls back to LLM if rules are insufficient or confidence is low
3. Routes low-confidence results to the review queue
"""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime
from typing import Any

from ..config import Config
from ..database import Database
from ..models import ClassificationResult, Correction, FileRecord
from .llm_client import OllamaClient

logger = logging.getLogger(__name__)


class Classifier:
    """Hybrid rule-based + LLM classification pipeline."""

    def __init__(self, config: Config, db: Database) -> None:
        self.config = config
        self.db = db
        self.llm = OllamaClient(config, db)
        self._llm_available: bool | None = None

    def classify(self, record: FileRecord) -> ClassificationResult:
        """
        Classify a file using the hybrid pipeline.

        1. Try rule-based classification
        2. If confidence < threshold, try LLM
        3. If LLM confidence < threshold, mark for review
        """
        # Step 1: Rule-based
        result = self._rule_based_classify(record)

        if result.confidence >= self.config.agent_confidence_threshold:
            result.reasoning = f"Rule-based: {result.reasoning}"
            self._apply_classification(record, result, "rule")
            return result

        # Step 2: LLM-based
        if self._check_llm():
            llm_result = self.llm.classify(record)
            if llm_result.confidence > result.confidence:
                result = llm_result
            result.reasoning = f"LLM: {result.reasoning}"
            classified_by = "llm"
        else:
            classified_by = "rule"

        # Step 3: Check confidence threshold
        if result.confidence < self.config.agent_confidence_threshold:
            record.needs_review = True
            logger.info(
                "Low confidence (%.2f) for %s — sending to review",
                result.confidence,
                record.filename,
            )

        self._apply_classification(record, result, classified_by)
        return result

    def _apply_classification(
        self, record: FileRecord, result: ClassificationResult, classified_by: str
    ) -> None:
        """Apply classification result to the file record."""
        record.tags = result.tags
        record.category = result.category
        record.subcategory = result.subcategory
        record.entities = result.entities
        record.document_type = result.document_type
        record.date_relevance = result.date_relevance
        record.status = result.status
        record.confidentiality = result.confidentiality
        record.summary = result.summary
        record.source = result.source
        record.confidence = result.confidence
        record.classified_by = classified_by
        record.classified_at = datetime.now().isoformat()
        self.db.upsert_file(record)

    def _check_llm(self) -> bool:
        """Check if LLM is available (cached)."""
        if self._llm_available is None:
            self._llm_available = self.llm.check_health()
        return self._llm_available

    def _rule_based_classify(self, record: FileRecord) -> ClassificationResult:
        """
        Rule-based classification using patterns from the V1 organizer.

        Analyzes filename and content for known patterns.
        """
        result = ClassificationResult()
        text_lower = (record.extracted_text[:3000] + " " + record.filename).lower()
        filename_lower = record.filename.lower()
        confidence_factors: list[float] = []

        # --- Detect Company/Brand ---
        detected_brand = ""
        for brand in self.config.brands:
            brand_lower = brand.lower()
            # Check filename and content
            if brand_lower in filename_lower or brand_lower in text_lower:
                detected_brand = brand
                result.entities.append(brand)
                confidence_factors.append(0.3)
                break
            # Check without spaces (e.g., "24hourfitness")
            brand_nospace = brand_lower.replace(" ", "")
            if brand_nospace in filename_lower.replace(" ", "").replace("-", "").replace("_", ""):
                detected_brand = brand
                result.entities.append(brand)
                confidence_factors.append(0.25)
                break

        # --- Detect Document Type ---
        doc_type_patterns: dict[str, list[str]] = {
            "Invoice": [r"invoice", r"inv[\s_#-]\d", r"bill\s+to", r"amount\s+due"],
            "Receipt": [r"receipt", r"payment\s+received", r"transaction\s+id"],
            "Statement": [r"statement", r"account\s+summary", r"balance"],
            "Lease": [r"lease", r"tenant", r"landlord", r"rent\s+commencement",
                      r"premises", r"lessor", r"lessee"],
            "Contract": [r"contract", r"(?<!lease\s)agreement", r"terms\s+and\s+conditions"],
            "Tax-Form": [r"w-?2\b", r"\b1099\b", r"k-?1\b", r"form\s+\d{3,4}"],
            "Tax-Return": [r"tax\s+return", r"form\s+1040", r"schedule\s+[a-e]"],
            "Insurance": [r"insurance", r"policy\s+number", r"coverage", r"premium"],
            "Legal": [r"attorney", r"law\s+firm", r"legal\s+notice", r"litigation"],
            "Report": [r"report", r"analysis", r"findings", r"executive\s+summary"],
            "Proposal": [r"proposal", r"scope\s+of\s+work", r"quotation"],
            "Letter": [r"dear\s+\w", r"sincerely", r"regards", r"to\s+whom"],
            "Financial-Model": [r"pro\s*forma", r"financial\s+model", r"projection",
                               r"underwriting", r"cash\s+flow\s+analysis"],
            "Memo": [r"\bmemo\b", r"memorandum", r"internal\s+memo"],
            "Amendment": [r"amendment", r"first\s+amendment", r"lease\s+amendment"],
            "Appraisal": [r"appraisal", r"appraised\s+value", r"market\s+value"],
            "Inspection-Report": [r"inspection", r"condition\s+report", r"property\s+condition"],
            "Rent-Roll": [r"rent\s+roll", r"tenant\s+roster", r"unit\s+mix"],
            "Bank-Statement": [r"bank\s+statement", r"checking\s+account", r"savings\s+account"],
            "Closing-Document": [r"closing", r"settlement\s+statement", r"hud-?1"],
            "Loan-Document": [r"loan", r"promissory\s+note", r"mortgage", r"term\s+sheet"],
            "Operating-Agreement": [r"operating\s+agreement", r"llc\s+agreement"],
            "Budget": [r"budget", r"annual\s+budget", r"operating\s+budget"],
            "Presentation": [r"presentation", r"slide", r"deck"],
            "Photo": [],  # Detected by extension
            "Email": [r"from:", r"to:", r"subject:", r"sent:"],
        }

        # Extension-based type detection
        ext = record.extension.lower()
        ext_type_map = {
            "jpg": "Photo", "jpeg": "Photo", "png": "Photo",
            "gif": "Photo", "bmp": "Photo", "tiff": "Photo",
            "ppt": "Presentation", "pptx": "Presentation",
            "eml": "Email", "msg": "Email",
        }
        if ext in ext_type_map and not result.document_type:
            result.document_type = ext_type_map[ext]
            confidence_factors.append(0.2)

        # Pattern-based type detection
        for doc_type, patterns in doc_type_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    result.document_type = doc_type
                    confidence_factors.append(0.3)
                    break
            if result.document_type:
                break

        # --- Detect Category ---
        if result.document_type:
            category_map = {
                "Invoice": ("Finance", "Invoices"),
                "Receipt": ("Finance", "Receipts"),
                "Statement": ("Finance", "Statements"),
                "Bank-Statement": ("Finance", "Bank-Statements"),
                "Financial-Model": ("Finance", "Financial-Models"),
                "Budget": ("Finance", "Budgets"),
                "Pro-Forma": ("Finance", "Pro-Formas"),
                "Contract": ("Legal", "Contracts"),
                "Lease": ("Legal", "Leases"),
                "Amendment": ("Legal", "Leases"),
                "Operating-Agreement": ("Legal", "Operating-Agreements"),
                "Legal": ("Legal", ""),
                "Appraisal": ("Deals", "Appraisals"),
                "Inspection-Report": ("Deals", "Inspections"),
                "Closing-Document": ("Deals", "Closing-Documents"),
                "Loan-Document": ("Deals", "Loan-Documents"),
                "Tax-Form": ("Tax", ""),
                "Tax-Return": ("Tax", "Returns"),
                "Insurance": ("Insurance", "Policies"),
                "Report": ("Reports", ""),
                "Presentation": ("Reports", "Presentations"),
                "Proposal": ("Reports", ""),
                "Letter": ("Correspondence", "Letters"),
                "Memo": ("Correspondence", "Memos"),
                "Email": ("Correspondence", "Emails"),
                "Rent-Roll": ("Property-Ops", "Rent-Rolls"),
                "Photo": ("", "Photos"),
            }
            if result.document_type in category_map:
                cat, subcat = category_map[result.document_type]
                result.category = cat
                result.subcategory = subcat
                confidence_factors.append(0.2)

        # --- Detect Personal vs Business ---
        personal_indicators = {
            "personal", "family", "medical", "health", "school",
            "vacation", "recipe", "birthday", "wedding",
        }
        if any(ind in text_lower for ind in personal_indicators):
            result.confidentiality = "personal-private"
            if not result.category:
                result.category = "Personal"
            confidence_factors.append(0.1)
        elif detected_brand and detected_brand != "Personal (Silva)":
            result.confidentiality = "business-confidential"
            confidence_factors.append(0.1)

        # --- Generate Tags ---
        result.tags = self._generate_tags(record, result, detected_brand)

        # --- Generate Summary ---
        if record.extracted_text:
            # Use first 200 chars as rough summary
            text = record.extracted_text[:200].strip()
            text = re.sub(r"\s+", " ", text)
            result.summary = text[:150] + "..." if len(text) > 150 else text

        # --- Detect Date Relevance ---
        result.date_relevance = self._detect_date_relevance(record)

        # --- Source Detection ---
        result.source = self._detect_source(record)

        # --- Compute Confidence ---
        result.confidence = min(sum(confidence_factors), 1.0)
        result.reasoning = (
            f"Brand: {detected_brand or 'none'}, "
            f"DocType: {result.document_type or 'none'}, "
            f"Category: {result.category or 'none'}"
        )

        return result

    def _generate_tags(
        self, record: FileRecord, result: ClassificationResult, brand: str
    ) -> list[str]:
        """Generate descriptive tags for the file."""
        tags: list[str] = []

        # Add brand as tag
        if brand:
            tags.append(brand.lower().replace(" ", "-"))

        # Add document type as tag
        if result.document_type:
            tags.append(result.document_type.lower())

        # Add category as tag
        if result.category:
            tags.append(result.category.lower())

        # Add extension as tag
        if record.extension:
            tags.append(record.extension.lower())

        # Add year as tag
        date_str = record.modified_at or record.created_at
        if date_str and len(date_str) >= 4:
            tags.append(date_str[:4])

        # Detect specific CRE terms
        text_lower = record.extracted_text[:2000].lower() if record.extracted_text else ""
        cre_tags = {
            "ti-allowance": [r"ti\s+allowance", r"tenant\s+improvement"],
            "nnn": [r"\bnnn\b", r"triple\s+net"],
            "cam": [r"\bcam\b", r"common\s+area\s+maintenance"],
            "noi": [r"\bnoi\b", r"net\s+operating\s+income"],
            "cap-rate": [r"cap\s+rate", r"capitalization\s+rate"],
        }
        for tag, patterns in cre_tags.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    tags.append(tag)
                    break

        # Detect location tags from content
        location_patterns = [
            (r"aliso\s+viejo", "aliso-viejo"),
            (r"irvine", "irvine"),
            (r"los\s+angeles", "los-angeles"),
            (r"san\s+diego", "san-diego"),
            (r"orange\s+county", "orange-county"),
        ]
        for pattern, tag in location_patterns:
            if re.search(pattern, text_lower):
                tags.append(tag)

        # Quarter tag
        date_str = result.date_relevance or record.modified_at
        if date_str and len(date_str) >= 7:
            try:
                month = int(date_str[5:7])
                quarter = (month - 1) // 3 + 1
                year = date_str[:4]
                tags.append(f"q{quarter}-{year}")
            except (ValueError, IndexError):
                pass

        return list(dict.fromkeys(tags))  # Deduplicate preserving order

    def _detect_date_relevance(self, record: FileRecord) -> str:
        """Detect the content-relevant date from text."""
        text = record.extracted_text[:2000] if record.extracted_text else ""

        # Try common date patterns in content
        patterns = [
            # MM/DD/YYYY
            r"(\d{1,2})/(\d{1,2})/(\d{4})",
            # Month DD, YYYY
            r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})",
            # YYYY-MM-DD
            r"(\d{4})-(\d{2})-(\d{2})",
        ]

        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                groups = match.groups()
                try:
                    if len(groups) == 3 and groups[0].isdigit() and len(groups[2]) == 4:
                        # MM/DD/YYYY
                        return f"{groups[2]}-{int(groups[0]):02d}-{int(groups[1]):02d}"
                    elif len(groups) == 3 and not groups[0].isdigit():
                        # Month DD, YYYY
                        months = {
                            "january": 1, "february": 2, "march": 3, "april": 4,
                            "may": 5, "june": 6, "july": 7, "august": 8,
                            "september": 9, "october": 10, "november": 11, "december": 12,
                        }
                        m = months.get(groups[0].lower(), 0)
                        if m:
                            return f"{groups[2]}-{m:02d}-{int(groups[1]):02d}"
                    elif len(groups[0]) == 4:
                        # YYYY-MM-DD
                        return f"{groups[0]}-{groups[1]}-{groups[2]}"
                except (ValueError, IndexError):
                    pass

        # Fallback to file modified date
        return record.modified_at[:10] if record.modified_at else ""

    def _detect_source(self, record: FileRecord) -> str:
        """Detect the likely source of the file."""
        path_lower = record.file_path.lower()
        filename_lower = record.filename.lower()

        if "download" in path_lower:
            return "download"
        if "attachment" in path_lower or record.extension in ("eml", "msg"):
            return "email-attachment"
        if "scan" in filename_lower or "scanned" in filename_lower:
            return "scanned"
        if "onedrive" in path_lower or "dropbox" in path_lower:
            return "cloud-sync"
        if "desktop" in path_lower:
            return "self-created"
        return "unknown"

    def log_correction(
        self,
        record: FileRecord,
        new_classification: dict[str, Any],
        feedback_note: str = "",
    ) -> None:
        """Log a user correction for the self-improvement loop."""
        old_classification = {
            "category": record.category,
            "subcategory": record.subcategory,
            "document_type": record.document_type,
            "tags": record.tags,
            "entities": record.entities,
            "status": record.status,
            "confidentiality": record.confidentiality,
        }

        correction = Correction(
            file_record_id=record.id,
            file_path=record.file_path,
            agent_decision=old_classification,
            user_decision=new_classification,
            corrected_at=datetime.now().isoformat(),
            feedback_note=feedback_note,
        )
        self.db.log_correction(correction)

        # Also save to corrections.json for few-shot examples
        self._save_correction_to_file(correction)

        # Apply the user's correction
        for key, value in new_classification.items():
            if hasattr(record, key):
                setattr(record, key, value)
        record.classified_by = "manual"
        record.classified_at = datetime.now().isoformat()
        record.needs_review = False
        record.confidence = 1.0
        self.db.upsert_file(record)

    def _save_correction_to_file(self, correction: Correction) -> None:
        """Append correction to the corrections.json file."""
        corrections_path = self.config.corrections_file
        os.makedirs(os.path.dirname(corrections_path), exist_ok=True)

        existing: list[dict[str, Any]] = []
        if os.path.exists(corrections_path):
            try:
                with open(corrections_path, "r", encoding="utf-8") as f:
                    existing = json.load(f)
            except (json.JSONDecodeError, OSError):
                existing = []

        existing.append({
            "file_path": correction.file_path,
            "agent_decision": correction.agent_decision,
            "user_decision": correction.user_decision,
            "corrected_at": correction.corrected_at,
            "feedback_note": correction.feedback_note,
        })

        # Keep last 100 corrections
        existing = existing[-100:]

        with open(corrections_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)
