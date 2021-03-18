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
      dialogCreateKey: false,
      dialogViewKeys: false,
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
      keysHeaders: [
        {
          text: 'Name',
          value: 'name'
        },
        {
          text: 'Created At',
          value: 'created'
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
      // Set when removing account membership
      selectedUser: null,
      isFetchingKeys: true,
      expiresAt: null,
      copyKeyDialog: false,
      apiKeyCopied: false,
      newAPIKey: '',
      newKeyName: '',
      keys: [],
      keyToDelete: null,
      dialogRemoveKey: false
    }
  },
  computed: {
    headers() {
      return this.$vuetify.breakpoint.mdAndUp
        ? this.allHeaders
        : this.allHeaders.filter(header => header.mobile)
    },
    newKeyFormFilled() {
      return !!this.newKeyName
    }
  },
  watch: {
    refetchSignal() {
      this.$apollo.queries.tenantUsers.refetch()
    }
  },
  methods: {
    copyNewKey() {
      var copyText = document.querySelector('#new-api-key')
      copyText.select()
      document.execCommand('copy')
      this.apiKeyCopied = true
      setTimeout(() => {
        this.apiKeyCopied = false
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
        this.resetNewKey()
        this.newAPIKey = result.data.create_api_key.key
        this.dialogCreateKey = false
        this.copyKeyDialog = true
        this.$apollo.queries.keys.refetch()
      } else {
        this.handleAlert(
          'error',
          'Something went wrong while trying to create your API key. Please try again. If this error persists, please contact help@prefect.io.'
        )
      }
    },
    async deleteKey(key) {
      const result = await this.$apollo.mutate({
        mutation: require('@/graphql/Tokens/delete-api-key.gql'),
        variables: {
          id: key.id
        }
      })

      if (result?.data?.delete_api_key?.success) {
        this.dialogRemoveKey = false
        this.handleAlert(
          'success',
          'The API key has been successfully revoked.'
        )
        this.$apollo.queries.keys.refetch()
      } else {
        this.handleAlert(
          'error',
          'Something went wrong while trying to delete your API key. Please try again. If this error persists, please contact help@prefect.io.'
        )
      }
    },
    handleAlert(type, message) {
      this.alertType = type
      this.alertMessage = message
      this.alertShow = true
    },
    resetNewKey() {
      this.newKeyName = ''
      this.newKeyScope = ''
      this.newAPIKey = ''
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
          'Something went wrong while trying to fetch your API keys. Please refresh the page and try again. If this error persists, please email help@prefect.io.'
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
        this.isFetchingKeys = false
      },
      update: data => data
    }
  }
}
</script>

<template>
  <div>
    <v-data-table
      v-if="isTenantAdmin"
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
      no-results-text="No service accounts found. Try expanding your search?"
      no-data-text="This team does not have any service accounts yet."
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
            dialogViewKeys = true
          "
        >
          <v-icon left>visibility</v-icon>
          View API Keys
        </v-btn>
      </template>

      <template v-if="isTenantAdmin" #item.create="{ item }">
        <v-btn
          small
          color="primary"
          class="white--text"
          @click="
            selectedUser = item
            dialogCreateKey = true
          "
          ><v-icon left>
            add
          </v-icon>
          Create API Key
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

    <!-- CREATE KEY DIALOG -->
    <ConfirmDialog
      v-model="dialogCreateKey"
      :dialog-props="{ 'max-width': '500' }"
      :disabled="!newKeyFormFilled"
      title="Create an API key"
      confirm-text="Create"
      @cancel="resetNewKey"
      @confirm="
        createAPIKey({
          user_id: selectedUser.id,
          name: newKeyName,
          expires_at: expiresAt
        })
      "
    >
      <v-text-field
        v-model="newKeyName"
        class="mb-3"
        single-line
        placeholder="API Key Name"
        autofocus
        outlined
        dense
      />
      <DateTime
        v-model="expiresAt"
        class="mb-3"
        warning="
           You have selected a time in the past; as a result, your key will have already expired.
        "
        :text-field-props="{
          outlined: true,
          dense: true,
          hint: `Leave blank to never expire this API key`,
          label: 'API Key Expiration',
          persistentHint: true
        }"
      />
    </ConfirmDialog>

    <!-- COPY KEY DIALOG -->
    <ConfirmDialog
      v-model="copyKeyDialog"
      :dialog-props="{ 'max-width': '500' }"
      title="Your API key has been created"
      :confirm-text="apiKeyCopied ? 'Copied' : 'Copy'"
      cancel-text="Close"
      @cancel="resetNewKey"
      @confirm="copyNewKey"
    >
      <p>
        Copy this key and put it in a secure place.
        <strong>
          You won't be able to see this key again once you close this dialog.
        </strong>
      </p>
      <v-textarea
        id="new-api-key"
        v-model="newAPIKey"
        data-private
        class="_lr-hide"
        auto-grow
        rows="1"
        readonly
        outlined
        spellcheck="false"
      />
    </ConfirmDialog>

    <!-- VIEW KEYS DIALOG -->

    <v-dialog v-if="selectedUser" v-model="dialogViewKeys"
      ><v-card>
        <v-card-title>{{ selectedUser.firstName }}'s API Keys</v-card-title>
        <v-data-table
          fixed-header
          :headers="keysHeaders"
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
                    keyToDelete = item
                    dialogRemoveKey = true
                  "
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Remove API key
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card>
    </v-dialog>

    <ConfirmDialog
      v-if="keyToDelete"
      v-model="dialogRemoveKey"
      type="error"
      :dialog-props="{ 'max-width': '500' }"
      :title="
        `Are you sure you want to revoke the API key
          ${keyToDelete.name}?`
      "
      confirm-text="Revoke"
      @confirm="deleteKey(keyToDelete)"
    >
      Once you delete this API key, you will not be able to use it again to
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
