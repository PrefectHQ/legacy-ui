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
      useDefault: true,
      roleName: '',
      addRole: false,
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
    ...mapGetters('license', [
      'license',
      'hasPermission',
      'allowedUsers',
      'role'
    ]),
    editedRoles() {
      if (!this.roles) return []
      const defaultRoles = this.roles?.filter(role =>
        this.defaultRoles.includes(role.name)
      )
      const tenantRoles = this.roles?.filter(
        role => role.tenant_id === this.tenant.id
      )
      return { defaultRoles, tenantRoles }
    }
  },
  watch: {
    editedRoles() {
      if (this.useDefault) {
        const role =
          this.editedRoles?.tenantRoles?.filter(
            role => role.id === this.role
          )[0] ||
          this.editedRoles?.defaultRoles?.filter(
            role => role.id === this.role
          )[0]
        this.template = role
      }
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    //We could update to use same formatting as in members page?
    formatName(name) {
      const newName = name
        .split('_')
        .map(
          word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
        )
      return newName.join(' ')
    },
    handleRoleSelect(role, roleType) {
      this.useDefault = false
      if (roleType === 'default') {
        role = { ...role, default: true }
      }
      if (roleType === 'new') {
        this.addRole = true
      } else {
        this.addRole = false
      }
      this.template = role
    },
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
        <v-list dense nav>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                Default Roles
              </v-list-item-title>
              <v-divider></v-divider>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            v-for="item in editedRoles.defaultRoles"
            :key="item.name"
            link
          >
            <v-list-item-content @click="handleRoleSelect(item, 'default')">
              <v-list-item-title
                :class="
                  template && template.name == item.name ? 'blue--text' : ''
                "
                >{{ formatName(item.name) }}</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-list
          v-if="
            editedRoles &&
              editedRoles.tenantRoles &&
              editedRoles.tenantRoles.length
          "
          dense
          nav
        >
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                Custom Roles
              </v-list-item-title>
              <v-divider></v-divider>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            v-for="item in editedRoles.tenantRoles"
            :key="item.value"
            link
          >
            <v-list-item-content @click="handleRoleSelect(item, 'tenant')">
              <v-list-item-title
                :class="
                  template && template.name == item.name ? 'blue--text' : ''
                "
                >{{ item.name }}</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-if="addRole">
            <v-list-item-content>
              <v-list-item-title>
                <v-text-field
                  v-model="roleName"
                  required
                  placeholder="Role Name"
                ></v-text-field
              ></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <div class="text-center mt-8">
          <v-btn
            color="primary"
            class="white--text"
            large
            @click="handleRoleSelect(null, 'new')"
          >
            <v-icon left>
              person_add
            </v-icon>
            Create Role
          </v-btn>
        </div>
      </v-navigation-drawer>
    </v-col>
    <v-col cols="9" class="pa-0">
      <CreateRoleTable table-only :template="template" :role-name="roleName" />
    </v-col>
  </v-row>
</template>
