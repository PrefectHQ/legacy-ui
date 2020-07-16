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
    }
  },
  data() {
    return {
      loading: 0
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
        await this.acceptMembershipInvitation(
          this.content.membership_invitation_id
        )
        success = true
      } catch (e) {
        success = false
      }

      this.setAlert(
        {
          alertShow: true,
          alertMessage: success
            ? `You joined ${this.content.sender_tenant_name}... hurrah!`
            : `Something went wrong trying to accept your invitation to ${this.content.sender_tenant_name}.... please wait a few moments and try again.`,
          alertType: success ? 'success' : 'error'
        },
        3000
      )
      this.getUser()
      this.$apollo.queries.membershipInvitation.refetch()
      this.loading--
    },
    async _declineInvitation() {
      this.loading++
      let success
      try {
        await this.declineMembershipInvitation(
          this.content.membership_invitation_id
        )
        success = true
      } catch (e) {
        success = false
      }

      this.setAlert(
        {
          alertShow: true,
          alertMessage: success
            ? `Invitation to join ${this.content.sender_tenant_name} declined.`
            : `Something went wrong trying to decline your invitation to ${this.content.sender_tenant_name}.... please wait a few moments and try again.`,
          alertType: success ? 'info' : 'error'
        },
        3000
      )
      this.getUser()
      this.$apollo.queries.membershipInvitation.refetch()
      this.loading--
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
    <v-list-item-title v-else-if="isMember">
      You joined
      <span class="font-weight-medium"> {{ content.sender_tenant_name }} </span>
      !
    </v-list-item-title>
    <v-list-item-title v-else-if="!isMember && membershipInvitationIsValid">
      <AcceptConfirmInputRow
        :label="rowLabel"
        @accept="_acceptInvitation"
        @decline="_declineInvitation"
      />
    </v-list-item-title>
    <v-list-item-title v-else>
      An invitation to join
      <span class="font-weight-medium">{{ content.sender_tenant_name }}</span>
      has expired or was declined.
    </v-list-item-title>
  </v-list-item-content>
</template>
