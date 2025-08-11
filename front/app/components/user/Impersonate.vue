<template>
  <v-card
    :title="$t('authenticate.impersonate')"
    :subtitle="showUser ? user.fullName : undefined"
    :loading="loadingTestUsers && 'primary'"
    prepend-icon="mdi-account"
  >
    <template #append>
      <v-scale-transition>
        <v-btn
          v-if="windowId === 'kibana'"
          v-tooltip:left="$t('refresh')"
          icon="mdi-reload"
          variant="text"
          @click="refresh()"
        />
      </v-scale-transition>
    </template>
    <v-window v-model="windowId">
      <v-window-item value="root">
        <v-list lines="two" class="pa-0">
          <v-divider />

          <v-list-item
            title="ezMESURE"
            :subtitle="$t('impersonate.ezmesureDesc')"
          >
            <template #append>
              <v-btn
                :loading="impersonating"
                :text="$t('authenticate.logIn')"
                color="primary"
                prepend-icon="mdi-login"
                variant="tonal"
                @click="impersonateUser()"
              />
            </template>
          </v-list-item>

          <v-divider />

          <v-list-item
            title="Kibana"
            :subtitle="$t('impersonate.kibanaDesc')"
            append-icon="mdi-chevron-right"
            @click="windowId = 'kibana'"
          />

          <v-divider />
        </v-list>
      </v-window-item>

      <v-window-item value="kibana">
        <v-card-text>
          <p>
            {{ $t('testUsers.description') }}
          </p>

          <v-list>
            <v-list-item
              v-for="testUser in testUsers ?? []"
              :key="testUser.username"
              lines="two"
            >
              <template #title>
                {{ testUser.username }}
              </template>

              <template #subtitle>
                <i18n-t keypath="testUsers.expires" tag="span">
                  <template #date>
                    <LocalDate :model-value="testUser.metadata.expiresAt" format="PPPp" />
                  </template>
                </i18n-t>
              </template>

              <template #append>
                <v-menu>
                  <template #activator="{ props: menu }">
                    <v-btn
                      :loading="connectingToKibana"
                      icon="mdi-dots-vertical"
                      variant="text"
                      v-bind="menu"
                    />
                  </template>

                  <v-list density="compact">
                    <v-list-item
                      :title="t('testUsers.copyUsername')"
                      prepend-icon="mdi-account"
                      @click="copyToClipboard(testUser.username)"
                    />
                    <v-list-item
                      v-if="testPasswords.has(testUser.username)"
                      :title="t('testUsers.copyPassword')"
                      prepend-icon="mdi-key"
                      @click="copyToClipboard(testPasswords.get(testUser.username))"
                    />
                    <v-list-item
                      v-if="testPasswords.has(testUser.username)"
                      :title="t('testUsers.loginToKibana')"
                      :disabled="connectingToKibana"
                      prepend-icon="mdi-login"
                      @click="loginToKibana(testUser)"
                    />

                    <v-divider />

                    <ConfirmPopover
                      :agree-text="$t('delete')"
                      :agree="() => deleteTestUser(testUser)"
                      location="end"
                    >
                      <template #activator="{ props: confirm }">
                        <v-list-item
                          :title="$t('delete')"
                          prepend-icon="mdi-trash-can"
                          variant="text"
                          color="red"
                          v-bind="confirm"
                        />
                      </template>
                    </ConfirmPopover>
                  </v-list>
                </v-menu>
              </template>
            </v-list-item>
          </v-list>

          <div class="text-center mt-2">
            <v-btn
              :text="$t('impersonate.createTestUser')"
              prepend-icon="mdi-account-plus"
              variant="text"
              density="comfortable"
              color="primary"
              :loading="creatingUser"
              @click="addTestUser()"
            />
          </div>
        </v-card-text>
      </v-window-item>
    </v-window>

    <template v-if="$slots.actions" #actions>
      <v-scale-transition>
        <v-btn
          v-if="windowId === 'kibana'"
          :text="$t('back')"
          prepend-icon="mdi-chevron-left"
          variant="text"
          density="comfortable"
          @click="windowId = 'root'"
        />
      </v-scale-transition>

      <v-spacer />

      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  showUser: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();
const snacks = useSnacksStore();
const { copy } = useClipboard();
const { refresh: refreshSession } = useAuth();

const windowId = ref('root');
const connectingToKibana = ref(false);
const creatingUser = ref(false);
const impersonating = ref(false);
const testPasswords = ref(new Map());

const {
  status,
  data: testUsers,
  refresh,
} = useFetch('/api/test-users', {
  query: { cloneOf: props.user.username },
  lazy: true,
});

const loadingTestUsers = computed(() => status.value === 'pending');

const addTestUser = async () => {
  creatingUser.value = true;

  try {
    const newTestUser = await $fetch('/api/test-users', {
      method: 'POST',
      body: { cloneOf: props.user.username },
    });

    if (newTestUser.username && newTestUser.password) {
      testPasswords.value.set(newTestUser.username, newTestUser.password);
    }
  } catch (e) {
    snacks.error(t('anErrorOccurred'), e);
    return;
  } finally {
    creatingUser.value = false;
  }

  refresh();
};

const deleteTestUser = async (testUser) => {
  try {
    await $fetch(`/api/test-users/${testUser.username}`, { method: 'DELETE' });
    refresh();
  } catch (e) {
    snacks.error(t('anErrorOccurred'), e);
  }
};

const loginToKibana = async (testUser) => {
  const password = testPasswords.value.get(testUser.username);

  if (!password) { return; }

  connectingToKibana.value = true;

  try {
    await $fetch('/kibana/internal/security/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'kbn-xsrf': 'true' },
      body: {
        providerType: 'basic',
        providerName: 'basic',
        currentURL: window.location.href,
        params: { username: testUser.username, password },
      },
    });
  } catch (e) {
    snacks.error(t('anErrorOccurred'), e);
    return;
  } finally {
    connectingToKibana.value = false;
  }

  snacks.success(t('impersonate.connectedToKibana'));
};

async function impersonateUser() {
  impersonating.value = true;

  try {
    await $fetch(`/api/users/${props.user.username}/_impersonate`, { method: 'POST' });
    await refreshSession();
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
    return;
  } finally {
    impersonating.value = false;
  }

  await navigateTo('/myspace');
}

/**
 * Copy text into the clipboard
 *
 * @param {object} text - The text we want to copy
 */
async function copyToClipboard(text) {
  if (!text) { return; }

  try {
    await copy(text);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>
