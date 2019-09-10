import api from './server/routes';

export default function (kibana) {

  const ezmesureLink = 'https://ezmesure-preprod.couperin.org';

  return new kibana.Plugin({
    name: 'ezmesure',

    require: ['kibana', 'elasticsearch'],

    uiExports: {
      links: [
        {
          id: 'ezmesure:home',
          title: 'ezMESURE',
          order: -1005,
          url: ezmesureLink,
          euiIconType: 'editorUndo',
          description: 'ezMESURE',
        },
      ],

      app: {
        title: 'Reporting',
        description: 'Reporting',
        main: 'plugins/ezmesure/app',
        euiIconType: 'reportingApp',
        order: -1004,
      },

      hacks: [
        'plugins/ezmesure/hack',
      ],
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init(server, options) {
      server.log(['status', 'info', 'ezmesure:plugin'], 'ezmesure Initializing...');
      api(server);
    },

  });
};
