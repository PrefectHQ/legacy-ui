<script>
import { teamProfileMixin } from '@/mixins/teamProfileMixin.js'

export default {
  components: {},
  mixins: [teamProfileMixin],
  data() {
    return {}
  },
  computed: {},
  methods: {}
}
</script>

<template>
  <v-card tile data-cy="profile-card" class="h-100 d-flex flex-column">
    <v-card-title class="mb-2 text-h4 font-weight-light">
      Profile
    </v-card-title>

    <v-card-subtitle> See and edit your team profile.</v-card-subtitle>
    <v-card-text class="align-self-stretch">
      <v-alert
        v-if="!isTenantAdmin"
        class="mx-auto mb-12"
        border="left"
        colored-border
        elevation="2"
        type="warning"
        tile
        icon="lock"
        max-width="540"
      >
        Only your team's administrators can modify these profile settings.
      </v-alert>
      <v-text-field
        v-model="name"
        data-cy="update-profile-name"
        label="Team Name"
        outlined
        class="mb-3"
        counter
        maxlength="80"
        :disabled="isUpdatingTenant"
        :loading="isCheckingName"
        prepend-inner-icon="supervised_user_circle"
        :readonly="!isTenantAdmin"
        @blur="checkName(name)"
        @input="resetNameMetadata"
      >
        <v-icon v-if="showNameCheck" slot="append" class="green--text">
          check
        </v-icon>
        <v-icon v-if="showNameClear" slot="append" class="red--text">
          clear
        </v-icon>
      </v-text-field>

      <v-text-field
        v-model="slug"
        data-cy="update-profile-slug"
        label="URL Slug"
        outlined
        counter
        maxlength="80"
        :disabled="isUpdatingTenant"
        :error-messages="slugErrors"
        :loading="isCheckingSlug"
        prepend-inner-icon="language"
        :readonly="!isTenantAdmin"
        @blur="checkSlug(slug)"
        @input="resetSlugMetadata"
      >
        <v-icon v-if="showSlugCheck" slot="append" class="green--text">
          check
        </v-icon>
        <v-icon v-if="showSlugClear" slot="append" class="red--text">
          clear
        </v-icon>
      </v-text-field>
    </v-card-text>

    <v-spacer />

    <v-card-actions v-if="isTenantAdmin" class="mt-auto">
      <v-spacer></v-spacer>
      <v-btn
        :disabled="!isUpdatable"
        data-cy="update-profile"
        color="primary"
        depressed
        small
        @click="updateTenant"
        >Update Profile</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.h-100 {
  height: 100%;
}
</style>
