<script>
import { mapGetters } from 'vuex'

import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import ManagementLayout from '@/layouts/ManagementLayout'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    Alert,
    ConfirmDialog,
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
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('license', ['hasPermission'])
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

    <template v-if="hasPermission('create', 'service-account')" #subtitle>
      <h4 class="error--text"
        ><v-icon class="error--text mr-1">error_outline</v-icon>DEPRECATED</h4
      >
      <div>
        <router-link :to="{ name: 'service-accounts' }">
          Service Accounts</router-link
        >
        are replacing API tokens</div
      >
      Existing tokens will continue to work, but new ones cannot be created.
      <br />
    </template>
    <template v-else-if="!hasPermission('create', 'service-account')" #subtitle>
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

    <template v-if="!hasPermission('create', 'service-account')" #alerts>
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
        You don't have permission to manage API tokens.
      </v-alert>
    </template>

    <!-- SEARCH (MOBILE) -->
    <v-text-field
      v-if="
        !$vuetify.breakpoint.mdAndUp &&
          hasPermission('create', 'service-account')
      "
      v-model="search"
      class="rounded-0 elevation-1 mb-1"
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
          v-if="
            $vuetify.breakpoint.mdAndUp &&
              hasPermission('create', 'service-account')
          "
          class="py-1 mr-2 flex"
        >
          <v-text-field
            v-model="search"
            class="rounded-0 elevation-1"
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
          v-if="hasPermission('update', 'service-account')"
          fixed-header
          :headers="headers"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :search="search"
          :items="tokens"
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
          no-results-text=" No API Tokens found. Try expanding your search?"
          no-data-text="Your team does not have any API Tokens yet."
        >
          <!-- HEADERS -->
          <template #header.name="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.created_by="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.created="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.last_used="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.expires_at="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.scope="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
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
          <template
            v-if="hasPermission('delete', 'service-account')"
            #item.actions="{ item }"
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
