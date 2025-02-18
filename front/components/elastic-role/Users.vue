<template>
  <v-card
    :title="$t('elasticRoles.assignments')"
    :subtitle="showRole ? role.name : undefined"
    prepend-icon="mdi-account-multiple"
  >
    <template #append>
      <UserAddMenu
        :model-value="users"
        :title="$t('elasticRoles.addUser')"
        @user-add="addUser($event)"
      >
        <template #activator="{ props: menu }">
          <v-btn
            v-tooltip="$t('add')"
            icon="mdi-plus"
            variant="text"
            density="comfortable"
            color="green"
            size="small"
            class="ml-2"
            v-bind="menu"
          />
        </template>
      </UserAddMenu>
    </template>

    <template #text>
      <div v-if="users.length <= 0" class="text-center text-grey pt-5">
        {{ $t('elasticRoles.noUsers') }}
      </div>

      <v-list v-else density="compact" lines="two">
        <v-list-item
          v-for="user in users"
          :key="user.username"
          :title="user.fullName"
          :subtitle="user.email"
        >
          <template #append>
            <v-btn
              v-tooltip="$t('revoke')"
              icon="mdi-account-off"
              variant="text"
              size="small"
              density="comfortable"
              color="red"
              @click="removeUser(user)"
            />
          </template>
        </v-list-item>
      </v-list>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  role: {
    type: Object,
    required: true,
  },
  showRole: {
    type: Boolean,
    default: false,
  },
});

const snacks = useSnacksStore();
const { t } = useI18n();

const emit = defineEmits({
  'update:modelValue': () => true,
});

/** @type {Ref<object[]>} */
const users = ref(props.role.users || []);

async function addUser(item) {
  try {
    const updatedUser = await $fetch(`/api/users/${item.username}/elastic-roles/${props.role.name}`, {
      method: 'PUT',
      body: {},
    });
    users.value.push(updatedUser);
    emit('update:modelValue', users.value);
  } catch {
    snacks.error(t('institutions.members.cannotAddMember'));
  }
}

async function removeUser(item) {
  try {
    await $fetch(`/api/users/${item.username}/elastic-roles/${props.role.name}`, {
      method: 'DELETE',
    });

    users.value = users.value.filter((user) => user.username !== item.username);

    emit('update:modelValue', users.value);
  } catch {
    snacks.error(t('anErrorOccurred'));
  }
}
</script>
