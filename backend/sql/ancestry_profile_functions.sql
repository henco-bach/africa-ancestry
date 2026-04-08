-- Reusable PostgreSQL functions for ancestry profile generation.
-- These functions are inference-only: they only use DB rows + explicit deterministic rules.

BEGIN;

-- 1) Language -> ethno-linguistic family lookup.
-- Uses a controlled alias map and joins to existing families in the database.
CREATE OR REPLACE FUNCTION lookup_language_family(p_language TEXT)
RETURNS TABLE (
  normalized_language TEXT,
  family_id BIGINT,
  family_code TEXT,
  family_name TEXT,
  language_confidence NUMERIC(5,4),
  mapping_reason TEXT
)
LANGUAGE sql
STABLE
AS $$
WITH normalized AS (
  SELECT lower(regexp_replace(trim(coalesce(p_language, '')), '\\s+', '', 'g')) AS language_key
), language_map AS (
  SELECT * FROM (VALUES
    ('isizulu', 'nguni', 0.9300::numeric, 'Direct isiZulu -> Nguni mapping'),
    ('zulu', 'nguni', 0.9100::numeric, 'Zulu token -> Nguni mapping'),
    ('isixhosa', 'nguni', 0.9300::numeric, 'Direct isiXhosa -> Nguni mapping'),
    ('xhosa', 'nguni', 0.9100::numeric, 'Xhosa token -> Nguni mapping'),
    ('siswati', 'nguni', 0.9000::numeric, 'siSwati token -> Nguni mapping'),
    ('swati', 'nguni', 0.8900::numeric, 'Swati token -> Nguni mapping'),
    ('setswana', 'sotho_tswana', 0.9300::numeric, 'Direct Setswana -> Sotho-Tswana mapping'),
    ('tswana', 'sotho_tswana', 0.9100::numeric, 'Tswana token -> Sotho-Tswana mapping'),
    ('sesotho', 'sotho_tswana', 0.9300::numeric, 'Direct Sesotho -> Sotho-Tswana mapping'),
    ('sotho', 'sotho_tswana', 0.9000::numeric, 'Sotho token -> Sotho-Tswana mapping'),
    ('tshivenda', 'venda', 0.9300::numeric, 'Direct Tshivenda -> Venda mapping'),
    ('venda', 'venda', 0.9100::numeric, 'Venda token -> Venda mapping'),
    ('xitsonga', 'tsonga', 0.9300::numeric, 'Direct Xitsonga -> Tsonga mapping'),
    ('tsonga', 'tsonga', 0.9100::numeric, 'Tsonga token -> Tsonga mapping'),
    ('shangaan', 'tsonga', 0.9000::numeric, 'Shangaan token -> Tsonga-Shangaan mapping'),
    ('sepedi', 'sotho_tswana', 0.9300::numeric, 'Direct Sepedi -> Sotho-Tswana mapping'),
    ('northernsotho', 'sotho_tswana', 0.9100::numeric, 'Northern Sotho token -> Sotho-Tswana mapping'),
    ('isindebele', 'ndebele', 0.9300::numeric, 'Direct isiNdebele -> Ndebele mapping'),
    ('ndebele', 'ndebele', 0.9000::numeric, 'Ndebele token -> Ndebele mapping'),
    ('swazi', 'nguni', 0.9000::numeric, 'Swazi token -> Nguni mapping')
  ) AS t(language_key, family_code, score, reason)
)
SELECT
  n.language_key AS normalized_language,
  f.id AS family_id,
  f.code AS family_code,
  f.name AS family_name,
  lm.score AS language_confidence,
  lm.reason AS mapping_reason
FROM normalized n
JOIN language_map lm ON lm.language_key = n.language_key
JOIN ethno_linguistic_families f ON f.code = lm.family_code;
$$;

COMMENT ON FUNCTION lookup_language_family(TEXT) IS
'Maps normalized language input to ethno-linguistic family rows with deterministic confidence and reason text.';

-- 2) Clan/lineage lookup with confidence scoring.
-- Confidence combines exact/fuzzy token matches + optional family consistency with language lookup.
CREATE OR REPLACE FUNCTION lookup_clan_lineage(
  p_clan_name TEXT,
  p_language TEXT DEFAULT NULL
)
RETURNS TABLE (
  clan_lineage_id BIGINT,
  clan_name TEXT,
  clan_display_name TEXT,
  subgroup_id BIGINT,
  subgroup_name TEXT,
  kingdom_nation_id BIGINT,
  kingdom_nation_name TEXT,
  family_id BIGINT,
  family_name TEXT,
  clan_confidence NUMERIC(5,4),
  match_reason TEXT
)
LANGUAGE sql
STABLE
AS $$
WITH normalized_input AS (
  SELECT lower(trim(coalesce(p_clan_name, ''))) AS clan_key
), language_family AS (
  SELECT lf.family_id
  FROM lookup_language_family(p_language) lf
  LIMIT 1
), candidates AS (
  SELECT
    cl.id AS clan_lineage_id,
    cl.name AS clan_name,
    coalesce(cl.display_name, cl.name) AS clan_display_name,
    sg.id AS subgroup_id,
    sg.name AS subgroup_name,
    kn.id AS kingdom_nation_id,
    kn.name AS kingdom_nation_name,
    ef.id AS family_id,
    ef.name AS family_name,
    CASE
      WHEN lower(cl.name) = ni.clan_key THEN 0.9500
      WHEN lower(coalesce(cl.display_name, '')) = ni.clan_key THEN 0.9200
      WHEN lower(cl.code) = ni.clan_key THEN 0.9000
      WHEN lower(cl.name) LIKE ni.clan_key || '%' THEN 0.8400
      WHEN lower(cl.name) LIKE '%' || ni.clan_key || '%' THEN 0.7800
      ELSE 0.5500
    END AS name_match_score,
    CASE
      WHEN lf.family_id IS NULL THEN 0.0000
      WHEN lf.family_id = ef.id THEN 0.0500
      ELSE -0.0500
    END AS language_alignment_adjustment,
    CASE
      WHEN lower(cl.name) = ni.clan_key THEN 'Exact clan name match'
      WHEN lower(coalesce(cl.display_name, '')) = ni.clan_key THEN 'Exact clan display name match'
      WHEN lower(cl.code) = ni.clan_key THEN 'Exact clan code match'
      WHEN lower(cl.name) LIKE ni.clan_key || '%' THEN 'Clan prefix match'
      WHEN lower(cl.name) LIKE '%' || ni.clan_key || '%' THEN 'Clan contains token'
      ELSE 'Fallback low-confidence candidate'
    END AS reason
  FROM normalized_input ni
  JOIN clans_lineages cl
    ON (
      lower(cl.name) = ni.clan_key
      OR lower(coalesce(cl.display_name, '')) = ni.clan_key
      OR lower(cl.code) = ni.clan_key
      OR lower(cl.name) LIKE ni.clan_key || '%'
      OR lower(cl.name) LIKE '%' || ni.clan_key || '%'
    )
  JOIN subgroups sg ON sg.id = cl.subgroup_id
  JOIN kingdoms_nations kn ON kn.id = sg.kingdom_nation_id
  JOIN ethno_linguistic_families ef ON ef.id = kn.family_id
  LEFT JOIN language_family lf ON TRUE
)
SELECT
  c.clan_lineage_id,
  c.clan_name,
  c.clan_display_name,
  c.subgroup_id,
  c.subgroup_name,
  c.kingdom_nation_id,
  c.kingdom_nation_name,
  c.family_id,
  c.family_name,
  LEAST(1.0000, GREATEST(0.0000, c.name_match_score + c.language_alignment_adjustment))::NUMERIC(5,4) AS clan_confidence,
  c.reason || CASE WHEN c.language_alignment_adjustment > 0 THEN '; aligned with language family'
                   WHEN c.language_alignment_adjustment < 0 THEN '; conflicts with language family'
                   ELSE '' END AS match_reason
FROM candidates c
ORDER BY clan_confidence DESC, c.clan_lineage_id;
$$;

COMMENT ON FUNCTION lookup_clan_lineage(TEXT, TEXT) IS
'Finds clan/lineage matches with deterministic confidence and optional language-family alignment adjustment.';

-- 3) Narrative extractor from matched entities and their cited sources.
-- No invented content: returns only descriptions + source metadata already stored.
CREATE OR REPLACE FUNCTION extract_entity_narratives(
  p_family_id BIGINT DEFAULT NULL,
  p_kingdom_nation_id BIGINT DEFAULT NULL,
  p_subgroup_id BIGINT DEFAULT NULL,
  p_clan_lineage_id BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
WITH family_data AS (
  SELECT jsonb_build_object(
    'id', f.id,
    'name', f.name,
    'display_name', f.display_name,
    'description', f.description,
    'confidence_score', f.confidence_score
  ) AS data
  FROM ethno_linguistic_families f
  WHERE f.id = p_family_id
), kingdom_data AS (
  SELECT jsonb_build_object(
    'id', k.id,
    'name', k.name,
    'display_name', k.display_name,
    'description', k.description,
    'confidence_score', k.confidence_score
  ) AS data
  FROM kingdoms_nations k
  WHERE k.id = p_kingdom_nation_id
), subgroup_data AS (
  SELECT jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'display_name', s.display_name,
    'description', s.description,
    'confidence_score', s.confidence_score
  ) AS data
  FROM subgroups s
  WHERE s.id = p_subgroup_id
), clan_data AS (
  SELECT jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'display_name', c.display_name,
    'description', c.description,
    'confidence_score', c.confidence_score
  ) AS data
  FROM clans_lineages c
  WHERE c.id = p_clan_lineage_id
), cited_sources AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'source_id', src.id,
      'title', src.title,
      'source_type', src.source_type,
      'publication_year', src.publication_year,
      'citation', src.citation,
      'url', src.url,
      'reliability_score', src.reliability_score,
      'entity_confidence', es.confidence_score,
      'evidence_note', es.evidence_note
    ) ORDER BY src.reliability_score DESC, src.publication_year DESC NULLS LAST
  ) AS items
  FROM entity_sources es
  JOIN sources src ON src.id = es.source_id
  WHERE (p_family_id IS NOT NULL AND es.family_id = p_family_id)
     OR (p_kingdom_nation_id IS NOT NULL AND es.kingdom_nation_id = p_kingdom_nation_id)
     OR (p_subgroup_id IS NOT NULL AND es.subgroup_id = p_subgroup_id)
     OR (p_clan_lineage_id IS NOT NULL AND es.clan_lineage_id = p_clan_lineage_id)
), mapped_regions AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'region_id', r.id,
      'name', r.name,
      'display_name', r.display_name,
      'region_type', r.region_type,
      'country_code', r.country_code,
      'is_primary_region', er.is_primary_region,
      'historical_start_year', er.historical_start_year,
      'historical_end_year', er.historical_end_year,
      'confidence_score', er.confidence_score
    ) ORDER BY er.is_primary_region DESC, er.confidence_score DESC
  ) AS items
  FROM entity_regions er
  JOIN regions r ON r.id = er.region_id
  WHERE (p_family_id IS NOT NULL AND er.family_id = p_family_id)
     OR (p_kingdom_nation_id IS NOT NULL AND er.kingdom_nation_id = p_kingdom_nation_id)
     OR (p_subgroup_id IS NOT NULL AND er.subgroup_id = p_subgroup_id)
     OR (p_clan_lineage_id IS NOT NULL AND er.clan_lineage_id = p_clan_lineage_id)
)
SELECT jsonb_build_object(
  'family', (SELECT data FROM family_data),
  'kingdom_nation', (SELECT data FROM kingdom_data),
  'subgroup', (SELECT data FROM subgroup_data),
  'clan_lineage', (SELECT data FROM clan_data),
  'sources', coalesce((SELECT items FROM cited_sources), '[]'::jsonb),
  'regions', coalesce((SELECT items FROM mapped_regions), '[]'::jsonb)
);
$$;

COMMENT ON FUNCTION extract_entity_narratives(BIGINT, BIGINT, BIGINT, BIGINT) IS
'Builds a narrative payload from existing entity descriptions, linked sources, and mapped regions.';

-- 4) Composite confidence scorer.
-- Weighted deterministic formula; clamp to [0,1].
CREATE OR REPLACE FUNCTION compute_composite_ancestry_confidence(
  p_family_conf NUMERIC,
  p_kingdom_conf NUMERIC,
  p_subgroup_conf NUMERIC,
  p_clan_conf NUMERIC,
  p_surname_conf NUMERIC,
  p_region_conf NUMERIC
)
RETURNS NUMERIC(5,4)
LANGUAGE sql
IMMUTABLE
AS $$
SELECT LEAST(
  1.0000,
  GREATEST(
    0.0000,
    (
      coalesce(p_family_conf, 0)  * 0.28 +
      coalesce(p_kingdom_conf, 0) * 0.16 +
      coalesce(p_subgroup_conf, 0) * 0.16 +
      coalesce(p_clan_conf, 0)     * 0.20 +
      coalesce(p_surname_conf, 0)  * 0.12 +
      coalesce(p_region_conf, 0)   * 0.08
    )
  )
)::NUMERIC(5,4);
$$;

COMMENT ON FUNCTION compute_composite_ancestry_confidence(NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) IS
'Combines section-level confidence metrics into a single composite ancestry confidence score.';

COMMIT;
