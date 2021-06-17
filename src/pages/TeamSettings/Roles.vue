<script>
import { mapActions, mapGetters } from 'vuex'
import CreateRoleTable from '@/pages/TeamSettings/CreateRoleTable'
import { formatTime } from '@/mixins/formatTimeMixin'

const DEFAULT_ROLES = [
  'TENANT_ADMIN',
  'USER',
  'READ_ONLY_USER',
  'ENTERPRISE_LICENSE_ADMIN'
]

export default {
  components: {
    CreateRoleTable
  },
  mixins: [formatTime],
  data() {
    return {
      loading: 0,
      template: null,
      deletingRole: null,
      defaultRoles: DEFAULT_ROLES,
      useDefault: true,
      roleName: '',
      addRole: false,
      roleId: null
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
    selectedRole() {
      if (this.roleId) return this.roleId
      if (this.template) return this.template.id
      return null
    },
    editedRoles() {
      if (!this.roles) return []
      const defaultRoles = this.roles?.reduce((arr, role) => {
        if (this.defaultRoles.includes(role.name))
          arr.push({ ...role, default: true })
        return arr
      }, [])
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
    },
    tenant() {
      this.$apollo.queries.roles.refetch()
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    //We should update to use same formatting as in members page?
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
      this.roleId = null
      if (roleType === 'new') {
        this.addRole = !this.addRole
      } else {
        this.addRole = false
      }
      this.template = role
    },
    cancelAddName() {
      this.roleName = ''
      this.addRole = false
    },
    refetch(id) {
      this.$apollo.queries.roles.refetch()
      this.cancelAddName()
      if (id) this.roleId = id
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
        if (this.template.id === role.id)
          this.template =
            this.editedRoles?.tenantRoles?.filter(
              role => role.id === this.role
            )[0] ||
            this.editedRoles?.defaultRoles?.filter(
              role => role.id === this.role
            )[0]
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
  <v-sheet height="85vH" class="app-background">
    <v-row>
      <v-col cols="3" class="pa-0 ma-0">
        <v-navigation-drawer permanent class="ma-0" width="100%">
          <v-list dense nav>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="text-subtitle-1 mb-2 mt-4">
                  Default Roles
                </v-list-item-title>
                <div v-if="loading" class="text-center">
                  <v-progress-linear
                    :width="5"
                    color="primary"
                    indeterminate
                  ></v-progress-linear>
                </div>
                <v-divider v-else></v-divider>
              </v-list-item-content>
            </v-list-item>

            <v-list-item
              v-for="item in editedRoles.defaultRoles"
              :key="item.name"
              link
            >
              <v-list-item-content @click="handleRoleSelect(item, 'default')">
                <v-list-item-title
                  :class="selectedRole === item.id ? 'primary--text' : ''"
                  class="text-body-2"
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
                <v-list-item-title class="text-subtitle-1">
                  Custom Roles
                  <v-btn
                    color="primary"
                    icon
                    small
                    @click="handleRoleSelect(null, 'new')"
                  >
                    <v-icon>add</v-icon>
                  </v-btn>
                </v-list-item-title>
                <v-divider></v-divider>
              </v-list-item-content>
            </v-list-item>
            <div v-if="loading" class="text-center">
              <v-progress-linear
                color="primary"
                indeterminate
              ></v-progress-linear>
            </div>

            <v-sheet v-else :style="{ overflow: 'auto' }" height="40vH">
              <v-list-item
                v-for="item in editedRoles.tenantRoles"
                :key="item.value"
                class="show-icon"
                link
              >
                <v-list-item-content @click="handleRoleSelect(item, 'tenant')">
                  <v-list-item-title
                    :class="selectedRole === item.id ? 'primary--text' : ''"
                    class="text-body-2"
                    >{{ item.name }}
                  </v-list-item-title>
                </v-list-item-content>

                <v-list-item-icon class="hidden-icon">
                  <v-btn
                    :disabled="defaultRoles.includes(item.name)"
                    icon
                    :loading="deletingRole === item.id"
                    x-small
                    color="error"
                    @click="deleteRole(item)"
                    ><v-icon>delete</v-icon></v-btn
                  >
                </v-list-item-icon>
              </v-list-item>
              <v-list-item v-if="addRole">
                <v-list-item-content>
                  <v-list-item-title>
                    <v-text-field
                      v-model="roleName"
                      class="text-body-2 pa-0"
                      required
                      autofocus
                      hide-details
                      placeholder="Role Name"
                    ></v-text-field>
                  </v-list-item-title>
                </v-list-item-content>
                <v-list-item-icon>
                  <v-btn
                    text
                    fab
                    x-small
                    color="blue-grey"
                    @click="cancelAddName"
                  >
                    <v-icon>clear</v-icon>
                  </v-btn>
                </v-list-item-icon>
              </v-list-item>
            </v-sheet>
          </v-list>
        </v-navigation-drawer>
      </v-col>
      <v-col cols="9" class="pa-0">
        <CreateRoleTable
          table-only
          :template="template"
          :role-name="roleName"
          @close="refetch"
        />
      </v-col>
    </v-row>
  </v-sheet>
</template>

<style scoped>
.hidden-icon {
  display: none;
}

.show-icon:hover .hidden-icon {
  display: inline;
}
</style>
