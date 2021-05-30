<script>
export default {
  components: {},

  props: {},
  data() {
    return {
      // Table headers
      headers: [
        {
          text: '',
          value: 'action'
        },
        {
          text: 'Permission',
          value: 'name'
        }
      ],
      includedPermissions: [],
      search: ''
    }
  },
  computed: {
    permissions() {
      return this.auth?.permissions?.map(item => ({ name: item }))
    }
  },
  methods: {
    createNewRole() {
      console.log('role')
    }
  },
  apollo: {
    auth: {
      query: require('@/graphql/TeamSettings/permissions.gql'),
      loadingKey: 'loading',
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
  <div>
    <v-data-table
      fixed-header
      :headers="headers"
      :header-props="{ 'sort-icon': 'arrow_drop_up' }"
      :items="permissions"
      item-key="name"
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
      :search="search"
      no-results-text="No permissions found. Try expanding your search?"
      no-data-text="No data."
    >
      <!-- HEADERS -->
      <template #header.name="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #item.name="{ item }">
        <span class="text-subtitle-2">{{ item.name }}</span>
      </template>
    </v-data-table>
  </div>
</template>
