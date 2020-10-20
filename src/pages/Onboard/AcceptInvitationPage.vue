<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  data() {
    return {
      loadingKey: 0,
      loading: false,
      deleting: false,
      start: false,
      error: false,
      invitationId:
        this.$route.query.invitation_id ||
        sessionStorage.getItem('invitationId'),
      membershipInvitation: null,
      mutationErrorMessage: false
    }
  },
  computed: {
    ...mapGetters('user', ['user']),
    ...mapGetters('tenant', ['tenant']),
    teamName() {
      return this.membershipInvitation?.tenant?.name || 'your new team'
    },
    loadingPage() {
      return this.loadingKey > 0
    },
    invitationError() {
      return (
        this.error ||
        !this.membershipInvitation ||
        !this.membershipInvitation.user ||
        this.mutationErrorMessage
      )
    },
    errorMessage() {
      if (this.membershipInvitation && !this.membershipInvitation.user)
        return "The membership ID provided doesn't match this user. Are you in the right account? "
      if (this.error)
        return 'It looks like there was a problem with your invitation.  Please check the details and your account and try again.'
      return `We can't find your membership invitation. Have you already
              accepted?`
    },
    noSlash() {
      return this.$vuetify.breakpoint.xl
        ? 15
        : this.$vuetify.breakpoint.lg
        ? 10
        : 5
    },
    slashClass() {
      return {
        slash: this.$vuetify.breakpoint.smAndUp,
        'slash-horizontal': this.$vuetify.breakpoint.smAndDown,
        'slash-full': this.$vuetify.breakpoint.smAndDown,
        'slash-origin-center': this.$vuetify.breakpoint.smAndUp
      }
    },
    slash1Class() {
      return {
        ...this.slashClass,
        paused: !this.start
      }
    },
    slash2Class() {
      return {
        slash: this.$vuetify.breakpoint.smAndUp,
        'slash-origin-center': this.$vuetify.breakpoint.smAndUp,
        paused: !this.start
      }
    },
    slash3Class() {
      return {
        ...this.slashClass,
        paused: false
      }
    },
    slash4Class() {
      return {
        ...this.slashResourcesClass,
        'slash-origin-left': this.$vuetify.breakpoint.smAndUp,
        paused: true
      }
    },
    slash5Class() {
      return {
        ...this.slashResourcesClass,
        'slash-origin-right': this.$vuetify.breakpoint.smAndUp,
        paused: true
      }
    }
  },
  mounted() {
    setTimeout(() => {
      this.start = true
    }, 250)
  },
  methods: {
    ...mapActions('tenant', ['setCurrentTenant']),
    async accept() {
      this.loading = true
      const tenant = this.membershipInvitation.tenant
      const invitationId = this.membershipInvitation.id
      const accepted = await this.acceptInvitation(invitationId)
      if (accepted) {
        sessionStorage.removeItem('invitationId')
        await this.setCurrentTenant(tenant.slug)
        this.$router.push({
          name: 'dashboard',
          params: { tenant: tenant.slug }
        })
      }
      this.loading = false
    },
    async decline() {
      this.deleting = true
      const invitationId = this.membershipInvitation.id
      const declined = await this.declineInvitation(invitationId)
      if (declined) {
        this.toDashboard()
      }
      this.deleting = false
    },
    toDashboard() {
      sessionStorage.removeItem('invitationId')
      this.$router.push({ name: 'dashboard' })
    },
    async declineInvitation(id) {
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/delete-membership-invitation.gql'),
          variables: {
            membershipInvitationId: id
          }
        })
        if (data?.delete_membership_invitation?.success) {
          return true
        }
      } catch (e) {
        console.log(e)
        this.mutationErrorMessage = e
          .toString()
          .split(':')
          .pop()
        this.loading = false
        this.error = true
      }
    },
    async acceptInvitation(id) {
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/accept-membership-invitation.gql'),
          variables: {
            membershipInvitationId: id
          }
        })
        if (data?.accept_membership_invitation?.id) {
          return true
        }
      } catch (e) {
        this.mutationErrorMessage = e
          .toString()
          .split(':')
          .pop()
        this.loading = false
        this.error = true
      }
    },
    slash2Style(i) {
      let width, top
      if (i > this.noSlash / 2) {
        top = i * 5 + 50
        width = Math.floor(Math.random() * (125 - 75)) + 75
      } else {
        top = i * 5
        width = Math.floor(Math.random() * (75 - 25)) + 25
      }

      return {
        top: `${top}%`,
        height: '120px',
        left: 0,
        'transition-delay': `${Math.floor(i / 2) * 25 + 250}ms`,
        width: `${width}%`
      }
    }
  },
  apollo: {
    membershipInvitation: {
      query: require('@/graphql/Tenant/membership-invitation.gql'),
      variables() {
        return { id: this.invitationId }
      },
      skip() {
        return !this.invitationId
      },
      loadingKey: 'loadingKey',
      pollInterval: 5000,
      update: data => data.membership_invitation_by_pk
    }
  }
}
</script>

<template>
  <v-container
    class="ma-0 pa-0 position-relative h-100 bg-grey overflow-y-hidden"
    fluid
  >
    <transition-group name="fade" mode="out-in">
      <div
        v-if="$vuetify.breakpoint.smAndUp"
        key="slash-1"
        class="slash-blue o-slash slash-1"
        :class="[slash1Class, $vuetify.breakpoint.smAndUp ? 'slash-1' : '']"
      >
      </div>
      <div
        key="slash-3"
        class="slash-grey o-slash slash-3"
        :class="[slash3Class, $vuetify.breakpoint.smAndUp ? 'slash-3' : '']"
      >
      </div>
      <div
        v-if="$vuetify.breakpoint.smAndUp"
        key="slash-4"
        class="slash-grey o-slash slash-4"
        :class="slash4Class"
      >
      </div>
      <div
        v-if="$vuetify.breakpoint.smAndUp"
        key="slash-5"
        class="slash-orange o-slash slash-5"
        :class="slash5Class"
      >
      </div>

      <div v-if="$vuetify.breakpoint.smAndUp" key="name-team-slashes">
        <div
          v-for="i in noSlash"
          :key="`name-team-slash-${i}`"
          class="o-slash slash-2"
          :class="[
            slash2Class,
            i % 2 === 0 ? 'slash-grey' : 'slash-grey-reverse'
          ]"
          :style="slash2Style(i)"
        ></div>
      </div>
    </transition-group>
    <v-container
      v-if="invitationError && !loadingPage"
      class="position-absolute onboard-content text-center pa-0"
      fluid
    >
      <v-row align="center">
        <v-col class="grey--text text--lighten-5 mx-12">
          <div class="display-1">
            <span> {{ mutationErrorMessage || errorMessage }} </span>
          </div>
          <div>
            <v-btn class="mt-8" color="primary" x-large @click="toDashboard">
              Back to the dashboard!
              <v-icon right>fas fa-rocket</v-icon>
            </v-btn>
          </div>
        </v-col>
      </v-row>
      <v-row align="center">
        <v-col>
          <div
            v-if="!loadingPage"
            class="ma-12 grey--text text--lighten-5 body-1 text--primary"
          >
            For more information about teams in Prefect Cloud, check out
            <router-link
              to="https://docs.prefect.io/orchestration/ui/team-settings.html"
              class="link-color"
            >
              our docs</router-link
            >.
          </div>
        </v-col>
      </v-row>
    </v-container>
    <v-container
      v-else
      class="text-center position-absolute pa-0 onboard-content router-view"
      fluid
    >
      <v-row v-if="!loadingPage" align="center">
        <v-col>
          <div class="display-1 grey--text text--lighten-5">
            You've been invited to join {{ teamName }}!
          </div>
          <div class="subtitle grey--text text--lighten-5 mt-4">
            To accept, please click below.
          </div>
          <div class="mt-8">
            <v-btn
              class="mr-3"
              color="accentPink"
              dark
              depressed
              :loading="loading"
              @click="accept"
            >
              <v-icon class="pr-4">fa-user-friends</v-icon>
              Accept
            </v-btn>

            <v-btn
              outlined
              class="white--text"
              :loading="deleting"
              @click="decline"
            >
              No Thanks
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row align="center">
        <v-col>
          <div
            v-if="!loadingPage"
            class="ma-12 grey--text text--lighten-5 body-1 text--primary"
          >
            For more information about teams in Prefect Cloud, check out
            <router-link
              to="https://docs.prefect.io/orchestration/ui/team-settings.html"
              class="link-color"
            >
              our docs</router-link
            >.
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<style lang="scss" scoped>
.link-color {
  color: #27b1ff;
}

.bg-grey {
  background-image: linear-gradient(105deg, #2f383f, #647489) !important;
}

.h-100 {
  min-height: 100vh !important;
}

.onboard-content {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}

.o-slash {
  backface-visibility: hidden;
  position: absolute;
  transition: all 250ms;
  z-index: 2;

  &.slash-full {
    height: 100vh !important;
    top: 0 !important;
    transform: none;
    width: 100% !important;

    &.slash-4 {
      left: 0 !important;
      top: 0 !important;
    }

    &.slash-5 {
      left: 0 !important;
      top: 100vh !important;
    }
  }

  &.slash-1 {
    height: 500px;
    top: 50%;
    width: 100%;
  }

  &.slash-2 {
    z-index: 1 !important;
  }

  &.slash-3 {
    height: 600px;
    top: 50%;
    width: 100%;
  }

  &.slash-4 {
    height: 600px;
    left: 0;
    top: 60%;
    width: 49%;
  }

  &.slash-5 {
    height: 600px;
    right: 0;
    top: 40%;
    width: 49%;
  }
}
</style>
