<script>
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
    }
  },
  data() {
    return {
      // Table headers
      headers: [
        {
          text: 'Type',
          value: 'type'
        },
        {
          text: 'Permission',
          value: 'name'
        }
      ],
      includedPermissions: [],
      searchInput: '',
      roleName: '',
      loadingKey: 0,
      allPermissions: false
    }
  },
  computed: {
    permissions() {
      const list = this.allPermissions
        ? [
            ...this.template?.permissions,
            ...this.auth?.permissions.filter(
              permission => !this.template.permissions.includes(permission)
            )
          ]
        : this.template?.permissions || this.auth?.permissions
      return list?.map((item, index) => {
        const sections = item.split(':')
        return { type: sections[0], name: sections[1], key: index, value: item }
      })
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
    handleCreateUpdateClick() {
      if (this.template) this.updateNewRole()
      else this.createNewRole()
    },
    createNewRole() {
      console.log('role', this.roleName, this.includedPermissions)
    },
    updateNewRole() {
      console.log('role', this.roleName, this.includedPermissions)
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
      variables() {
        return {}
      },
      pollInterval: 10000,
      update: data => data.auth_info
    }
  }
}
</script>

<template>
  <v-card>
    <v-card-title> Select permissions</v-card-title>
    <v-card-subtitle class="mt-4 pb-0">
      <v-text-field
        v-model="roleName"
        outlined
        required
        placeholder="Role Name"
      ></v-text-field>
    </v-card-subtitle>
    <v-card-text>
      <v-text-field
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
        v-model="includedPermissions"
        fixed-header
        :headers="headers"
        :header-props="{ 'sort-icon': 'arrow_drop_up' }"
        :items="permissions"
        item-key="key"
        :loading="loading"
        :items-per-page="10"
        show-select
        class="elevation-2 rounded-0 truncate-table"
        :footer-props="{
          showFirstLastPage: true,
          itemsPerPageOptions: [10, 15, 20, -1],
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
        <template v-if="template" #top>
          <v-switch
            v-model="allPermissions"
            label="Show all permissions"
            class="pa-3"
          ></v-switch>
        </template>
      </v-data-table>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text color="error" @click.stop="cancel">
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        :disabled="!roleName"
        @click.stop="handleCreateUpdateClick"
      >
        {{ template ? 'Update' : 'Create' }} Role
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
