/* eslint-disable @kbn/eslint/require-license-header */
import { resolve } from 'path';
import { existsSync } from 'fs';

export default function (kibana) {

  const ezmesureLink = '{{EZMESURE_URL}}';

  return new kibana.Plugin({
    require: ['elasticsearch'],

    name: 'ezmesure_home',

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

      hacks: [
        'plugins/ezmesure_home/hack',
      ],

      styleSheetPaths: [resolve(__dirname, 'public/app.scss'), resolve(__dirname, 'public/app.css')].find(p => existsSync(p)),
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

  });
}
