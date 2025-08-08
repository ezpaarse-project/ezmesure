<template>
  <v-container>
    <v-row>
      <v-col>
        <i18n-t keypath="files.depositFiles.text" tag="p">
          <template #not>
            <strong>{{ $t('files.depositFiles.not') }}</strong>
          </template>

          <template #bestPracticeLink>
            <a href="http://blog.ezpaarse.org/2017/06/les-fichiers-ecs-dans-ezmesure/">{{ $t('files.depositFiles.bestPracticeLink') }}</a>
          </template>
        </i18n-t>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card
          @dragover.prevent="isDraggingFile = true"
          @dragleave.prevent="isDraggingFile = false"
          @drop.prevent="onFileDrop($event)"
          @click="openFileDialog()"
        >
          <v-card-text class="text-center text-grey">
            <v-icon icon="mdi-cloud-upload" />

            <div>
              {{ $t('files.clickOrDeposit') }}
            </div>
          </v-card-text>

          <v-overlay
            :model-value="isDraggingFile"
            scrim="primary"
            class="drop-files-here"
            contained
          >
            {{ $t('files.dropFilesHere') }}
          </v-overlay>
        </v-card>
      </v-col>
    </v-row>

    <CurrentUserFileListToUpload
      v-model="filesPending"
      :label="$t('files.category.pending')"
      @ready:upload="moveToLoading($event)"
    />

    <CurrentUserFileListToUpload
      v-model="filesLoading"
      :label="$t('files.category.loading')"
    />

    <CurrentUserFileListToUpload
      v-model="filesFinished"
      :label="$t('files.category.finished')"
    >
      <template #actions>
        <v-btn
          :text="$t('files.deleteCompleted')"
          prepend-icon="mdi-notification-clear-all"
          variant="outlined"
          @click="filesFinished = []"
        />
      </template>
    </CurrentUserFileListToUpload>
  </v-container>
</template>

<script setup>
let lastId = 0;

const { open: openFileDialog, onChange: onFilesChange } = useFileDialog({
  accept: '.csv, .gz',
  reset: true,
});

const isDraggingFile = shallowRef(false);
const filesPending = ref([]);
const filesLoading = ref([]);
const filesFinished = ref([]);

async function moveToFinished(upload) {
  filesLoading.value = filesLoading.value.filter((u) => u.id !== upload.id);

  const status = upload.status !== 'running' ? upload.status : 'finished';
  filesFinished.value.push({ ...upload, status, cancel: undefined });
}

async function uploadNextFile() {
  const upload = filesLoading.value.at(0);
  if (!upload || !upload.target.repository) {
    return;
  }

  const controller = new AbortController();
  upload.cancel = () => {
    controller.abort();
  };

  try {
    await fetch(`/api/logs/${upload.target.index}`, {
      method: 'POST',
      body: upload.file,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      upload.status = 'cancelled';
    } else {
      upload.status = 'failed';
      upload.error = err instanceof Error ? err : new Error(err);
    }
  }

  moveToFinished(upload);
}

function moveToLoading(upload) {
  const isUploading = filesLoading.value.length > 0;
  filesPending.value = filesPending.value.filter((u) => u.id !== upload.id);
  filesLoading.value.push({ ...upload, status: 'running' });

  if (!isUploading) {
    uploadNextFile();
  }
}

/**
 * Add a file to the pending list
 *
 * @param {File} file
 */
function addToPending(file) {
  filesPending.value.push({
    id: lastId,
    file,
    status: 'pending',
    target: undefined,
    cancel: undefined,
    error: undefined,
  });

  lastId += 1;
}

/**
 * Add a file to the pending list on drop
 *
 * @param {DragEvent} event
 */
function onFileDrop(event) {
  const files = event?.dataTransfer?.files ?? [];

  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    addToPending(file);
  }

  isDraggingFile.value = false;
}

/**
 * Add a file to the pending list on file dialog change
 */
onFilesChange((files) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const file of files ?? []) {
    addToPending(file);
  }
});
</script>

<style scoped lang="scss">
.drop-files-here {
  align-items: center;
  justify-content: center;
  top: 0 !important;
}
</style>
