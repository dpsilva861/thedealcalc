"""
Ollama LLM Client — sends classification prompts to a local LLM.

Constructs prompts with full context:
- Folder tree structure
- Tag and category vocabulary
- Active projects, properties, clients
- Recent file history
- User corrections as few-shot examples
- The new file's extracted content
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import requests

from ..config import Config
from ..database import Database
from ..models import ClassificationResult, FileRecord

logger = logging.getLogger(__name__)


class OllamaClient:
    """Interface to a local Ollama LLM for intelligent file classification."""

    def __init__(self, config: Config, db: Database) -> None:
        self.config = config
        self.db = db
        self.base_url = config.ollama_url
        self.model = config.ollama_model

    def classify(self, record: FileRecord) -> ClassificationResult:
        """
        Send file content to Ollama and get a structured classification.

        Returns ClassificationResult with confidence score.
        """
        prompt = self._build_prompt(record)

        try:
            response = self._call_ollama(prompt)
            result = self._parse_response(response)
            return result
        except Exception as e:
            logger.error("LLM classification failed for %s: %s", record.filename, e)
            return ClassificationResult(confidence=0.0, reasoning=f"LLM error: {e}")

    def _build_prompt(self, record: FileRecord) -> str:
        """Build the full classification prompt with context."""
        # Get context data
        recent_files = self.db.get_recent_files(limit=20)
        corrections = self.db.get_recent_corrections(limit=10)
        all_tags = self.db.get_all_tags()
        all_entities = self.db.get_all_entities()

        # Build folder tree summary
        folder_tree = self._build_folder_tree_summary()

        # Build tag vocabulary
        tag_vocab = ", ".join(t[0] for t in all_tags[:50])

        # Build entity list
        entity_list = ", ".join(e[0] for e in all_entities[:30])

        # Build recent files context
        recent_context = "\n".join(
            f"  - {f.filename} -> Category: {f.category}, Type: {f.document_type}, "
            f"Tags: {','.join(f.tags[:5])}"
            for f in recent_files[:20]
        )

        # Build corrections as few-shot examples
        correction_examples = ""
        if corrections:
            examples = []
            for c in corrections[:10]:
                agent = c.agent_decision
                user = c.user_decision
                examples.append(
                    f"  File: {c.file_path}\n"
                    f"  Agent classified as: category={agent.get('category')}, "
                    f"type={agent.get('document_type')}\n"
                    f"  User corrected to: category={user.get('category')}, "
                    f"type={user.get('document_type')}\n"
                    f"  Feedback: {c.feedback_note}"
                )
            correction_examples = (
                "\nIMPORTANT - Learn from these past corrections:\n" +
                "\n\n".join(examples)
            )

        # Build content preview (truncated)
        content_preview = record.extracted_text[:3000] if record.extracted_text else "(no text extracted)"

        # Categories and subcategories
        categories_str = json.dumps(self.config.categories, indent=2)

        # Document types
        doc_types_str = ", ".join(self.config.document_types)

        # Known brands
        brands_str = ", ".join(self.config.brands)

        prompt = f"""You are a file classification agent for a commercial real estate professional.
Your job is to analyze a file and return a JSON classification decision.

CONTEXT:
========

FOLDER STRUCTURE (where files can be placed):
{folder_tree}

KNOWN COMPANIES/BRANDS:
{brands_str}

CATEGORIES AND SUBCATEGORIES:
{categories_str}

DOCUMENT TYPES:
{doc_types_str}

TAG VOCABULARY (existing tags in use):
{tag_vocab}

KNOWN ENTITIES (companies, properties, people):
{entity_list}

RECENTLY PROCESSED FILES (for context and consistency):
{recent_context}
{correction_examples}

FILE TO CLASSIFY:
=================
Filename: {record.filename}
Extension: {record.extension}
File size: {record.file_size} bytes
Modified: {record.modified_at}
Created: {record.created_at}

EXTRACTED CONTENT:
{content_preview}

INSTRUCTIONS:
=============
Analyze the file and return ONLY a valid JSON object with these fields:
- destination_folder: The subfolder path within the organized directory (e.g., "Business/Silva-Operations/Leases")
- filename: The new filename following MMDDYYYY_Company_DocumentType.ext convention (all lowercase, words separated by hyphens within segments, segments separated by underscores)
- tags: Array of descriptive tags (3-8 tags, lowercase, hyphenated)
- category: Primary category from the list above
- subcategory: Subcategory from the list above
- entities: Array of associated companies, properties, or people
- summary: 1-2 sentence plain-language description
- document_type: The document type from the list above
- date_relevance: The date the CONTENT pertains to (YYYY-MM-DD format), not just file dates
- status: One of: active, archived, reference, draft, final, expired
- confidentiality: One of: business-confidential, personal-private, general
- source: Where the file likely came from: email-attachment, download, self-created, scanned, unknown
- confidence: Your confidence in this classification (0.0 to 1.0)
- reasoning: Brief explanation of your classification logic

Return ONLY the JSON object, no other text.
"""
        return prompt

    def _build_folder_tree_summary(self) -> str:
        """Build a summary of the folder structure for the prompt."""
        base = self.config.organized_base
        lines = [
            f"{base}/",
            "  Business/",
        ]
        for brand in sorted(self.config.brands):
            if brand == "Personal (Silva)":
                continue
            safe = brand.replace(" ", "-")
            lines.append(f"    {safe}/")
            lines.append(f"      Leases/ Contracts/ Financial/ Invoices/ Receipts/")
            lines.append(f"      Correspondence/ Reports/ Insurance/ Tax/ Legal/")
            lines.append(f"      Due-Diligence/ Property-Ops/ Photos/ Closing/ Loan/")
        lines.extend([
            "    _Other-Business/",
            "    _Cross-Company/",
            "  Personal/",
            "    Financial/ Tax/ Insurance/ Medical/ Education/",
            "    Legal/ Travel/ Family/ Photos/ Subscriptions/",
            "  Reference/",
            "    Templates/ Manuals/ Training/ Industry-Research/",
            "  _System/",
            "    _Inbox/ _Review/ _Duplicates/ _Archive/",
        ])
        return "\n".join(lines)

    def _call_ollama(self, prompt: str) -> str:
        """Call the Ollama API and return the response text."""
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 1000,
            },
        }

        try:
            resp = requests.post(url, json=payload, timeout=120)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")
        except requests.exceptions.ConnectionError:
            raise ConnectionError(
                f"Cannot connect to Ollama at {self.base_url}. "
                "Ensure Ollama is running: 'ollama serve'"
            )
        except requests.exceptions.Timeout:
            raise TimeoutError("Ollama request timed out after 120s")
        except Exception as e:
            raise RuntimeError(f"Ollama API error: {e}")

    def _parse_response(self, response: str) -> ClassificationResult:
        """Parse the LLM response into a ClassificationResult."""
        # Try to extract JSON from the response
        response = response.strip()

        # Handle markdown code blocks
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", response)
        if json_match:
            response = json_match.group(1).strip()

        # Try to find JSON object
        brace_start = response.find("{")
        brace_end = response.rfind("}")
        if brace_start >= 0 and brace_end > brace_start:
            response = response[brace_start:brace_end + 1]

        try:
            data = json.loads(response)
            return ClassificationResult.from_dict(data)
        except json.JSONDecodeError as e:
            logger.warning("Failed to parse LLM response as JSON: %s", e)
            return ClassificationResult(
                confidence=0.0,
                reasoning=f"Failed to parse LLM response: {e}",
            )

    def check_health(self) -> bool:
        """Check if Ollama is running and the model is available."""
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                model_names = [m.get("name", "") for m in models]
                if any(self.model in name for name in model_names):
                    return True
                logger.warning(
                    "Model '%s' not found in Ollama. Available: %s",
                    self.model,
                    model_names,
                )
            return False
        except Exception:
            return False
