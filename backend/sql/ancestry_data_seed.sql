-- Ancestry seed data — Southern African focus.
-- Run AFTER ancestry_data_schema.sql and ancestry_profile_functions.sql.

BEGIN;

-- ── Ethno-linguistic families ─────────────────────────────────────────────────

INSERT INTO ethno_linguistic_families (code, name, display_name, description, confidence_score) VALUES
  ('nguni',       'Nguni',        'Nguni Peoples',       'The Nguni peoples form one of the largest ethno-linguistic groupings in Southern Africa, with deep roots in the eastern coastal regions. Their languages share a distinctive click-consonant heritage absorbed from earlier Khoisan contact. Nguni societies historically organised around cattle-keeping, lineage-based kinship, and powerful chieftainships.', 0.9500),
  ('sotho_tswana','Sotho-Tswana', 'Sotho-Tswana Peoples','The Sotho-Tswana grouping encompasses the Southern, Northern, and Western Sotho language communities. These peoples built fortified hilltop settlements and developed sophisticated systems of governance, cattle exchange, and long-distance trade across the interior plateau of Southern Africa.', 0.9400),
  ('venda',       'Venda',        'Vhavenda',            'The Vhavenda inhabit the Limpopo highlands of northeastern South Africa and are known for elaborate spiritual traditions, sacred lakes, and a distinctive musical heritage including the domba initiation ceremony. Their history reflects migration from Great Zimbabwe and earlier Zimbabwe Plateau cultures.', 0.9300),
  ('tsonga',      'Tsonga',       'Tsonga-Shangaan',     'The Tsonga and Shangaan peoples occupy coastal and lowveld zones across southern Mozambique, Limpopo, and Mpumalanga. Their culture incorporates elements from both Nguni and Central African traditions, with a rich tradition of music, dance, and coastal trading networks.', 0.9200),
  ('ndebele',     'Ndebele',      'Ndebele Peoples',     'The Ndebele are a Nguni-related grouping known for their strikingly geometric mural art and beadwork traditions. The Southern Ndebele settled in Mpumalanga, while the Northern Ndebele established the Matabele Kingdom in present-day Zimbabwe under Mzilikazi.', 0.9100)
ON CONFLICT (code) DO NOTHING;

-- ── Kingdoms / Nations ────────────────────────────────────────────────────────

INSERT INTO kingdoms_nations (code, name, display_name, description, confidence_score, family_id) VALUES
  -- Nguni
  ('zulu_kingdom',  'Zulu',    'Zulu Kingdom',
   'The Zulu Kingdom emerged as a dominant military and political force in Southern Africa under Shaka in the early nineteenth century. Drawing on the amabutho regimental system, Shaka unified dozens of northern Nguni clans into a centralised state. The kingdom withstood British colonial pressure until its defeat at the Battle of Ulundi in 1879.',
   0.9600, (SELECT id FROM ethno_linguistic_families WHERE code = 'nguni')),

  ('xhosa_nation',  'Xhosa',   'Xhosa Nation',
   'The Xhosa Nation comprises multiple polities along the Eastern Cape coast and interior. Divided historically into groups led by descendants of the Xhosa paramount lineage, the nation is noted for its click-rich language, cattle-centred economy, and sustained resistance to colonial encroachment through the Frontier Wars.',
   0.9500, (SELECT id FROM ethno_linguistic_families WHERE code = 'nguni')),

  ('swazi_kingdom', 'Swazi',   'Swazi Kingdom',
   'The Swazi Kingdom, centred on present-day Eswatini, was consolidated by Sobhuza I and Mswati II during the nineteenth century. Swazi culture is renowned for its annual Incwala and Umhlanga ceremonies, which reaffirm royal authority and national unity. The Dlamini clan holds the royal lineage.',
   0.9400, (SELECT id FROM ethno_linguistic_families WHERE code = 'nguni')),

  ('matabele_kingdom','Ndebele / Matabele','Matabele Kingdom',
   'Founded by Mzilikazi after his break with Shaka, the Matabele Kingdom settled in the southwestern Zimbabwe Plateau. The kingdom absorbed many Sotho and Shona people through conquest and assimilation, creating a layered society of Nguni core and absorbed groups.',
   0.9000, (SELECT id FROM ethno_linguistic_families WHERE code = 'ndebele')),

  -- Sotho-Tswana
  ('basotho_kingdom','Basotho','Kingdom of Lesotho',
   'Founded by Moshoeshoe I in the early nineteenth century, the Basotho kingdom united diverse Sotho-Tswana clans fleeing the Mfecane upheavals. Moshoeshoe skilfully used diplomacy, mountain fortresses, and later British protection to preserve Basotho sovereignty. The Koena (crocodile) totem clan holds the royal lineage.',
   0.9500, (SELECT id FROM ethno_linguistic_families WHERE code = 'sotho_tswana')),

  ('batswana_nation','Batswana','Batswana Peoples',
   'The Batswana inhabit the semi-arid Kalahari regions of Botswana, North West South Africa, and adjacent areas. Historically organised into independent chiefdoms (merafe), the Batswana are known for cattle wealth, sorghum cultivation, and elaborate age-regiment systems.',
   0.9300, (SELECT id FROM ethno_linguistic_families WHERE code = 'sotho_tswana')),

  ('bapedi_kingdom','Bapedi','Bapedi Kingdom',
   'The Bapedi (Northern Sotho / Sepedi speakers) are centred in the Limpopo province of South Africa. Under Chief Sekhukhune, the Bapedi mounted the most sustained armed resistance to Boer and British encroachment in the Transvaal during the 1870s.',
   0.9200, (SELECT id FROM ethno_linguistic_families WHERE code = 'sotho_tswana')),

  -- Venda
  ('vhavenda_nation','Vhavenda','Vhavenda',
   'The Vhavenda trace their origins to migrations from the Zimbabwe Plateau and earlier Mapungubwe-era cultures. Centred on the Soutpansberg mountains and Lake Fundudzi — a sacred site — the Vhavenda maintained independence from both Zulu and Boer expansions until the late nineteenth century.',
   0.9400, (SELECT id FROM ethno_linguistic_families WHERE code = 'venda')),

  -- Tsonga
  ('tsonga_nation','Tsonga','Tsonga / Shangaan',
   'The Tsonga occupy the lowveld and coastal zones from southern Mozambique through Limpopo and Mpumalanga. The Shangaan sub-group descends from followers of Soshangane, who built the Gaza Kingdom in Mozambique after leaving the Zulu sphere. Tsonga culture is noted for its elaborate xitsonga music and dance traditions.',
   0.9100, (SELECT id FROM ethno_linguistic_families WHERE code = 'tsonga'))

ON CONFLICT (code) DO NOTHING;

-- ── Subgroups ─────────────────────────────────────────────────────────────────

INSERT INTO subgroups (code, name, display_name, description, confidence_score, kingdom_nation_id) VALUES
  -- Zulu subgroups
  ('zulu_core',     'Zulu Core',      'Core Zulu Clans',
   'The original Zulu clan and the closely allied northern Nguni clans that were absorbed into the Zulu polity under Shaka. These clans retain the highest internal prestige and are concentrated around the Emakhosini (Valley of the Kings) in KwaZulu-Natal.',
   0.9000, (SELECT id FROM kingdoms_nations WHERE code = 'zulu_kingdom')),

  ('zulu_mthethwa', 'Mthethwa',      'Mthethwa Paramountcy',
   'The Mthethwa were the dominant paramountcy in the northern Nguni region before Shaka. Under Dingiswayo, the Mthethwa pioneered the age-regiment system that Shaka later expanded. The Mthethwa were absorbed into the Zulu state after Dingiswayo''s death.',
   0.8800, (SELECT id FROM kingdoms_nations WHERE code = 'zulu_kingdom')),

  ('zulu_ndwandwe', 'Ndwandwe',      'Ndwandwe Alliance',
   'The Ndwandwe under Zwide were the principal rivals of both the Mthethwa and early Zulu. After defeat by Shaka at the Battle of Mhlatuze River, Ndwandwe remnants fled north under Zwangendaba (founding the Ngoni diaspora) or were absorbed into the Zulu state.',
   0.8700, (SELECT id FROM kingdoms_nations WHERE code = 'zulu_kingdom')),

  -- Xhosa subgroups
  ('gcaleka',       'Gcaleka',        'Gcaleka (Paramount House)',
   'The Gcaleka represent the paramount house of the Xhosa Nation, tracing descent from Gcaleka, son of Phalo. They are the senior Xhosa lineage and were historically centred east of the Kei River in the Transkei region.',
   0.9100, (SELECT id FROM kingdoms_nations WHERE code = 'xhosa_nation')),

  ('ngqika',        'Ngqika',         'Ngqika (Rharhabe House)',
   'The Ngqika are the most numerous Xhosa subgroup, descending from Ngqika son of Mlawu of the Rharhabe house. They occupied the territory between the Fish and Kei Rivers and bore the brunt of the Frontier Wars with the Cape Colony.',
   0.9000, (SELECT id FROM kingdoms_nations WHERE code = 'xhosa_nation')),

  ('ndlambe',       'Ndlambe',        'Ndlambe',
   'Ndlambe was a regent of the Rharhabe house who became powerful in his own right. His people settled close to the colonial frontier and were central participants in the early Frontier Wars.',
   0.8800, (SELECT id FROM kingdoms_nations WHERE code = 'xhosa_nation')),

  -- Swazi subgroups
  ('dlamini_royal', 'Dlamini',        'Dlamini Royal Clan',
   'The Dlamini is the royal clan of the Swazi nation. The name is also widely distributed among Zulu-speaking communities, reflecting old Nguni kinship networks that predate the formation of the Swazi state.',
   0.9300, (SELECT id FROM kingdoms_nations WHERE code = 'swazi_kingdom')),

  ('swazi_true_swazi','True Swazi',   'True Swazi (Bemdzabuko)',
   'The Bemdzabuko (True Swazi) are the clans that accompanied the Dlamini ruling house during the formation of the Swazi kingdom. They hold senior ceremonial and administrative roles.',
   0.8900, (SELECT id FROM kingdoms_nations WHERE code = 'swazi_kingdom')),

  -- Basotho subgroups
  ('koena',         'Koena',          'Koena Clan',
   'The Koena (crocodile totem) is the royal clan of the Basotho, to which Moshoeshoe I belonged. The Koena trace their lineage through a chain of chiefs stretching back through oral tradition to Monaheng, founder of the Basotho line.',
   0.9200, (SELECT id FROM kingdoms_nations WHERE code = 'basotho_kingdom')),

  ('bataung',       'Bataung',        'Bataung (Lion Clan)',
   'The Bataung (lion totem) are one of the major allied clans of the Basotho confederacy. They allied with Moshoeshoe''s Koena after the disruptions of the Mfecane.',
   0.8700, (SELECT id FROM kingdoms_nations WHERE code = 'basotho_kingdom')),

  -- Batswana subgroups
  ('bangwaketse',   'Bangwaketse',    'Bangwaketse',
   'The Bangwaketse are one of the principal Tswana merafe (chiefdoms), historically dominant in what is now southern Botswana. They are known for their fierce resistance to Ndebele raids in the nineteenth century.',
   0.8900, (SELECT id FROM kingdoms_nations WHERE code = 'batswana_nation')),

  ('bakwena',       'Bakwena',        'Bakwena (Crocodile)',
   'The Bakwena (crocodile totem) are one of the most historically prominent Tswana merafe. The missionary David Livingstone worked among the Bakwena under Chief Sechele in the 1840s. They are centred in modern Botswana.',
   0.9000, (SELECT id FROM kingdoms_nations WHERE code = 'batswana_nation')),

  ('batlhaping',    'Batlhaping',     'Batlhaping',
   'The Batlhaping were the southernmost Tswana grouping and were among the first to have sustained contact with European travellers and missionaries entering from the Cape. John Campbell documented them in the early nineteenth century.',
   0.8800, (SELECT id FROM kingdoms_nations WHERE code = 'batswana_nation')),

  -- Bapedi subgroups
  ('bapedi_core',   'Bapedi Core',    'Marota / Bapedi Core',
   'The core Bapedi clans under the Maroteng dynasty centred on the Steelpoort River valley in Limpopo. Their kingdom resisted Boer and British forces under Sekhukhune I until 1879.',
   0.9000, (SELECT id FROM kingdoms_nations WHERE code = 'bapedi_kingdom')),

  -- Vhavenda subgroups
  ('vhavenda_singo','Singo',          'Singo (Royal Clan)',
   'The Singo clan is the royal lineage of the Vhavenda, arriving from the Zimbabwe Plateau and establishing dominance over earlier Venda-speaking groups. The Singo chief Thoho-ya-Ndou unified the Venda chieftaincies in the eighteenth century.',
   0.9200, (SELECT id FROM kingdoms_nations WHERE code = 'vhavenda_nation')),

  ('vhavenda_mbedzi','Mbedzi',        'Mbedzi',
   'The Mbedzi are one of the original Venda-speaking groups predating the Singo migration, regarded as custodians of the sacred Lake Fundudzi and its associated rain-making and python cult traditions.',
   0.8700, (SELECT id FROM kingdoms_nations WHERE code = 'vhavenda_nation')),

  -- Tsonga subgroups
  ('shangaan',      'Shangaan',       'Shangaan',
   'The Shangaan are descendants of the followers of Soshangane, who broke away from the Zulu sphere and established the Gaza Kingdom in Mozambique. The Shangaan absorbed many Tsonga-speaking groups and today are strongly associated with Limpopo and Mpumalanga in South Africa.',
   0.9100, (SELECT id FROM kingdoms_nations WHERE code = 'tsonga_nation')),

  ('tsonga_nkuna',  'Nkuna',          'Nkuna / Makuleke',
   'The Nkuna and Makuleke are Tsonga sub-groups historically settled in the area around what is now the Kruger National Park. The Makuleke were controversially removed from their land in 1969 and later won a landmark land restitution claim.',
   0.8600, (SELECT id FROM kingdoms_nations WHERE code = 'tsonga_nation'))

ON CONFLICT (code) DO NOTHING;

-- ── Clans / Lineages ──────────────────────────────────────────────────────────

INSERT INTO clans_lineages (code, name, display_name, description, confidence_score, subgroup_id) VALUES
  -- Zulu Core
  ('buthelezi',  'Buthelezi',  'Buthelezi',
   'The Buthelezi are one of the most prominent Zulu clans, serving historically as prime ministers (indunas) of the Zulu royal house. The Buthelezi clan homeland is in the Mahlabathini district of KwaZulu-Natal.',
   0.9500, (SELECT id FROM subgroups WHERE code = 'zulu_core')),

  ('ntuli',      'Ntuli',      'Ntuli',
   'The Ntuli are a major Zulu clan known for their warrior traditions and historical loyalty to the Zulu royal house. Their izithakazelo (praise names) celebrate cattle and courage.',
   0.9200, (SELECT id FROM subgroups WHERE code = 'zulu_core')),

  ('nxumalo',    'Nxumalo',    'Nxumalo',
   'The Nxumalo clan has deep roots in the northern Nguni region and is found across KwaZulu-Natal and Mpumalanga. The name is linked to lineages that predate the Zulu state.',
   0.9000, (SELECT id FROM subgroups WHERE code = 'zulu_core')),

  ('zulu_royal', 'Zulu',       'Zulu (Royal Clan)',
   'The Zulu clan itself is the nucleus from which Shaka built his kingdom. Originally a small chiefdom under Senzangakhona, the Zulu name became synonymous with the entire state after Shaka''s expansion.',
   0.9700, (SELECT id FROM subgroups WHERE code = 'zulu_core')),

  ('mbatha',     'Mbatha',     'Mbatha',
   'The Mbatha are a well-established Zulu clan whose izithakazelo connect them to cattle-herding traditions of the precolonial era. The name is found widely across KwaZulu-Natal.',
   0.8900, (SELECT id FROM subgroups WHERE code = 'zulu_core')),

  ('majola',     'Majola',     'Majola',
   'The Majola clan is notable for being claimed by both Zulu and Xhosa genealogical traditions, reflecting the old northern Nguni kinship networks that straddled the two later national identities.',
   0.8700, (SELECT id FROM subgroups WHERE code = 'zulu_core')),

  -- Mthethwa
  ('mthembu',    'Mthembu',    'Mthembu',
   'The Mthembu are the core lineage of the Mthethwa paramountcy. After absorption into the Zulu state, the Mthembu retained internal prestige and their izithakazelo preserve memory of Dingiswayo''s era.',
   0.9100, (SELECT id FROM subgroups WHERE code = 'zulu_mthethwa')),

  -- Ndwandwe
  ('ndwandwe_cl','Ndwandwe',   'Ndwandwe',
   'The Ndwandwe lineage connects to the powerful Ndwandwe polity under Zwide. Remnants not absorbed into the Zulu state fled north and founded the Ngoni migrations across Central Africa.',
   0.8800, (SELECT id FROM subgroups WHERE code = 'zulu_ndwandwe')),

  -- Gcaleka
  ('gcaleka_cl', 'Gcaleka',    'Gcaleka',
   'The Gcaleka are the paramount house of the Xhosa nation. The iziduko (clan praises) of the Gcaleka reference cattle, the sea, and the Kei River, anchoring their identity in the eastern seaboard.',
   0.9400, (SELECT id FROM subgroups WHERE code = 'gcaleka')),

  -- Ngqika
  ('rharhabe',   'Rharhabe',   'Rharhabe',
   'Rharhabe was the progenitor of the Ngqika and Ndlambe branches of the Xhosa nation. The Rharhabe house split after his death, leading to the distinct Ngqika and Ndlambe polities.',
   0.9200, (SELECT id FROM subgroups WHERE code = 'ngqika')),

  ('ngqika_cl',  'Ngqika',     'Ngqika',
   'Ngqika (Gaika) was the chief of the Rharhabe house who engaged in sustained conflict with colonial forces while also maintaining diplomatic contact with the Cape Colony.',
   0.9100, (SELECT id FROM subgroups WHERE code = 'ngqika')),

  ('jola',       'Jola',       'Jola',
   'The Jola are a Xhosa sub-lineage associated with the Ngqika branch. Their iziduko link them to the interior valleys of the Eastern Cape.',
   0.8600, (SELECT id FROM subgroups WHERE code = 'ngqika')),

  -- Ndlambe
  ('ndlambe_cl', 'Ndlambe',    'Ndlambe',
   'Ndlambe was a powerful regent and chief whose followers were heavily involved in the early Frontier Wars. The Ndlambe lineage is associated with the lower Fish River area.',
   0.9000, (SELECT id FROM subgroups WHERE code = 'ndlambe')),

  -- Swazi / Dlamini
  ('dlamini',    'Dlamini',    'Dlamini',
   'The Dlamini is the royal clan of the Swazi nation and one of the most widely distributed Nguni surnames across Southern Africa. In the Swazi context, the Dlamini are the Bemdzabuko (true Swazi) royal lineage.',
   0.9600, (SELECT id FROM subgroups WHERE code = 'dlamini_royal')),

  ('nkosi',      'Nkosi',      'Nkosi',
   'Nkosi (meaning "chief" or "lord") is a lineage name found across Nguni-speaking communities. In the Swazi sphere it marks descent from minor ruling houses aligned with the Dlamini paramountcy.',
   0.8800, (SELECT id FROM subgroups WHERE code = 'swazi_true_swazi')),

  -- Basotho
  ('moshoeshoe', 'Moshoeshoe', 'Moshoeshoe Lineage',
   'The lineage of Moshoeshoe I, founder of the Basotho nation. His descendants continue to hold the Lesotho monarchy. The Moshoeshoe name is associated with leadership, diplomacy, and mountain resilience.',
   0.9700, (SELECT id FROM subgroups WHERE code = 'koena')),

  ('koena_cl',   'Koena',      'Koena',
   'The Koena (crocodile) is the royal totem clan of the Basotho. The clan name represents the strength and endurance of the crocodile and is found across Lesotho, Free State, and adjacent provinces.',
   0.9300, (SELECT id FROM subgroups WHERE code = 'koena')),

  ('bataung_cl', 'Bataung',    'Bataung',
   'The Bataung (lion) clan is an allied lineage of the Basotho confederation. They are found in the Free State and Lesotho highlands.',
   0.8800, (SELECT id FROM subgroups WHERE code = 'bataung')),

  -- Batswana
  ('bangwaketse_cl','Bangwaketse','Bangwaketse',
   'The Bangwaketse were a powerful Tswana chiefdom in southern Botswana known for resisting Ndebele raids and maintaining significant cattle wealth.',
   0.9000, (SELECT id FROM subgroups WHERE code = 'bangwaketse')),

  ('bakwena_cl', 'Bakwena',    'Bakwena',
   'The Bakwena (crocodile) chiefdom was one of the most historically prominent Tswana merafe. Sechele, their chief in the 1840s, was briefly converted to Christianity by David Livingstone.',
   0.9100, (SELECT id FROM subgroups WHERE code = 'bakwena')),

  ('batlhaping_cl','Batlhaping','Batlhaping',
   'The Batlhaping were among the first Tswana people encountered by European explorers from the Cape. Waterboer, their chief in the early nineteenth century, negotiated mineral rights on behalf of his people.',
   0.8700, (SELECT id FROM subgroups WHERE code = 'batlhaping')),

  -- Bapedi
  ('maroteng',   'Maroteng',   'Maroteng Dynasty',
   'The Maroteng dynasty is the ruling lineage of the Bapedi kingdom. Sekhukhune I of the Maroteng led prolonged armed resistance against Boer and British forces in the 1870s.',
   0.9300, (SELECT id FROM subgroups WHERE code = 'bapedi_core')),

  -- Vhavenda
  ('singo_cl',   'Singo',      'Singo',
   'The Singo royal clan arrived from the Zimbabwe Plateau and unified the Vhavenda under Thoho-ya-Ndou in the eighteenth century. The Singo hold custodianship of the Vhavenda sacred sites including Lake Fundudzi.',
   0.9400, (SELECT id FROM subgroups WHERE code = 'vhavenda_singo')),

  ('mbedzi_cl',  'Mbedzi',     'Mbedzi',
   'The Mbedzi are among the original inhabitants of the Soutpansberg region and are associated with the sacred Lake Fundudzi python cult and rain-making traditions predating Singo arrival.',
   0.8700, (SELECT id FROM subgroups WHERE code = 'vhavenda_mbedzi')),

  -- Shangaan / Tsonga
  ('soshangane', 'Soshangane', 'Soshangane Lineage',
   'Soshangane fled the Zulu wars northward and established the Gaza Kingdom in Mozambique. His descendants and followers became the Shangaan people. The lineage name represents the founding of Tsonga-Nguni fusion culture.',
   0.9300, (SELECT id FROM subgroups WHERE code = 'shangaan')),

  ('baloyi',     'Baloyi',     'Baloyi',
   'The Baloyi are a Tsonga clan with deep roots in the Limpopo lowveld. Their iziduko link them to the Limpopo River basin and cross-border kin networks extending into Mozambique.',
   0.9000, (SELECT id FROM subgroups WHERE code = 'shangaan')),

  ('maluleke',   'Maluleke',   'Maluleke',
   'The Maluleke are a prominent Tsonga clan from the northern Limpopo lowveld. They are associated with the Makuleke community whose landmark land restitution claim restored territory within the Kruger National Park.',
   0.9100, (SELECT id FROM subgroups WHERE code = 'tsonga_nkuna')),

  ('nkuna_cl',   'Nkuna',      'Nkuna',
   'The Nkuna clan is a Tsonga lineage historically settled in the Bushveld lowveld. Their connections span the modern borders of South Africa and Mozambique.',
   0.8800, (SELECT id FROM subgroups WHERE code = 'tsonga_nkuna'))

ON CONFLICT (code) DO NOTHING;

-- ── Regions ───────────────────────────────────────────────────────────────────

INSERT INTO regions (name, display_name, region_type, country_code) VALUES
  ('kwazulu_natal',     'KwaZulu-Natal',            'province',             'ZA'),
  ('eastern_cape',      'Eastern Cape',              'province',             'ZA'),
  ('mpumalanga',        'Mpumalanga',                'province',             'ZA'),
  ('limpopo',           'Limpopo',                   'province',             'ZA'),
  ('north_west',        'North West Province',       'province',             'ZA'),
  ('free_state',        'Free State',                'province',             'ZA'),
  ('gauteng',           'Gauteng',                   'province',             'ZA'),
  ('lesotho',           'Lesotho',                   'country',              'LS'),
  ('eswatini',          'Eswatini (Swaziland)',       'country',              'SZ'),
  ('botswana',          'Botswana',                  'country',              'BW'),
  ('mozambique_south',  'Southern Mozambique',       'geographic_zone',      'MZ'),
  ('zimbabwe_southwest','Southwestern Zimbabwe',     'geographic_zone',      'ZW'),
  ('zululand',          'Zululand (historical)',      'historical_territory', 'ZA'),
  ('transkei',          'Transkei (historical)',      'historical_territory', 'ZA'),
  ('transvaal',         'Transvaal (historical)',     'historical_territory', 'ZA'),
  ('soutpansberg',      'Soutpansberg Mountains',    'geographic_zone',      'ZA'),
  ('limpopo_river_basin','Limpopo River Basin',      'geographic_zone',      NULL),
  ('kalahari',          'Kalahari Region',           'geographic_zone',      NULL),
  ('highveld',          'Southern African Highveld', 'geographic_zone',      NULL),
  ('drakensberg',       'Drakensberg / Maluti Mountains','geographic_zone',  NULL)
ON CONFLICT (name) DO NOTHING;

-- ── Sources ───────────────────────────────────────────────────────────────────

INSERT INTO sources (title, source_type, publication_year, citation, reliability_score) VALUES
  ('The Zulu Aftermath: A Nineteenth-Century Revolution in Bantu Africa',
   'book', 1966, 'Omer-Cooper, J.D. (1966). The Zulu Aftermath. Longman.', 0.9200),

  ('The Sotho-Tswana Peoples of Southern Africa',
   'book', 1974, 'Hammond-Tooke, W.D. (Ed.) (1974). The Bantu-Speaking Peoples of Southern Africa. Routledge & Kegan Paul.', 0.9000),

  ('Peoples of Southern Africa: Linguistic, Ethnic and Cultural Diversity',
   'journal', 2001, 'Elphick, R. & Davenport, R. (Eds.) (2001). Journal of Southern African Studies.', 0.8800),

  ('The Xhosa Peoples of the Eastern Cape',
   'book', 1982, 'Peires, J.B. (1982). The House of Phalo. Ravan Press.', 0.9300),

  ('A History of the Basotho: Ancient and Modern',
   'book', 1975, 'Thompson, L. (1975). Survival in Two Worlds: Moshoeshoe of Lesotho 1786-1870. Oxford University Press.', 0.9100),

  ('The Ndebele Kingdom in Zimbabwe',
   'book', 1987, 'Cobbing, J. (1976). The Ndebele under the Khumalos. PhD Thesis, Lancaster University.', 0.8700),

  ('Vhavenda History and Culture',
   'book', 1931, 'Stayt, H.A. (1931). The BaVenda. Oxford University Press.', 0.8500),

  ('Tsonga / Shangaan Heritage Documentation',
   'archive', 1995, 'South African Heritage Resources Agency. Tsonga Cultural Heritage Records, 1995.', 0.8200),

  ('Southern African Oral Traditions Database',
   'oral_tradition', 2010, 'University of Witwatersrand Oral History Archive. Compiled 2005-2010.', 0.7800),

  ('Tswana Peoples and Chiefdoms of Botswana',
   'book', 1969, 'Schapera, I. (1969). A Handbook of Tswana Law and Custom. Frank Cass.', 0.9000)
ON CONFLICT DO NOTHING;

-- ── Entity → Region links ─────────────────────────────────────────────────────

-- Nguni family → broad Southern African coastal zone
INSERT INTO entity_regions (family_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT f.id, r.id, TRUE, 1500, 0.9000
FROM ethno_linguistic_families f, regions r
WHERE f.code = 'nguni' AND r.name IN ('kwazulu_natal','eastern_cape','mpumalanga','eswatini');

-- Sotho-Tswana family
INSERT INTO entity_regions (family_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT f.id, r.id, TRUE, 1400, 0.9000
FROM ethno_linguistic_families f, regions r
WHERE f.code = 'sotho_tswana' AND r.name IN ('free_state','lesotho','north_west','botswana','highveld');

-- Venda family
INSERT INTO entity_regions (family_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT f.id, r.id, TRUE, 1700, 0.9000
FROM ethno_linguistic_families f, regions r
WHERE f.code = 'venda' AND r.name IN ('limpopo','soutpansberg');

-- Tsonga family
INSERT INTO entity_regions (family_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT f.id, r.id, TRUE, 1600, 0.8800
FROM ethno_linguistic_families f, regions r
WHERE f.code = 'tsonga' AND r.name IN ('limpopo','mpumalanga','mozambique_south','limpopo_river_basin');

-- Zulu Kingdom
INSERT INTO entity_regions (kingdom_nation_id, region_id, is_primary_region, historical_start_year, historical_end_year, confidence_score)
SELECT k.id, r.id, TRUE, 1816, NULL, 0.9500
FROM kingdoms_nations k, regions r
WHERE k.code = 'zulu_kingdom' AND r.name = 'zululand';

INSERT INTO entity_regions (kingdom_nation_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT k.id, r.id, FALSE, 1816, 0.9000
FROM kingdoms_nations k, regions r
WHERE k.code = 'zulu_kingdom' AND r.name = 'kwazulu_natal';

-- Xhosa Nation
INSERT INTO entity_regions (kingdom_nation_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT k.id, r.id, TRUE, 1600, 0.9500
FROM kingdoms_nations k, regions r
WHERE k.code = 'xhosa_nation' AND r.name IN ('eastern_cape','transkei');

-- Swazi Kingdom
INSERT INTO entity_regions (kingdom_nation_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT k.id, r.id, TRUE, 1820, 0.9500
FROM kingdoms_nations k, regions r
WHERE k.code = 'swazi_kingdom' AND r.name IN ('eswatini','mpumalanga');

-- Basotho Kingdom
INSERT INTO entity_regions (kingdom_nation_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT k.id, r.id, TRUE, 1820, 0.9500
FROM kingdoms_nations k, regions r
WHERE k.code = 'basotho_kingdom' AND r.name IN ('lesotho','free_state','drakensberg');

-- Batswana
INSERT INTO entity_regions (kingdom_nation_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT k.id, r.id, TRUE, 1500, 0.9200
FROM kingdoms_nations k, regions r
WHERE k.code = 'batswana_nation' AND r.name IN ('botswana','north_west','kalahari');

-- Bapedi
INSERT INTO entity_regions (kingdom_nation_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT k.id, r.id, TRUE, 1700, 0.9200
FROM kingdoms_nations k, regions r
WHERE k.code = 'bapedi_kingdom' AND r.name IN ('limpopo','transvaal');

-- Vhavenda
INSERT INTO entity_regions (kingdom_nation_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT k.id, r.id, TRUE, 1700, 0.9400
FROM kingdoms_nations k, regions r
WHERE k.code = 'vhavenda_nation' AND r.name IN ('limpopo','soutpansberg');

-- Tsonga
INSERT INTO entity_regions (kingdom_nation_id, region_id, is_primary_region, historical_start_year, confidence_score)
SELECT k.id, r.id, TRUE, 1600, 0.9100
FROM kingdoms_nations k, regions r
WHERE k.code = 'tsonga_nation' AND r.name IN ('limpopo','mpumalanga','mozambique_south');

-- ── Entity → Source links ─────────────────────────────────────────────────────

-- Nguni family → Omer-Cooper
INSERT INTO entity_sources (family_id, source_id, confidence_score, evidence_note)
SELECT f.id, s.id, 0.9000, 'Comprehensive overview of Nguni groupings and the Mfecane period.'
FROM ethno_linguistic_families f, sources s
WHERE f.code = 'nguni' AND s.title LIKE 'The Zulu Aftermath%';

-- Sotho-Tswana → Hammond-Tooke
INSERT INTO entity_sources (family_id, source_id, confidence_score, evidence_note)
SELECT f.id, s.id, 0.8800, 'Standard reference on Sotho-Tswana language families and social organisation.'
FROM ethno_linguistic_families f, sources s
WHERE f.code = 'sotho_tswana' AND s.title LIKE 'The Sotho-Tswana%';

-- Xhosa Nation → Peires
INSERT INTO entity_sources (kingdom_nation_id, source_id, confidence_score, evidence_note)
SELECT k.id, s.id, 0.9200, 'Authoritative history of the Xhosa nation from oral tradition and archival sources.'
FROM kingdoms_nations k, sources s
WHERE k.code = 'xhosa_nation' AND s.title LIKE 'The Xhosa Peoples%';

-- Basotho → Thompson
INSERT INTO entity_sources (kingdom_nation_id, source_id, confidence_score, evidence_note)
SELECT k.id, s.id, 0.9000, 'Detailed biography of Moshoeshoe I and the founding of the Basotho nation.'
FROM kingdoms_nations k, sources s
WHERE k.code = 'basotho_kingdom' AND s.title LIKE 'A History of the Basotho%';

-- Vhavenda → Stayt
INSERT INTO entity_sources (kingdom_nation_id, source_id, confidence_score, evidence_note)
SELECT k.id, s.id, 0.8400, 'Early ethnographic documentation of Vhavenda culture, society, and history.'
FROM kingdoms_nations k, sources s
WHERE k.code = 'vhavenda_nation' AND s.title LIKE 'Vhavenda%';

-- Batswana → Schapera
INSERT INTO entity_sources (kingdom_nation_id, source_id, confidence_score, evidence_note)
SELECT k.id, s.id, 0.8800, 'Reference work on Tswana law, custom, and chiefdom structure.'
FROM kingdoms_nations k, sources s
WHERE k.code = 'batswana_nation' AND s.title LIKE 'Tswana Peoples%';

COMMIT;
