<template>
  <v-navigation-drawer v-model="isOpen" color="grey-lighten-3" width="300">
    <v-list density="compact" class="text-grey-darken-3 pa-0">
      <v-list-item
        :title="$t('menu.institutions')"
        to="/admin/institutions"
        prepend-icon="mdi-domain"
      />

      <v-list-item
        :title="$t('menu.repositories')"
        to="/admin/repositories"
        prepend-icon="mdi-database"
      />

      <v-list-group value="aliases">
        <template #activator="{ props }">
          <v-list-item
            :title="$t('menu.repositoryAliases.group')"
            prepend-icon="mdi-database-eye"
            v-bind="props"
          />
        </template>

        <v-list-item
          :title="$t('menu.repositoryAliases.aliases')"
          to="/admin/repository-aliases"
          prepend-icon="mdi-database-eye"
        />

        <v-list-item
          :title="$t('menu.repositoryAliases.templates')"
          to="/admin/repository-alias-templates"
          prepend-icon="mdi-view-grid"
        />
      </v-list-group>

      <v-list-item
        :title="$t('menu.spaces')"
        to="/admin/spaces"
        prepend-icon="mdi-tab"
      />

      <v-list-item
        :title="$t('menu.users')"
        to="/admin/users"
        prepend-icon="mdi-account-multiple"
      />

      <v-list-item
        :title="$t('menu.elasticRoles')"
        to="/admin/elastic-roles"
        prepend-icon="mdi-account-tag"
      />

      <v-list-item
        :title="$t('menu.sushiEndpoints')"
        to="/admin/endpoints"
        prepend-icon="mdi-api"
      />

      <v-list-item
        :title="$t('menu.customFields')"
        to="/admin/custom-fields"
        prepend-icon="mdi-tag-outline"
      />
      <v-list-item
        :title="$t('menu.harvest')"
        to="/admin/harvests"
        prepend-icon="mdi-tractor"
      />

      <v-list-group value="ezREEPORT">
        <template #activator="{ props }">
          <v-list-item
            :title="$t('menu.adminReport')"
            prepend-icon="mdi-file-chart-outline"
            v-bind="props"
          />
        </template>

        <v-list-item
          :title="$t('report.admin.templateTab')"
          to="/admin/report/templates"
          prepend-icon="mdi-view-grid"
        />

        <v-list-item
          :title="$t('report.admin.presetTab')"
          to="/admin/report/presets"
          prepend-icon="mdi-file"
        />

        <v-list-item
          :title="$t('report.admin.taskTab')"
          to="/admin/report/tasks"
          prepend-icon="mdi-email"
        />

        <v-list-item
          :title="$t('report.admin.adminTab')"
          to="/admin/report"
          prepend-icon="mdi-tools"
        />

        <v-list-item
          :title="$t('report.admin.activityTab')"
          to="/admin/report/activity"
          prepend-icon="mdi-history"
        />
      </v-list-group>

      <v-list-item
        :title="$t('menu.sync')"
        to="/admin/sync"
        prepend-icon="mdi-sync"
      />

      <v-list-item
        :title="$t('menu.activity')"
        to="/admin/activity"
        prepend-icon="mdi-history"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
const { isOpen } = storeToRefs(useDrawerStore());
</script>
