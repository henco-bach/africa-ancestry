# Ancestry Narrative Templates

These templates are designed for user-facing output and are populated only with database-derived values and computed confidence scores.

## 1) Language Classification Template

Template:

`Based on your language (%LANGUAGE%), the strongest database-supported mapping is to the %FAMILY% ethno-linguistic family (confidence %CONFIDENCE%). Reason: %REASON%.`

Inputs:
- `%LANGUAGE%`: user-provided language string
- `%FAMILY%`: `lookup_language_family(...).family_name`
- `%CONFIDENCE%`: formatted `language_confidence`
- `%REASON%`: `mapping_reason`

## 2) Clan / Lineage Match Template

Template:

`Your provided clan/lineage (%CLAN_INPUT%) best matches %CLAN_NAME% in subgroup %SUBGROUP% and kingdom/nation %KINGDOM% (confidence %CONFIDENCE%). Match basis: %REASON%.`

Inputs:
- `%CLAN_INPUT%`: user `clanOrLineageName` (or fallback marker)
- `%CLAN_NAME%`: `lookup_clan_lineage(...).clan_display_name` or `.clan_name`
- `%SUBGROUP%`: `lookup_clan_lineage(...).subgroup_name`
- `%KINGDOM%`: `lookup_clan_lineage(...).kingdom_nation_name`
- `%CONFIDENCE%`: formatted `clan_confidence`
- `%REASON%`: `match_reason`

## 3) Surname Association Template

Template:

`Your surname (%SURNAME%) shows strongest structural association with %CLAN_NAME% in %SUBGROUP% (confidence %CONFIDENCE%). Inference basis: %REASON%.`

Inputs:
- `%SURNAME%`: user surname
- `%CLAN_NAME%`: `infer_surname_association(...).clan_name`
- `%SUBGROUP%`: `infer_surname_association(...).subgroup_name`
- `%CONFIDENCE%`: formatted `surname_confidence`
- `%REASON%`: `inference_reason`

## 4) Historical and Cultural Context Template

Template:

`Historical and cultural context is assembled from matched entity descriptions and linked sources in the database. %DETAILS%`

Inputs:
- `%DETAILS%`: first non-empty `description` from matched clan/subgroup/kingdom/family (or explicit no-data fallback)

## 5) Region and Migration Template

Template:

`Region associations indicate likely historical presence and movement across: %REGIONS%.`

Inputs:
- `%REGIONS%`: derived from `extract_entity_narratives(...).regions`, ordered by historical start year

## 6) Summary Template

Template:

`Profile summary for %FULL_NAME%: strongest signals point to %FAMILY% with secondary linkage to %KINGDOM%/%SUBGROUP% and clan-level evidence at confidence %COMPOSITE_CONFIDENCE%.`

Inputs:
- `%FULL_NAME%`: given names + surname
- `%FAMILY%`: matched family name
- `%KINGDOM%`: matched kingdom name
- `%SUBGROUP%`: matched subgroup name
- `%COMPOSITE_CONFIDENCE%`: formatted output from `compute_composite_ancestry_confidence(...)`

## Credibility Rules

- Only populate placeholders from DB query results or deterministic calculations.
- If a match is missing, use explicit fallback text rather than inferred factual claims.
- Always include section-level confidence values when a section is matched.
