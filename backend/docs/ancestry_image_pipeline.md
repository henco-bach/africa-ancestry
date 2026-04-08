# Ancestry + Cultural Portrait Pipeline

This backend uses database-first inference and only emits culturally grounded output when evidence exists.

## A) Backend logic (implemented)

Implemented in:
- `/Users/hencobach/Desktop/Africa-Ancestry/backend/src/ancestryProfileHandler.ts`

Flow:
1. Validate and normalize user inputs (`language`, `clanOrLineageName`, names, `gender`, DOB, optional photo metadata).
2. Run deterministic DB inference:
- `lookup_language_family(language)`
- `lookup_clan_lineage(clan, language)`
- `infer_surname_association(surname, language)`
3. Resolve strongest hierarchy anchor (clan > surname > language).
4. Pull only stored historical/cultural/source/region records via `extract_entity_narratives(...)`.
5. Compute confidence breakdown and final composite via `compute_composite_ancestry_confidence(...)`.
6. Build narrative sections with explicit confidence and uncertainty statement.
7. Build image prompt:
- If photo + evidence cues: identity portrait mode.
- Else: symbolic portrait mode.
- Always include strict non-invention constraints.

## B) Image prompt template

```txt
Create a dignified, realistic cultural portrait for a digital ancestry report.
Ancestry anchor: {{anchor_label}} ({{anchor_level}}), family: {{family}}, kingdom: {{kingdom}}, subgroup: {{subgroup}}.
Anchor confidence: {{anchor_confidence}}.
Gender styling requirement: {{gender_presentation}}.
{{if photo_url}}Identity reference image URL: {{photo_url}}. Use only for facial identity continuity, skin tone, and non-sensitive visible features.{{else}}No identity reference image available; create a symbolic stylized human figure (not a real person).{{/if}}
Photo-derived traits: {{photo_traits_or_none}}.
Documented cultural cues from database: {{numbered_cues_or_none}}.
Regional grounding: {{region_summary}}.
Attire rule: include only clothing/pattern/accessory elements supported by documented cultural cues above; if cue evidence is weak, keep attire minimal and non-specific rather than inventing details.
Safety and respect: avoid caricature, exoticization, exaggeration, or theatrical costume styling.
Background: neutral studio-like backdrop suitable for profile card or certificate.
Output label requirement: include metadata tag "Cultural interpretation, not a historical photograph."
```

## C) Final response object contract

```json
{
  "ancestryProfile": {
    "person": {
      "fullName": "...",
      "givenNames": "...",
      "surname": "...",
      "gender": "female",
      "dateOfBirth": "1990-06-10",
      "timeOfBirth": "08:15"
    },
    "input": {
      "language": "isiZulu",
      "clanOrLineageName": "Buthelezi",
      "photoProvided": true
    },
    "normalizedInput": {},
    "matches": {},
    "hierarchy": {},
    "sources": [],
    "regions": []
  },
  "confidenceBreakdown": {
    "family": 0.93,
    "kingdom": 0.86,
    "subgroup": 0.81,
    "clan": 0.88,
    "surname": 0.75,
    "region": 0.72,
    "composite": 0.84
  },
  "narrativeSections": [
    {
      "id": "language_classification",
      "title": "Ethno-Linguistic Classification",
      "body": "...",
      "confidence": 0.93
    }
  ],
  "generatedImage": {
    "imagePrompt": "...",
    "mode": "identity_portrait",
    "explanation": "This image is a cultural interpretation based on available ancestry data and source-linked cues. It is not a historical photograph or definitive genealogical proof."
  }
}
```

## Why this preserves accuracy and respect

- Historical accuracy: only uses rows from your ancestry + source + region tables.
- Cultural respect: prompt forbids caricature and requires evidence-linked cues.
- Honest uncertainty: every section returns confidence, plus explicit probabilistic disclaimer.
- No fabricated ancestry: unresolved matches remain unresolved in output text.
