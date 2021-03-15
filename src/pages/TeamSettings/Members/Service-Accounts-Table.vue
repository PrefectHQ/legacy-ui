<script>
import ConfirmDialog from '@/components/ConfirmDialog'
import DateTime from '@/components/DateTime'

export default {
  components: {
    ConfirmDialog,
    DateTime
  },
  props: {
    // Check admin privileges
    isTenantAdmin: {
      type: Boolean,
      required: true
    },
    // Number that updates every time tenantUsers should be refetched
    refetchSignal: {
      type: Number,
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
    },
    // Current user information
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      // Dialogs
      dialogCreateToken: false,
      dialogViewTokens: false,
      dialogRemoveUser: false,

      // Table headers
      allHeaders: [
        {
          mobile: true,
          text: 'Username',
          value: 'username',
          width: '20%'
        },
        {
          mobile: true,
          text: '',
          value: 'view',
          align: 'center',
          sortable: false,
          width: '35%'
        },
        {
          mobile: true,
          text: '',
          value: 'create',
          align: 'center',
          sortable: false,
          width: '35%'
        },
        {
          mobile: true,
          text: '',
          value: 'actions',
          align: 'end',
          sortable: false,
          width: '10%'
        }
      ],
      tokenHeaders: [
        {
          text: 'Name',
          value: 'name'
        },
        {
          text: 'Created At',
          value: 'created'
        },
        {
          text: 'Last Used',
          value: 'last_used'
        },
        {
          text: 'Expires',
          value: 'expires_at'
        },
        {
          text: '',
          value: 'actions',
          align: 'right',
          sortable: false
        }
      ],

      // Table items (populated by Apollo query)
      membersItems: [],

      // Loading states
      isFetchingMembers: false,
      isRemovingUser: false,
      isSettingRole: false,

      // Inputs
      roleInput: 'USER',

      // Selected user
      // Set when modifying a user's role or removing user membership
      selectedUser: null
    }
  },
  computed: {
    headers() {
      return this.$vuetify.breakpoint.mdAndUp
        ? this.allHeaders
        : this.allHeaders.filter(header => header.mobile)
    }
  },
  watch: {
    refetchSignal() {
      this.$apollo.queries.tenantUsers.refetch()
    }
  },
  methods: {
    copyNewToken() {
      var copyText = document.querySelector('#new-api-token')
      copyText.select()
      document.execCommand('copy')
      this.apiTokenCopied = true
      setTimeout(() => {
        this.apiTokenCopied = false
      }, 2000)
    },
    async createAPIToken(variables) {
      const result = await this.$apollo.mutate({
        mutation: require('@/graphql/Tokens/create-api-token.gql'),
        variables
      })

      if (
        result?.data?.create_api_token?.id &&
        result?.data?.create_api_token?.token
      ) {
        this.resetNewToken()
        this.newAPIToken = result.data.create_api_token.token
        this.createTokenDialog = false
        this.copyTokenDialog = true
        this.$apollo.queries.tokens.refetch()
      } else {
        this.handleAlert(
          'error',
          'Something went wrong while trying to create your token. Please try again. If this error persists, please contact help@prefect.io.'
        )
      }
    },
    async deleteToken(token) {
      const result = await this.$apollo.mutate({
        mutation: require('@/graphql/Tokens/delete-token.gql'),
        variables: {
          id: token.id
        }
      })

      if (result?.data?.delete_api_token?.success) {
        this.tokenToDeleteDialog = false
        this.handleAlert('success', 'The token has been successfully revoked.')
        this.$apollo.queries.tokens.refetch()
      } else {
        this.handleAlert(
          'error',
          'Something went wrong while trying to delete your token. Please try again. If this error persists, please contact help@prefect.io.'
        )
      }
    },
    async removeUser(membershipId) {
      this.isRemovingUser = true

      const res = await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/delete-membership.gql'),
        variables: { membershipId }
      })

      if (res?.data?.delete_membership?.success) {
        this.$emit(
          'successful-action',
          'The user has been removed from your team.'
        )
        this.$apollo.queries.tenantUsers.refetch()
      } else {
        this.$emit(
          'failed-action',
          'Something went wrong while trying to remove this member from your team. Please try again.'
        )
      }

      this.isRemovingUser = false
      this.dialogRemoveUser = false
      this.selectedUser = null
    }
  },
  apollo: {
    tenantUsers: {
      query: require('@/graphql/Tenant/tenant-users.gql'),
      watchLoading(isLoading) {
        this.isFetchingMembers = isLoading
      },
      result({ data }) {
        if (!data) return

        this.membersItems = data.tenantUsers
          // we'll filter for just service accounts here, and filter them out in MembersTable
          .filter(user =>
            user.memberships.find(mem => mem.tenant_id == this.tenant.id)
          )
          .map(user => {
            let membership = user.memberships.find(
              mem => mem.tenant_id == this.tenant.id
            )
            return {
              id: user.id,
              username: user.username,
              userId: user.id,
              membershipId: membership.id
            }
          })

        this.$emit('load-end', {
          fullUsers: this.membersItems.filter(m => m.role !== 'READ_ONLY_USER'),
          readOnlyUsers: this.membersItems.filter(
            m => m.role == 'READ_ONLY_USER'
          )
        })
        return data
      },
      error() {
        this.$emit(
          'failed-action',
          'Something went wrong while trying to fetch your team members. Please try again.'
        )
        this.$emit('load-end')
      },
      fetchPolicy: 'no-cache',
      skip() {
        return !this.tenant
      }
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
      :items="membersItems"
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
      no-results-text="No members found. Try expanding your search?"
      no-data-text="This team does not have any members yet."
    >
      <!-- HEADERS -->
      <template #header.username="{ header }">
        <span class="subtitle-2">{{ header.text }}</span>
      </template>

      <template v-if="isTenantAdmin" #item.view="{ item }">
        <v-btn
          small
          color="primary"
          class="white--text"
          v-on="on"
          @click="
            selectedUser = item
            dialogViewTokens = true
          "
        >
          <v-icon left>visibility</v-icon>
          View Tokens
        </v-btn>
      </template>

      <template v-if="isTenantAdmin" #item.create="{ item }">
        <v-btn
          small
          color="primary"
          class="white--text"
          @click="
            selectedUser = item
            dialogCreateToken = true
          "
          ><v-icon left>
            add
          </v-icon>
          Create Token
        </v-btn>
      </template>

      <!-- ACTIONS -->
      <template v-if="isTenantAdmin" #item.actions="{ item }">
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
                dialogRemoveUser = true
              "
            >
              <v-icon>delete</v-icon>
            </v-btn>
          </template>
          Remove account
        </v-tooltip>
      </template>
    </v-data-table>

    <!-- CREATE TOKEN DIALOG -->
    <ConfirmDialog
      v-model="dialogCreateToken"
      :dialog-props="{ 'max-width': '500' }"
      :confirm-props="{ 'data-cy': 'submit-new-api-token' }"
      :disabled="!newTokenFormFilled"
      title="Create an API token"
      confirm-text="Create"
      @cancel="resetNewToken"
      @confirm="
        createAPIToken({
          name: newTokenName,
          scope: newTokenScope,
          expires_at: expiresAt
        })
      "
    >
      <v-text-field
        v-model="newTokenName"
        class="mb-3"
        single-line
        data-cy="new-api-token-name"
        placeholder="Token Name"
        autofocus
        outlined
        dense
      />
      <DateTime
        v-model="expiresAt"
        class="mb-3"
        warning="
           You have selected a time in the past; as a result, your token will have already expired.
        "
        :text-field-props="{
          outlined: true,
          dense: true,
          hint: `Leave blank to never expire this token`,
          label: 'Token Expiration',
          persistentHint: true
        }"
      />
    </ConfirmDialog>

    <!-- VIEW TOKENS DIALOG -->

    <ConfirmDialog
      v-if="selectedUser"
      v-model="dialogViewTokens"
      :dialog-props="{ 'max-width': '600' }"
      :title="`${selectedUser.username}'s Tokens`"
      :disabled="isSettingRole"
      :loading="isSettingRole"
      @cancel="dialogViewTokens = false"
    >
      <v-data-table
        fixed-header
        :headers="tokenHeaders"
        :header-props="{ 'sort-icon': 'arrow_drop_up' }"
        :items="membersItems"
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
        no-data-text="This team does not have any members yet."
      >
      </v-data-table>
    </ConfirmDialog>

    <!-- DELETE USER DIALOG -->
    <ConfirmDialog
      v-if="selectedUser"
      v-model="dialogRemoveUser"
      type="error"
      :title="
        `Are you sure you want to remove ${selectedUser.username} from your team?`
      "
      :dialog-props="{ 'max-width': '600' }"
      :disabled="isRemovingUser"
      :loading="isRemovingUser"
      @confirm="removeUser(selectedUser.membershipId)"
    >
      <div>
        <span class="font-weight-bold">{{ selectedUser.username }}</span>
        and all of their API keys will be deleted.</div
      >
    </ConfirmDialog>
  </div>
</template>
