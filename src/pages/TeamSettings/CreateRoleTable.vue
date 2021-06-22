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
      attrs: {
        class: 'mb-0',
        elevation: 0
      },
      attra: {
        height: '20px',
        width: '30%',
        elevation: 0
      },
      attrb: {
        height: '20px',
        width: '80%',
        elevation: 0
      },
      isChanged: false,
      templatePermissions: null,
      permissions: null,
      defaultRole: false,
      enableEdit: false,
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
          log: { name: 'Logs', value: 'log' },
          flow: { name: 'Flow', value: 'flow' }
        },
        Agents: {
          agent: { name: 'Agent', value: 'agent' }
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
    disableEdit() {
      if (this.defaultRole) return true
      if (this.enableEdit) return false
      if (!this.template) return false
      return true
    },
    noName() {
      return !this.template && !this.roleName
    },
    authPermissionObject() {
      let obj = Object.values(this.permissionGroups).map(permissionGroup => {
        this.auth?.user_permissions_filtered_by_license_features?.reduce(
          (permissionsObj, item) => {
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
          },
          permissionGroup
        )
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
    cancel() {
      this.permissions = Object.values(this.templatePermissionObject())
      this.enableEdit = false
      this.$emit('close')
    },
    handleAll(item) {
      if (this.disableEdit) return
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
          mutation: require('@/graphql/Mutations/create-custom-role.gql'),
          variables: {
            input: {
              name: this.roleName,
              permissions: includedPermissions
            }
          }
        })
        if (res?.data?.create_custom_role) {
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
        this.enableEdit = false
        this.$emit('close')
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
        this.enableEdit = false
        this.$apollo.queries.auth.refetch()
        this.$emit('close')
      }
    }
  },
  apollo: {
    auth: {
      query: require('@/graphql/TeamSettings/permissions.gql'),
      loadingKey: 'loadingKey',
      update: data => data.permissions_info
    }
  }
}
</script>

<template>
  <v-card elevation="0" width="100%">
    <div v-if="loading" :style="{ height: '80vH' }" class="text-center pa-4">
      <v-row style="{height: '35px'}">
        <v-col cols="12">
          <v-skeleton-loader v-bind="attra" type="text"></v-skeleton-loader>
          <v-divider></v-divider>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="5">
          <v-skeleton-loader v-bind="attrb" type="text"></v-skeleton-loader>
        </v-col>
        <v-col cols="1"></v-col>
        <v-col v-for="n in 5" :key="n" cols="1">
          <v-skeleton-loader v-bind="attrb" type="text"></v-skeleton-loader>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="4">
          <v-skeleton-loader
            v-for="n in 4"
            :key="n"
            v-bind="attrs"
            type="list-item"
          ></v-skeleton-loader>
        </v-col>
        <v-col cols="8">
          <v-skeleton-loader v-bind="attrs" type="image"></v-skeleton-loader>
        </v-col>
      </v-row>
    </div>
    <div v-else class="font-weight-light">
      <div height="35px" class="ma-2">
        <div v-if="defaultRole" class="pl-2 pt-2"
          >Default Roles can not be modified.</div
        >
        <div v-else class="text-right">
          <div v-if="enableEdit || !template">
            <v-btn small text class="mr-2" @click.stop="cancel">
              Cancel
            </v-btn>
            <v-btn
              small
              color="primary"
              :loading="loadingRole"
              :disabled="!isChanged || noName"
              @click.stop="handleCreateUpdateClick"
            >
              {{ template ? 'Update' : 'Create' }} Role
            </v-btn>
          </div>
          <div v-else class="mr-2">
            <v-btn small color="primary" @click.stop="enableEdit = true">
              Edit
            </v-btn>
          </div>
        </div>
        <v-divider class="mt-2"></v-divider>
      </div>
      <v-sheet height="80vh" :style="{ overflow: 'auto' }" class="pa-4">
        <div v-for="(group, index) in permissions" :key="index">
          <v-row class="mb-4" no-gutters>
            <v-col cols="4" class="text-h5 font-weight-light text--secondary">
              {{ groupName(index) }}
            </v-col>
            <v-col class="text-center mr-4 text--secondary" cols="1"
              ><span>All</span></v-col
            >
            <v-col class="text-center mx-2 text--secondary" cols="1"
              >Create</v-col
            >
            <v-col class="text-center mx-2 text--secondary" cols="1"
              >Read</v-col
            >
            <v-col class="text-center mx-2 text--secondary" cols="1"
              >Update</v-col
            >
            <v-col class="text-center mx-2 text--secondary" cols="1"
              >Delete</v-col
            >
          </v-row>
          <div v-for="(item, indexa) in group" :key="indexa">
            <v-row no-gutters class="pa-0 ma-0">
              <v-col cols="4">
                <span> {{ item.name }} </span>
              </v-col>

              <v-col class="my-0 ml-0 mr-4 text-center" cols="1">
                <v-simple-checkbox
                  v-model="item.includeAll"
                  hide-details
                  :ripple="false"
                  color="primary"
                  class="deep"
                  :disabled="disableEdit"
                  :style="{ 'margin-top': '0px' }"
                  @click="handleAll(item)"
                />
              </v-col>
              <v-col cols="1" class=" mx-2 text-center">
                <v-simple-checkbox
                  v-if="!item.disableCreate"
                  v-model="item.includeCreate"
                  :disabled="disableEdit"
                  color="primary"
                  class="deep"
                  hide-details
                  :ripple="false"
                  :style="{ 'margin-top': '0px' }"
                />
              </v-col>
              <v-col cols="1" class=" mx-2 text-center">
                <v-simple-checkbox
                  v-if="!item.disableRead"
                  v-model="item.includeRead"
                  :disabled="disableEdit"
                  hide-details
                  class="deep"
                  :ripple="false"
                  color="primary"
                  :style="{ 'margin-top': '0px' }"
                />
              </v-col>
              <v-col cols="1" class=" mx-2 text-center">
                <v-simple-checkbox
                  v-if="!item.disableUpdate"
                  v-model="item.includeUpdate"
                  :disabled="disableEdit"
                  hide-details
                  class="deep"
                  :ripple="false"
                  color="primary"
                  :style="{ 'margin-top': '0px' }"
                />
              </v-col>
              <v-col cols="1" class="mx-2 text-center">
                <v-simple-checkbox
                  v-if="!item.disableDelete"
                  v-model="item.includeDelete"
                  :disabled="disableEdit"
                  hide-details
                  class="deep"
                  :ripple="false"
                  color="primary"
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
    </div>
  </v-card>
</template>

<style scoped>
.deep >>> div {
  margin-right: 0px;
}
</style>
