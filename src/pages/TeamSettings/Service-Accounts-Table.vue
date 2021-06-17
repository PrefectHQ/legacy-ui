<script>
import ConfirmDialog from '@/components/ConfirmDialog'
import DateTime from '@/components/DateTime'
import { formatTime } from '@/mixins/formatTimeMixin'
import { mapActions } from 'vuex'

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
          value: 'firstName'
        },
        {
          mobile: true,
          text: 'Role',
          value: 'role'
        },
        {
          mobile: true,
          text: '',
          value: 'create',
          align: 'center',
          sortable: false
        },
        {
          mobile: true,
          text: '',
          value: 'actions',
          align: 'end',
          sortable: false
        }
      ],

      // Table items (populated by Apollo query)
      membersItems: [],
      expanded: [],
      keys: [],

      // Loading states
      isFetchingMembers: false,
      isRemovingUser: false,
      isCreatingKey: false,
      isDeletingKey: false,

      // Selected user
      // Set when removing account membership
      selectedUser: null,
      isFetchingKeys: true,
      expiresAt: null,
      copyKeyDialog: false,
      apiKeyCopied: false,

      newAPIKey: '',
      newKeyName: '',
      keyToDelete: null,
      dialogRemoveKey: false,

      // Role maps
      roleMap: {
        USER: 'User',
        READ_ONLY_USER: 'Read-Only',
        TENANT_ADMIN: 'Administrator',
        PENDING: 'Pending'
      },
      roleColorMap: {
        USER: 'codeBlueBright',
        READ_ONLY_USER: 'cloudUIPrimaryDark',
        TENANT_ADMIN: 'cloudUIPrimaryBlue',
        PENDING: 'accentOrange'
      }
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
    ...mapActions('alert', ['setAlert']),
    copyNewKey() {
      const copyText = document.querySelector('#new-api-key')
      copyText.select()
      document.execCommand('copy')
      this.apiKeyCopied = true
      setTimeout(() => {
        this.apiKeyCopied = false
      }, 2000)
    },
    async createAPIKey(variables) {
      this.isCreatingKey = true
      const result = await this.$apollo.mutate({
        mutation: require('@/graphql/Tokens/create-api-key.gql'),
        variables
      })

      if (
        result?.data?.create_api_key?.id &&
        result?.data?.create_api_key?.key
      ) {
        this.isCreatingKey = false
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
        this.isCreatingKey = false
      }
    },
    async deleteKey(key) {
      this.isDeletingKey = true
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

      this.isDeletingKey = false
    },
    handleAlert(type, message) {
      this.setAlert({
        alertShow: true,
        alertMessage: message,
        alertType: type
      })
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
    },
    updateRole(account) {
      this.$emit('update', account)
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
              membershipID: user.memberships[0].id,
              firstName: user.first_name,
              role: user?.memberships[0]?.role_detail?.name
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
            user_id: key.user_id,
            created_by: key.created_by ? key.created_by.username : ''
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
      show-expand
      :expanded.sync="expanded"
      :headers="headers"
      :header-props="{ 'sort-icon': 'arrow_drop_up' }"
      :items="membersItems"
      :items-per-page="10"
      :loading="isFetchingKeys"
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
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>

      <template #expanded-item="{item}">
        <td :colspan="4">
          <v-list dense class="mx-8">
            <v-subheader>{{ item.firstName }}'s Keys</v-subheader>
            <v-list-item
              v-if="!keys.filter(key => key.user_id === item.id).length"
              >{{ item.firstName }} currently has no keys.</v-list-item
            >
            <v-list-item
              v-for="key in keys.filter(key => key.user_id === item.id)"
              :key="key.id"
            >
              <v-list-item-title>{{ key.name }}</v-list-item-title>
              <v-list-item-subtitle
                >Created {{ key.created_at ? formDate(key.created_at) : '' }}
                <span v-if="key.created_by">by {{ key.created_by }}</span>
              </v-list-item-subtitle>
              <v-list-item-subtitle>
                {{
                  !key.expires
                    ? 'Never Expires'
                    : formatTimeRelative(key.expires).includes('ago')
                    ? `Expired ${formatTimeRelative(key.expires)}`
                    : `Expires ${formatTimeRelative(key.expires)}`
                }}</v-list-item-subtitle
              >
              <v-tooltip bottom>
                <template #activator="{ on }">
                  <v-btn
                    text
                    fab
                    x-small
                    color="error"
                    v-on="on"
                    @click="
                      keyToDelete = key
                      dialogRemoveKey = true
                    "
                  >
                    <v-icon>delete</v-icon>
                  </v-btn>
                </template>
                Remove API key
              </v-tooltip>
            </v-list-item>
          </v-list>
        </td>
      </template>
      <template #item.role="{ item }">
        <!-- {{ item.role }} -->

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
              color="primary"
              v-on="on"
              @click="updateRole(item)"
            >
              <v-icon>edit</v-icon>
            </v-btn>
          </template>
          Change Service Account role
        </v-tooltip>
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
      :disabled="!newKeyFormFilled || isCreatingKey"
      :loading="isCreatingKey"
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
      :disabled="isDeletingKey"
      :loading="isDeletingKey"
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

<style lang="scss" scoped>
.subtable {
  border: 2px solid var(--v-utilGrayLight-base);
  border-radius: 8px;
}
</style>
