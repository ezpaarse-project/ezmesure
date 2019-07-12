export default function (kibana) {

  let ezmesureLink = 'https://ezmesure-preprod.couperin.org';

  return new kibana.Plugin({
    name: 'ezmesure_home',

    require: ['kibana', 'elasticsearch'],

    uiExports: {
      links: [
        {
          id: 'kibana:ezmesure_home',
          title: 'ezMESURE',
          order: -1004,
          url: ezmesureLink,
          icon: 'plugins/navbar/assets/ezmesure.svg',
          euiIconType: 'editorUndo',
          description: 'ezMESURE',
        },
      ],
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

  });
};
