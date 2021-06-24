<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  data() {
    return {
      serverUrlInput: this.serverUrl,
      error: false,
      loading: false,
      success: this.tenants?.length > 0
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant', 'tenants'])
  },
  methods: {
    ...mapActions('tenant', ['getTenants', 'setCurrentTenant']),
    async _refreshTenants() {
      this.success = false
      this.error = false
      this.loading = true

      try {
        await this.getTenants()

        if (this.tenants?.length === 0) {
          this.error = 'No tenants found. Did you create your default tenant?'
        }
      } catch (e) {
        this.error = e
      }

      this.loading = false
    },
    async _selectTenant(slug) {
      this.success = false
      this.error = false
      this.loading = true

      try {
        await this.setCurrentTenant(slug)

        if (this.tenant) {
          this.success = 'You successfully set your tenant!'
        }
      } catch (e) {
        this.success = false
        this.error =
          'There was a problem setting your tenant... please try again.'

        throw new Error(e)
      }

      this.loading = false
    }
  }
}
</script>

<template>
  <div class="appForeground">
    <div class="text-body-1">
      Tenants (or teams) are a unit Prefect Server uses to organize data such as
      Projects and Flows. If you ran
      <br /><kbd>prefect server start</kbd> to spin up your infrastucture, a
      default tenant was created for you automatically! If you ran the Prefect
      services separately (such as in a Kubernetes deployment), you'll need to
      create your own tenant using the steps below.
    </div>

    <ol class="my-6">
      <li value="1" class="text-h6 mt-6 mb-2">Set backend</li>
      <div class="text-body-1 mt-2">
        First, make sure Prefect is working against
        {{ isCloud ? 'Prefect Cloud' : 'your Prefect Server' }}
      </div>

      <div
        class="text-body-1 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-3 mt-4"
        style="border: 1px solid var(--v-utilGrayLight-base) !important;"
      >
        <div class="code-block">
          <span class="blue-grey--text text--lighten-1 user-select-none"
            >$
          </span>
          <span class="primary--text font-weight-medium">prefect</span>
          backend<span class="deepRed--text font-weight-medium">
            {{ isCloud ? 'cloud' : 'server' }}
          </span>
        </div>
      </div>
    </ol>

    <ol class="my-12">
      <li value="2" class="text-h6 mt-6 mb-2">Run the CLI Command</li>
      <div
        class="text-body-1 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-3 mt-4"
        style="border: 1px solid var(--v-utilGrayLight-base) !important;"
      >
        <div class="code-block">
          <span class="blue-grey--text text--lighten-1 user-select-none"
            >$
          </span>
          <span class="primary--text font-weight-medium">prefect</span>
          server
          <span class="deepRed--text font-weight-medium">create-tenant</span>
          --name
          <span class="yellow--text text--darken-3 font-weight-medium"
            >default</span
          >
          --slug
          <span class="yellow--text text--darken-3 font-weight-medium"
            >default</span
          >
        </div>
      </div>
    </ol>

    <ol class="mt-6">
      <li value="3" class="text-h6 mt-6 mb-2">Select your Tenant</li>
      <div>
        <v-btn class="my-4" color="primary" small @click="_refreshTenants">
          <v-icon left>refresh</v-icon>Refresh tenants
        </v-btn>

        <span class="ml-2">
          <v-fade-transition mode="out-in">
            <span v-if="success">
              <v-icon v-if="success" key="success" color="green">
                check
              </v-icon>
              {{ success }}
            </span>
            <span v-else-if="error">
              <v-icon key="error" color="error">
                error
              </v-icon>
              {{ error }}
            </span>
          </v-fade-transition>
        </span>
      </div>

      <v-simple-table>
        <template #default>
          <thead>
            <tr>
              <th class="text-left">Name</th>
              <th class="text-left">Slug</th>
              <th class="text-left"></th>
            </tr>
          </thead>

          <tbody v-if="tenants && tenants.length > 0">
            <tr>
              <td
                colspan="3"
                class="pa-0"
                style="
                  border: unset !important;
                  height: auto !important;"
              >
                <v-progress-linear
                  :active="loading"
                  indeterminate
                  color="primary"
                />
              </td>
            </tr>
            <tr v-for="t in tenants" :key="t.id">
              <td>{{ t.name }}</td>
              <td>{{ t.slug }}</td>
              <td class="text-right">
                <v-btn
                  color="accentOrange"
                  :disabled="tenant && tenant.id == t.id"
                  :dark="tenant && tenant.id !== t.id"
                  depressed
                  small
                  @click="_selectTenant(t.slug)"
                >
                  {{ tenant && tenant.id == t.id ? 'Selected' : 'Select' }}
                </v-btn>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td>No tenants</td>
              <td></td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </ol>
  </div>
</template>
