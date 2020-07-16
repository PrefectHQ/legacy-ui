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
  <v-card tile max-width="720" class="mx-auto my-4" data-cy="profile-card">
    <v-card-title> Profile </v-card-title>
    <v-card-subtitle> See and edit your team profile.</v-card-subtitle>
    <v-card-text>
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
        maxlength="30"
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
        maxlength="30"
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

    <v-card-actions v-if="isTenantAdmin">
      <v-spacer></v-spacer>
      <v-btn
        :disabled="!isUpdatable"
        data-cy="update-profile"
        color="primary"
        @click="updateTenant"
        >Update Profile</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
