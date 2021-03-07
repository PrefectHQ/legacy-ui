<script>
import { mapActions, mapGetters } from 'vuex'
import { handleMembershipInvitations } from '@/mixins/membershipInvitationMixin'
import AcceptConfirmInputRow from '@/components/AcceptConfirmInputRow'
import { clearCache } from '@/vue-apollo'

const backendProtectedRoutes = [
  'team',
  'account',
  'task-concurrency',
  'members',
  'secrets',
  'tokens',
  'user',
  'profile',
  'user-tokens',
  'welcome',
  'name-team',
  'onboard-resources'
]

const tenantProtectedRoutes = [
  'project',
  'flow',
  'flow-run',
  'task',
  'task-run',
  'flow-run-logs',
  'select-plan',
  'billing',
  'welcome',
  'current-plan',
  'payment',
  'api',
  'name-team'
]

export default {
  components: { AcceptConfirmInputRow },
  mixins: [handleMembershipInvitations],
  data() {
    return {
      loading: false,
      model: false
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant', 'tenants']),
    ...mapGetters('user', ['invitations', 'memberships']),
    role() {
      if (!this.tenant) return

      let role
      switch (this.tenant.role) {
        case 'USER':
          role = 'User'
          break
        case 'READ_ONLY_USER':
          role = 'Restricted User'
          break
        case 'TENANT_ADMIN':
          role = 'Team Admin'
          break
        default:
          role = ''
          break
      }
      return role
    },
    teams() {
      return this.isCloud
        ? this.memberships?.map(m => {
            return { ...m, ...m.tenant }
          })
        : this.tenants
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapActions('data', ['resetData']),
    ...mapActions('tenant', ['setCurrentTenant']),
    async handleAcceptPendingInvitation(id, name, slug) {
      this.loading = true
      let success
      try {
        await this.acceptMembershipInvitation(id)
        success = true
      } catch (e) {
        success = false
      } finally {
        this.setAlert(
          {
            alertShow: true,
            alertMessage: success
              ? `You joined ${name}... hurrah!`
              : `Something went wrong trying to accept your invitation to ${name}... please wait a few moments and try again.`,
            alertType: success ? 'success' : 'error',
            alertLink: success
              ? {
                  name: 'dashboard',
                  params: { tenant: slug }
                }
              : null,
            linkText: success ? 'Go to team' : ''
          },
          3000
        )
        await this.$globalApolloQueries['membershipInvitations']?.refetch()
        this.loading = false
      }
    },
    async handleDeclinePendingInvitation(id, name) {
      this.loading = true
      let success
      try {
        await this.declineMembershipInvitation(id)
        success = true
      } catch (e) {
        success = false
      } finally {
        this.setAlert(
          {
            alertShow: true,
            alertMessage: success
              ? `Invitation to join ${name} declined.`
              : `Something went wrong trying to decline your invitation to ${name}... please wait a few moments and try again.`,
            alertType: success ? 'success' : 'error'
          },
          3000
        )
        await this.$globalApolloQueries['membershipInvitations']?.refetch()
        this.loading = false
      }
    },
    async handleSwitchTenant(tenant) {
      if (tenant.slug == this.tenant.slug) return

      this.loading = true

      this.resetData()

      await this.setCurrentTenant(tenant.slug)

      clearCache()
      this.handlePostTokenRouting()
    },
    async handlePostTokenRouting() {
      try {
        if (this.isCloud && !this.tenant.settings.teamNamed) {
          await this.$router.push({
            name: 'welcome',
            params: {
              tenant: this.tenant.slug
            }
          })

          return
        }

        if (
          tenantProtectedRoutes.includes(this.$route.name) ||
          (this.isServer && backendProtectedRoutes.includes(this.$route.name))
        ) {
          await this.$router.push({
            name: 'dashboard',
            params: { tenant: this.tenant.slug }
          })
        } else {
          await this.$router.push({
            name: this.$route.name,
            params: { ...this.$route.params, tenant: this.tenant.slug }
          })
        }
      } catch {
        /* */
      } finally {
        this.model = false
        this.loading = false
      }
    }
  }
}
</script>

<template>
  <v-container class="pa-0" fluid>
    <v-progress-linear
      absolute
      :active="loading"
      :indeterminate="loading"
      color="accentPink"
    />

    <div class="pt-6 px-4 text-center">
      <div>
        <div class="text-h4">
          {{
            tenant && tenant.name
              ? tenant.name
              : loading
              ? '...'
              : 'No team selected'
          }}
        </div>

        <div class="text-body-1 grey--text text--darken-1">{{ role }}</div>
      </div>
    </div>
    <v-menu v-model="model" offset-x :close-on-content-click="false">
      <template #activator="{ on }">
        <v-list-item
          class="py-0"
          :disabled="!tenants || tenants.length === 0"
          v-on="on"
        >
          <v-list-item-avatar tile class="mr-2">
            <v-badge
              v-if="invitations && invitations.length > 0"
              :value="invitations && invitations.length"
              :content="invitations && invitations.length"
              color="accentPink"
              inline
              class="ml-1 white--text"
            />
            <v-icon
              v-else
              :color="model ? 'primaryDark' : 'grey darken-1'"
              small
            >
              sync_alt
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-body-1 text-none">
              Switch team
            </v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-icon :color="model ? 'primaryDark' : 'grey darken-1'">
              arrow_right
            </v-icon>
          </v-list-item-action>
        </v-list-item>
      </template>

      <v-card class="team-switcher-list elevation-4 text-truncate">
        <v-list :disabled="loading">
          <v-subheader>
            <v-icon x-small class="mr-2">
              fas fa-users
            </v-icon>
            <div>Teams</div>
            <v-divider class="ml-4" />
          </v-subheader>
          <v-list-item
            v-for="team in teams"
            :key="team.id"
            class="pl-4 py-2"
            :input-value="tenant.id == team.id"
            active-class="active"
            @click="handleSwitchTenant(team)"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ team.name }}
              </v-list-item-title>
              <v-list-item-subtitle
                v-if="tenant.id == team.id"
                class="font-weight-light"
              >
                Current
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-list
          v-if="invitations && invitations.length > 0"
          :disabled="loading"
        >
          <v-subheader>
            <v-icon x-small class="mr-2">
              fas fa-envelope
            </v-icon>
            <div>Invitations</div>
            <v-divider class="ml-4" />
          </v-subheader>
          <v-list-item
            v-for="invitation in invitations"
            :key="invitation.id"
            class="pl-4 py-2 disabled-list-item"
            :ripple="false"
          >
            <v-list-item-content>
              <AcceptConfirmInputRow
                :label="invitation.tenant.name"
                :loading="loading"
                @accept="
                  handleAcceptPendingInvitation(
                    invitation.id,
                    invitation.tenant.name,
                    invitation.tenant.slug
                  )
                "
                @decline="
                  handleDeclinePendingInvitation(
                    invitation.id,
                    invitation.tenant.name
                  )
                "
              />
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </v-container>
</template>

<style lang="scss" scoped>
/* stylelint-disable-next-line */
.v-list-item--active::before {
  opacity: 0 !important;
}

.team-switcher-list {
  .v-list {
    padding: 0;
  }

  .v-list-item {
    border-left: 10px solid rgba(0, 0, 0, 0.05);
    cursor: pointer;

    &.active {
      background-color: var(--v-primaryLight-base) !important;
      border-left: 10px solid var(--v-primaryDark-base);

      /* stylelint-disable-next-line */
      .v-list-item__title {
        color: var(--v-primaryDark-base) !important;
      }
    }

    &:hover:not(.disabled-list-item),
    &:focus:not(.disabled-list-item) {
      background-color: rgba(0, 0, 0, 0.05) !important;
    }

    &.disabled-list-item {
      border-left: 10px solid var(--v-accentPink-base);
      cursor: auto;
    }
  }
}
</style>
