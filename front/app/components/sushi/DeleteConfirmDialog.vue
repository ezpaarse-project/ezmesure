<template>
  <v-dialog
    :model-value="show"
    max-width="400"
    v-bind="$attrs"
    @update:model-value="cancel()"
  >
    <v-card
      :title="$t('areYouSure')"
    >
      <template #text>
        <v-row>
          <v-col>
            <i18n-t keypath="sushi.deleteNbCredentials" tag="p">
              <template #count>
                {{ data.toDelete.length }}
              </template>

              <template #cantCancel>
                <span class="font-weight-bold">{{ $t('cantCancel') }}</span>
              </template>
            </i18n-t>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            {{ $t('sushi.deleteReasonDescription') }}
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-form id="deleteForm" v-model="isValid" @submit.prevent="agree()">
              <v-combobox
                v-model="reason"
                :label="$t('sushi.deleteReason')"
                :items="availableReasons"
                :rules="[(v) => !!v || $t('fieldIsRequired')]"
                prepend-icon="mdi-delete-circle-outline"
                variant="underlined"
              />
            </v-form>
          </v-col>
        </v-row>
      </template>

      <template #actions>
        <v-spacer />

        <v-btn
          :text="$t('cancel')"
          :disabled="agreeLoading"
          :loading="disagreeLoading"
          size="small"
          variant="text"
          @click="cancel()"
        />
        <v-btn
          :text="$t('delete')"
          :disabled="disagreeLoading || !isValid"
          :loading="agreeLoading"
          prepend-icon="mdi-delete"
          size="small"
          color="primary"
          type="submit"
          form="deleteForm"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * @typedef {Object} DeleteSushiDialogData
 * @property {() => void | Promise<void>} [onAgree] Callback to execute when user agrees
 * @property {() => void | Promise<void>} [onDisagree] Callback to execute when user disagrees
 * @property {object[]} toDelete Items to delete
 */

const { t } = useI18n();
const snacks = useSnacksStore();

let close;
const disagreeLoading = shallowRef(false);
const agreeLoading = shallowRef(false);
const show = shallowRef(false);
const isValid = shallowRef(false);
const reason = shallowRef('');
/**
 * @type {Ref<DeleteSushiDialogData>}
 */
const data = ref({});

const availableReasons = computed(() => [
  t('sushi.deleteReasons.mistake'),
  t('sushi.deleteReasons.neverWorked'),
  t('sushi.deleteReasons.duplicate'),
]);

/**
 * Open dialog to confirm user action. Returns promise that resolves to `true` or `false`
 * depending on user choice. You can use callbacks too : `true`/`opts.onAgree` when user agrees,
 * `false`/`opts.onDisagree` when user disagrees.
 *
 * Callbacks allow promises, and shows loader while promise is pending.
 *
 * @param {DeleteSushiDialogData} options Data to display
 *
 * @returns {Promise<boolean>}
 */
function openConfirm(options) {
  data.value = { ...options };
  show.value = true;
  return new Promise((resolve) => {
    close = (value) => resolve(value);
  });
}

/**
 * Close current dialog
 *
 * @param {boolean} value Value to return: `true` when user agrees, `false` when user disagrees
 *
 * @return {boolean} If user agreed or disagreed
 */
function closeConfirm(value) {
  show.value = false;
  if (!close) {
    return value;
  }

  close(value);
  return value;
}

async function deleteSushis() {
  const { toDelete } = data.value;

  const results = await Promise.all(
    toDelete.map(
      (item) => $fetch(`/api/sushi/${item.id}`, {
        method: 'DELETE',
        body: { reason: reason.value },
      })
        .catch((err) => {
          snacks.error(t('cannotDeleteItems', { id: item.name || item.id }), err);
          return null;
        }),
    ),
  );

  if (!results.some((r) => !r)) {
    snacks.success(t('sushi.itemsDeleted', { count: toDelete.length }));
  }
}

async function cancel() {
  disagreeLoading.value = true;
  await data.value.onDisagree?.();
  closeConfirm(false);
  disagreeLoading.value = false;
}

async function agree() {
  agreeLoading.value = true;
  await deleteSushis();
  await data.value.onAgree?.();
  closeConfirm(true);
  agreeLoading.value = false;
}

defineExpose({
  openConfirm,
  closeConfirm,
});
</script>
