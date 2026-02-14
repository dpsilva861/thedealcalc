"""
CLI Entry Point — provides the 'file-organizer' (or 'fo') command.

Commands:
    scan        Scan directories and build file inventory
    search      Search the file inventory
    profile     Show file landscape profile
    taxonomy    Propose/create folder taxonomy
    organize    Execute file organization
    agent       Start/stop the persistent file agent
    dashboard   Launch the web dashboard
    undo        Undo recent file moves
    config      View/edit configuration
    status      Show system status
"""

from __future__ import annotations

import json
import logging
import os
import sys

import click
from rich.console import Console
from rich.table import Table
from rich.tree import Tree

from ..config import Config
from ..content_reader import ContentReader
from ..database import Database

console = Console()


def _get_config(config_path: str | None) -> Config:
    return Config.load(config_path)


def _get_db(config: Config) -> Database:
    return Database(config.db_path)


@click.group()
@click.option("--config", "config_path", default=None, help="Path to config file")
@click.pass_context
def cli(ctx: click.Context, config_path: str | None) -> None:
    """File Organizer v2 — Intelligent file organization with LLM classification."""
    ctx.ensure_object(dict)
    ctx.obj["config_path"] = config_path


# ------------------------------------------------------------------ #
# scan
# ------------------------------------------------------------------ #
@cli.command()
@click.argument("directories", nargs=-1)
@click.option("--no-content", is_flag=True, help="Skip content extraction")
@click.option("--no-hash", is_flag=True, help="Skip hash computation")
@click.option("--dry-run", is_flag=True, help="Count files without processing")
@click.pass_context
def scan(ctx: click.Context, directories: tuple[str, ...], no_content: bool,
         no_hash: bool, dry_run: bool) -> None:
    """Scan directories and build file inventory."""
    config = _get_config(ctx.obj.get("config_path"))
    db = _get_db(config)
    from ..scanner import Scanner

    dirs = list(directories) if directories else config.scan_dirs
    console.print(f"[bold]Scanning {len(dirs)} directories...[/bold]")

    def progress(path: str, current: int, total: int) -> None:
        if current % 50 == 0 or current == total:
            console.print(f"  [{current}/{total}] {os.path.basename(path)}")

    scanner = Scanner(config, db, progress_callback=progress)
    profile = scanner.scan(
        directories=dirs,
        extract_content=not no_content,
        compute_hashes=not no_hash,
        dry_run=dry_run,
    )

    console.print(f"\n[bold green]Scan complete![/bold green]")
    console.print(f"  Total files:  {profile.total_files:,}")
    console.print(f"  Total size:   {_human_size(profile.total_size_bytes)}")
    console.print(f"  Duplicates:   {profile.duplicates_found}")
    console.print(f"  Errors:       {len(profile.errors)}")

    if profile.file_counts_by_extension:
        table = Table(title="Files by Extension")
        table.add_column("Extension", style="cyan")
        table.add_column("Count", justify="right")
        for ext, count in list(profile.file_counts_by_extension.items())[:15]:
            table.add_row(f".{ext}", f"{count:,}")
        console.print(table)

    if profile.detected_brands:
        console.print(f"\n[bold]Detected brands:[/bold] {', '.join(profile.detected_brands)}")

    db.close()


# ------------------------------------------------------------------ #
# search
# ------------------------------------------------------------------ #
@cli.command()
@click.argument("query", nargs=-1)
@click.option("--tags", default="", help="Filter by tags (comma-separated)")
@click.option("--category", default="", help="Filter by category")
@click.option("--entity", default="", help="Filter by entity")
@click.option("--type", "doc_type", default="", help="Filter by document type")
@click.option("--status", default="", help="Filter by status")
@click.option("--date-start", default="", help="Start date (YYYY-MM-DD)")
@click.option("--date-end", default="", help="End date (YYYY-MM-DD)")
@click.option("--limit", default=50, help="Max results")
@click.option("--json-output", is_flag=True, help="Output as JSON")
@click.pass_context
def search(ctx: click.Context, query: tuple[str, ...], tags: str, category: str,
           entity: str, doc_type: str, status: str, date_start: str,
           date_end: str, limit: int, json_output: bool) -> None:
    """Search the file inventory with natural language or filters."""
    config = _get_config(ctx.obj.get("config_path"))
    db = _get_db(config)
    from ..search import SearchEngine

    search_engine = SearchEngine(db)
    query_str = " ".join(query)

    if query_str and not any([tags, category, entity, doc_type, status]):
        results = search_engine.natural_language_search(query_str)
    else:
        results = search_engine.search(
            query_str,
            tags=tags,
            category=category,
            entity=entity,
            document_type=doc_type,
            status=status,
            date_start=date_start,
            date_end=date_end,
            limit=limit,
        )

    if json_output:
        click.echo(json.dumps([r.to_dict() for r in results], indent=2))
    else:
        if not results:
            console.print("[yellow]No results found.[/yellow]")
        else:
            table = Table(title=f"Search Results ({len(results)})")
            table.add_column("Filename", style="cyan", max_width=40)
            table.add_column("Category")
            table.add_column("Type")
            table.add_column("Entities", max_width=25)
            table.add_column("Tags", max_width=30)
            table.add_column("Path", style="dim", max_width=50)

            for r in results:
                table.add_row(
                    r.filename,
                    r.category,
                    r.document_type,
                    ", ".join(r.entities[:2]),
                    ", ".join(r.tags[:3]),
                    r.file_path,
                )
            console.print(table)

    db.close()


# ------------------------------------------------------------------ #
# profile
# ------------------------------------------------------------------ #
@cli.command()
@click.option("--json-output", is_flag=True, help="Output as JSON")
@click.pass_context
def profile(ctx: click.Context, json_output: bool) -> None:
    """Show file landscape profile."""
    config = _get_config(ctx.obj.get("config_path"))
    db = _get_db(config)
    from ..profiler import Profiler

    profiler = Profiler(config, db)
    prof = profiler.build_profile()

    if json_output:
        click.echo(json.dumps(prof, indent=2, default=str))
    else:
        report = profiler.generate_report(prof)
        console.print(report)

    db.close()


# ------------------------------------------------------------------ #
# taxonomy
# ------------------------------------------------------------------ #
@cli.command()
@click.option("--create", is_flag=True, help="Create directories on disk")
@click.option("--json-output", is_flag=True, help="Output as JSON")
@click.pass_context
def taxonomy(ctx: click.Context, create: bool, json_output: bool) -> None:
    """Propose or create folder taxonomy."""
    config = _get_config(ctx.obj.get("config_path"))
    db = _get_db(config)
    from ..taxonomy import TaxonomyEngine

    engine = TaxonomyEngine(config, db)
    root = engine.propose()

    if json_output:
        click.echo(json.dumps(root.to_dict(), indent=2))
    else:
        tree_str = engine.render_tree(root)
        console.print(tree_str)
        console.print(engine.get_naming_convention_doc())

    if create:
        created = engine.create_directories(root)
        console.print(f"\n[green]Created {len(created)} directories[/green]")

    db.close()


# ------------------------------------------------------------------ #
# organize
# ------------------------------------------------------------------ #
@cli.command()
@click.option("--dry-run", is_flag=True, help="Preview without moving files")
@click.option("--manifest", default="", help="Export manifest CSV to this path")
@click.pass_context
def organize(ctx: click.Context, dry_run: bool, manifest: str) -> None:
    """Execute file organization based on classifications."""
    config = _get_config(ctx.obj.get("config_path"))
    db = _get_db(config)
    from ..organizer import Organizer

    organizer = Organizer(config, db)
    moves = organizer.organize(dry_run=dry_run)

    prefix = "[DRY RUN] " if dry_run else ""
    console.print(f"\n{prefix}[bold green]{len(moves)} files organized[/bold green]")

    if moves:
        table = Table(title=f"{prefix}Move Log")
        table.add_column("Old Path", style="dim", max_width=50)
        table.add_column("New Path", style="cyan", max_width=50)
        for m in moves[:20]:
            table.add_row(m.old_path, m.new_path)
        console.print(table)
        if len(moves) > 20:
            console.print(f"  ... and {len(moves) - 20} more")

    if manifest:
        organizer.export_manifest_csv(manifest)
        console.print(f"[green]Manifest exported to {manifest}[/green]")

    db.close()


# ------------------------------------------------------------------ #
# classify
# ------------------------------------------------------------------ #
@cli.command()
@click.argument("file_path")
@click.option("--json-output", is_flag=True, help="Output as JSON")
@click.pass_context
def classify(ctx: click.Context, file_path: str, json_output: bool) -> None:
    """Classify a single file."""
    config = _get_config(ctx.obj.get("config_path"))
    db = _get_db(config)
    from ..agent.classifier import Classifier
    from ..scanner import Scanner

    scanner = Scanner(config, db)
    record = scanner.scan_single(file_path)

    classifier = Classifier(config, db)
    result = classifier.classify(record)

    if json_output:
        click.echo(json.dumps(result.to_dict(), indent=2))
    else:
        console.print(f"[bold]Classification for:[/bold] {file_path}")
        console.print(f"  Category:      {result.category}")
        console.print(f"  Subcategory:   {result.subcategory}")
        console.print(f"  Document Type: {result.document_type}")
        console.print(f"  Tags:          {', '.join(result.tags)}")
        console.print(f"  Entities:      {', '.join(result.entities)}")
        console.print(f"  Summary:       {result.summary}")
        console.print(f"  Status:        {result.status}")
        console.print(f"  Confidence:    {result.confidence:.0%}")
        console.print(f"  Destination:   {result.destination_folder}")
        console.print(f"  New Filename:  {result.filename}")
        console.print(f"  Reasoning:     {result.reasoning}")

    db.close()


# ------------------------------------------------------------------ #
# agent
# ------------------------------------------------------------------ #
@cli.command()
@click.option("--foreground", is_flag=True, help="Run in foreground (not as service)")
@click.option("--install", is_flag=True, help="Install as Windows service")
@click.option("--uninstall", is_flag=True, help="Uninstall Windows service")
@click.option("--tray", is_flag=True, help="Run with system tray icon")
@click.pass_context
def agent(ctx: click.Context, foreground: bool, install: bool,
          uninstall: bool, tray: bool) -> None:
    """Start/manage the persistent file agent."""
    config = _get_config(ctx.obj.get("config_path"))

    if install:
        from ..agent.service import install_service
        install_service()
    elif uninstall:
        from ..agent.service import uninstall_service
        uninstall_service()
    elif tray:
        from ..agent.tray import run_tray
        run_tray(config)
    elif foreground:
        from ..agent.service import run_foreground
        run_foreground(config)
    else:
        console.print("Use --foreground, --tray, --install, or --uninstall")


# ------------------------------------------------------------------ #
# dashboard
# ------------------------------------------------------------------ #
@cli.command()
@click.option("--port", default=5000, help="Port number")
@click.option("--host", default="127.0.0.1", help="Host address")
@click.pass_context
def dashboard(ctx: click.Context, port: int, host: str) -> None:
    """Launch the web dashboard."""
    config = _get_config(ctx.obj.get("config_path"))
    config.dashboard_port = port
    config.dashboard_host = host
    from ..dashboard.app import run_dashboard
    console.print(f"[bold]Starting dashboard at http://{host}:{port}[/bold]")
    run_dashboard(config)


# ------------------------------------------------------------------ #
# undo
# ------------------------------------------------------------------ #
@cli.command()
@click.option("--count", default=1, help="Number of moves to undo")
@click.pass_context
def undo(ctx: click.Context, count: int) -> None:
    """Undo recent file moves."""
    config = _get_config(ctx.obj.get("config_path"))
    db = _get_db(config)
    from ..organizer import Organizer

    organizer = Organizer(config, db)
    undone = organizer.undo_last(count)

    if undone:
        console.print(f"[green]Undone {len(undone)} moves:[/green]")
        for m in undone:
            console.print(f"  {m.new_path} -> {m.old_path}")
    else:
        console.print("[yellow]Nothing to undo.[/yellow]")

    db.close()


# ------------------------------------------------------------------ #
# config
# ------------------------------------------------------------------ #
@cli.command("config")
@click.option("--show", is_flag=True, help="Show current configuration")
@click.option("--init", is_flag=True, help="Create default configuration file")
@click.pass_context
def config_cmd(ctx: click.Context, show: bool, init: bool) -> None:
    """View or initialize configuration."""
    config = _get_config(ctx.obj.get("config_path"))

    if init:
        config.save()
        console.print(f"[green]Configuration saved to {config.db_path}[/green]")
    elif show:
        from dataclasses import asdict
        click.echo(json.dumps(asdict(config), indent=2))
    else:
        console.print("Use --show or --init")


# ------------------------------------------------------------------ #
# status
# ------------------------------------------------------------------ #
@cli.command()
@click.pass_context
def status(ctx: click.Context) -> None:
    """Show system status."""
    config = _get_config(ctx.obj.get("config_path"))
    db = _get_db(config)

    stats = db.get_stats()
    console.print("[bold]File Organizer Status[/bold]")
    console.print(f"  Database:        {config.db_path}")
    console.print(f"  Total files:     {stats['total_files']:,}")
    console.print(f"  Total size:      {_human_size(stats['total_size'])}")
    console.print(f"  Awaiting review: {stats['review_count']}")
    console.print(f"  Categories:      {len(stats['by_category'])}")

    # Check Ollama
    from ..agent.llm_client import OllamaClient
    llm = OllamaClient(config, db)
    ollama_ok = llm.check_health()
    console.print(f"  Ollama:          {'[green]Connected[/green]' if ollama_ok else '[red]Not available[/red]'}")
    console.print(f"  Ollama model:    {config.ollama_model}")

    db.close()


# ------------------------------------------------------------------ #
# duplicates
# ------------------------------------------------------------------ #
@cli.command()
@click.option("--near", is_flag=True, help="Find near-duplicates (content-based)")
@click.pass_context
def duplicates(ctx: click.Context, near: bool) -> None:
    """Find duplicate files."""
    config = _get_config(ctx.obj.get("config_path"))
    db = _get_db(config)

    if near:
        dupes = db.find_near_duplicates()
    else:
        dupes = db.find_duplicates_by_hash()

    if not dupes:
        console.print("[green]No duplicates found.[/green]")
    else:
        console.print(f"[yellow]Found {len(dupes)} duplicate groups:[/yellow]")
        for hash_val, files in dupes.items():
            console.print(f"\n  Hash: {hash_val[:16]}...")
            for f in files:
                console.print(f"    {f.file_path}")

    db.close()


def _human_size(size_bytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(size_bytes) < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0  # type: ignore
    return f"{size_bytes:.1f} PB"


if __name__ == "__main__":
    cli()
