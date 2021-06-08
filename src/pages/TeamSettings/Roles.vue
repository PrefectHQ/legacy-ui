<script>
import { mapActions, mapGetters } from 'vuex'

// import ManagementLayout from '@/layouts/ManagementLayout'
import CreateRoleTable from '@/pages/TeamSettings/CreateRoleTable'
import { formatTime } from '@/mixins/formatTimeMixin'

const DEFAULT_ROLES = ['TENANT_ADMIN', 'USER', 'READ_ONLY_USER']

export default {
  components: {
    // ManagementLayout,
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
      this.expanded.push(role)
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
  <v-row>
    <v-col cols="3" class="pa-0 ma-0">
      <v-navigation-drawer permanent class="ma-0" width="100%">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="text-h6">
              Roles
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-divider></v-divider>

        <v-list dense nav>
          <v-list-item v-for="item in roles" :key="item.value" link>
            <v-list-item-content>
              <v-list-item-title>{{ item.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
    </v-col>
    <v-col cols="9" class="pa-0">
      <CreateRoleTable />
    </v-col>
  </v-row>
</template>
