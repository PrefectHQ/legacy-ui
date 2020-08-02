<script>
export default {
  data() {
    return {
      serverUrlInput: this.serverUrl,
      error: false,
      loading: false,
      success: false,
      tenants: []
    }
  },
  methods: {
    async _refreshTenants() {
      this.success = false
      this.error = false
      this.loading = true

      try {
        const { data } = await this.$apollo.query({
          query: require('@/graphql/Tenant/tenants.gql')
        })

        if (data?.tenant?.length > 0) {
          this.tenants = data.tenant
          // set tenant
        } else {
          this.error = 'No tenants found. Did you create your default tenant?'
        }
      } catch (e) {
        console.log(e)
      }
    }
  }
}
</script>

<template>
  <div>
    <div class="text-body-1">
      Tenants (or teams) are a unit Prefect Server uses to organize data such as
      Projects and Flows. If you ran
      <br /><kbd>prefect server start</kbd> to spin up your infrastucture, a
      default tenant was created for you automatically! If you ran the Prefect
      services separately (such as in a Kubernetes deployment), you'll need to
      create your own tenant using the steps below.
    </div>

    <ol class="mt-6">
      <li value="1" class="text-h6 mt-6 mb-2">Run the CLI Command</li>
      <div
        class="text-body-1 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-3 mt-4"
        style="border: 1px solid #b0bec5 !important;"
      >
        <div class="code-block">
          <span class="blue-grey--text text--lighten-1 user-select-none"
            >$
          </span>
          <span class="primary--text font-weight-medium">prefect</span>
          server create-default-tenant --name
          <span class="deepRed--text font-weight-medium">default</span>
        </div>
      </div>
    </ol>

    <ol class="mt-6">
      <li value="1" class="text-h6 mt-6 mb-2">Refresh tenants</li>
      <v-btn class="mt-4" color="primary" @click="_refreshTenants">
        Check for new tenants
      </v-btn>
    </ol>
  </div>
</template>
