<script>
import { mapActions, mapGetters } from 'vuex'

import ManagementLayout from '@/layouts/ManagementLayout'
import CreateRoleTable from '@/pages/TeamSettings/CreateRoleTable'
import { formatTime } from '@/mixins/formatTimeMixin'

const DEFAULT_ROLES = ['TENANT_ADMIN', 'USER', 'READ_ONLY_USER']

export default {
  components: {
    ManagementLayout,
    CreateRoleTable
  },
  mixins: [formatTime],
  data() {
    return {
      searchInput: null,
      loading: 0,
      expanded: [],
      createRoleDialog: false,
      clearDialog: false,
      template: null,
      deletingRole: null,
      defaultRoles: DEFAULT_ROLES,
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
          text: 'Actions',
          value: 'actions'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['user']),
    ...mapGetters('license', ['license', 'hasPermission', 'allowedUsers']),
    editedRoles() {
      if (!this.roles) return []
      const defaultRoles = this.roles?.filter(role =>
        this.defaultRoles.includes(role.name)
      )
      const tenantRoles = this.roles?.filter(
        role => role.tenant_id === this.tenant.id
      )
      return [...defaultRoles, ...tenantRoles]
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    // permissionList(list) {
    //   return list.permissions.splice(',')
    // },
    handleAlert(type, message) {
      this.setAlert({
        alertShow: true,
        alertMessage: message,
        alertType: type
      })
    },
    closeDialog() {
      this.clearDialog = true
      this.createRoleDialog = false
      this.template = null
    },
    resetClear() {
      this.clearDialog = false
    },
    editRole(role) {
      this.template = role
      this.createRoleDialog = true
    },
    async deleteRole(role) {
      this.deletingRole = role.id
      try {
        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/delete_custom-role.gql'),
          variables: {
            input: {
              role_id: role.id
            }
          }
        })
        if (res?.data?.delete_custom_role) {
          this.$apollo.queries.roles.refetch()

          this.setAlert({
            alertShow: true,
            alertMessage: 'Role deleted',
            alertType: 'Success'
          })
        }
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage: `${e}`,
          alertType: 'error'
        })
      } finally {
        this.deletingRole = null
      }
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
      <v-dialog
        v-model="createRoleDialog"
        width="70vW"
        @click:outside="closeDialog"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            color="primary"
            class="white--text"
            large
            v-bind="attrs"
            v-on="on"
          >
            <v-icon left>
              person_add
            </v-icon>
            Create Role
          </v-btn>
        </template>

        <CreateRoleTable
          :clear="clearDialog"
          :template="template"
          @reset="resetClear"
          @close="closeDialog"
        />
      </v-dialog>
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
      :search="searchInput"
      :items="editedRoles"
      :items-per-page="10"
      show-expand
      :expanded.sync="expanded"
      item-key="name"
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

      <template #expanded-item="{ item }">
        <CreateRoleTable :template="item" table-only />
      </template>
      <template #item.actions="{item}">
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              text
              fab
              :disabled="defaultRoles.includes(item.name)"
              x-small
              color="primary"
              v-on="on"
              @click="editRole(item)"
            >
              <v-icon>edit</v-icon>
            </v-btn>
          </template>
          Update Role
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              :disabled="defaultRoles.includes(item.name)"
              text
              :loading="deletingRole === item.id"
              fab
              x-small
              color="error"
              v-on="on"
              @click="deleteRole(item)"
            >
              <v-icon>delete</v-icon>
            </v-btn>
          </template>
          Remove role
        </v-tooltip>
      </template>
    </v-data-table>
  </ManagementLayout>
</template>
