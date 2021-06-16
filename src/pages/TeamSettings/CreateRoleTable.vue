const permissionGroups = { Auth: {api-key: {name: "User API Key", value:
'api-key'}, service-account: {name: 'Service Account', value:
'service-account'}, 'service-api-key': {name: "Service API Key", value:
'service-api-key'}}, Flows: {run: {name "Run", value: "run"}, project:
{name:'project', value: 'project'}, logs: {name: 'Logs', value: 'logs'}}}

<script>
import { mapActions } from 'vuex'
export default {
  components: {},
  props: {
    // clear: {
    //   type: Boolean,
    //   required: false,
    //   default: false
    // },
    roleName: {
      type: String,
      required: false,
      default: ''
    },
    template: {
      type: Object,
      required: false,
      default: null
    },
    tableOnly: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
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
        User: {
          login: { name: 'Login', value: 'login' }
        },
        Admin: {
          usage: { name: 'Usage', value: 'usage' }
        }
      },
      // Table headers
      headers: [
        {
          text: 'Type',
          value: 'name'
        },
        { text: '', value: 'all' },
        { text: 'Read', value: 'read' },
        { text: 'Create', value: 'create' },
        { text: 'Update', value: 'update' },
        { text: 'Delete', value: 'delete' }
      ],
      includedPermissions: [],
      searchInput: '',
      // roleName: '',
      loadingKey: 0,
      allPermissions: false,
      loadingRole: false,
      showTenantAdmin: false
    }
  },
  computed: {
    itemsPerPage() {
      return this.permissions?.length
    },
    permissionsList() {
      return this.auth?.auth_info?.permissions
      // return this.allPermissions
      //   ? [
      //       ...this.template?.permissions,
      //       ...this.auth?.permissions.filter(
      //         permission => !this.template.permissions.includes(permission)
      //       )
      //     ]
      //   : this.template?.permissions || this.auth?.permissions
    },
    authPermissionObject() {
      let obj = Object.values(this.permissionGroups).map(permissionGroup => {
        // console.log('group', permissionGroup)
        this.auth?.permissions?.reduce((permissionsObj, item) => {
          const sections = item.split(':')
          // if (!['create', 'delete', 'update', 'read'].includes(sections[0])) {
          //   if (item === 'tenant:admin') this.showTenantAdmin = true
          //   return permissionsObj
          // }
          // console.log('name', permissionsObj)
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
        console.log(permissionGroup)
        return permissionGroup
      })
      // console.log(obj)
      return obj
    },
    permissions() {
      if (!this.authPermissionObject && !this.templatePermissionObject)
        return []
      const permissionObject = this.templatePermissionObject()

      return Object.values(permissionObject)
    },
    loading() {
      return this.loadingKey > 0
    }
  },
  watch: {},
  methods: {
    ...mapActions('alert', ['setAlert']),
    permissionList(item) {
      return Object.values(item)
    },
    groupName(index) {
      return Object.keys(this.permissionGroups)[index]
    },
    templatePermissionObject() {
      // console.log(this.authPermissionObject)
      if (!this.authPermissionObject) return
      const permissionsObj = this.authPermissionObject.map(group => {
        Object?.values(group).map(obj => {
          obj.includeCreate = false
          obj.includeRead = false
          obj.includeUpdate = false
          obj.includeDelete = false
          obj.includeAll = false
        })
        // console.log('group', group)
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
        return group
      })
      return permissionsObj
    },
    handleAll(item) {
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
        this.permissions.forEach(permission => {
          if (permission.includeCreate)
            includedPermissions.push(`create:${permission.name}`)
          if (permission.includeDelete)
            includedPermissions.push(`delete:${permission.name}`)
          if (permission.includeRead)
            includedPermissions.push(`read:${permission.name}`)
          if (permission.includeUpdate)
            includedPermissions.push(`update:${permission.name}`)
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
        this.reset()
      }
    },
    async updateRole() {
      try {
        const includedPermissions = []
        this.permissions.forEach(permission => {
          if (permission.includeCreate)
            includedPermissions.push(`create:${permission.name}`)
          if (permission.includeDelete)
            includedPermissions.push(`delete:${permission.name}`)
          if (permission.includeRead)
            includedPermissions.push(`read:${permission.name}`)
          if (permission.includeUpdate)
            includedPermissions.push(`update:${permission.name}`)
        })
        // const permissions = this.includedPermissions.map(
        //   permission => permission.value
        // )
        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/update-custom-role.gql'),
          variables: {
            input: {
              role_id: this.template.id,
              permissions: includedPermissions
            }
          }
        })
        if (res?.data?.update_custom_role) {
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
        this.reset()
      }
    },
    reset() {
      this.templatePermissionObject()
      // this.roleName = ''
      this.$emit('close')
    }
  },
  apollo: {
    auth: {
      query: require('@/graphql/TeamSettings/permissions.gql'),
      loadingKey: 'loadingKey',
      // pollInterval: 1000,
      update: data => data.auth_info
    }
  }
}
</script>

<template>
  <v-card width="100%">
    <!-- <v-card-title v-if="!tableOnly"> Add name and permissions</v-card-title>
    <v-card-subtitle v-if="!tableOnly" class="mt-4 pb-0">
      <v-text-field
        v-model="roleName"
        :disabled="!!template"
        outlined
        required
        placeholder="Role Name"
      ></v-text-field>
    </v-card-subtitle> -->
    <v-card-text class="font-weight-light">
      <!-- <v-sheet height="70vh" :style="{ overflow: 'auto' }"> -->
      <!-- <v-text-field
          v-if="!tableOnly"
          v-model="searchInput"
          class="rounded-0 elevation-1 mb-1"
          solo
          dense
          hide-details
          single-line
          placeholder="Search by type or name"
          prepend-inner-icon="search"
          autocomplete="new-password"
        ></v-text-field> -->

      <!-- <v-container fluid> -->
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
        <div v-for="(item, indexa) in permissionList(group)" :key="indexa">
          <v-row no-gutters class="pa-0 ma-0">
            <v-col cols="4">
              <span class="text-body-1"> {{ item.name }} </span>
            </v-col>

            <v-col class="ma-0" cols="1">
              <v-checkbox
                v-model="item.includeAll"
                hide-details
                :style="{ 'margin-top': '0px' }"
                @click="handleAll(item)"
              />
            </v-col>
            <v-col cols="1" class="ma-0">
              <!-- </template> -->
              <!-- <template #item.create="{item}"> -->
              <v-checkbox
                v-if="!item.hideCheck"
                v-model="item.includeCreate"
                hide-details
                :style="{ 'margin-top': '0px' }"
                :disabled="item.disableCreate"
              />
            </v-col>
            <v-col cols="1" class="ma-0">
              <!-- </template> -->
              <!-- <template #item.read="{item}"> -->
              <v-checkbox
                v-if="!item.hideCheck"
                v-model="item.includeRead"
                hide-details
                :style="{ 'margin-top': '0px' }"
                :disabled="item.disableRead"
              />
            </v-col>
            <v-col cols="1" class="ma-0">
              <!-- </template>
            <template #item.update="{item}"> -->
              <v-checkbox
                v-if="!item.hideCheck"
                v-model="item.includeUpdate"
                hide-details
                :style="{ 'margin-top': '0px' }"
                :disabled="item.disableUpdate"
              />
            </v-col>
            <v-col cols="1" class="ma-0">
              <!-- </template>
            <template #item.delete="{item}"> -->
              <v-checkbox
                v-if="!item.hideCheck"
                v-model="item.includeDelete"
                hide-details
                :style="{ 'margin-top': '0px' }"
                :disabled="item.disableDelete"
              />
            </v-col>
          </v-row>
        </div>
        <v-row>
          <v-col class="my-4" cols="12"><v-divider></v-divider></v-col>
        </v-row>
        <!-- </template> -->
        <!-- </v-data-table> -->
      </div>
      <!-- </v-container>
      </v-sheet> -->
    </v-card-text>
    <v-card-actions v-if="!template || !template.default">
      <v-spacer />
      <v-btn text @click.stop="reset">
        Reset
      </v-btn>
      <v-btn
        color="primary"
        :loading="loadingRole"
        @click.stop="handleCreateUpdateClick"
      >
        {{ template ? 'Update' : 'Create' }} Role
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
