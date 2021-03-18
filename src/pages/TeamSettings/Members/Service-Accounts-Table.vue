<script>
import ConfirmDialog from '@/components/ConfirmDialog'
import DateTime from '@/components/DateTime'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    ConfirmDialog,
    DateTime
  },
  mixins: [formatTime],
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
          text: 'Name',
          value: 'firstName',
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

      // Selected user
      // Set when modifying a user's role or removing user membership
      selectedUser: null,
      isFetchingTokens: true,
      expiresAt: null,
      copyTokenDialog: false,
      apiTokenCopied: false,
      newAPIToken: '',
      newTokenName: '',
      keys: [],
      tokenToDelete: null,
      dialogRemoveToken: false
    }
  },
  computed: {
    headers() {
      return this.$vuetify.breakpoint.mdAndUp
        ? this.allHeaders
        : this.allHeaders.filter(header => header.mobile)
    },
    newTokenFormFilled() {
      return !!this.newTokenName
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
    async createAPIKey(variables) {
      const result = await this.$apollo.mutate({
        mutation: require('@/graphql/Tokens/create-api-key.gql'),
        variables
      })

      if (
        result?.data?.create_api_key?.id &&
        result?.data?.create_api_key?.key
      ) {
        this.resetNewToken()
        this.newAPIToken = result.data.create_api_key.key
        this.dialogCreateToken = false
        this.copyTokenDialog = true
        this.$apollo.queries.keys.refetch()
      } else {
        this.handleAlert(
          'error',
          'Something went wrong while trying to create your token. Please try again. If this error persists, please contact help@prefect.io.'
        )
      }
    },
    async deleteToken(token) {
      const result = await this.$apollo.mutate({
        mutation: require('@/graphql/Tokens/delete-api-key.gql'),
        variables: {
          id: token.id
        }
      })

      if (result?.data?.delete_api_key?.success) {
        this.dialogRemoveToken = false
        this.handleAlert('success', 'The token has been successfully revoked.')
        this.$apollo.queries.keys.refetch()
      } else {
        this.handleAlert(
          'error',
          'Something went wrong while trying to delete your token. Please try again. If this error persists, please contact help@prefect.io.'
        )
      }
    },
    handleAlert(type, message) {
      this.alertType = type
      this.alertMessage = message
      this.alertShow = true
    },
    resetNewToken() {
      this.newTokenName = ''
      this.newTokenScope = ''
      this.newAPIToken = ''
      this.expiresAt = null
    },
    async removeAccount(id) {
      this.isRemovingUser = true

      const res = await this.$apollo.mutate({
        mutation: require('@/graphql/User/delete-service-account.gql'),
        variables: { id }
      })

      if (res?.data?.delete_service_account?.success) {
        this.$emit('successful-action', 'The service account has been removed.')
        this.$apollo.queries.tenantUsers.refetch()
      } else {
        this.$emit(
          'failed-action',
          'Something went wrong while trying to remove this service account. Please try again.'
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
          .filter(user =>
            user.memberships.find(mem => mem.tenant_id == this.tenant.id)
          )
          .filter(user => user.account_type === 'SERVICE')
          .map(user => {
            user.memberships.find(mem => mem.tenant_id == this.tenant.id)

            return {
              id: user.id,
              firstName: user.first_name
            }
          })
        return data
      },
      error() {
        this.$emit(
          'failed-action',
          'Something went wrong while trying to fetch your service accounts. Please try again.'
        )
        this.$emit('load-end')
      },
      fetchPolicy: 'no-cache',
      skip() {
        return !this.tenant
      }
    },
    keys: {
      query: require('@/graphql/Tokens/api-keys.gql'),
      fetchPolicy: 'network-only',
      error() {
        this.handleAlert(
          'error',
          'Something went wrong while trying to fetch your keys. Please refresh the page and try again. If this error persists, please email help@prefect.io.'
        )
      },
      result({ data }) {
        this.keys = data.auth_api_key.map(key => {
          return {
            id: key.id,
            name: key.name,
            created_at: key.created,
            expires: key.expires_at,
            user_id: key.user_id
          }
        })
        this.isFetchingTokens = false
      },
      update: data => data
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
      <template #header.firstName="{ header }">
        <span class="subtitle-2">{{ header.text }}</span>
      </template>

      <template v-if="isTenantAdmin" #item.view="{ item }">
        <v-btn
          small
          color="primary"
          class="white--text"
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
      :disabled="!newTokenFormFilled"
      title="Create an API token"
      confirm-text="Create"
      @cancel="resetNewToken"
      @confirm="
        createAPIKey({
          user_id: selectedUser.id,
          name: newTokenName,
          expires_at: expiresAt
        })
      "
    >
      <v-text-field
        v-model="newTokenName"
        class="mb-3"
        single-line
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

    <!-- COPY TOKEN DIALOG -->
    <ConfirmDialog
      v-model="copyTokenDialog"
      :dialog-props="{ 'max-width': '500' }"
      title="Your token has been created"
      :confirm-text="apiTokenCopied ? 'Copied' : 'Copy'"
      cancel-text="Close"
      @cancel="resetNewToken"
      @confirm="copyNewToken"
    >
      <p>
        Copy this token and put it in a secure place.
        <strong>
          You won't be able to see this token again once you close this dialog.
        </strong>
      </p>
      <v-textarea
        id="new-api-token"
        v-model="newAPIToken"
        data-private
        class="_lr-hide"
        auto-grow
        rows="1"
        readonly
        outlined
        spellcheck="false"
      />
    </ConfirmDialog>

    <!-- VIEW TOKENS DIALOG -->

    <v-dialog v-if="selectedUser" v-model="dialogViewTokens"
      ><v-card>
        <v-card-title>{{ selectedUser.firstName }}'s Tokens</v-card-title>
        <v-data-table
          fixed-header
          :headers="tokenHeaders"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :items="keys.filter(key => key.user_id === selectedUser.id)"
          :items-per-page="10"
          class="rounded-0 truncate-table"
          :footer-props="{
            showFirstLastPage: true,
            itemsPerPageOptions: [10, 15, 20, -1],
            firstIcon: 'first_page',
            lastIcon: 'last_page',
            prevIcon: 'keyboard_arrow_left',
            nextIcon: 'keyboard_arrow_right'
          }"
          no-data-text="This account doesn't have any keys yet."
        >
          <template #item.name="{ item }">
            {{ item.name }}
          </template>

          <template #item.created="{ item }">
            <v-tooltip top>
              <template #activator="{ on }">
                <span v-on="on">
                  {{ item.created_at ? formDate(item.created_at) : '' }}
                </span>
              </template>
              <span>
                {{ item.created_at ? formatTime(item.created_at) : '' }}
              </span>
            </v-tooltip>
          </template>

          <template #item.last_used="{ item }">
            <v-tooltip top>
              <template #activator="{ on }">
                <span v-on="on">
                  {{ item.last_used ? formDate(item.last_used) : '' }}
                </span>
              </template>
              <span>
                {{ item.last_used ? formatTime(item.last_used) : '' }}
              </span>
            </v-tooltip>
          </template>

          <template #item.expires_at="{ item }">
            {{ item.expires ? formatTimeRelative(item.expires) : 'Never' }}
          </template>
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
                    tokenToDelete = item
                    dialogRemoveToken = true
                  "
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Remove token
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card>
    </v-dialog>

    <ConfirmDialog
      v-if="tokenToDelete"
      v-model="dialogRemoveToken"
      type="error"
      :dialog-props="{ 'max-width': '500' }"
      :title="
        `Are you sure you want to revoke the token
          ${tokenToDelete.name}?`
      "
      confirm-text="Revoke"
      @confirm="deleteToken(tokenToDelete)"
    >
      Once you delete this token, you will not be able to use it again to
      interact with the Prefect Cloud API.
    </ConfirmDialog>

    <!-- DELETE USER DIALOG -->
    <ConfirmDialog
      v-if="selectedUser"
      v-model="dialogRemoveUser"
      type="error"
      :title="
        `Are you sure you want to remove ${selectedUser.firstName} from your team?`
      "
      :dialog-props="{ 'max-width': '600' }"
      :disabled="isRemovingUser"
      :loading="isRemovingUser"
      @confirm="removeAccount(selectedUser.id)"
    >
      <div>
        <span class="font-weight-bold">{{ selectedUser.firstName }}</span>
        and all of their API keys will be deleted.</div
      >
    </ConfirmDialog>
  </div>
</template>
