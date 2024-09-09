<template>
  <v-card
    :title="$t('sushi.files.title')"
    :loading="status === 'pending'"
    prepend-icon="mdi-file-tree"
  >
    <template v-if="showSushi" #subtitle>
      <SushiSubtitle :model-value="sushi" />
    </template>

    <template #append>
      <v-btn
        :text="$t('refresh')"
        :loading="status === 'pending'"
        prepend-icon="mdi-reload"
        variant="tonal"
        color="primary"
        class="mr-2"
        @click="refresh()"
      />
    </template>

    <template #text>
      <v-row v-if="(files?.length ?? 0) <= 0">
        <v-col class="text-center">
          <v-empty-state
            icon="mdi-file-hidden"
            :title="$t('sushi.files.noFilesAvailable')"
          />
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col>
          <v-treeview
            :items="files ?? []"
            item-value="name"
            item-title="name"
            open-on-click
          >
            <template #prepend="{ item, isOpen }">
              <v-icon v-if="item.children" :icon="isOpen ? 'mdi-folder-open' : 'mdi-folder'" />
              <v-icon v-else icon="mdi-file-outline" />
            </template>

            <template #append="{ item }">
              <template v-if="item.children">
                <span class="text-caption">
                  {{ $t('sushi.files.nbFiles', item.children.length) }}
                </span>
              </template>

              <template v-else>
                <span class="text-caption mr-2">
                  {{ prettySize(item.size) }} - <LocalDate :model-value="item.mtime" format="Pp" />
                </span>

                <v-btn
                  v-if="item.href"
                  v-tooltip="$t('download')"
                  :href="item.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon="mdi-download"
                  color="primary"
                  variant="flat"
                  density="comfortable"
                  size="small"
                />
              </template>
            </template>
          </v-treeview>
        </v-col>
      </v-row>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />
      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
import prettySize from 'pretty-bytes';

const props = defineProps({
  sushi: {
    type: Object,
    required: true,
  },
  showSushi: {
    type: Boolean,
    default: false,
  },
});

const {
  data: files,
  refresh,
  status,
} = await useFetch(`/api/sushi/${props.sushi.id}/files`, { lazy: true });
</script>
