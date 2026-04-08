import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';

export type Gender = 'female' | 'male' | 'non_binary' | 'other';

export interface PhotoIdentityReference {
  uploadedPhotoUrl?: string;
  // Optional features from a separate vision pipeline; used only as identity hints.
  // This service does not infer these directly from the image.
  extractedTraits?: {
    skinTone?: string;
    faceShape?: string;
    hairStyle?: string;
    distinguishingFeatures?: string[];
  };
}

export interface AncestryInput {
  language: string;
  clanOrLineageName?: string;
  givenNames: string;
  surname: string;
  gender: Gender;
  dateOfBirth: string;
  timeOfBirth?: string | null;
  photo?: PhotoIdentityReference | null;
}

type DbClient = SupabaseClient;

interface LanguageFamilyRow {
  normalized_language: string;
  family_id: number;
  family_code: string;
  family_name: string;
  language_confidence: string;
  mapping_reason: string;
}

interface ClanMatchRow {
  clan_lineage_id: number;
  clan_name: string;
  clan_display_name: string;
  subgroup_id: number;
  subgroup_name: string;
  kingdom_nation_id: number;
  kingdom_nation_name: string;
  family_id: number;
  family_name: string;
  clan_confidence: string;
  match_reason: string;
}

interface SurnameMatchRow {
  clan_lineage_id: number;
  clan_name: string;
  subgroup_id: number;
  subgroup_name: string;
  kingdom_nation_id: number;
  kingdom_nation_name: string;
  family_id: number;
  family_name: string;
  surname_confidence: string;
  inference_reason: string;
}

interface RegionSummary {
  region_id: number;
  name: string;
  display_name: string | null;
  region_type: string;
  country_code: string | null;
  is_primary_region: boolean;
  historical_start_year: number | null;
  historical_end_year: number | null;
  confidence_score: number;
}

interface SourceSummary {
  source_id: number;
  title: string;
  source_type: string;
  publication_year: number | null;
  citation: string | null;
  url: string | null;
  reliability_score: number;
  entity_confidence: number;
  evidence_note: string | null;
}

interface NarrativeBundle {
  family: { id: number; name: string; display_name?: string | null; description?: string | null; confidence_score?: number } | null;
  kingdom_nation: { id: number; name: string; display_name?: string | null; description?: string | null; confidence_score?: number } | null;
  subgroup: { id: number; name: string; display_name?: string | null; description?: string | null; confidence_score?: number } | null;
  clan_lineage: { id: number; name: string; display_name?: string | null; description?: string | null; confidence_score?: number } | null;
  sources: SourceSummary[];
  regions: RegionSummary[];
}

const NARRATIVE_TEMPLATES = {
  language:
    'Based on your language (%LANGUAGE%), the strongest database-supported mapping is to the %FAMILY% ethno-linguistic family (confidence %CONFIDENCE%). Reason: %REASON%.',
  clan:
    'Your provided clan/lineage (%CLAN_INPUT%) best matches %CLAN_NAME% in subgroup %SUBGROUP% and kingdom/nation %KINGDOM% (confidence %CONFIDENCE%). Match basis: %REASON%.',
  surname:
    'Your surname (%SURNAME%) shows strongest structural association with %CLAN_NAME% in %SUBGROUP% (confidence %CONFIDENCE%). Inference basis: %REASON%.',
  history:
    'Historical and cultural context is assembled from matched entity descriptions and linked sources in the database. %DETAILS%',
  migration:
    'Region associations indicate likely historical presence and movement across: %REGIONS%.',
  uncertainty:
    'This profile is probabilistic, not a definitive genealogical proof. Confidence reflects current source coverage and match quality; lower-confidence sections should be treated as tentative.',
  summary:
    'Profile summary for %FULL_NAME%: strongest signals point to %FAMILY% with secondary linkage to %KINGDOM%/%SUBGROUP% and clan-level evidence at confidence %COMPOSITE_CONFIDENCE%.'
} as const;

function normalizeText(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function toNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatConfidence(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function applyTemplate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (acc, [key, val]) => acc.replaceAll(`%${key}%`, val),
    template
  );
}

function regionNarrative(regions: RegionSummary[]): string {
  if (!regions.length) return 'No mapped regions were found in the current dataset for matched entities.';

  const ordered = [...regions].sort((a, b) => {
    const aStart = a.historical_start_year ?? 9999;
    const bStart = b.historical_start_year ?? 9999;
    return aStart - bStart;
  });

  return ordered
    .map((r) => {
      const label = r.display_name || r.name;
      if (r.historical_start_year || r.historical_end_year) {
        return `${label} (${r.historical_start_year ?? 'unknown'}-${r.historical_end_year ?? 'present'})`;
      }
      return label;
    })
    .join(', ');
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function buildVisualEvidenceCues(bundle: NarrativeBundle): string[] {
  const entityDescriptions = [
    bundle.family?.description,
    bundle.kingdom_nation?.description,
    bundle.subgroup?.description,
    bundle.clan_lineage?.description
  ].filter((v): v is string => Boolean(v && v.trim()));

  const sourceNotes = bundle.sources
    .map((s) => s.evidence_note || '')
    .filter((v) => v.trim().length > 0);

  const regionLabels = bundle.regions
    .slice(0, 5)
    .map((r) => r.display_name || r.name)
    .filter(Boolean);

  return dedupe([...entityDescriptions, ...sourceNotes, ...regionLabels]).slice(0, 8);
}

function choosePrimaryImageAnchor(args: {
  clanMatch: ClanMatchRow | null;
  surnameMatch: SurnameMatchRow | null;
  languageMatch: LanguageFamilyRow | null;
  narrativeData: NarrativeBundle;
}) {
  const { clanMatch, surnameMatch, languageMatch, narrativeData } = args;

  if (clanMatch) {
    return {
      level: 'clan_lineage',
      label: clanMatch.clan_display_name || clanMatch.clan_name,
      subgroup: clanMatch.subgroup_name,
      kingdom: clanMatch.kingdom_nation_name,
      family: clanMatch.family_name,
      confidence: toNumber(clanMatch.clan_confidence)
    };
  }

  if (surnameMatch) {
    return {
      level: 'surname_inference',
      label: surnameMatch.clan_name,
      subgroup: surnameMatch.subgroup_name,
      kingdom: surnameMatch.kingdom_nation_name,
      family: surnameMatch.family_name,
      confidence: toNumber(surnameMatch.surname_confidence)
    };
  }

  return {
    level: 'language_family',
    label: narrativeData.family?.display_name || narrativeData.family?.name || languageMatch?.family_name || 'unresolved ancestry anchor',
    subgroup: narrativeData.subgroup?.name || 'unresolved subgroup',
    kingdom: narrativeData.kingdom_nation?.name || 'unresolved kingdom',
    family: narrativeData.family?.name || languageMatch?.family_name || 'unresolved family',
    confidence: toNumber(languageMatch?.language_confidence)
  };
}

function genderPresentation(gender: Gender): string {
  if (gender === 'female') return 'female-coded presentation';
  if (gender === 'male') return 'male-coded presentation';
  if (gender === 'non_binary') return 'non-binary presentation';
  return 'user-specified gender presentation';
}

function buildImagePrompt(args: {
  input: AncestryInput;
  anchor: ReturnType<typeof choosePrimaryImageAnchor>;
  regions: RegionSummary[];
  visualCues: string[];
}) {
  const { input, anchor, regions, visualCues } = args;
  const regionText = regionNarrative(regions);
  const cuesText = visualCues.length
    ? visualCues.map((c, i) => `${i + 1}. ${c}`).join(' | ')
    : 'No explicit attire cues are available from current structured records.';

  const traits = input.photo?.extractedTraits;
  const traitsText = traits
    ? [
        traits.skinTone ? `skin tone: ${traits.skinTone}` : '',
        traits.faceShape ? `face shape: ${traits.faceShape}` : '',
        traits.hairStyle ? `hair style: ${traits.hairStyle}` : '',
        traits.distinguishingFeatures?.length
          ? `distinguishing features: ${traits.distinguishingFeatures.join(', ')}`
          : ''
      ]
        .filter(Boolean)
        .join('; ')
    : 'No machine-extracted photo traits were provided.';

  const hasPhoto = Boolean(input.photo?.uploadedPhotoUrl);
  const hasEvidenceCues = visualCues.length > 0;
  const mode = hasPhoto && hasEvidenceCues ? 'identity_portrait' : 'symbolic_portrait';

  const prompt = [
    'Create a dignified, realistic cultural portrait for a digital ancestry report.',
    `Ancestry anchor: ${anchor.label} (${anchor.level}), family: ${anchor.family}, kingdom: ${anchor.kingdom}, subgroup: ${anchor.subgroup}.`,
    `Anchor confidence: ${formatConfidence(anchor.confidence)}.`,
    `Gender styling requirement: ${genderPresentation(input.gender)}.`,
    hasPhoto
      ? `Identity reference image URL: ${input.photo?.uploadedPhotoUrl}. Use only for facial identity continuity, skin tone, and non-sensitive visible features.`
      : 'No identity reference image available; create a symbolic stylized human figure (not a real person).',
    `Photo-derived traits: ${traitsText}`,
    `Documented cultural cues from database: ${cuesText}`,
    `Regional grounding: ${regionText}`,
    'Attire rule: include only clothing/pattern/accessory elements supported by documented cultural cues above; if cue evidence is weak, keep attire minimal and non-specific rather than inventing details.',
    'Safety and respect: avoid caricature, exoticization, exaggeration, or theatrical costume styling.',
    'Background: neutral studio-like backdrop suitable for profile card or certificate.',
    'Output label requirement: include metadata tag "Cultural interpretation, not a historical photograph."'
  ].join(' ');

  return {
    mode,
    prompt,
    explanation:
      'This image is a cultural interpretation based on available ancestry data and source-linked cues. It is not a historical photograph or definitive genealogical proof.'
  };
}

export async function generateAncestryProfile(db: DbClient, input: AncestryInput) {
  const normalized = {
    language: normalizeText(input.language),
    clanOrLineageName: normalizeText(input.clanOrLineageName),
    givenNames: normalizeText(input.givenNames),
    surname: normalizeText(input.surname),
    gender: normalizeText(input.gender),
    dateOfBirth: input.dateOfBirth,
    timeOfBirth: input.timeOfBirth ?? null
  };

  if (
    !normalized.language ||
    !normalized.givenNames ||
    !normalized.surname ||
    !normalized.gender ||
    !normalized.dateOfBirth
  ) {
    throw new Error('Missing required fields: language, givenNames, surname, gender, dateOfBirth.');
  }

  const { data: langRows } = await db.rpc('lookup_language_family', { p_language: normalized.language });
  const languageMatch: LanguageFamilyRow | null = (langRows as LanguageFamilyRow[] | null)?.[0] ?? null;

  const clanInput = normalized.clanOrLineageName || normalized.surname;
  const { data: clanRows } = await db.rpc('lookup_clan_lineage', { p_clan_name: clanInput, p_language: normalized.language });
  const clanMatch: ClanMatchRow | null = (clanRows as ClanMatchRow[] | null)?.[0] ?? null;

  const { data: surnameRows } = await db.rpc('infer_surname_association', { p_surname: normalized.surname, p_language: normalized.language });
  const surnameMatch: SurnameMatchRow | null = (surnameRows as SurnameMatchRow[] | null)?.[0] ?? null;

  const selectedFamilyId = clanMatch?.family_id ?? surnameMatch?.family_id ?? languageMatch?.family_id ?? null;
  const selectedKingdomId = clanMatch?.kingdom_nation_id ?? surnameMatch?.kingdom_nation_id ?? null;
  const selectedSubgroupId = clanMatch?.subgroup_id ?? surnameMatch?.subgroup_id ?? null;
  const selectedClanId = clanMatch?.clan_lineage_id ?? surnameMatch?.clan_lineage_id ?? null;

  const { data: narrativeRaw } = await db.rpc('extract_entity_narratives', {
    p_family_id: selectedFamilyId,
    p_kingdom_nation_id: selectedKingdomId,
    p_subgroup_id: selectedSubgroupId,
    p_clan_lineage_id: selectedClanId
  });

  const narrativeData: NarrativeBundle = (narrativeRaw as NarrativeBundle | null) ?? {
    family: null,
    kingdom_nation: null,
    subgroup: null,
    clan_lineage: null,
    sources: [],
    regions: []
  };

  const regions: RegionSummary[] = Array.isArray(narrativeData.regions) ? narrativeData.regions : [];
  const regionConfidence =
    regions.length > 0
      ? regions.reduce((acc, r) => acc + toNumber(r.confidence_score, 0), 0) / regions.length
      : 0;

  const familyConfidence = toNumber(languageMatch?.language_confidence, 0);
  const kingdomConfidence = toNumber(narrativeData.kingdom_nation?.confidence_score, 0);
  const subgroupConfidence = toNumber(narrativeData.subgroup?.confidence_score, 0);
  const clanConfidence = toNumber(
    clanMatch?.clan_confidence,
    toNumber(narrativeData.clan_lineage?.confidence_score, 0)
  );
  const surnameConfidence = toNumber(surnameMatch?.surname_confidence, 0);

  const { data: compositeRaw } = await db.rpc('compute_composite_ancestry_confidence', {
    p_family_conf: familyConfidence,
    p_kingdom_conf: kingdomConfidence,
    p_subgroup_conf: subgroupConfidence,
    p_clan_conf: clanConfidence,
    p_surname_conf: surnameConfidence,
    p_region_conf: regionConfidence
  });
  const compositeConfidence = toNumber(compositeRaw as string | number | null, 0);

  const fullName = `${input.givenNames.trim()} ${input.surname.trim()}`;

  const narrativeSections = [
    {
      id: 'language_classification',
      title: 'Ethno-Linguistic Classification',
      body: languageMatch
        ? applyTemplate(NARRATIVE_TEMPLATES.language, {
            LANGUAGE: input.language,
            FAMILY: languageMatch.family_name,
            CONFIDENCE: formatConfidence(familyConfidence),
            REASON: languageMatch.mapping_reason
          })
        : `No language-family mapping was found for "${input.language}" in the configured lookup rules.`,
      confidence: familyConfidence
    },
    {
      id: 'clan_lineage_match',
      title: 'Clan and Lineage Matching',
      body: clanMatch
        ? applyTemplate(NARRATIVE_TEMPLATES.clan, {
            CLAN_INPUT: input.clanOrLineageName || '(not provided, inferred from surname)',
            CLAN_NAME: clanMatch.clan_display_name || clanMatch.clan_name,
            SUBGROUP: clanMatch.subgroup_name,
            KINGDOM: clanMatch.kingdom_nation_name,
            CONFIDENCE: formatConfidence(toNumber(clanMatch.clan_confidence)),
            REASON: clanMatch.match_reason
          })
        : 'No direct clan/lineage match was found in the clans_lineages table for the provided input.',
      confidence: clanConfidence
    },
    {
      id: 'surname_inference',
      title: 'Surname Origin Inference',
      body: surnameMatch
        ? applyTemplate(NARRATIVE_TEMPLATES.surname, {
            SURNAME: input.surname,
            CLAN_NAME: surnameMatch.clan_name,
            SUBGROUP: surnameMatch.subgroup_name,
            CONFIDENCE: formatConfidence(toNumber(surnameMatch.surname_confidence)),
            REASON: surnameMatch.inference_reason
          })
        : `No surname-based clan association was found for "${input.surname}" using current database conventions.`,
      confidence: surnameConfidence
    },
    {
      id: 'history_culture',
      title: 'Historical and Cultural Context',
      body: applyTemplate(NARRATIVE_TEMPLATES.history, {
        DETAILS:
          narrativeData.family?.description ||
          narrativeData.kingdom_nation?.description ||
          narrativeData.subgroup?.description ||
          narrativeData.clan_lineage?.description ||
          'No description text is currently stored for the matched entities.'
      }),
      confidence: Math.max(kingdomConfidence, subgroupConfidence)
    },
    {
      id: 'regions_migrations',
      title: 'Regions and Migrations',
      body: applyTemplate(NARRATIVE_TEMPLATES.migration, {
        REGIONS: regionNarrative(regions)
      }),
      confidence: regionConfidence
    },
    {
      id: 'uncertainty_notice',
      title: 'Uncertainty and Evidence Limits',
      body: NARRATIVE_TEMPLATES.uncertainty,
      confidence: compositeConfidence
    },
    {
      id: 'summary',
      title: 'Profile Summary',
      body: applyTemplate(NARRATIVE_TEMPLATES.summary, {
        FULL_NAME: fullName,
        FAMILY: languageMatch?.family_name || narrativeData.family?.name || 'unresolved family mapping',
        KINGDOM: narrativeData.kingdom_nation?.name || 'unresolved kingdom',
        SUBGROUP: narrativeData.subgroup?.name || 'unresolved subgroup',
        COMPOSITE_CONFIDENCE: formatConfidence(compositeConfidence)
      }),
      confidence: compositeConfidence
    }
  ];

  const anchor = choosePrimaryImageAnchor({ clanMatch, surnameMatch, languageMatch, narrativeData });
  const visualCues = buildVisualEvidenceCues(narrativeData);
  const generatedImage = buildImagePrompt({
    input,
    anchor,
    regions,
    visualCues
  });

  return {
    ancestryProfile: {
      person: {
        fullName,
        givenNames: input.givenNames,
        surname: input.surname,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth,
        timeOfBirth: input.timeOfBirth ?? null
      },
      input: {
        language: input.language,
        clanOrLineageName: input.clanOrLineageName ?? null,
        photoProvided: Boolean(input.photo?.uploadedPhotoUrl)
      },
      normalizedInput: normalized,
      matches: {
        languageFamily: languageMatch,
        clanLineage: clanMatch,
        surnameAssociation: surnameMatch
      },
      hierarchy: {
        family: narrativeData.family,
        kingdomNation: narrativeData.kingdom_nation,
        subgroup: narrativeData.subgroup,
        clanLineage: narrativeData.clan_lineage
      },
      sources: narrativeData.sources,
      regions
    },
    confidenceBreakdown: {
      family: familyConfidence,
      kingdom: kingdomConfidence,
      subgroup: subgroupConfidence,
      clan: clanConfidence,
      surname: surnameConfidence,
      region: regionConfidence,
      composite: compositeConfidence
    },
    narrativeSections,
    generatedImage: {
      imagePrompt: generatedImage.prompt,
      mode: generatedImage.mode,
      explanation: generatedImage.explanation
    }
  };
}

export function createAncestryProfileHandler(db: DbClient) {
  return async function ancestryProfileHandler(req: Request, res: Response) {
    try {
      const profile = await generateAncestryProfile(db, req.body as AncestryInput);
      res.status(200).json(profile);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({ ok: false, error: message });
    }
  };
}

/*
Upload integration note:
- If you accept multipart uploads, parse file via middleware (e.g., multer) and store it.
- Set req.body.photo.uploadedPhotoUrl to the stored asset URL before calling this handler.
- If a vision pipeline extracts non-sensitive identity traits, populate req.body.photo.extractedTraits.
*/
