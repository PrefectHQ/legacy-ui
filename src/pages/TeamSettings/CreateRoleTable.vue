<script>
import { mapActions } from 'vuex'
export default {
  components: {},
  props: {
    clear: {
      type: Boolean,
      required: false,
      default: false
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
      roleName: '',
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
      let saveTenant
      let obj = this.auth?.permissions?.reduce((permissionsObj, item) => {
        const sections = item.split(':')
        if (!['create', 'delete', 'update', 'read'].includes(sections[0])) {
          if (item === 'tenant:admin') this.showTenantAdmin = true
          return permissionsObj
        }
        if (!permissionsObj[sections[1]]) {
          if (sections[1] === 'tenant') {
            saveTenant = {
              disableCreate: sections[0] !== 'create',
              disableUpdate: sections[0] !== 'update',
              disableRead: sections[0] !== 'read',
              disableDelete: sections[0] !== 'delete',
              includeUpdate: false,
              includeCreate: false,
              includeDelete: false,
              includeRead: false,
              includeAll: false,
              name: sections[1],
              key: item,
              value: item
            }
            return permissionsObj
          }
          permissionsObj[sections[1]] = {
            disableCreate: sections[0] !== 'create',
            disableUpdate: sections[0] !== 'update',
            disableRead: sections[0] !== 'read',
            disableDelete: sections[0] !== 'delete',
            includeUpdate: false,
            includeCreate: false,
            includeDelete: false,
            includeRead: false,
            includeAll: false,
            name: sections[1],
            key: item,
            value: item
          }
        } else {
          if (sections[0] === 'create')
            permissionsObj[sections[1]].disableCreate = false
          if (sections[0] === 'read')
            permissionsObj[sections[1]].disableRead = false
          if (sections[0] === 'update')
            permissionsObj[sections[1]].disableUpdate = false
          if (sections[0] === 'delete')
            permissionsObj[sections[1]].disableDelete = false
        }
        return permissionsObj
      }, {})
      if (saveTenant) {
        obj = { saveTenant, ...obj }
      }
      if (this.showTenantAdmin) {
        obj = {
          TenantAdmin: {
            name: 'Tenant Admin',
            includeAll: false,
            value: 'tenant:admin',
            hideCheck: true
          },
          ...obj
        }
      }
      return obj
    },
    templatePermissionObject() {
      if (!this.authPermissionObject) return
      const permissionsObj = this.authPermissionObject
      this.template?.permissions.map(item => {
        const sections = item.split(':')
        if (permissionsObj[sections[1]]) {
          if (sections[0] === 'create')
            permissionsObj[sections[1]].includeCreate = true
          if (sections[0] === 'read')
            permissionsObj[sections[1]].includeRead = true
          if (sections[0] === 'update')
            permissionsObj[sections[1]].includeUpdate = true
          if (sections[0] === 'delete')
            permissionsObj[sections[1]].includeDelete = true
        }
      })
      return permissionsObj
    },
    permissions() {
      if (!this.authPermissionObject && !this.templatePermissionObject)
        return []
      const permissionObject = this.template
        ? this.templatePermissionObject
        : this.authPermissionObject
      return Object.values(permissionObject)
    },
    loading() {
      return this.loadingKey > 0
    }
  },
  watch: {
    clear(val) {
      if (val) {
        this.includedPermissions = []
        this.roleName = ''
        this.$emit('reset')
      }
    },
    template(val) {
      if (val) {
        this.roleName = val.name
        this.includedPermissions = this.permissions
      }
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
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
        this.cancel()
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
        this.cancel()
      }
    },
    cancel() {
      this.includedPermissions = []
      this.roleName = ''
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
    <v-card-title v-if="!tableOnly"> Add name and permissions</v-card-title>
    <v-card-subtitle v-if="!tableOnly" class="mt-4 pb-0">
      <v-text-field
        v-model="roleName"
        :disabled="!!template"
        outlined
        required
        placeholder="Role Name"
      ></v-text-field>
    </v-card-subtitle>
    <v-card-text>
      <v-sheet height="70vh" :style="{ overflow: 'auto' }">
        <v-text-field
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
        ></v-text-field>
        <v-data-table
          fixed-header
          height="100vH"
          :hide-default-footer="!!template"
          :headers="headers"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :items="permissions"
          item-key="key"
          :loading="loading"
          :items-per-page="itemsPerPage"
          class="elevation-2 rounded-0 truncate-table"
          :footer-props="{
            showFirstLastPage: true,

            firstIcon: 'first_page',
            lastIcon: 'last_page',
            prevIcon: 'keyboard_arrow_left',
            nextIcon: 'keyboard_arrow_right'
          }"
          :search="searchInput"
          no-results-text="No permissions found. Try expanding your search?"
          no-data-text="No data."
        >
          <!-- HEADERS -->
          <!-- <template v-if="template" #top>
            <v-switch
              v-model="allPermissions"
              label="Show all permissions"
              class="pa-3"
            ></v-switch>
          </template> -->
          <template #item.all="{item}">
            <v-checkbox
              v-model="item.includeAll"
              :disabled="item.disableRead"
              @click="handleAll(item)"
            />
          </template>
          <template #item.create="{item}">
            <v-checkbox
              v-if="!item.hideCheck"
              v-model="item.includeCreate"
              :disabled="item.disableCreate"
            />
          </template>
          <template #item.read="{item}">
            <v-checkbox
              v-if="!item.hideCheck"
              v-model="item.includeRead"
              :disabled="item.disableRead"
            />
          </template>
          <template #item.update="{item}">
            <v-checkbox
              v-if="!item.hideCheck"
              v-model="item.includeUpdate"
              :disabled="item.disableUpdate"
            />
          </template>
          <template #item.delete="{item}">
            <v-checkbox
              v-if="!item.hideCheck"
              v-model="item.includeDelete"
              :disabled="item.disableDelete"
            />
          </template>
        </v-data-table>
      </v-sheet>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text color="error" @click.stop="cancel">
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        :loading="loadingRole"
        :disabled="!roleName"
        @click.stop="handleCreateUpdateClick"
      >
        {{ template ? 'Update' : 'Create' }} Role
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
