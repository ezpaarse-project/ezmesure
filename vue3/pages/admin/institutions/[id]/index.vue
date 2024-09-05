<template>
  <SkeletonPageLoader
    v-if="!institution"
    :error="error"
    show
    show-refresh
    @click:refresh="refresh()"
  />
  <div v-else>
    <SkeletonPageBar :title="institution.name">
      <v-btn
        v-tooltip="$t('institutions.reports.reports')"
        :to="`/admin/institutions/${institution.id}/reports`"
        icon="mdi-file-chart-outline"
        variant="tonal"
        density="comfortable"
        color="primary"
        class="mr-4"
      />

      <v-btn
        v-tooltip="$t('institutions.sushi.credentials')"
        :to="`/admin/institutions/${institution.id}/sushi`"
        icon="mdi-key"
        variant="tonal"
        density="comfortable"
        color="primary"
        class="mr-4"
      />

      <v-btn
        v-tooltip="$t('institutions.members.members')"
        :to="`/admin/institutions/${institution.id}/members`"
        icon="mdi-account-multiple"
        variant="tonal"
        density="comfortable"
        color="primary"
        class="mr-4"
      />

      <v-btn
        v-if="institutionFormRef"
        v-tooltip="$t('modify')"
        icon="mdi-pencil"
        variant="tonal"
        density="comfortable"
        color="blue"
        class="mr-4"
        @click="institutionFormRef.open(institution)"
      />
    </SkeletonPageBar>

    <v-container>
      <v-row>
        <v-col cols="12" md="6">
          <InstitutionCard
            :institution="institution"
            :loading="status === 'pending'"
            @update:model-value="refresh()"
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
        </v-col>
      </v-row>
    </v-container>

    <InstitutionFormDialog
      ref="institutionFormRef"
      @update:model-value="refresh()"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'terms', 'admin'],
});

const { params } = useRoute();
const { t } = useI18n();
const snacks = useSnacksStore();

const validatedLoading = ref(false);

/** @type {Ref<Object | null>} Vue ref of the institution form */
const institutionFormRef = ref(null);

const {
  error,
  status,
  refresh,
  data: institution,
} = await useFetch(`/api/institutions/${params.id}`, {
  query: {
    include: ['parentInstitution', 'childInstitutions', 'repositories', 'spaces'],
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
  } catch (e) {
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
