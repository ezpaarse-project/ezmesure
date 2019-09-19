/* eslint-disable @kbn/eslint/require-license-header */
import router from './server/router';

export default function (kibana) {

  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch'],

    name: 'ezmesure_reporting',

    uiExports: {
      app: {
        title: 'ezMESURE',
        description: 'ezMESURE',
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
      router(server);
    },

  });
}
