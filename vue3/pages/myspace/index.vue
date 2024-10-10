<template>
  <div style="position: relative;">
    <SkeletonPageBar :title="$t('menu.myInstitutions')" />

    <v-container>
      <v-row v-if="!hasMemberships">
        <v-col>
          <!-- Arrow next to "Join an institution" -->
          <div
            class="d-flex justify-center text-primary font-weight-light font-italic"
            style="position: absolute; left: 0.25rem; top: 5.5rem;"
          >
            <v-icon icon="mdi-arrow-top-left-thin" size="large" />

            <span style="transform: translateY(1rem);">
              {{ $t('institutions.searchForInstitution') }}
            </span>
          </div>

          <!-- Text to explain what to do -->
          <v-empty-state
            icon="mdi-domain-off"
            :title="$t('myspace.noMemberships')"
          >
            <template #text>
              <i18n-t keypath="myspace.determineAccessRight">
                <template #team>
                  <nuxt-link to="/contact-us">
                    {{ $t('myspace.ezmesureTeam') }}
                  </nuxt-link>
                </template>

                <template #join>
                  <b class="text-lowercase">
                    {{ $t('institutions.askToJoinAnInstitution') }}
                  </b>
                </template>
              </i18n-t>
            </template>
          </v-empty-state>
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col
          v-for="membership in items"
          :key="membership.institution.id"
          cols="12"
          md="6"
          xl="4"
        >
          <CurrentUserInstitutionCard
            :membership="membership"
            @click:update="institutionFormDialogRef.open($event)"
          />
        </v-col>
      </v-row>
    </v-container>

    <InstitutionFormDialog
      ref="institutionFormDialogRef"
      @update:model-value="currentUser.fetchMemberships()"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'space',
  middleware: ['auth', 'terms'],
});

const currentUser = useCurrentUserStore();
const { hasMemberships, memberships } = storeToRefs(currentUser);

const institutionFormDialogRef = useTemplateRef('institutionFormDialogRef');

const items = computed(() => memberships.value?.filter((m) => {
  const perms = new Set(m.permissions);

  return perms.has('institution:read') || perms.has('institution:write');
}));
</script>
