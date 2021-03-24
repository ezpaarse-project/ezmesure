module.exports = {
  settings: {
    number_of_shards: 1,
    analysis: {
      normalizer: {
        lowercase_normalizer: {
          type: 'custom',
          filter: ['lowercase'],
        },
      },
    },
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
      code_uai: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      n_siret: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      type_detablissement: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      nom: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      sigle: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      statut: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      tutelle: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      universite: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      boite_postale: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      adresse: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      cp: { type: 'integer' },
      commune: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      commune_cog: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      cedex: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      telephone: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      arrondissement: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      departement: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      academie: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      region: {
        type: 'keyword',
        normalizer: 'lowercase_normalizer',
      },
      region_cog: { type: 'integer' },
      longitude_x: { type: 'float' },
      latitude_y: { type: 'float' },
    },
  },
};
