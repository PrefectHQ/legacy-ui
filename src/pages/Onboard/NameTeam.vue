<script>
import { mapActions, mapGetters } from 'vuex'
import ExternalLink from '@/components/ExternalLink'
import { teamProfileMixin } from '@/mixins/teamProfileMixin.js'
import { handleMembershipInvitations } from '@/mixins/membershipInvitationMixin.js'
import { shuffle } from '@/utils/array'

let hidden, visibilityChange

if (window) {
  if (typeof document.hidden !== 'undefined') {
    // Opera 12.10 and Firefox 18 and later
    hidden = 'hidden'
    visibilityChange = 'visibilitychange'
  } else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden'
    visibilityChange = 'msvisibilitychange'
  } else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden'
    visibilityChange = 'webkitvisibilitychange'
  }
}

export default {
  components: { ExternalLink },
  mixins: [teamProfileMixin, handleMembershipInvitations],
  data() {
    return {
      // Form's computed height
      height: '0px',
      loading: 0,
      accepting: false,
      activeInvite: null,
      currentInvitation: null,
      declining: false,
      dialog: false,
      redirectTenant: null,

      // Reveal animation bools
      revealNote: false,
      revealNameInput: false,
      revealUrlInput: false,
      revealDropdown: false,
      revealPendingTeams: false,
      revealConfirm: false,

      // "how did you hear about us" options
      options: [
        'Twitter',
        'Google',
        'LinkedIn',
        'Colleague',
        'Conference',
        'Meetup',
        'Other'
      ],
      selectedOption: '',
      extraInfo: ''
    }
  },
  computed: {
    ...mapGetters('auth', ['user']),
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('license', ['license', 'hasPermission']),
    disabled() {
      return this.loading > 0 || !this.revealConfirm
    },
    isTenantAdmin() {
      return this.hasPermission('update', 'tenant')
    },
    shuffledOptions() {
      let optionsCopy = [...this.options]
      let other = optionsCopy.pop()
      let shuffledArray = shuffle(optionsCopy)

      return [...shuffledArray, other]
    }
  },
  mounted() {
    this.createLicense()

    this.tenantChanges.name = this.tenant.name
    this.tenantChanges.slug = this.tenant.slug

    window.addEventListener(
      visibilityChange,
      this.handleVisibilityChange,
      false
    )

    setTimeout(() => {
      this.revealNote = true

      setTimeout(() => {
        this.height = getComputedStyle(this.$refs['main-row']).height
      }, 250)
    }, 500)

    setTimeout(() => {
      this.revealNameInput = true
      this.revealUrlInput = true
      this.revealDropdown = true
      this.revealPendingTeams = true
      this.revealConfirm = true

      setTimeout(() => {
        this.height = getComputedStyle(this.$refs['main-row']).height
      }, 250)
    }, 1250)
  },
  beforeDestroy() {
    window.removeEventListener(this.handleVisibilityChange)
  },
  methods: {
    ...mapActions('tenant', ['getTenants', 'updateTenantSettings']),
    ...mapActions('user', ['getUser']),
    async createLicense() {
      if (this.license) return
      this.loading++
      try {
        // Create the stripe customer (necessary for creating a self serve license)
        await this.$apollo.mutate({
          mutation: require('@/graphql/License/update-stripe-customer.gql'),
          variables: {
            input: {
              email: this.user.email,
              name: `${this.user.name ? this.user.name : ''}`.trim(),
              source: null
            }
          }
        })

        // Create usage license
        await this.$apollo.mutate({
          mutation: require('@/graphql/License/create-usage-based-license.gql'),
          variables: {
            input: {
              tenant_id: this.tenant.id,
              plan_name: 'FREE_2021'
            }
          }
        })
      } catch (e) {
        /* eslint-disable no-console */
        console.error(e)
      }

      this.loading--
      return
    },
    handleVisibilityChange() {
      // Redundancy for the animation reveals (which are on timeouts)
      if (!document[hidden]) {
        this.height = getComputedStyle(this.$refs['main-row']).height

        this.revealNote = true
        this.revealNameInput = true
        this.revealUrlInput = true
        this.revealDropdown = true
        this.revealPendingTeams = true
        this.revealConfirm = true
      }
    },
    async updateTenant() {
      // Async tenant checks
      await this.checkNameAsync()
      await this.checkSlugAsync()

      if (this.nameErrors.length > 0 || this.slugErrors.length > 0) {
        return
      }

      this.updateServerError = false
      this.loading++

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
          if (e.message.includes('Uniqueness violation')) {
            this.slugErrors = ['Sorry, that slug is already in use.']
          } else {
            this.updateServerError = true
          }
        }
      }

      this.loading--
      if (this.slugErrors.length > 0) {
        return
      }

      if (!this.updateServerError) this.goToResources()
    },
    async skip() {
      this.updateTenantSettings({
        teamNamed: true
      })

      this.$router.push({
        name: 'onboard-resources',
        params: { tenant: this.tenant.slug }
      })
    },
    async accept(pt) {
      this.loading++
      this.accepting = true
      try {
        this.activeInvite = pt.id
        const invitationId = pt.id
        const accepted = await this.acceptMembershipInvitation(invitationId)
        this.redirectTenant = pt.tenant.slug
        if (accepted.accept_membership_invitation.id) {
          this.redirectTenant = pt.tenant.slug
          this.$apollo.queries.pendingInvitations.refetch()
        }
      } catch (e) {
        this.mutationErrorMessage = e
          .toString()
          .split(':')
          .pop()
        this.error = true
      }
      this.activeInvite = null
      this.accepting = false
      this.loading--
    },
    openModal(pt) {
      this.activeInvite = pt.id
      this.currentInvitation = pt
      this.dialog = true
    },
    async decline(id) {
      this.loading++
      this.declining = true
      try {
        this.activeInvite = id
        const declined = await this.declineMembershipInvitation(id)
        if (declined.delete_membership_invitation.success) {
          this.dialog = false
          this.$apollo.queries.pendingInvitations.refetch()
        }
      } catch (e) {
        this.mutationErrorMessage = e
          .toString()
          .split(':')
          .pop()
        this.error = true
      }
      this.declining = false
      this.activeInvite = null
      this.loading--
    },
    setSelectedOption(option) {
      this.selectedOption = option
    },
    setExtraInfo(extraInfo) {
      this.extraInfo = extraInfo
    },
    async goToResources() {
      this.revealNameInput = false
      this.revealUrlInput = false
      this.revealDropdown = false
      this.revealConfirm = false
      this.revealNote = false

      await this.setCurrentTenant(
        this.redirectTenant ?? this.tenantChanges.slug ?? this.tenant.slug
      )

      const eventSource = this.isCloud ? 'prefect_cloud' : 'prefect_server'

      fetch('https://sens-o-matic.prefect.io', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'x-prefect-event': eventSource
        },
        body: JSON.stringify({
          source: eventSource,
          type: 'welcome_survey',
          payload: {
            location: this.selectedOption,
            info: this.extraInfo
          }
        })
      }).then(res => {
        return res.json()
      })

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
      pollInterval: 60000,
      update: data => data?.pendingInvitations ?? []
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
    style="align-items: center;
    display: flex;
    width: fit-content !important;"
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
            <div v-if="isTenantAdmin" class="text-h4 text-center">
              Let's start by creating your team
              <v-menu
                :close-on-content-click="false"
                offset-y
                transition="slide-y-transition"
              >
                <template #activator="{ on, attrs }">
                  <v-btn icon v-bind="attrs" v-on="on"
                    ><v-icon class="white--text"
                      >fa-question-circle</v-icon
                    ></v-btn
                  >
                </template>
                <v-card tile class="pa-3 mt-1" max-width="320">
                  <div class="text-body-1">
                    Prefect automatically creates a sandbox development team for
                    you to use &mdash; this is a great place to test and deploy
                    flows as you explore Prefect. When you're ready to
                    collaborate with others, you can
                    <ExternalLink href="https://www.prefect.io/pricing">
                      upgrade this team</ExternalLink
                    >
                    to invite more users or
                    <ExternalLink href="https://www.prefect.io/pricing#contact">
                      contact us</ExternalLink
                    >
                    to add another team. For more information about teams in
                    Prefect, check out our
                    <ExternalLink
                      href="https://docs.prefect.io/orchestration/ui/team-settings.html#switching-teams"
                      >docs</ExternalLink
                    >.
                  </div>
                </v-card>
              </v-menu>
            </div>
            <div v-else class="text-h4 text-center"> Team Details </div>
          </v-col>

          <v-col v-if="revealNote" key="revealNote" cols="12">
            <div v-if="isTenantAdmin" class="text-body-2 text--darken-1">
              (You can always change this later)
            </div>
            <div v-else class="text-body-2 text--darken-1">
              Contact your team administrators to complete onboarding</div
            >
          </v-col>

          <v-col
            v-if="revealNameInput"
            key="input-1"
            cols="12"
            class="my-2 mt-12 name-team-input mx-auto"
          >
            <div class="text-overline">
              Team Name
            </div>
            <div v-if="!isTenantAdmin" class="text-h5">
              {{ tenant.name }}
            </div>
            <v-text-field
              v-if="isTenantAdmin"
              v-model="name"
              data-cy="team-name"
              :disabled="disabled"
              :error-messages="nameErrors"
              :loading="isCheckingName"
              dark
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
            class="my-2 name-team-input mx-auto"
          >
            <div class="text-overline d-flex justify-center align-center">
              <span class="mr-1">Team Slug</span>
              <Truncate
                content="This slug is used to create shareable links for your flows and runs unique to your team."
              >
                <v-icon x-small dark>
                  info
                </v-icon>
              </Truncate>
            </div>
            <div v-if="!isTenantAdmin" class="text-h5 medium"> </div>
            <v-text-field
              v-if="isTenantAdmin"
              v-model="slug"
              data-cy="team-slug"
              :disabled="disabled"
              :error-messages="slugErrors"
              :loading="isCheckingSlug"
              dark
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

          <v-col
            v-if="revealDropdown"
            key="input-3"
            cols="12"
            class="my-2 mb-12 mx-auto"
          >
            <div class="text-overline">
              How did you hear about us?
            </div>
            <v-select
              :items="shuffledOptions"
              dark
              :menu-props="{ maxHeight: 400 }"
              label="Options"
              @change="setSelectedOption"
            ></v-select>
            <v-text-field
              v-show="selectedOption == 'Other'"
              dark
              autofocus
              placeholder="Newsletter, advertisement, etc..."
              @input="setExtraInfo"
            ></v-text-field>
          </v-col>

          <v-col
            v-if="revealPendingTeams && pendingInvitations"
            key="pendingInvites"
            cols="12"
          >
            <div v-if="pendingInvitations.length" class="text-body-1">
              Your pending invitations:
            </div>
            <v-list
              v-for="pt in pendingInvitations"
              :key="pt.id"
              color="transparent"
            >
              <v-list-item
                style="align-items: baseline;
                color: appForeground !important;
                justify-content: space-between;"
              >
                <span class="pr-2">{{ pt.tenant.name }}</span>
                <div class="mt-8">
                  <v-btn
                    class="mr-3"
                    color="accentPink"
                    dark
                    depressed
                    :disabled="disabled"
                    :loading="activeInvite === pt.id && accepting"
                    @click="accept(pt)"
                  >
                    <v-icon class="pr-4">fa-user-friends</v-icon>
                    Accept
                  </v-btn>
                  <v-btn
                    outlined
                    class="white--text"
                    :disabled="disabled"
                    @click="openModal(pt)"
                  >
                    No Thanks
                  </v-btn>
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
            <div>
              <v-btn
                v-if="isTenantAdmin"
                color="primary"
                width="200"
                data-cy="submit-team-info"
                :loading="loading > 0"
                :disabled="disabled"
                @click="updateTenant"
              >
                Next
              </v-btn>
            </div>
            <div class="mt-4">
              <v-btn
                color="white"
                :disabled="disabled"
                text
                width="auto"
                @click="skip"
              >
                Skip
                <v-icon right>arrow_right</v-icon>
              </v-btn>
            </div>
          </v-col>

          <v-col
            v-if="
              updateServerError &&
                nameErrors.length === 0 &&
                slugErrors.length === 0
            "
            key="error"
            cols="12"
            class="text-h6 red--text text--lighten-1"
          >
            Sorry, something went wrong. Please try again.
          </v-col>
        </transition-group>
      </div>
    </v-row>
    <v-dialog v-if="currentInvitation" v-model="dialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          Are you sure you want to decline the invitation to
          {{ currentInvitation.tenant.name }}?
        </v-card-title>
        <v-card-text>
          <div>
            Clicking
            <span class="font-weight-bold"> Decline </span> will delete your
            invitation.
          </div>
          <div class="mt-2">
            If you don't want to accept or decline your invitation right now,
            you can click on
            <span class="font-weight-bold"> Cancel</span>. You'll be able to
            accept (or decline) the invitation later.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="white--text"
            color="prefect"
            :loading="declining"
            @click="decline(currentInvitation.id)"
          >
            Decline
          </v-btn>
          <v-btn outlined color="prefect" @click="dialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style lang="scss" scoped>
.transition-height {
  transition: max-height 500ms ease;
}

.name-team-input {
  max-width: 700px;
}
</style>
