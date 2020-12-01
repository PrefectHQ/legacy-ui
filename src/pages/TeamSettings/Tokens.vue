<script>
import { setTimeout } from 'timers'
import { mapGetters } from 'vuex'

import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import DateTime from '@/components/DateTime'
import ManagementLayout from '@/layouts/ManagementLayout'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    Alert,
    ConfirmDialog,
    DateTime,
    ManagementLayout
  },
  mixins: [formatTime],
  data() {
    return {
      alertShow: false,
      alertMessage: '',
      alertType: null,
      apiTokenCopied: false,
      copyTokenDialog: false,
      createTokenDialog: false,
      expiresAt: null,
      headers: [
        {
          text: 'Name',
          value: 'name'
        },
        {
          text: 'Created By',
          value: 'created_by',
          width: '5%'
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
          text: 'Scope',
          value: 'scope'
        },
        {
          text: '',
          value: 'actions',
          align: 'right',
          sortable: false
        }
      ],
      isFetchingTokens: true,
      newAPIToken: '',
      newTokenName: '',
      newTokenScope: 'TENANT',
      search: null,
      tokens: [],
      tokenToDelete: null,
      tokenToDeleteDialog: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    isReadOnlyUser() {
      return this.role === 'READ_ONLY_USER'
    },
    isTenantAdmin() {
      return this.role === 'TENANT_ADMIN'
    },
    localExpiryDate() {
      return this.formDate('2100-01-01T00:00:00+00:00')
    },
    newTokenFormFilled() {
      return !!this.newTokenName && !!this.newTokenScope
    }
  },

  watch: {
    tenant() {
      this.$apollo.queries.tokens.refetch()
    },
    tokenToDeleteDialog(value) {
      if (!value) {
        this.tokenToDelete = false
      }
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
    setExpiry(dateTime) {
      this.expiresAt = dateTime
    }
  },
  apollo: {
    tokens: {
      query: require('@/graphql/Tokens/api-tokens.gql'),
      fetchPolicy: 'network-only',
      error() {
        this.handleAlert(
          'error',
          'Something went wrong while trying to fetch your tokens. Please refresh the page and try again. If this error persists, please email help@prefect.io.'
        )
      },
      result({ data }) {
        this.tokens = data.api_token.map(token => {
          return {
            ...token,
            created_by: token.created_by ? token.created_by.username : ''
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
  <ManagementLayout :show="!isFetchingTokens" control-show>
    <template #title>API Tokens</template>

    <template v-if="isTenantAdmin" #subtitle>
      Create and manage your
      <a
        href="https://docs.prefect.io/cloud/concepts/api.html#tenant"
        target="_blank"
        rel="noopener noreferrer"
        >TENANT</a
      >
      <sup>
        <v-icon x-small>
          open_in_new
        </v-icon>
      </sup>
      tokens and your team's
      <a
        href="https://docs.prefect.io/cloud/concepts/api.html#runner"
        target="_blank"
        rel="noopener noreferrer"
        >RUNNER</a
      >
      <sup>
        <v-icon x-small>
          open_in_new
        </v-icon>
      </sup>
      tokens.
    </template>
    <template v-else-if="isReadOnlyUser" #subtitle>
      Manage
      <a
        href="https://docs.prefect.io/cloud/concepts/api.html#runner"
        target="_blank"
        rel="noopener noreferrer"
        >RUNNER</a
      >
      <sup>
        <v-icon x-small>
          open_in_new
        </v-icon>
      </sup>
      and
      <a
        href="https://docs.prefect.io/cloud/concepts/api.html#tenant"
        target="_blank"
        rel="noopener noreferrer"
        >TENANT</a
      >
      <sup>
        <v-icon x-small>
          open_in_new
        </v-icon>
      </sup>
      tokens.
    </template>
    <template v-else #subtitle>
      Manage and create your
      <a
        href="https://docs.prefect.io/cloud/concepts/api.html#tenant"
        target="_blank"
        rel="noopener noreferrer"
        >TENANT</a
      >
      <sup>
        <v-icon x-small>
          open_in_new
        </v-icon>
      </sup>
      tokens.
    </template>

    <template v-if="isReadOnlyUser" #alerts>
      <v-alert
        class="mx-auto"
        border="left"
        colored-border
        elevation="2"
        type="warning"
        tile
        icon="lock"
        max-width="380"
      >
        Read-only users cannot create API tokens.
      </v-alert>
    </template>

    <template #cta>
      <v-btn
        v-if="!isReadOnlyUser"
        color="primary"
        class="white--text"
        large
        data-cy="create-api-token"
        @click="createTokenDialog = true"
      >
        <v-icon left>
          add
        </v-icon>
        Create Token
      </v-btn>
    </template>

    <!-- SEARCH (MOBILE) -->
    <v-text-field
      v-if="!$vuetify.breakpoint.mdAndUp && !isReadOnlyUser"
      v-model="search"
      class="rounded-none elevation-1 mb-1"
      solo
      dense
      hide-details
      single-line
      placeholder="Search for an API Token"
      prepend-inner-icon="search"
      autocomplete="new-password"
    ></v-text-field>

    <v-card tile>
      <v-card-text class="pa-0">
        <div
          v-if="$vuetify.breakpoint.mdAndUp && !isReadOnlyUser"
          class="py-1 mr-2 flex"
        >
          <v-text-field
            v-model="search"
            class="rounded-none elevation-1"
            solo
            dense
            hide-details
            single-line
            placeholder="Search for an API Token"
            prepend-inner-icon="search"
            autocomplete="new-password"
            :style="{
              'max-width': $vuetify.breakpoint.mdAndUp ? '400px' : null
            }"
          ></v-text-field>
        </div>

        <!-- TOKENS TABLE -->
        <v-data-table
          v-if="!isReadOnlyUser"
          fixed-header
          :headers="headers"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :search="search"
          :items="tokens"
          :items-per-page="10"
          class="elevation-2 rounded-none truncate-table"
          :footer-props="{
            showFirstLastPage: true,
            itemsPerPageOptions: [10, 15, 20, -1],
            firstIcon: 'first_page',
            lastIcon: 'last_page',
            prevIcon: 'keyboard_arrow_left',
            nextIcon: 'keyboard_arrow_right'
          }"
          no-results-text=" No API Tokens found. Try expanding your search?"
          no-data-text="Your team does not have any API Tokens yet."
        >
          <!-- HEADERS -->
          <template #header.name="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>
          <template #header.created_by="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>
          <template #header.created="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>
          <template #header.last_used="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>
          <template #header.expires_at="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>
          <template #header.scope="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>

          <!-- TOKEN CREATED-AT TIME -->
          <template #item.created="{ item }">
            <v-tooltip top>
              <template #activator="{ on }">
                <span v-on="on">
                  {{ item.created ? formDate(item.created) : '' }}
                </span>
              </template>
              <span>
                {{ item.created ? formatTime(item.created) : '' }}
              </span>
            </v-tooltip>
          </template>

          <!-- TOKEN LAST-USED TIME -->
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

          <!-- TOKEN EXPIRES-AT TIME -->
          <template #item.expires_at="{ item }">
            {{ item.expires_at ? formatTimeRelative(item.expires_at) : '' }}
          </template>

          <!-- TOKEN ACTIONS -->
          <template v-if="!isReadOnlyUser" #item.actions="{ item }">
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
                    tokenToDeleteDialog = true
                  "
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Revoke token
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- CREATE TOKEN DIALOG -->
    <ConfirmDialog
      v-model="createTokenDialog"
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
      <v-select
        v-model="newTokenScope"
        data-cy="new-api-token-scope"
        :items="isTenantAdmin ? ['TENANT', 'RUNNER'] : ['TENANT']"
        :menu-props="{ offsetY: true }"
        label="Scope"
        outlined
        dense
        hide-details
      />
      <div class="ml-2 mt-1">
        <a
          href="https://docs.prefect.io/cloud/concepts/api.html#tenant"
          target="_blank"
          rel="noopener noreferrer"
          >What is this?</a
        >
        <sup>
          <v-icon x-small>
            open_in_new
          </v-icon>
        </sup>
      </div>
    </ConfirmDialog>

    <!-- COPY TOKEN DIALOG -->
    <ConfirmDialog
      v-model="copyTokenDialog"
      :dialog-props="{ 'max-width': '500' }"
      :cancel-props="{ 'data-cy': 'close-api-token-dialog' }"
      title="Your token has been created"
      :confirm-text="apiTokenCopied ? 'Copied' : 'Copy'"
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
        data-cy="api-token-field"
        data-private
        class="_lr-hide"
        auto-grow
        rows="1"
        readonly
        outlined
        spellcheck="false"
      />
    </ConfirmDialog>

    <!-- REVOKE TOKEN DIALOG -->
    <ConfirmDialog
      v-if="tokenToDelete"
      v-model="tokenToDeleteDialog"
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

    <Alert
      v-model="alertShow"
      :type="alertType"
      :message="alertMessage"
      :offset-x="$vuetify.breakpoint.mdAndUp ? 256 : 56"
    ></Alert>
  </ManagementLayout>
</template>

<style lang="scss" scoped>
a {
  text-decoration: none;
}

.flex {
  display: flex;
  justify-content: flex-end;
}
</style>
