-- Ancestry data tables schema.
-- Run this BEFORE ancestry_profile_functions.sql and ancestry_data_seed.sql.

BEGIN;

-- Ethno-linguistic family (top of hierarchy)
CREATE TABLE IF NOT EXISTS ethno_linguistic_families (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.8000
);

-- Kingdom or nation within a language family
CREATE TABLE IF NOT EXISTS kingdoms_nations (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.8000,
  family_id BIGINT NOT NULL REFERENCES ethno_linguistic_families(id) ON DELETE CASCADE
);

-- Subgroup within a kingdom/nation
CREATE TABLE IF NOT EXISTS subgroups (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.8000,
  kingdom_nation_id BIGINT NOT NULL REFERENCES kingdoms_nations(id) ON DELETE CASCADE
);

-- Clan or lineage within a subgroup
CREATE TABLE IF NOT EXISTS clans_lineages (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.8000,
  subgroup_id BIGINT NOT NULL REFERENCES subgroups(id) ON DELETE CASCADE
);

-- Geographic regions
CREATE TABLE IF NOT EXISTS regions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  region_type TEXT NOT NULL CHECK (region_type IN ('country', 'province', 'historical_territory', 'geographic_zone')),
  country_code CHAR(2)
);

-- Sources / bibliography
CREATE TABLE IF NOT EXISTS sources (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('book', 'journal', 'archive', 'oral_tradition', 'government_record', 'database')),
  publication_year INT,
  citation TEXT,
  url TEXT,
  reliability_score NUMERIC(5,4) NOT NULL DEFAULT 0.7000
);

-- Entity ↔ region links
CREATE TABLE IF NOT EXISTS entity_regions (
  id BIGSERIAL PRIMARY KEY,
  family_id BIGINT REFERENCES ethno_linguistic_families(id) ON DELETE CASCADE,
  kingdom_nation_id BIGINT REFERENCES kingdoms_nations(id) ON DELETE CASCADE,
  subgroup_id BIGINT REFERENCES subgroups(id) ON DELETE CASCADE,
  clan_lineage_id BIGINT REFERENCES clans_lineages(id) ON DELETE CASCADE,
  region_id BIGINT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  is_primary_region BOOLEAN NOT NULL DEFAULT FALSE,
  historical_start_year INT,
  historical_end_year INT,
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.8000,
  CONSTRAINT entity_regions_at_least_one CHECK (
    family_id IS NOT NULL OR kingdom_nation_id IS NOT NULL OR
    subgroup_id IS NOT NULL OR clan_lineage_id IS NOT NULL
  )
);

-- Entity ↔ source links
CREATE TABLE IF NOT EXISTS entity_sources (
  id BIGSERIAL PRIMARY KEY,
  family_id BIGINT REFERENCES ethno_linguistic_families(id) ON DELETE CASCADE,
  kingdom_nation_id BIGINT REFERENCES kingdoms_nations(id) ON DELETE CASCADE,
  subgroup_id BIGINT REFERENCES subgroups(id) ON DELETE CASCADE,
  clan_lineage_id BIGINT REFERENCES clans_lineages(id) ON DELETE CASCADE,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.7000,
  evidence_note TEXT,
  CONSTRAINT entity_sources_at_least_one CHECK (
    family_id IS NOT NULL OR kingdom_nation_id IS NOT NULL OR
    subgroup_id IS NOT NULL OR clan_lineage_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_kingdoms_family ON kingdoms_nations(family_id);
CREATE INDEX IF NOT EXISTS idx_subgroups_kingdom ON subgroups(kingdom_nation_id);
CREATE INDEX IF NOT EXISTS idx_clans_subgroup ON clans_lineages(subgroup_id);
CREATE INDEX IF NOT EXISTS idx_entity_regions_region ON entity_regions(region_id);
CREATE INDEX IF NOT EXISTS idx_entity_sources_source ON entity_sources(source_id);

COMMIT;
