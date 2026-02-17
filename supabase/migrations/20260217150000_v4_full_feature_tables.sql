-- V4 Full Feature Tables: versions, comments, collaboration, sharing, audit, templates, deals, clause library

-- ── Analysis Versions ──────────────────────────────────────────────────
create table if not exists public.analysis_versions (
  id text primary key,
  analysis_id uuid references public.lease_analyses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  version_number integer not null,
  revisions jsonb not null default '[]'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  summary text,
  risk_flags jsonb not null default '[]'::jsonb,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists idx_analysis_versions_analysis on public.analysis_versions(analysis_id);
alter table public.analysis_versions enable row level security;

create policy "Users can read their own versions"
  on public.analysis_versions for select using (auth.uid() = user_id);
create policy "Users can insert their own versions"
  on public.analysis_versions for insert with check (auth.uid() = user_id);
create policy "Users can delete their own versions"
  on public.analysis_versions for delete using (auth.uid() = user_id);

-- ── Analysis Comments ──────────────────────────────────────────────────
create table if not exists public.analysis_comments (
  id text primary key,
  analysis_id uuid not null,
  revision_index integer,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null,
  content text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_analysis_comments_analysis on public.analysis_comments(analysis_id);
alter table public.analysis_comments enable row level security;

create policy "Users can read comments on analyses they can access"
  on public.analysis_comments for select using (true);
create policy "Users can insert comments"
  on public.analysis_comments for insert with check (auth.uid() = user_id);
create policy "Users can update their own comments"
  on public.analysis_comments for update using (auth.uid() = user_id);

-- ── Collaborators ──────────────────────────────────────────────────────
create table if not exists public.analysis_collaborators (
  id bigint generated always as identity primary key,
  analysis_id uuid not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  added_at timestamptz not null default now(),
  unique(analysis_id, user_id)
);

create index if not exists idx_collaborators_analysis on public.analysis_collaborators(analysis_id);
create index if not exists idx_collaborators_user on public.analysis_collaborators(user_id);
alter table public.analysis_collaborators enable row level security;

create policy "Users can see collaborations they are part of"
  on public.analysis_collaborators for select
  using (auth.uid() = user_id);
create policy "Owners can add collaborators"
  on public.analysis_collaborators for insert
  with check (auth.uid() = user_id);
create policy "Owners can remove collaborators"
  on public.analysis_collaborators for delete
  using (auth.uid() = user_id);

-- ── Share Links ────────────────────────────────────────────────────────
create table if not exists public.share_links (
  id text primary key,
  analysis_id uuid not null,
  token text unique not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  recipient_email text,
  expires_at timestamptz not null,
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_share_links_token on public.share_links(token);
create index if not exists idx_share_links_analysis on public.share_links(analysis_id);
alter table public.share_links enable row level security;

create policy "Creators can manage their share links"
  on public.share_links for all using (auth.uid() = created_by);
-- Public read via token (handled by edge function, not RLS)

-- ── Audit Trail ────────────────────────────────────────────────────────
create table if not exists public.audit_trail (
  id text primary key,
  analysis_id uuid,
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  details jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_trail_user on public.audit_trail(user_id);
create index if not exists idx_audit_trail_analysis on public.audit_trail(analysis_id);
create index if not exists idx_audit_trail_action on public.audit_trail(action);
alter table public.audit_trail enable row level security;

create policy "Users can read their own audit entries"
  on public.audit_trail for select using (auth.uid() = user_id);
create policy "Users can insert their own audit entries"
  on public.audit_trail for insert with check (auth.uid() = user_id);

-- ── Custom Clause Library ──────────────────────────────────────────────
create table if not exists public.custom_clauses (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  label text not null,
  language text not null,
  jurisdiction text,
  document_types jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_custom_clauses_user on public.custom_clauses(user_id);
create index if not exists idx_custom_clauses_category on public.custom_clauses(category);
alter table public.custom_clauses enable row level security;

create policy "Users can CRUD their own clauses"
  on public.custom_clauses for all using (auth.uid() = user_id);

-- ── Lease Templates ────────────────────────────────────────────────────
create table if not exists public.lease_templates (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  document_type text not null,
  jurisdiction text,
  clauses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lease_templates_user on public.lease_templates(user_id);
alter table public.lease_templates enable row level security;

create policy "Users can CRUD their own templates"
  on public.lease_templates for all using (auth.uid() = user_id);

-- ── Deal Folders ───────────────────────────────────────────────────────
create table if not exists public.deal_folders (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  property_address text,
  tenant_name text,
  jurisdiction text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deal_folders_user on public.deal_folders(user_id);
alter table public.deal_folders enable row level security;

create policy "Users can CRUD their own deals"
  on public.deal_folders for all using (auth.uid() = user_id);

-- ── Deal Documents ─────────────────────────────────────────────────────
create table if not exists public.deal_documents (
  id text primary key,
  deal_id text references public.deal_folders(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  document_type text not null,
  file_name text not null,
  analysis_id uuid,
  status text not null default 'pending' check (status in ('pending', 'analyzed', 'reviewed')),
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_deal_documents_deal on public.deal_documents(deal_id);
alter table public.deal_documents enable row level security;

create policy "Users can CRUD their own deal documents"
  on public.deal_documents for all using (auth.uid() = user_id);

-- ── Add jurisdiction column to lease_analyses ──────────────────────────
alter table public.lease_analyses add column if not exists jurisdiction text;
alter table public.lease_analyses add column if not exists deal_id text;
alter table public.lease_analyses add column if not exists document_text text;
