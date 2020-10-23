<script>
import { mapActions, mapGetters } from 'vuex'
import ExternalLink from '@/components/ExternalLink'
import { teamProfileMixin } from '@/mixins/teamProfileMixin.js'
import { handleMembershipInvitations } from '@/mixins/membershipInvitationMixin.js'

export default {
  components: { ExternalLink },
  mixins: [teamProfileMixin, handleMembershipInvitations],
  data() {
    return {
      // Form's computed height
      height: '0px',

      loading: 0,
      pendingInvitations: [],
      accepting: false,
      deleting: false,
      dialog: false,
      redirectTenant: null,

      // Reveal animation bools
      revealNote: false,
      revealNameInput: false,
      revealUrlInput: false,
      revealPendingTeams: false,
      revealConfirm: false
    }
  },
  computed: {
    ...mapGetters('user', ['user']),
    ...mapGetters('api', ['isCloud']),
    disabled() {
      return this.loading > 0 || !this.revealConfirm
    }
  },
  mounted() {
    this.tenantChanges.name = this.tenant.name
    this.tenantChanges.slug = this.tenant.slug

    setTimeout(() => {
      this.revealNote = true

      setTimeout(() => {
        this.height = getComputedStyle(this.$refs['main-row']).height
      })
    }, 500)

    setTimeout(() => {
      this.revealNameInput = true
      this.revealUrlInput = true
      this.revealPendingTeams = true
      this.revealConfirm = true

      setTimeout(() => {
        this.height = getComputedStyle(this.$refs['main-row']).height
      })
    }, 1000)
  },
  methods: {
    ...mapActions('tenant', ['getTenants', 'updateTenantSettings']),
    async createLicense() {
      this.loading++

      try {
        // Create the stripe customer (necessary for creating a self serve license)
        await this.$apollo.mutate({
          mutation: require('@/graphql/License/update-stripe-customer.gql'),
          variables: {
            input: {
              email: this.user.email,
              name: `${this.user.first_name}${this.user.last_name}`.trim(),
              source: null
            }
          }
        })

        // Create the self serve license
        await this.$apollo.mutate({
          mutation: require('@/graphql/License/create-self-serve-license.gql'),
          variables: {
            input: {
              confirm: true,
              users: 1,
              stripe_coupon_id: null
            }
          }
        })
      } catch (e) {
        if (!e?.message.includes('This tenant already has an active license'))
          this.updateServerError = true
      }

      this.loading--
      return
    },
    async updateTenant() {
      if (this.nameErrors.length > 0 || this.slugErrors.length > 0) {
        return
      }

      this.updateServerError = false
      this.loading++

      // Async tenant checks
      await this.checkNameAsync()
      await this.checkSlugAsync()

      if (
        this.tenantChanges.slug == this.tenant.slug &&
        this.tenantChanges.name == this.tenant.name
      ) {
        await this.updateTenantSettings({
          teamNamed: true
        })
      } else {
        try {
          await this.$apollo.mutate({
            mutation: require('@/graphql/Tenant/update-tenant.gql'),
            variables: {
              name: this.tenantChanges.name || this.tenant.name,
              slug: this.tenantChanges.slug || this.tenant.slug
            }
          })

          await this.updateTenantSettings({
            teamNamed: true
          })

          await this.getTenants()
        } catch (e) {
          this.updateServerError = true
        }
      }

      this.loading--
      await this.createLicense()
      if (!this.updateServerError) this.goToResources()
    },
    async accept(pt) {
      try {
        this.accepting = true
        const invitationId = pt.id
        const accepted = await this.acceptMembershipInvitation(invitationId)
        this.redirectTenant = pt.tenant.slug
        if (accepted.accept_membership_invitation.id) {
          this.redirectTenant = pt.tenant.slug
          this.accepting = false
          this.$apollo.queries.pendingInvitations.refetch()
        }
      } catch (e) {
        this.mutationErrorMessage = e
          .toString()
          .split(':')
          .pop()
        this.loading = false
        this.error = true
      }
      this.loading = false
    },
    async decline(id) {
      try {
        this.deleting = true
        const declined = await this.declineMembershipInvitation(id)
        if (declined.delete_membership_invitation.success) {
          this.$emit('hide')
          this.$apollo.queries.pendingInvitations.refetch()
        }
        this.deleting = false
      } catch (e) {
        this.mutationErrorMessage = e
          .toString()
          .split(':')
          .pop()
        this.loading = false
        this.error = true
      }
    },
    async goToResources() {
      this.revealNameInput = false
      this.revealUrlInput = false
      this.revealConfirm = false

      await this.setCurrentTenant(
        this.redirectTenant != null
          ? this.redirectTenant
          : this.tenantChanges.slug || this.tenant.slug
      )

      this.$router.push({
        name: 'onboard-resources',
        params: { tenant: this.tenant.slug }
      })
    }
  },
  apollo: {
    pendingInvitations: {
      query: require('@/graphql/Tenant/pending-invitations-by-email.gql'),
      variables() {
        return {
          email: this.user.email
        }
      },
      async result({ data, loading }) {
        if (loading || !data || !data.pendingInvitations) return
        // We filter this because we don't want to show invitations
        // to tenants we're already in...
        // This is due to a bug(feature?) in the back end that allows
        // users to be invited to tenants they're already part of
        await this.getUser()
        this.pendingInvitations =
          data.pendingInvitations && data.pendingInvitations.length
            ? data.pendingInvitations.filter(
                pi =>
                  !this.memberships
                    .map(at => at.tenant.id)
                    .includes(pi.tenant.id)
              )
            : []
      },
      skip() {
        return !this.isCloud || !this.user || !this.user.email
      },
      fetchPolicy: 'network-only',
      pollInterval: 60000
    }
  }
}
</script>

<template>
  <v-card
    v-if="tenant.id"
    class="text-center mx-auto px-12 py-8 white--text"
    flat
    tile
    style="width: fit-content !important;"
    color="transparent"
  >
    <v-row
      align="center"
      justify="center"
      :style="{ 'max-height': height }"
      class="transition-height"
    >
      <div ref="main-row">
        <transition-group name="fade">
          <v-col v-if="revealNote" key="name" cols="12" class="pb-0">
            <div class="display-1 text-center">
              Let's start by creating your team
              <v-menu
                :close-on-content-click="false"
                offset-y
                transition="slide-y-transition"
              >
                <template #activator="{ on }">
                  <v-icon class="white--text" v-on="on"
                    >fa-question-circle</v-icon
                  >
                </template>
                <v-card tile class="pa-2 mt-1" max-width="320">
                  <div class="body-2">
                    All Prefect users are required to have a personal team for
                    sandbox use. You can always switch between teams using the
                    side menu. For more information about teams in Prefect,
                    check out our
                    <ExternalLink
                      href="https://docs.prefect.io/orchestration/ui/team-settings.html#switching-teams"
                      >docs</ExternalLink
                    >.
                  </div>
                </v-card>
              </v-menu>
            </div>
          </v-col>

          <v-col v-if="revealNote" key="revealNote" cols="12">
            <div class="body-2 text--darken-1">
              (You can always change this later)
            </div>
          </v-col>

          <v-col
            v-if="revealNameInput"
            key="input-1"
            cols="12"
            class="my-2 mt-12 name-team-input mx-auto"
          >
            <div class="overline">
              Team Name
            </div>
            <div v-if="tenant.role !== 'TENANT_ADMIN'" class="headline">
              {{ tenant.name }}
            </div>
            <v-text-field
              v-if="tenant.role == 'TENANT_ADMIN'"
              v-model="name"
              data-cy="team-name"
              :disabled="disabled"
              :error-messages="nameErrors"
              :loading="isCheckingName"
              class="white--text v-text-field-input-color"
              color="white"
              @blur="checkName(name)"
              @input="resetNameMetadata"
            >
              <v-icon
                v-if="showNameIcon && nameErrors.length === 0"
                slot="append"
                class="white--text"
              >
                check
              </v-icon>
              <v-icon
                v-if="showNameIcon && nameErrors.length > 0"
                slot="append"
                class="red--text"
              >
                clear
              </v-icon>
            </v-text-field>
          </v-col>
          <v-col
            v-if="revealUrlInput"
            key="input-2"
            cols="12"
            class="my-2 mb-12 name-team-input mx-auto"
          >
            <div class="overline">
              Team URL
            </div>
            <div v-if="tenant.role !== 'TENANT_ADMIN'" class="headline medium">
              {{ tenant.slug }}
            </div>
            <v-text-field
              v-if="tenant.role == 'TENANT_ADMIN'"
              v-model="slug"
              data-cy="team-slug"
              :disabled="disabled"
              :error-messages="slugErrors"
              :loading="isCheckingSlug"
              class="white--text v-text-field-input-color"
              color="white"
              @blur="checkSlug(slug)"
              @input="resetSlugMetadata"
            >
              <v-icon
                v-if="showSlugIcon && slugErrors.length === 0"
                slot="append"
                class="white--text"
              >
                check
              </v-icon>
              <v-icon
                v-if="showSlugIcon && slugErrors.length > 0"
                slot="append"
                class="red--text"
              >
                clear
              </v-icon>
            </v-text-field>
          </v-col>

          <v-col v-if="revealPendingTeams" key="pendingInvites" cols="12">
            <div v-if="pendingInvitations.length" class="body-1">
              Your pending invitations:
            </div>
            <v-list
              v-for="pt in pendingInvitations"
              :key="pt.id"
              color="transparent"
            >
              <v-list-item
                style="align-items: baseline;
                color: #fff !important;
                justify-content: space-between;"
              >
                <span class="pr-2">{{ pt.tenant.name }}</span>
                <div class="mt-8">
                  <v-btn
                    class="mr-3"
                    color="accentPink"
                    dark
                    depressed
                    :loading="accepting"
                    @click="accept(pt)"
                  >
                    <v-icon class="pr-4">fa-user-friends</v-icon>
                    Accept
                  </v-btn>
                  <v-dialog v-model="dialog" max-width="500">
                    <template #activator="{ on, attrs }">
                      <v-btn
                        outlined
                        class="white--text"
                        v-bind="attrs"
                        v-on="on"
                      >
                        No Thanks
                      </v-btn>
                    </template>
                    <v-card>
                      <v-card-title class="headline">
                        Are you sure you want to decline?
                      </v-card-title>
                      <v-card-text>
                        <div>
                          Clicking
                          <span class="font-weight-bold"> Decline </span> will
                          delete your invitation.
                        </div>
                        <div class="mt-2">
                          If you don't want to confirm or delete your invitation
                          right now, you can click on
                          <span class="font-weight-bold"> Cancel</span>. You'll
                          be able to accept (or decline) the invitation from
                          your dashboard after creating your personal team.
                        </div>
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn
                          class="white--text"
                          color="prefect"
                          :loading="deleting"
                          @click="decline(pt.id)"
                        >
                          Decline
                        </v-btn>
                        <v-btn outlined color="prefect" @click="dialog = false"
                          >Cancel</v-btn
                        >
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                </div>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col
            v-if="revealConfirm"
            key="revealConfirm"
            cols="12"
            class="my-2"
          >
            <v-btn
              v-if="tenant.role == 'TENANT_ADMIN'"
              color="primary"
              width="auto"
              data-cy="submit-team-info"
              :loading="loading > 0"
              :disabled="disabled"
              @click="updateTenant"
            >
              Next
              <v-icon right>arrow_right</v-icon>
            </v-btn>
          </v-col>

          <v-col
            v-if="
              updateServerError &&
                nameErrors.length === 0 &&
                slugErrors.length === 0
            "
            key="error"
            cols="12"
            class="body-2 red--text text--darken-1"
          >
            Sorry, something went wrong. Please try again.
          </v-col>
        </transition-group>
      </div>
    </v-row>
  </v-card>
</template>

<style lang="scss" scoped>
.h-80 {
  min-height: calc(80vh - 64px) !important;
}

.transition-height {
  transition: max-height 500ms ease;
}

.name-team-input {
  max-width: 700px;
}

.w-100 {
  width: 100vw;
}

.name-team-card {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
