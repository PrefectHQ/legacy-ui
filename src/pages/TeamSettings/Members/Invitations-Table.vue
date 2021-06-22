<script>
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    ConfirmDialog
  },
  mixins: [formatTime],
  props: {
    // Check admin privileges
    isTenantAdmin: {
      type: Boolean,
      required: true
    },
    // Number that updates every time pendingInvitations should be refetched
    refetchSignal: {
      type: Number,
      required: true
    },
    // Mapping between role & role color
    roleColorMap: {
      type: Object,
      required: true
    },
    // Mapping between role & displayed role text
    roleMap: {
      type: Object,
      required: true
    },
    // Search input
    search: {
      type: String,
      required: true
    },
    // Tenant information
    tenant: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      // Dialogs
      dialogRevokeInvite: false,

      // Table headers
      headers: [
        {
          text: 'Email',
          value: 'email',
          align: 'left',
          width: '30%'
        },
        {
          text: 'Role',
          value: 'role',
          align: 'left',
          width: '20%'
        },
        {
          text: 'Sent',
          value: 'created',
          align: 'left',
          width: '30%'
        },
        {
          text: '',
          value: 'action',
          align: 'end',
          sortable: false,
          width: '20%'
        }
      ],

      // Table items (populated by Apollo query)
      pendingInvitationsItems: [],

      // Loading states
      isRevokingInvitation: false,
      isFetchingInvitations: false,

      // Selected user
      // Set when invitation is being revoked
      selectedUser: null
    }
  },
  watch: {
    refetchSignal() {
      this.$apollo.queries.pendingInvitations.refetch()
    }
  },
  methods: {
    async revokeInvitation(membershipInvitationId) {
      this.isRevokingInvitation = true

      const res = await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/delete-membership-invitation.gql'),
        variables: { membershipInvitationId }
      })

      if (res?.data?.delete_membership_invitation?.success) {
        this.$emit('successful-action', 'The invitation has been revoked.')
        this.$apollo.queries.pendingInvitations.refetch()
      } else {
        this.$emit(
          'failed-action',
          'Something went wrong when trying to revoke this membership. Please try again later.'
        )
      }

      this.isRevokingInvitation = false
      this.dialogRevokeInvite = false
      this.selectedUser = null
    }
  },
  apollo: {
    pendingInvitations: {
      query: require('@/graphql/Tenant/pending-invitations.gql'),
      watchLoading(isLoading) {
        this.isFetchingInvitations = isLoading
      },
      update(data) {
        if (!data) return

        // We filter this because we don't want to show invitations
        // to other tenants, which are returned by this query
        this.pendingInvitationsItems = data.pendingInvitations
          .filter(pi => this.tenant.id == pi.tenant.id)
          .map(invitation => {
            return {
              email: invitation.email,
              membershipInvitationId: invitation.id,
              role: invitation.role_detail.name,
              pending: true,
              created: invitation.created
            }
          })

        this.$emit('load-end', this.pendingInvitationsItems)
        return data
      },
      error() {
        this.$emit(
          'failed-action',
          'Something went wrong while trying to fetch invitations. Please try again.'
        )
        this.$emit('load-end')
      },
      fetchPolicy: 'network-only',
      skip() {
        return !this.tenant
      },
      pollInterval: 15000
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
      :items="pendingInvitationsItems"
      :items-per-page="10"
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
      no-results-text="No invitations found. Try expanding your search?"
      no-data-text="There are no pending membership invitations."
    >
      <!-- HEADERS -->
      <template #header.email="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #header.role="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #header.created="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>

      <!-- INVITATION SENT TIMESTAMP -->
      <template #item.created="{ item }">
        {{ formatDateTime(item.created) }}
      </template>

      <!-- ROLE -->
      <template #item.role="{ item }">
        <v-chip
          small
          dark
          :color="
            !roleColorMap[item.role]
              ? 'accentPink'
              : roleColorMap[item.role] || 'secondaryLight'
          "
        >
          {{ roleMap[item.role] || item.role }}
        </v-chip>
      </template>

      <!-- ACTIONS -->
      <template v-if="isTenantAdmin" #item.action="{ item }">
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              text
              fab
              x-small
              color="error"
              v-on="on"
              @click="
                selectedUser = item
                dialogRevokeInvite = true
              "
            >
              <v-icon>delete</v-icon>
            </v-btn>
          </template>
          Revoke invitation
        </v-tooltip>
      </template>
    </v-data-table>

    <!-- REVOKE INVITATION DIALOG -->
    <ConfirmDialog
      v-if="selectedUser"
      v-model="dialogRevokeInvite"
      type="error"
      confirm-text="Revoke"
      :dialog-props="{ 'max-width': '660' }"
      :title="
        `Are you sure you want to revoke ${selectedUser.email}'s
            invitation to your team?`
      "
      :disabled="isRevokingInvitation"
      :loading="isRevokingInvitation"
      @confirm="revokeInvitation(selectedUser.membershipInvitationId)"
    >
      The user will no longer be able to accept this invitation and will need to
      be reinvited to join the team.
    </ConfirmDialog>
  </div>
</template>
