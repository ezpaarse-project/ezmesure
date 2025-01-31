<template>
  <SkeletonPageLoader
    v-if="!institution"
    :error="error"
    show
    show-refresh
    @click:refresh="refresh()"
  />
  <div v-else>
    <SkeletonPageBar :title="institution.name" />

    <v-container>
      <v-row>
        <v-col cols="12" md="6">
          <InstitutionCard
            :institution="institution"
            :loading="status === 'pending'"
          >
            <template #actions>
              <v-switch
                :model-value="institution.validated"
                :label="institution.validated
                  ? $t('institutions.institution.validated')
                  : $t('institutions.institution.notValidated')"
                :loading="validatedLoading"
                density="comfortable"
                color="primary"
                hide-details
                class="ml-2"
                @update:model-value="activateInstitution()"
              />

              <v-spacer />

              <v-btn
                v-if="institutionFormDialogRef"
                v-tooltip="$t('modify')"
                icon="mdi-pencil"
                variant="text"
                density="comfortable"
                color="blue"
                @click="institutionFormDialogRef.open(institution)"
              />
            </template>
          </InstitutionCard>
        </v-col>

        <v-col cols="12" md="6">
          <v-row>
            <v-col>
              <InstitutionParent
                :institution="institution"
                @update:model-value="onParentUpdate($event)"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <InstitutionComponents :institution="institution" />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <InstitutionRepositories :institution="institution" />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <InstitutionSpaces :institution="institution" />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <InstitutionRepositoryAliases :institution="institution" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>

    <InstitutionFormDialog
      ref="institutionFormDialogRef"
      @update:model-value="refresh()"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { params } = useRoute();
const { t } = useI18n();
const snacks = useSnacksStore();

const validatedLoading = ref(false);

const institutionFormDialogRef = useTemplateRef('institutionFormDialogRef');

const {
  error,
  status,
  refresh,
  data: institution,
} = await useFetch(`/api/institutions/${params.id}`, {
  query: {
    include: ['parentInstitution', 'childInstitutions', 'repositories', 'repositoryAliases.repository', 'spaces'],
  },
});

async function activateInstitution() {
  if (!institution.value) {
    return;
  }

  validatedLoading.value = true;
  try {
    const value = !institution.value.validated;
    await $fetch(`/api/institutions/${institution.value.id}/validated`, {
      method: 'PUT',
      body: { value },
    });
    institution.value.validated = value;
  } catch {
    snacks.error(t('cannotUpdateItem', { id: institution.value.name || institution.value.id }));
  }
  validatedLoading.value = false;
}

function onParentUpdate(item) {
  if (!institution.value) {
    return;
  }

  institution.value.parentInstitutionId = item?.id;
  institution.value.parentInstitution = item;
}
</script>
