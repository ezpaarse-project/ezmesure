import { i18n } from '@kbn/i18n';
import router from './server/router';

export default function (kibana) {

  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch', 'xpack_main'],

    id: 'ezreporting',

    configPrefix: 'ezreporting.app',

    name: 'ezreporting',

    uiExports: {
      app: {
        title: process.env.REPORTING_NAME || 'Reporting',
        description: process.env.REPORTING_NAME || 'Reporting',
        main: 'plugins/ezreporting/app',
        euiIconType: 'reportingApp',
      },
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init(server) {
      server.log(['status', 'info', 'ezreporting:plugin'], 'ezreporting Initializing...');

      server.plugins.xpack_main.registerFeature({
        id: 'ezreporting',
        name: process.env.REPORTING_NAME || 'Reporting',
        icon: 'reportingApp',
        app: ['ezreporting', 'kibana'],
        catalogue: ['ezreporting'],
        navLinkId: 'ezreporting',
        privileges: {
          all: {
            api: ['ezreporting'],
            savedObject: {
              all: [],
              read: [],
            },
            ui: ['create', 'edit', 'save', 'delete', 'show'],
          },
          read: {
            api: ['ezreporting'],
            savedObject: {
              all: [],
              read: [],
            },
            ui: ['show'],
          },
        },
      });

      router(server, process.env.REPORTING_URL || 'http://localhost:3000');
    },

  });
}
