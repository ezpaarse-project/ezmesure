<template>
  <div>
    <v-container fluid class="pa-6 home-background home-background--primary">
      <v-row class="align-center pa-12">
        <v-col md="6" class="position-relative">
          <h4 class="text-h6 font-weight-light">
            {{ $t('home.head.subtitle') }}
          </h4>
          <h1 class="text-h4">
            {{ $t('home.head.title') }}
          </h1>

          <v-chip
            :text="$t('home.head.chip')"
            href="https://readmetrics.org/"
            size="small"
            color="secondary"
            variant="flat"
            class="my-1"
          >
            <template #append>
              <img
                src="/logos/readmetrics.svg"
                alt="ReadMetrics Logo"
                height="16px"
                class="ml-1"
              />
            </template>
          </v-chip>

          <p class="text-body-1 text-medium-emphasis my-6">
            {{ $t('home.head.text') }}
          </p>

          <v-btn
            :text="$t('home.head.actions.start')"
            to="/myspace"
            append-icon="mdi-chevron-right"
            variant="elevated"
            color="primary"
          />
        </v-col>

        <v-col class="d-none d-md-block">
          <v-sheet border rounded class="overflow-hidden">
            <v-img :src="`/images/home/head/dashboard-${locale}.png`" />
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>

    <v-container class="text-center home-background home-background--accent pa-md-12 pa-6">
      <v-row
        v-for="(group, i) in PARTNERS"
        :key="i"
        class="justify-center"
      >
        <v-divider v-if="i !== 0" class="my-4" />

        <v-col
          v-for="logo in group"
          :key="logo.name"
          cols="3"
        >
          <!-- eslint-disable-next-line vuejs-accessibility/anchor-has-content-->
          <a :href="logo.href" :title="logo.name">
            <v-sheet v-ripple color="transparent" rounded class="pa-4">
              <v-img
                v-if="logo.src"
                :alt="logo.name"
                :src="logo.src"
                height="5rem"
                contain
              />
              <v-avatar
                v-else
                :text="logo.name"
                color="red"
                size="5rem"
                tile
                class="font-weight-bold"
              />
            </v-sheet>
          </a>
        </v-col>
      </v-row>
    </v-container>

    <v-container fluid class="home-background home-background--reverse pa-md-12 pa-6">
      <v-responsive class="position-relative mx-auto text-center mb-8" max-width="700px">
        <h4 class="font-weight-medium text-primary mb-2">
          {{ $t('home.features.subtitle') }}
        </h4>
        <h3 class="text-h4 font-weight-bold mb-4">
          {{ $t('home.features.title') }}
        </h3>

        <p class="body-1 text-medium-emphasis">
          {{ $t('home.features.text') }}
        </p>
      </v-responsive>

      <v-row justify="center">
        <v-col v-for="(feat, i) in features" :key="i" cols="12" sm="6" md="4">
          <v-card
            :title="feat.title"
            :text="feat.text"
            :prepend-icon="feat.icon"
            variant="flat"
            color="transparent"
          >
            <template #prepend>
              <v-icon :icon="feat.icon" color="primary" />
            </template>

            <template v-if="feat.to" #actions>
              <v-btn
                :text="$t('home.features.actions.seeMore')"
                append-icon="mdi-arrow-right"
                variant="tonal"
                size="small"
                color="accent"
                rounded
                @click="goTo(feat.to)"
              />
            </template>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-parallax
      id="metrics"
      gradient="to top, rgba(var(--v-theme-primary), .9), rgba(var(--v-theme-primary), .65)"
      src="/images/home/metrics/background.png"
      max-height="750px"
      cover
      class="bg-primary"
    >
      <v-container fluid class="h-100 d-flex align-center pa-md-12 pa-6">
        <div class="flex-1-1">
          <v-row>
            <v-col cols="12" md="6">
              <h3 class="font-weight-bold text-h5">
                {{ $t('home.metrics.title') }}
              </h3>

              <p class="text-subtitle-2">
                {{ $t('home.metrics.text') }}
              </p>
            </v-col>
          </v-row>

          <v-row>
            <v-col v-for="(metric, i) in metricsItems" :key="i" cols="12" sm="6" md="3" class="d-flex">
              <v-divider vertical />

              <v-skeleton-loader
                v-if="metricsStatus === 'loading'"
                type="list-item-two-line"
                color="transparent"
                width="50%"
                class="ml-2 mb-2"
              />
              <v-list-item v-else>
                <v-list-item-title class="text-h4 font-weight-bold">
                  {{ metric.value }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ metric.title }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-col>
          </v-row>

          <v-chip
            :text="$t('home.metrics.chip', { date: metricsDate })"
            size="x-small"
            color="success"
            class="mt-4"
          />
        </div>
      </v-container>
    </v-parallax>

    <v-container id="counter" fluid class="home-background pa-md-12 pa-6">
      <v-responsive class="position-relative mx-auto text-center mb-8" max-width="700px">
        <div class="font-weight-medium text-primary mb-2">
          {{ $t('home.counter.subtitle') }}
        </div>
        <h3 class="text-h4 font-weight-bold mb-2">
          {{ $t('home.counter.title') }}
        </h3>

        <v-menu width="300">
          <template #activator="{ props }">
            <v-chip
              :text="$t('home.counter.chip.title')"
              append-icon="mdi-information"
              size="small"
              color="secondary"
              variant="flat"
              class="mb-4"
              v-bind="props"
            />
          </template>

          <v-card :text="$t('home.counter.chip.text')">
            <template #actions>
              <v-spacer />

              <v-btn
                :text="$t('home.features.actions.seeMore')"
                href="https://www.countermetrics.org/about/how-we-work/"
                append-icon="mdi-open-in-new"
                variant="flat"
                color="primary"
                size="small"
              />
            </template>
          </v-card>
        </v-menu>

        <p class="body-1 text-medium-emphasis">
          {{ $t('home.counter.text') }}
        </p>
      </v-responsive>

      <v-sheet rounded class="overflow-hidden">
        <v-img
          :src="`/images/home/features/counter-credentials-${locale}.png`"
          gradient="to bottom, rgba(var(--v-theme-background), 0) 25%, rgba(var(--v-theme-background), 1)"
          rounded
        />
      </v-sheet>
    </v-container>

    <v-container class="home-background home-background--accent pa-md-12 pa-6">
      <v-responsive class="position-relative  mx-auto text-center mb-8" max-width="700px">
        <div class="font-weight-medium text-primary mb-2">
          {{ $t('home.git.subtitle') }}
        </div>
        <h3 class="text-h4 font-weight-bold mb-4">
          {{ $t('home.git.title') }}
        </h3>
      </v-responsive>

      <v-row class="align-center">
        <v-col
          v-for="(group, i) in gitItems"
          :key="i"
          cols="12"
          md="6"
          lg="3"
          :class="[`order-${group.order}`]"
        >
          <v-row>
            <v-col v-for="(item, j) in group.items" :key="j" cols="12" sm="6" md="12">
              <v-skeleton-loader
                v-if="metricsStatus === 'loading'"
                type="list-item-avatar-two-line"
                color="transparent"
                width="75%"
              />
              <v-sheet v-else border rounded>
                <v-list-item class="pa-4">
                  <template #prepend>
                    <v-icon :icon="item.icon" />
                  </template>
                  <v-list-item-title class="font-weight-bold">
                    {{ item.value }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ item.title }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-sheet>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" lg="6" class="order-3 order-lg-2">
          <v-sheet border rounded class="d-flex flex-column align-center justify-center text-body-2 pa-4">
            <p class="text-center">
              {{ $t('home.git.text') }}
            </p>

            <v-btn
              :text="$t('home.git.actions.contribute')"
              href="https://github.com/ezpaarse-project/ezmesure"
              append-icon="mdi-github"
              variant="flat"
              color="accent"
              class="mt-6"
            />
          </v-sheet>
        </v-col>
      </v-row>

      <v-chip
        :text="$t('home.metrics.chip', { date: metricsDate })"
        size="x-small"
        color="success"
        class="mt-4"
      />
    </v-container>

    <v-container id="reporting" fluid class="pa-md-12 pa-6">
      <v-responsive class="position-relative mx-auto text-center mb-8" max-width="700px">
        <div class="font-weight-medium text-primary mb-2">
          {{ $t('home.reporting.subtitle') }}
        </div>
        <h3 class="text-h4 font-weight-bold mb-2">
          {{ $t('home.reporting.title') }}
        </h3>

        <p class="body-1 text-medium-emphasis">
          {{ $t('home.reporting.text') }}
        </p>
      </v-responsive>

      <v-row>
        <v-col cols="12" md="6">
          <v-sheet rounded class="overflow-hidden">
            <v-img
              :src="`/images/home/features/reporting-${locale}.png`"
              gradient="to bottom, rgba(var(--v-theme-background), 0) 25%, rgba(var(--v-theme-background), 1)"
              rounded
            />
          </v-sheet>
        </v-col>
        <v-col cols="12" md="6">
          <v-img
            :src="`/images/home/features/reporting-example-${locale}.png`"
            gradient="to bottom, rgba(var(--v-theme-background), 0) 25%, rgba(var(--v-theme-background), 1)"
            rounded
          />
        </v-col>
      </v-row>
    </v-container>

    <v-footer color="secondary">
      <div class="text-caption">
        © 2016 ~ {{ YEAR }} ReadMetrics — {{ $t('home.footer.rights') }}
      </div>

      <v-spacer />

      <v-btn
        v-for="(link, i) in SOCIALS"
        :key="i"
        :icon="link.icon"
        :href="link.href"
        variant="text"
        size="small"
      />
    </v-footer>
  </div>
</template>

<script setup>
import prettySize from 'pretty-bytes';

const { t, locale } = useI18n();
const router = useRouter();
const goTo = useGoTo();
const { public: { homepage } } = useRuntimeConfig();

const { openDialog } = useDialogStore();
const snacks = useSnacksStore();
if (router.currentRoute.value.query.error) {
  const err = JSON.parse(atob(router.currentRoute.value.query.error));
  snacks.error(t('authenticate.failed'), err);
  router.replace({ query: undefined });
}

const YEAR = new Date().getFullYear();

const SOCIALS = [
  {
    icon: 'mdi-github',
    href: 'https://github.com/ezpaarse-project/ezmesure',
  },
  {
    icon: 'mdi-message-text',
    href: 'https://blog.readmetrics.net/',
  },
  {
    icon: 'mdi-youtube',
    href: 'https://www.youtube.com/channel/UCcR-0UE9WjYiwS4fMG2T4tQ',
  },
];

const PARTNERS = [
  [
    {
      name: 'EPFL',
      src: '/logos/partners/logo-epfl.svg',
      href: 'https://www.epfl.ch/',
      hide: !homepage.logos.EPFL,
    },
    {
      name: 'SLSP',
      src: '/logos/partners/logo-slsp.svg',
      href: 'https://slsp.ch/',
      hide: !homepage.logos.SLSP,
    },
    {
      name: 'CSAL',
      href: 'https://consortium.ch/',
      hide: !homepage.logos.CSAL,
    },
    {
      name: 'UNIGE',
      src: '/logos/partners/logo-unige.svg',
      href: 'https://www.unige.ch/',
      hide: !homepage.logos.UNIGE,
    },
  ].filter((item) => !item.hide),
  [
    {
      name: 'CNRS',
      src: '/logos/partners/logo-cnrs.svg',
      href: 'https://www.cnrs.fr/',
      hide: !homepage.logos.CNRS,
    },
    {
      name: 'couperin',
      src: '/logos/partners/logo-couperin.svg',
      href: 'https://www.couperin.org/',
      hide: !homepage.logos.COUPERIN,
    },
    {
      name: 'INIST-CNRS',
      src: '/logos/by-inist.svg',
      href: 'https://www.inist.fr/',
      hide: !homepage.logos.INIST,
    },
  ].filter((item) => !item.hide),
].filter((items) => items.length > 0);

const { data: metrics, status: metricsStatus } = await useFetch('/api/metrics', {
  lazy: true,
  // Short timeout so we can quickly switch to fallback if there's a problem
  timeout: 250,
  // Have fallback if server fails to provide metrics
  // Default data is rounded
  default: () => ({
    createdAt: '2026-07-06',
    cluster: {
      stats: {
        fsUsed: 2_816_000_000_000,
      },
    },
    counts: {
      users: 1_200,
      institutions: 310,
      sushiEndpoints: 220,
    },
    git: {
      stars: 11,
      issues: 9,
      contributors: 10,
      updatedAt: '2026-07-03',
    },
  }),
});

const formatter = computed(() => new Intl.NumberFormat(locale.value));

const metricsDate = computed(() => dateFormat(metrics.value?.createdAt, locale.value, 'PPP'));

const metricsItems = computed(() => [
  {
    title: t('home.metrics.items.data'),
    value: prettySize(metrics.value?.cluster?.stats?.fsUsed ?? 0, { locale: locale.value }),
  },
  {
    title: t('home.metrics.items.users'),
    value: formatter.value.format(metrics.value?.counts?.users ?? 0),
  },
  {
    title: t('home.metrics.items.institutions'),
    value: formatter.value.format(metrics.value?.counts?.institutions ?? 0),
  },
  {
    title: t('home.metrics.items.dataHosts'),
    value: formatter.value.format(metrics.value?.counts?.sushiEndpoints ?? 0),
  },
]);

const gitItems = computed(() => [
  {
    order: 1,
    items: [
      {
        icon: 'mdi-license',
        title: t('home.git.items.license'),
        value: 'CeCILL (GPL)',
      },
      {
        icon: 'mdi-alert-circle-outline',
        title: t('home.git.items.issues'),
        value: formatter.value.format(metrics.value?.git?.issues ?? 0),
      },
    ],
  },
  {
    order: 3,
    items: [
      {
        icon: 'mdi-source-branch',
        title: t('home.git.items.commits'),
        value: dateFormat(metrics.value?.git?.updatedAt, locale.value, 'PPP'),
      },
      {
        icon: 'mdi-account-supervisor',
        title: t('home.git.items.contributors'),
        value: formatter.value.format(metrics.value?.git?.contributors ?? 0),
      },
    ],
  },
]);

const features = computed(() => [
  {
    icon: 'mdi-view-dashboard',
    title: t('home.features.items.dashboard.title'),
    text: t('home.features.items.dashboard.text'),
    hide: !homepage.features.dashboard,
  },
  {
    icon: 'mdi-database',
    title: t('home.features.items.repository.title'),
    text: t('home.features.items.repository.text'),
    hide: !homepage.features.repository,
    to: '#metrics',
  },
  {
    icon: 'mdi-file-document',
    title: t('home.features.items.ezpaarse.title'),
    text: t('home.features.items.ezpaarse.text'),
    hide: !homepage.features.ezpaarse,
  },
  {
    icon: 'mdi-api',
    title: t('home.features.items.counter.title'),
    text: t('home.features.items.counter.text'),
    hide: !homepage.features.counter,
    to: '#counter',
  },
  {
    icon: 'mdi-file-chart-outline',
    title: t('home.features.items.reporting.title'),
    text: t('home.features.items.reporting.text'),
    hide: !homepage.features.reporting,
    to: '#reporting',
  },
].filter((item) => !item.hide));

function onImageClick() {
  // TODO
}
</script>

<style lang="css" scoped>
.home-background {
  --home-gradient-side: to bottom;
  --home-gradient-color: var(--v-theme-secondary);
  --home-gradient-opacity: .25;
  --home-gradient-size: 25%;

  background: linear-gradient(var(--home-gradient-side), rgba(var(--home-gradient-color), var(--home-gradient-opacity)), rgba(var(--v-theme-background), 0) var(--home-gradient-size));
}

.home-background--reverse {
  --home-gradient-side: to top;
}

.home-background--primary {
  --home-gradient-color: var(--v-theme-primary);
}

.home-background--accent {
  background: radial-gradient(rgba(var(--v-theme-accent), var(--home-gradient-opacity)), rgba(var(--v-theme-background), 0) 50%);
}
</style>
