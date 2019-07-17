export default function (kibana) {

  let ezmesureLink = 'https://ezmesure.couperin.org';

  return new kibana.Plugin({
    name: 'ezmesure_plugin',

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
      replaceInjectedVars(injectedVars, request, server) {
        const hiddenApps = [
          // 'kibana:discover',
          // 'kibana:visualize',
          // 'kibana:dashboard',
          // 'kibana:dev_tools',
          // 'kibana:management',
          // 'timelion',
          // 'canvas',
          // 'infra:home',
          // 'infra:logs',
          // 'maps',
          // 'apm',
          // 'uptime',
          // 'monitoring',
        ];
        injectedVars.hiddenAppIds = hiddenApps;

        hiddenApps.forEach((ha) => {
          if (request.path.match('(.*/app/' + ha + '.*)|(.*/api/' + ha + '.*)')) {
            forbid = true;
          }
        });
  
        return injectedVars;
      },
      hacks: [
        'plugins/navbar/hacks/menu'
      ],
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

  });
};
