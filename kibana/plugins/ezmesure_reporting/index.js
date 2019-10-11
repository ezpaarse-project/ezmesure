import { i18n } from '@kbn/i18n';
import router from './server/router';

export default function (kibana) {

  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch', 'xpack_main'],

    id: 'ezmesure_reporting',

    configPrefix: 'ezmesure.reporting',

    name: 'ezmesure_reporting',

    uiExports: {
      app: {
        title: 'Reporting ezMESURE',
        description: 'Reporting ezMESURE',
        main: 'plugins/ezmesure_reporting/app',
        euiIconType: 'reportingApp',
      },
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init(server) {
      server.log(['status', 'info', 'ezmesure_reporting:plugin'], 'ezmesure_reporting Initializing...');

      server.plugins.xpack_main.registerFeature({
        id: 'ezmesure_reporting',
        name: 'Reporting ezMESURE',
        icon: 'reportingApp',
        app: ['ezmesure_reporting', 'kibana'],
        catalogue: ['ezmesure_reporting'],
        navLinkId: 'ezmesure_reporting',
        privileges: {
          all: {
            api: ['ezmesure_reporting'],
            savedObject: {
              all: [],
              read: [],
            },
            ui: ['create', 'edit', 'save', 'delete', 'show'],
          },
          read: {
            api: ['ezmesure_reporting'],
            savedObject: {
              all: [],
              read: [],
            },
            ui: ['show'],
          },
        },
        privilegesTooltip: i18n.translate('ezmesureReporting.privilegesTooltip', {
          defaultMessage: 'The user should have the rights to perform actions.',
        }),
      });

      router(server, process.env.REPORTING_URL || 'http://localhost:3000');
    },

  });
}
