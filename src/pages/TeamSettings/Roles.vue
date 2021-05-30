<script>
import { mapActions, mapGetters } from 'vuex'

import ManagementLayout from '@/layouts/ManagementLayout'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    ManagementLayout
  },
  mixins: [formatTime],
  data() {
    return {
      search: null,
      loading: 0,
      headers: [
        {
          text: 'Name',
          value: 'name'
        },
        {
          text: 'Created',
          value: 'created'
        },
        {
          text: 'Updated',
          value: 'updated'
        },
        {
          text: 'Permissions',
          value: 'permissions',
          width: '20%'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['user']),
    ...mapGetters('license', ['license', 'hasPermission', 'allowedUsers'])
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    handleAlert(type, message) {
      this.setAlert({
        alertShow: true,
        alertMessage: message,
        alertType: type
      })
    }
  },
  apollo: {
    roles: {
      query: require('@/graphql/TeamSettings/roles.gql'),
      loadingKey: 'loading',
      variables() {
        return {}
      },
      pollInterval: 10000,
      update: data => data.auth_role
    }
  }
}
</script>

<template>
  <ManagementLayout :show="!loading" control-show>
    <template #title>Roles</template>

    <template #subtitle>
      <span>
        Create Custom Roles
      </span>
    </template>

    <template #cta>
      <v-btn color="primary" class="white--text" large>
        <v-icon left>
          person_add
        </v-icon>
        Create Role
      </v-btn>
    </template>

    <v-text-field
      v-if="!$vuetify.breakpoint.mdAndUp"
      v-model="searchInput"
      class="rounded-0 elevation-1 mb-1"
      solo
      dense
      hide-details
      single-line
      placeholder="Search by role or permission"
      prepend-inner-icon="search"
      autocomplete="new-password"
    ></v-text-field>
    <v-data-table
      fixed-header
      :headers="headers"
      :header-props="{ 'sort-icon': 'arrow_drop_up' }"
      :search="search"
      :items="roles"
      :items-per-page="10"
      class="elevation-2 rounded-0 truncate-table"
      :footer-props="{
        showFirstLastPage: true,
        itemsPerPageOptions: [10, 15, 20, -1],
        firstIcon: 'first_page',
        lastIcon: 'last_page',
        prevIcon: 'keyboard_arrow_left',
        nextIcon: 'keyboard_arrow_right'
      }"
      no-results-text=" No roles found. Try expanding your search?"
    >
      <!-- HEADERS -->
      <template #header.name="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #header.created_by="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #header.created="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #header.last_used="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #header.expires_at="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #header.scope="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #item.updated="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on">
              {{ item.updated ? formDate(item.updated) : '' }}
            </span>
          </template>
          <span>
            {{ item.updated ? formatTime(item.updated) : '' }}
          </span>
        </v-tooltip>
      </template>
      <template #item.created="{ item }">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on">
              {{ item.created ? formDate(item.created) : '' }}
            </span>
          </template>
          <span>
            {{ item.created ? formatTime(item.created) : '' }}
          </span>
        </v-tooltip>
      </template>
      <template #item.permissions="{ item }">
        <truncate :content="item.permissions.toString()">{{
          item.permissions
        }}</truncate>
      </template>
    </v-data-table>
  </ManagementLayout>
</template>
