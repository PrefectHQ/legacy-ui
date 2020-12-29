<script>
import { mapActions, mapGetters } from 'vuex'
import AcceptConfirmInputRow from '@/components/AcceptConfirmInputRow'
import { handleMembershipInvitations } from '@/mixins/membershipInvitationMixin'

export default {
  components: { AcceptConfirmInputRow },
  mixins: [handleMembershipInvitations],
  props: {
    content: {
      type: Object,
      required: true
    },
    dense: {
      type: Boolean,
      required: false,
      default: () => false
    },
    timestamp: {
      type: String,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      loading: 0,
      tempMember: false,
      tempDecline: false
    }
  },
  computed: {
    ...mapGetters('user', ['memberships']),
    isMember() {
      return this.membershipTeamIds.includes(this.content.sender_tenant_id)
    },
    membershipTeamIds() {
      return this.memberships.map(m => m.tenant.id)
    },
    membershipInvitationIsValid() {
      return this.membershipInvitation
    },
    itemTitle() {
      return this.tempMember || this.isMember
        ? `You joined ${this.content.sender_tenant_name}`
        : !this.tempDecline &&
          !this.isMember &&
          this.membershipInvitationIsValid
        ? `${this.content.sender_user_name} invited you to join ${this.content.sender_tenant_name}`
        : `An invitation to join
      ${this.content.sender_tenant_name}
      has expired or was declined.`
    },
    rowLabel() {
      return `
      <span class="font-weight-medium">${this.content.sender_user_name}</span>
      invited you to join
      <span class="font-weight-medium">${this.content.sender_tenant_name}</span>
      !
      `
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapActions('user', ['getUser']),
    async _acceptInvitation() {
      this.loading++
      let success
      try {
        const data = await this.acceptMembershipInvitation(
          this.content.membership_invitation_id
        )
        if (data?.accept_membership_invitation) {
          this.tempMember = true
          success = true
        }
      } catch (e) {
        success = false
      } finally {
        this.setAlert(
          {
            alertShow: true,
            alertMessage: success
              ? `You joined ${this.content.sender_tenant_name}... hurrah!`
              : `Something went wrong trying to accept your invitation to ${this.content.sender_tenant_name}... please wait a few moments and try again.`,
            alertType: success ? 'success' : 'error',
            alertLink: success
              ? {
                  name: 'dashboard',
                  params: { tenant: this.content.sender_tenant_slug }
                }
              : null,
            linkText: success ? 'Take me to my new tenant!' : ''
          },
          3000
        )
        await this.getUser()
        await this.$apollo.queries.membershipInvitation.refetch()
        this.loading--
      }
    },
    async _declineInvitation() {
      this.loading++
      let success
      try {
        const data = await this.declineMembershipInvitation(
          this.content.membership_invitation_id
        )
        if (data?.delete_membership_invitation) {
          this.tempDecline = true
          success = true
        }
      } catch (e) {
        success = false
      } finally {
        this.setAlert(
          {
            alertShow: true,
            alertMessage: success
              ? `Invitation to join ${this.content.sender_tenant_name} declined.`
              : `Something went wrong trying to decline your invitation to ${this.content.sender_tenant_name}... please wait a few moments and try again.`,
            alertType: success ? 'info' : 'error'
          },
          3000
        )
        this.getUser()
        await this.$apollo.queries.membershipInvitation.refetch()
        this.loading--
      }
    }
  },
  apollo: {
    membershipInvitation: {
      query: require('@/graphql/Notifications/membership-invitation.gql'),
      variables() {
        return {
          id: this.content.membership_invitation_id
        }
      },
      loadingKey: 'loading',
      update: data => data.membership_invitation_by_pk
    }
  }
}
</script>

<template>
  <v-list-item-content>
    <v-skeleton-loader v-if="loading > 0" type="text" tile />
    <truncate v-else-if="dense" :content="itemTitle">
      <v-list-item-title v-if="tempMember || isMember">
        You joined
        <span class="font-weight-medium">
          {{ content.sender_tenant_name }}
        </span>
        !
      </v-list-item-title>
      <v-list-item-title
        v-else-if="!tempDecline && !isMember && membershipInvitationIsValid"
      >
        <AcceptConfirmInputRow
          :label="rowLabel"
          :loading="loading > 0"
          @accept="_acceptInvitation"
          @decline="_declineInvitation"
        />
      </v-list-item-title>
      <v-list-item-title v-else>
        An invitation to join
        <span class="font-weight-medium">{{ content.sender_tenant_name }}</span>
        has expired or was declined.
      </v-list-item-title>
    </truncate>
    <div v-else>
      <v-skeleton-loader v-if="loading > 0" type="text" tile />
      <v-list-item-title v-else-if="tempMember || isMember">
        You joined
        <span class="font-weight-medium">
          {{ content.sender_tenant_name }}
        </span>
        !
      </v-list-item-title>
      <v-list-item-title
        v-else-if="!tempDecline && !isMember && membershipInvitationIsValid"
      >
        <AcceptConfirmInputRow
          :label="rowLabel"
          :loading="loading > 0"
          @accept="_acceptInvitation"
          @decline="_declineInvitation"
        />
      </v-list-item-title>
      <v-list-item-title v-else>
        An invitation to join
        <span class="font-weight-medium">{{ content.sender_tenant_name }}</span>
        has expired or was declined.
      </v-list-item-title>
    </div>
    <v-list-item-subtitle v-if="timestamp">
      {{ timestamp }}
    </v-list-item-subtitle>
  </v-list-item-content>
</template>
