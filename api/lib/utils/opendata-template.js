
const keywords = [
  'aca_id',
  'aca_nom',
  'adresse_uai',
  'anciens_codes_uai',
  'article',
  'code_postal_uai',
  'com_code',
  'com_nom',
  'compte_facebook',
  'compte_twitter',
  'dep_id',
  'dep_nom',
  'dernier_decret_legifrance_lib',
  'dernier_decret_legifrance',
  'element_grid',
  'element_isni',
  'element_ror',
  'element_wikidata',
  'identifiant_eter',
  'identifiant_grid',
  'identifiant_interne',
  'identifiant_isni',
  'identifiant_ror',
  'identifiant_wikidata',
  'localisation',
  'localite_acheminement_uai',
  'nom_court',
  'pays_etranger_acheminement',
  'reg_id_old',
  'reg_id',
  'reg_nom_old',
  'reg_nom',
  'secteur_d_etablissement',
  'siren',
  'siret',
  'statut_juridique_court',
  'statut_juridique_long',
  'type_d_etablissement',
  'uai_rgp_loi_esr_2013',
  'uai',
  'uo_lib_officiel',
  'uo_lib',
  'url_en',
  'url',
  'uucr_id',
  'uucr_nom',
  'wikipedia_en',
  'wikipedia',
];

module.exports = {
  settings: {
    number_of_shards: 1,
  },
  mappings: {
    dynamic_templates: [
      {
        strings_as_keywords: {
          match_mapping_type: 'string',
          mapping: {
            type: 'keyword',
          },
        },
      },
    ],
    properties: {
      coordonnees: {
        type: 'geo_point',
      },
      ...keywords.reduce((acc, keyword) => {
        acc[keyword] = { type: 'keyword' };
        return acc;
      }, {}),
    },
  },
};
