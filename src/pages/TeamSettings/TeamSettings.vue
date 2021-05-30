<script>
import { mapMutations, mapGetters } from 'vuex'

export default {
  components: {},
  data() {
    return {
      // Delete team
      deleteTeamDialog: false,
      deleteTeamFormValid: false,
      deleteTeamTimeout: null,
      deleteTeamLoading: false,
      deleteTeamError: null,

      // Form rules
      rules: {
        confirm: value => value == 'confirm' || 'Input is incorrect.',
        nameMatches: value =>
          value == this.tenant.name || 'Input must match Team Name.',
        required: value => !!value || 'This field is is required.'
      },

      // Misc
      teamName: null,
      show: true
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant', 'role'])
  },
  watch: {
    tenant() {
      this.show = false

      setTimeout(() => {
        this.show = true
      }, 1000)
    }
  },
  methods: {
    ...mapMutations('tenant', ['setTenant', 'unsetTenant']),
    _closeTeamDialog() {
      this.deleteTeamDialog = false
      this.teamName = null
      this.deleteTeamLoading = false
      this.deleteTeamError = null
      clearTimeout(this.deleteTeamTimeout)
    },
    async deleteTeam() {
      clearTimeout(this.deleteTeamTimeout)
      this.deleteTeamLoading = true
      const deleteTeam = await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/delete-tenant.gql'),
        variables: {
          input: {
            confirm: true
          }
        }
      })
      this.deleteTeamTimeout = setTimeout(() => {
        this.deleteTeamLoading = false
        this.teamName = null
        this.nameMatches = false
        if (deleteTeam?.data?.delete_tenant?.success) {
          this.unsetTenant()
          this.$router.push({ name: 'dashboard', tenant: this.tenant?.slug })
        } else {
          this.deleteTeamError = 'Something went wrong.'
        }
      }, 750)
    }
  }
}
</script>

<template>
  <v-container>
    <v-navigation-drawer
      clipped
      left
      fixed
      permanent
      touchless
      expand-on-hover
      :mini-variant="$vuetify.breakpoint.smAndDown"
      :style="{
        height: `calc(100% - ${$vuetify.breakpoint.smAndDown ? 56 : 64}px)`,
        top: $vuetify.breakpoint.smAndDown ? '56px' : '64px'
      }"
    >
      <template #prepend>
        <v-list-item>
          <v-list-item-action>
            <v-icon class="blue--text accent-4">
              settings
            </v-icon>
          </v-list-item-action>

          <v-list-item-content>
            <div class="font-weight-medium">
              Team
            </div>
          </v-list-item-content>
        </v-list-item>
      </template>

      <v-divider />

      <v-list dense>
        <v-list-item
          :to="{ name: 'account', params: { tenant: tenant.slug } }"
          ripple
          exact
          data-cy="account"
        >
          <v-list-item-action>
            <v-icon>contacts</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Account</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          :disabled="!isCloud"
          :to="{ name: 'tokens', params: { tenant: tenant.slug } }"
          data-cy="team-settings-api-tokens"
          ripple
          exact
        >
          <v-list-item-action>
            <v-icon>sync_alt</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>API Tokens</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          :to="{ name: 'cloud-hooks', params: { tenant: tenant.slug } }"
          ripple
          exact
          data-cy="cloud-hooks"
        >
          <v-list-item-action>
            <v-icon>cloud_queue</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Cloud Hooks</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          :disabled="!isCloud"
          :to="{ name: 'flow-concurrency', params: { tenant: tenant.slug } }"
          ripple
          exact
          data-cy="flow-concurrency"
        >
          <v-list-item-action>
            <v-icon>pi-flow-run</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Flow Concurrency</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          :to="{ name: 'flow-groups', params: { tenant: tenant.slug } }"
          ripple
          exact
        >
          <v-list-item-action>
            <v-icon>pi-flow</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Flow Groups</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          :disabled="!isCloud"
          :to="{ name: 'members', params: { tenant: tenant.slug } }"
          ripple
          exact
          data-cy="members"
        >
          <v-list-item-action>
            <v-icon>people</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Members</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          :disabled="!isCloud"
          :to="{ name: 'roles', params: { tenant: tenant.slug } }"
          ripple
          exact
          data-cy="flow-concurrency"
        >
          <v-list-item-action>
            <v-icon>face</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Roles</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          :to="{ name: 'projects', params: { tenant: tenant.slug } }"
          ripple
          exact
        >
          <v-list-item-action>
            <v-icon>pi-project</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Projects</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          :disabled="!isCloud"
          :to="{ name: 'secrets', params: { tenant: tenant.slug } }"
          ripple
          exact
        >
          <v-list-item-action>
            <v-icon>vpn_key</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Secrets</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          :disabled="!isCloud"
          :to="{ name: 'service-accounts', params: { tenant: tenant.slug } }"
          ripple
          exact
        >
          <v-list-item-action>
            <v-icon>engineering</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Service Accounts</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          :disabled="!isCloud"
          :to="{ name: 'task-concurrency', params: { tenant: tenant.slug } }"
          ripple
          exact
          data-cy="task-concurrency"
        >
          <v-list-item-action>
            <v-icon>pi-task-run</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Task Concurrency</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <template #append>
        <v-list dense>
          <v-list-item v-if="false && role == 'TENANT_ADMIN'" :ripple="false">
            <v-list-item-content v-if="$vuetify.breakpoint.mdAndUp">
              <v-btn
                color="red"
                class="ma-auto d-block mb-6 px-12"
                dark
                depressed
                @click="deleteTeamDialog = true"
              >
                Delete Team
              </v-btn>
            </v-list-item-content>
            <v-list-item-action v-else-if="$vuetify.breakpoint.smAndDown">
              <v-icon color="red">remove_circle</v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <div
      :class="{
        'sm-and-down-left-padding': $vuetify.breakpoint.smAndDown,
        'sm-and-up-left-padding': $vuetify.breakpoint.smAndUp
      }"
    >
      <v-fade-transition mode="out-in">
        <router-view></router-view>
      </v-fade-transition>
    </div>

    <template v-if="false && role == 'TENANT_ADMIN'">
      <v-dialog v-model="deleteTeamDialog" max-width="600">
        <v-card>
          <v-card-title class="text-h5 word-break-normal mb-3">
            Delete
            <span class="font-weight-bold blue--text ml-2">
              {{ tenant.name }}
            </span>
            ?
          </v-card-title>
          <v-card-text>
            This will remove all of your team's flows, tasks, schematics, runs,
            and logs.
            <div class="font-weight-bold">This can't be undone.</div>

            <div class="mt-10">
              <div>
                To confirm, type your team's name below:
              </div>
              <v-form v-model="deleteTeamFormValid">
                <v-text-field
                  v-if="tenant.role == 'TENANT_ADMIN'"
                  v-model="teamName"
                  autocomplete="off"
                  :label="tenant.name"
                  single-line
                  :rules="[rules.required, rules.nameMatches]"
                  color="primary"
                  :loading="deleteTeamLoading"
                >
                </v-text-field>
              </v-form>
            </div>
          </v-card-text>
          <v-card-actions class="pb-4 px-6">
            <span v-if="deleteTeamError" class="error--text text-body-2">
              {{ deleteTeamError }}
            </span>
            <v-spacer></v-spacer>
            <v-btn depressed color="primary" @click="_closeTeamDialog">
              Cancel
            </v-btn>
            <v-btn
              color="red--text darken-1"
              depressed
              :disabled="!deleteTeamFormValid"
              :loading="deleteTeamLoading"
              @click="deleteTeam"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </v-container>
</template>

<style lang="scss" scoped>
.cursor-point {
  cursor: pointer;
}

.sm-and-up-left-padding {
  // Match left padding with User Settings sidebar width
  padding-left: 56px;
}

.sm-and-down-left-padding {
  // Match left padding with collapsed User Settings sidebar width
  padding-left: 56px;
}

.transition-height {
  transition: max-height 500ms ease;
}
</style>

<style lang="scss">
.text-center {
  // stylelint-disable
  .v-skeleton-loader__heading {
    margin: auto !important;
  }
  // stylelint-enable
}
</style>
