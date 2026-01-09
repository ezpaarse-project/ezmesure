<template>
  <v-card :title="$t('myspace.settings.notifications.title')" prepend-icon="mdi-email">
    <template #text>
      <v-row>
        <v-col>
          <i18n-t keypath="myspace.settings.notifications.description.text" tag="p">
            <template #credentialsLink>
              <nuxt-link to="/myspace/profile">
                {{ $t('myspace.settings.notifications.description.parts.credentialsLink') }}
              </nuxt-link>
            </template>
          </i18n-t>
        </v-col>
      </v-row>

      <v-expand-transition>
        <v-row v-if="success || error">
          <v-col>
            <v-alert
              v-if="error"
              :title="error.title"
              :text="error.text"
              type="error"
              density="compact"
              closable
              @update:model-value="() => (error = undefined)"
            />
            <v-alert
              v-if="success"
              :title="$t('myspace.settings.notifications.alerts.updated.title')"
              type="success"
              density="compact"
            />
          </v-col>
        </v-row>
      </v-expand-transition>

      <v-row v-if="user.isAdmin">
        <v-col>
          <v-tabs v-model="currentTab" color="accent">
            <v-tab
              :text="$t('myspace.settings.notifications.modifiers.user')"
              prepend-icon="mdi-account"
              value="user"
            />
            <v-tab
              v-if="user.isAdmin"
              :text="$t('myspace.settings.notifications.modifiers.admin')"
              prepend-icon="mdi-security"
              value="admin"
            />
          </v-tabs>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-expansion-panels
            v-model="openedScopes"
            variant="accordion"
            color="secondary"
            multiple
          >
            <v-scroll-x-transition group>
              <v-expansion-panel
                v-for="scope in availableOptions"
                :key="scope.key"
                :title="scope.title"
                :value="scope.key"
                static
              >
                <template #text>
                  <v-checkbox
                    v-for="item in scope.items"
                    :key="item.key"
                    :label="item.title"
                    :model-value="data[item.key] !== false"
                    color="primary"
                    density="compact"
                    hide-details
                    @update:model-value="data[item.key] = $event"
                  />
                </template>
              </v-expansion-panel>
            </v-scroll-x-transition>
          </v-expansion-panels>
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <v-btn
        :text="$t('myspace.settings.notifications.buttons.save')"
        :loading="loading"
        prepend-icon="mdi-content-save"
        color="primary"
        @click="updateNotifications()"
      />
    </template>
  </v-card>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const NOTIFICATION_TYPES = [
  'institution:validated',
  'institution:new_user_matching_institution',
  'institution:membership_request',
  'institution:role_assigned',

  'counter:new_data_available',

];

const ADMIN_NOTIFICATION_TYPES = [
  'institution:counter_ready_change',

  'contact:form',

  'app:recent_activity',
];

const { getSession, data: user } = useAuth();
const { t } = useI18n();

const currentTab = shallowRef('user');
const openedScopes = ref(['institution', 'contact', 'counter', 'app']);
const loading = shallowRef(false);
const data = ref({});
const success = shallowRef(false);
const error = ref(undefined);

const availableOptions = computed(() => {
  const isAdmin = currentTab.value === 'admin';

  const types = [
    ...NOTIFICATION_TYPES,
    ...(isAdmin ? ADMIN_NOTIFICATION_TYPES : []),
  ];

  const scopesMap = new Map();

  // eslint-disable-next-line no-restricted-syntax
  for (const key of types) {
    const [scope] = key.split(':', 2);

    const scopeItem = scopesMap.get(scope) ?? {
      key: scope,
      title: t(`myspace.settings.notifications.scopes.${scope}`),
      items: [],
    };

    let modifier = 'user';
    if (isAdmin) {
      modifier = 'admin';
    }

    scopeItem.items.push({
      key: modifier === 'user' ? key : `${key}.${modifier}`,
      title: t(`myspace.settings.notifications.types.${key}.${modifier}`),
    });

    scopesMap.set(scope, scopeItem);
  }

  return Array.from(scopesMap.values());
});

async function updateNotifications() {
  loading.value = true;
  error.value = undefined;
  success.value = false;
  try {
    await $fetch('/api/profile/excludeNotifications', {
      method: 'PUT',
      body: Object.entries(data.value)
        .filter(([, value]) => value === false)
        .map(([key]) => key),
    });

    await getSession({ force: true });

    success.value = true;
    setTimeout(() => {
      success.value = false;
    }, 5000);
  } catch (err) {
    error.value = {
      title: t('anErrorOccurred'),
      text: getErrorMessage(err),
    };
  }
  loading.value = false;
}

watch(
  () => user.value.excludeNotifications,
  (excluded) => {
    data.value = Object.fromEntries(
      excluded.map((key) => [key, false]),
    );
  },
  { immediate: true },
);
</script>
