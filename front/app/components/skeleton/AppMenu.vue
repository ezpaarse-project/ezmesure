<template>
  <div class="mx-2">
    <!-- Desktop menu -->
    <div class="d-none d-md-flex align-center ga-2">
      <template v-for="item in items">
        <v-spacer v-if="item.separator" :key="item.key" />

        <v-menu v-else-if="item.items" :key="`${item.key}-menu`">
          <template #activator="{ props }">
            <v-btn
              :text="item.text"
              v-bind="props"
              variant="text"
              append-icon="mdi-chevron-down"
            />
          </template>

          <v-list>
            <v-list-item
              v-for="sub in item.items"
              :key="sub.key || sub.to || sub.href"
              :to="sub.to"
              :href="sub.href"
              :title="sub.text"
              :prepend-icon="sub.prependIcon"
              :target="sub.target"
              :rel="sub.rel"
              slim
            />
          </v-list>
        </v-menu>

        <v-btn
          v-else
          :key="item.key || item.to || item.href"
          :to="item.to"
          :href="item.href"
          :text="item.text"
          :exact="item.exact"
          :target="item.target"
          :rel="item.rel"
          variant="text"
        />
      </template>

      <SkeletonLangMenu>
        <template #activator="{ props, currentLang, isOpen }">
          <v-btn
            :append-icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            :text="currentLang"
            v-bind="props"
          />
        </template>
      </SkeletonLangMenu>
    </div>

    <!-- Mobile menu -->
    <div class="d-flex d-md-none align-center">
      <v-spacer />

      <SkeletonLangMenu>
        <template #activator="{ props, currentLang, isOpen }">
          <v-btn
            :append-icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            :text="currentLang"
            v-bind="props"
          />
        </template>
      </SkeletonLangMenu>

      <v-bottom-sheet>
        <template #activator="{ props }">
          <v-btn
            icon="mdi-menu"
            variant="text"
            v-bind="props"
          />
        </template>

        <v-list>
          <template v-for="item in items">
            <v-divider v-if="item.separator" :key="item.key" />

            <template v-else-if="item.items">
              <v-list-subheader :key="item.key">
                {{ item.text }}
              </v-list-subheader>

              <v-list-item
                v-for="sub in item.items"
                :key="`${item.key}.${sub.key || sub.to || sub.href}`"
                :to="sub.to"
                :href="sub.href"
                :title="sub.text"
                :target="sub.target"
                :rel="sub.rel"
              />

              <v-divider :key="`${item.key}-divider`" />
            </template>

            <v-list-item
              v-else
              :key="item.key || item.to || item.href"
              :to="item.to"
              :href="item.href"
              :text="item.text"
              :exact="item.exact"
              :target="item.target"
              :rel="item.rel"
            />
          </template>
        </v-list>
      </v-bottom-sheet>
    </div>
  </div>
</template>

<script setup>
const { t, locale } = useI18n();
const { user } = storeToRefs(useAuthStore());

const docHref = computed(() => {
  let key = 'en';
  if (locale.value === 'fr') {
    key = 'fr';
  }

  return `https://docs.readmetrics.org/s/${key}-ezmesure-user`;
});

const items = computed(() => [
  {
    text: t('menu.bar.documentation.title'),
    key: 'documentation',
    items: [
      {
        text: t('menu.bar.documentation.entries.user'),
        href: docHref.value,
        target: '_blank',
        rel: 'noopener noreferrer',
        prependIcon: 'mdi-book-open',
      },
      {
        text: t('menu.bar.documentation.entries.api'),
        to: '/api-reference',
        prependIcon: 'mdi-code-tags',
      },
    ],
  },
  { text: t('menu.bar.partners'), to: '/partners', exact: true },
  { text: t('menu.bar.contact'), to: '/contact-us', exact: true },
  { separator: true, key: 'menu-separator' },
  {
    text: t('menu.bar.dashboard'),
    href: '/kibana/',
    exact: true,
    target: '_blank',
  },
  { text: t('menu.bar.myspace'), to: '/myspace/' },
  { text: t('menu.bar.administration'), to: '/admin/', hide: !user.value?.isAdmin },
].filter((item) => !item.hide));
</script>
