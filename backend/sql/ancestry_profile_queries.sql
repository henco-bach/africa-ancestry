-- Query/procedure layer for ancestry profile generation.
-- Depends on functions in: backend/sql/ancestry_profile_functions.sql

BEGIN;

-- Optional helper view to unify hierarchy joins.
CREATE OR REPLACE VIEW ancestry_hierarchy_view AS
SELECT
  ef.id AS family_id,
  ef.code AS family_code,
  ef.name AS family_name,
  ef.display_name AS family_display_name,
  kn.id AS kingdom_nation_id,
  kn.code AS kingdom_code,
  kn.name AS kingdom_name,
  kn.display_name AS kingdom_display_name,
  sg.id AS subgroup_id,
  sg.code AS subgroup_code,
  sg.name AS subgroup_name,
  sg.display_name AS subgroup_display_name,
  cl.id AS clan_lineage_id,
  cl.code AS clan_code,
  cl.name AS clan_name,
  cl.display_name AS clan_display_name
FROM ethno_linguistic_families ef
LEFT JOIN kingdoms_nations kn ON kn.family_id = ef.id
LEFT JOIN subgroups sg ON sg.kingdom_nation_id = kn.id
LEFT JOIN clans_lineages cl ON cl.subgroup_id = sg.id;

COMMENT ON VIEW ancestry_hierarchy_view IS
'Read-optimized hierarchy view used by backend handlers for family->kingdom->subgroup->clan traversals.';

-- A1) Lookup language to family.
-- Example usage:
-- SELECT * FROM lookup_language_family('isiZulu');

-- A2) Lookup clan/lineage with confidence.
-- Example usage:
-- SELECT * FROM lookup_clan_lineage('Buthelezi', 'isiZulu') LIMIT 5;

-- Additional surname inference query (heuristic; DB-backed, no invented facts).
-- Uses structural similarity against known clans in the mapped language family.
CREATE OR REPLACE FUNCTION infer_surname_association(
  p_surname TEXT,
  p_language TEXT DEFAULT NULL
)
RETURNS TABLE (
  clan_lineage_id BIGINT,
  clan_name TEXT,
  subgroup_id BIGINT,
  subgroup_name TEXT,
  kingdom_nation_id BIGINT,
  kingdom_nation_name TEXT,
  family_id BIGINT,
  family_name TEXT,
  surname_confidence NUMERIC(5,4),
  inference_reason TEXT
)
LANGUAGE sql
STABLE
AS $$
WITH surname_input AS (
  SELECT lower(trim(coalesce(p_surname, ''))) AS surname_key
), lang_family AS (
  SELECT family_id
  FROM lookup_language_family(p_language)
  LIMIT 1
), candidate_rows AS (
  SELECT
    cl.id AS clan_lineage_id,
    cl.name AS clan_name,
    sg.id AS subgroup_id,
    sg.name AS subgroup_name,
    kn.id AS kingdom_nation_id,
    kn.name AS kingdom_nation_name,
    ef.id AS family_id,
    ef.name AS family_name,
    CASE
      WHEN lower(cl.name) = si.surname_key THEN 0.9000
      WHEN lower(cl.name) LIKE si.surname_key || '%' THEN 0.7600
      WHEN si.surname_key LIKE lower(cl.name) || '%' THEN 0.7300
      WHEN lower(cl.name) LIKE '%' || si.surname_key || '%' THEN 0.6700
      WHEN left(lower(cl.name), 4) = left(si.surname_key, 4) THEN 0.6200
      WHEN left(lower(cl.name), 3) = left(si.surname_key, 3) THEN 0.5600
      ELSE 0.4000
    END AS structural_score,
    CASE
      WHEN lf.family_id IS NOT NULL AND lf.family_id = ef.id THEN 0.0600
      WHEN lf.family_id IS NOT NULL AND lf.family_id <> ef.id THEN -0.0600
      ELSE 0.0000
    END AS language_bonus,
    CASE
      WHEN lower(cl.name) = si.surname_key THEN 'Exact surname=clan match'
      WHEN lower(cl.name) LIKE si.surname_key || '%' THEN 'Surname prefix aligns to clan name'
      WHEN si.surname_key LIKE lower(cl.name) || '%' THEN 'Clan token is surname root'
      WHEN lower(cl.name) LIKE '%' || si.surname_key || '%' THEN 'Surname token appears in clan name'
      WHEN left(lower(cl.name), 4) = left(si.surname_key, 4) THEN 'First-4-character convention match'
      WHEN left(lower(cl.name), 3) = left(si.surname_key, 3) THEN 'First-3-character convention match'
      ELSE 'Low-confidence structural fallback'
    END AS reason
  FROM surname_input si
  JOIN clans_lineages cl
    ON (
      lower(cl.name) = si.surname_key
      OR lower(cl.name) LIKE si.surname_key || '%'
      OR si.surname_key LIKE lower(cl.name) || '%'
      OR lower(cl.name) LIKE '%' || si.surname_key || '%'
      OR left(lower(cl.name), 4) = left(si.surname_key, 4)
      OR left(lower(cl.name), 3) = left(si.surname_key, 3)
    )
  JOIN subgroups sg ON sg.id = cl.subgroup_id
  JOIN kingdoms_nations kn ON kn.id = sg.kingdom_nation_id
  JOIN ethno_linguistic_families ef ON ef.id = kn.family_id
  LEFT JOIN lang_family lf ON TRUE
)
SELECT
  c.clan_lineage_id,
  c.clan_name,
  c.subgroup_id,
  c.subgroup_name,
  c.kingdom_nation_id,
  c.kingdom_nation_name,
  c.family_id,
  c.family_name,
  LEAST(1.0000, GREATEST(0.0000, c.structural_score + c.language_bonus))::NUMERIC(5,4) AS surname_confidence,
  c.reason || CASE WHEN c.language_bonus > 0 THEN '; language family aligned'
                   WHEN c.language_bonus < 0 THEN '; language family conflict'
                   ELSE '' END AS inference_reason
FROM candidate_rows c
ORDER BY surname_confidence DESC, c.clan_lineage_id;
$$;

COMMENT ON FUNCTION infer_surname_association(TEXT, TEXT) IS
'Surname-origin inference by structural clan token similarity + language-family consistency bonus/penalty.';

-- A3) Extract historical/cultural narrative records.
-- Example usage:
-- SELECT extract_entity_narratives(1, 2, 3, 4);

-- A4) Compute composite ancestry confidence.
-- Example usage:
-- SELECT compute_composite_ancestry_confidence(0.93, 0.86, 0.82, 0.79, 0.75, 0.80);

COMMIT;
