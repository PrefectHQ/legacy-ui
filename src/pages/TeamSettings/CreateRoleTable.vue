<script>
import { mapActions } from 'vuex'
import _ from 'lodash'

export default {
  components: {},
  props: {
    roleName: {
      type: String,
      required: false,
      default: ''
    },
    template: {
      type: Object,
      required: false,
      default: null
    }
  },
  data() {
    return {
      isChanged: false,
      templatePermissions: null,
      permissions: null,
      defaultRole: false,
      permissionGroups: {
        Auth: {
          'api-key': { name: 'User API Key', value: 'api-key' },
          'service-account': {
            name: 'Service Account',
            value: 'service-account'
          },
          'service-api-key': {
            name: 'Service API Key',
            value: 'service-api-key'
          }
        },
        Flows: {
          run: { name: 'Run', value: 'run' },
          project: { name: 'Project', value: 'project' },
          log: { name: 'Logs', value: 'log' }
        },
        Secrets: {
          secret: { name: 'Secret', value: 'secret' },
          ['secret-value']: { name: 'Secret Value', value: 'secret-value' }
        },
        Features: {
          ['cloud-hook']: { name: 'Cloud Hooks', value: 'cloud-hook' },
          hook: { name: 'Automations', value: 'hook' },
          ['flow-sla']: { name: 'Flow SLA', value: 'flow-sla' },
          ['key-value']: { name: 'Key Value', value: 'key-value' },
          ['concurrency-limit']: {
            name: 'Concurrency Limit',
            value: 'concurrency-limit'
          },
          ['audit-trail']: { name: 'Audit Trail', value: 'audit-trail' }
        },
        // User: {
        //   login: { name: 'Login', value: 'login' }
        // },
        Admin: {
          usage: { name: 'Usage', value: 'usage' },
          user: { name: 'User', value: 'user' },
          tenant: { name: 'Team', value: 'tenant' },
          license: { name: 'License', value: 'license' },
          role: { name: 'Role', value: 'role' },
          membership: { name: 'Membership', value: 'membership' },
          ['membership-invitation']: {
            name: 'Membership Invitation',
            value: 'membership-invitation'
          }
        }
      },
      loadingKey: 0,
      loadingRole: false
    }
  },
  computed: {
    permissionsList() {
      return this.auth?.auth_info?.permissions
    },
    authPermissionObject() {
      let obj = Object.values(this.permissionGroups).map(permissionGroup => {
        this.auth?.permissions?.reduce((permissionsObj, item) => {
          const sections = item.split(':')
          if (permissionsObj[sections[1]]?.includeMore) {
            if (sections[0] === 'create')
              permissionsObj[sections[1]].disableCreate = false
            if (sections[0] === 'read')
              permissionsObj[sections[1]].disableRead = false
            if (sections[0] === 'update')
              permissionsObj[sections[1]].disableUpdate = false
            if (sections[0] === 'delete')
              permissionsObj[sections[1]].disableDelete = false
          } else if (permissionsObj[sections[1]]) {
            permissionsObj[sections[1]] = {
              ...permissionsObj[sections[1]],
              includeMore: true,
              disableCreate: sections[0] !== 'create',
              disableUpdate: sections[0] !== 'update',
              disableRead: sections[0] !== 'read',
              disableDelete: sections[0] !== 'delete',
              includeUpdate: false,
              includeCreate: false,
              includeDelete: false,
              includeRead: false,
              includeAll: false,
              shortName: sections[1],
              key: item,
              value: item
            }
          }
          return permissionsObj
        }, permissionGroup)
        return permissionGroup
      })
      return obj
    },
    loading() {
      return this.loadingKey > 0
    }
  },
  watch: {
    template(val) {
      this.defaultRole = val?.default ? true : false
      this.permissions = Object.values(this.templatePermissionObject())
    },
    permissions: {
      handler: function(val) {
        if (val) this.hasChanges()
      },
      deep: true
    }
  },
  created() {
    this.permissions = Object.values(this.templatePermissionObject())
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    hasChanges() {
      const equal = _.isEqual(this.permissions, this.templatePermissions)
      this.isChanged = !equal
    },
    permissionList(item) {
      return Object.values(item)
    },
    groupName(index) {
      return Object.keys(this.permissionGroups)[index]
    },
    templatePermissionObject() {
      let copiedPermissionsArr = []
      if (!this.authPermissionObject) return
      const permissionsArr = this.authPermissionObject.map(group => {
        Object?.values(group).map(obj => {
          obj.includeCreate = false
          obj.includeRead = false
          obj.includeUpdate = false
          obj.includeDelete = false
          obj.includeAll = false
        })
        this.template?.permissions?.map(item => {
          const sections = item.split(':')
          if (group[sections[1]]) {
            if (sections[0] === 'create')
              group[sections[1]].includeCreate = true
            if (sections[0] === 'read') group[sections[1]].includeRead = true
            if (sections[0] === 'update')
              group[sections[1]].includeUpdate = true
            if (sections[0] === 'delete')
              group[sections[1]].includeDelete = true
            group[sections[1]].includeAll =
              group[sections[1]].includeDelete &&
              group[sections[1]].includeUpdate &&
              group[sections[1]].includeRead &&
              group[sections[1]].includeCreate
          }
        })
        copiedPermissionsArr.push(JSON.parse(JSON.stringify(group)))
        return group
      })
      this.templatePermissions = copiedPermissionsArr
      return permissionsArr
    },
    reset() {
      this.permissions = Object.values(this.templatePermissionObject())
    },
    handleAll(item) {
      if (this.defaultRole) return
      item.includeRead = item.includeAll
      item.includeCreate = item.includeAll
      item.includeDelete = item.includeAll
      item.includeUpdate = item.includeAll
    },
    handleCreateUpdateClick() {
      this.loadingRole = true
      if (this.template) this.updateRole()
      else this.createNewRole()
    },
    async createNewRole() {
      let id = null
      try {
        const includedPermissions = []
        this.permissions.forEach(group => {
          Object.values(group).forEach(permission => {
            // if (permission.includeCreate && !permission.disableCreate) {
            //   console.log(permission)
            // }
            if (permission.includeCreate && !permission.disableCreate)
              includedPermissions.push(`create:${permission.shortName}`)
            if (permission.includeDelete && !permission.disableDelete)
              includedPermissions.push(`delete:${permission.shortName}`)
            if (permission.includeRead && !permission.disableRead)
              includedPermissions.push(`read:${permission.shortName}`)
            if (permission.includeUpdate && !permission.disableUpdate)
              includedPermissions.push(`update:${permission.shortName}`)
          })
        })
        // console.log(includedPermissions)
        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-custom-role.gql'),
          variables: {
            input: {
              name: this.roleName,
              permissions: includedPermissions
            }
          }
        })
        if (res?.data?.create_custom_role) {
          id = res?.data?.create_custom_role.id
          this.setAlert({
            alertShow: true,
            alertMessage: 'Role created',
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
        this.loadingRole = false
        this.$emit('close', id)
      }
    },
    async updateRole() {
      try {
        const includedPermissions = []
        this.permissions.forEach(group => {
          Object.values(group).forEach(permission => {
            if (permission.includeCreate && !permission.disableCreate)
              includedPermissions.push(`create:${permission.shortName}`)
            if (permission.includeDelete && !permission.disableDelete)
              includedPermissions.push(`delete:${permission.shortName}`)
            if (permission.includeRead && !permission.disableRead)
              includedPermissions.push(`read:${permission.shortName}`)
            if (permission.includeUpdate && !permission.disableUpdate)
              includedPermissions.push(`update:${permission.shortName}`)
          })
        })
        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/update-custom-role.gql'),
          variables: {
            input: {
              role_id: this.template.id,
              permissions: includedPermissions
            }
          }
        })
        if (res?.data?.update_custom_role_permissions) {
          this.setAlert({
            alertShow: true,
            alertMessage: 'Role updated',
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
        this.loadingRole = false
        this.$apollo.queries.auth.refetch()
        this.$emit('close')
      }
    }
  },
  apollo: {
    auth: {
      query: require('@/graphql/TeamSettings/permissions.gql'),
      loadingKey: 'loadingKey',
      update: data => data.auth_info
    }
  }
}
</script>

<template>
  <v-card elevation="0" width="100%">
    <v-card-text v-if="loading" :style="{ height: '80vH' }" class="text-center">
      <v-progress-circular
        indeterminate
        class="ma-12"
        :disabled="!isChanged"
        color="primary"
        :size="200"
        :width="8"
      ></v-progress-circular>
    </v-card-text>
    <v-card-text v-else class="font-weight-light">
      <v-card-actions v-if="!template || !template.default">
        <v-spacer />
        <v-btn text @click.stop="reset">
          Reset
        </v-btn>
        <v-btn
          color="primary"
          :loading="loadingRole"
          :disabled="!isChanged"
          @click.stop="handleCreateUpdateClick"
        >
          {{ template ? 'Update' : 'Create' }} Role
        </v-btn>
      </v-card-actions>
      <v-sheet height="80vh" :style="{ overflow: 'auto' }">
        <div v-for="(group, index) in permissions" :key="index">
          <v-row class="mb-4 text-body-1" no-gutters>
            <v-col cols="4" class="text-h5 run-body">
              {{ groupName(index) }}
            </v-col>
            <v-col class="text-left" cols="1">All</v-col>
            <v-col class="text-left" cols="1">Create</v-col>
            <v-col class="text-left" cols="1">Read</v-col>
            <v-col class="text-left" cols="1">Update</v-col>
            <v-col class="text-left" cols="1">Delete</v-col>
          </v-row>
          <div v-for="(item, indexa) in group" :key="indexa">
            <v-row no-gutters class="pa-0 ma-0">
              <v-col cols="4">
                <span class="text-body-1"> {{ item.name }} </span>
              </v-col>

              <v-col class="ma-0" cols="1">
                <v-checkbox
                  v-model="item.includeAll"
                  hide-details
                  :disabled="defaultRole"
                  :style="{ 'margin-top': '0px' }"
                  @click="handleAll(item)"
                />
              </v-col>
              <v-col cols="1" class="ma-0">
                <v-checkbox
                  v-if="!item.disableCreate"
                  v-model="item.includeCreate"
                  :disabled="defaultRole"
                  hide-details
                  :style="{ 'margin-top': '0px' }"
                />
              </v-col>
              <v-col cols="1" class="ma-0">
                <v-checkbox
                  v-if="!item.disableRead"
                  v-model="item.includeRead"
                  :disabled="defaultRole"
                  hide-details
                  :style="{ 'margin-top': '0px' }"
                />
              </v-col>
              <v-col cols="1" class="ma-0">
                <v-checkbox
                  v-if="!item.disableUpdate"
                  v-model="item.includeUpdate"
                  :disabled="defaultRole"
                  hide-details
                  :style="{ 'margin-top': '0px' }"
                />
              </v-col>
              <v-col cols="1" class="ma-0">
                <v-checkbox
                  v-if="!item.disableDelete"
                  v-model="item.includeDelete"
                  :disabled="defaultRole"
                  hide-details
                  :style="{ 'margin-top': '0px' }"
                />
              </v-col>
            </v-row>
          </div>
          <v-row>
            <v-col class="my-4" cols="12"><v-divider></v-divider></v-col>
          </v-row>
        </div>
      </v-sheet>
    </v-card-text>
  </v-card>
</template>
