<script>
import { setTimeout } from 'timers'
import { mapGetters } from 'vuex'
import DateTime from '@/components/DateTime'

import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import ExternalLink from '@/components/ExternalLink'
import ManagementLayout from '@/layouts/ManagementLayout'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    DateTime,
    Alert,
    ConfirmDialog,
    ExternalLink,
    ManagementLayout
  },
  mixins: [formatTime],
  data() {
    return {
      createTokenDialog: false,
      copyTokenDialog: false,
      //alert
      alertShow: false,
      alertMessage: '',
      alertType: null,
      //data table
      headers: [
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
        { text: 'Expires', value: 'expires_at' },
        {
          text: '',
          value: 'actions',
          align: 'right',
          sortable: false
        }
      ],
      search: null,
      //token
      newPersonalAccessToken: '',
      newTokenName: '',
      newTokenScope: 'USER',
      tokens: [],
      tokenCopied: false,
      tokenToDelete: false,
      tokenToDeleteDialog: false,
      expiresAt: null,
      label: 'Expiry Date',
      hint: 'Leave blank for an expiry of 2100-01-01 UTC',
      warning:
        'You have selected a time in the past.  Your token will have an expiry of 2100-01-01 UTC'
    }
  },
  computed: {
    ...mapGetters('tenant', ['role']),
    newTokenFormFilled() {
      return !!this.newTokenName && !!this.newTokenScope
    },
    localExpiryDate() {
      return this.formDate('2100-01-01T00:00:00+00:00')
    }
  },
  watch: {
    tokenToDeleteDialog(value) {
      if (!value) {
        this.tokenToDelete = false
      }
    }
  },
  methods: {
    clearAlert() {
      this.alertShow = false
      this.alertMessage = ''
      this.alertType = null
    },
    copyNewToken() {
      var copyText = document.querySelector('#new-api-token')
      copyText.select()
      document.execCommand('copy')
      this.tokenCopied = true
      setTimeout(() => {
        this.tokenCopied = false
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
        this.newPersonalAccessToken = result.data.create_api_token.token
        this.copyTokenDialog = true
      } else {
        this.alertShow = true
        this.alertMessage = 'Something went wrong when creating a token.'
        this.alertType = 'error'
      }
    },
    async deleteToken(token) {
      const result = await this.$apollo.mutate({
        mutation: require('@/graphql/Tokens/delete-token.gql'),
        variables: {
          id: token.id
        }
      })
      if (result.data && result.data.deleteAPIToken.success) {
        this.tokenToDeleteDialog = false
        this.alertShow = true
        this.alertMessage = 'Token was successfully revoked.'
        this.alertType = 'success'
      } else {
        this.alertShow = true
        this.alertMessage = 'Something went wrong when deleting a token.'
        this.alertType = 'error'
      }
    },
    resetNewToken() {
      this.newTokenName = ''
      this.newTokenScope = 'USER'
      this.newPersonalAccessToken = ''
      this.expiresAt = null
      this.createTokenDialog = false
      this.copyTokenDialog = false
    }
  },
  apollo: {
    tokens: {
      query: require('@/graphql/Tokens/personal-access-tokens.gql'),
      fetchPolicy: 'network-only',
      pollInterval: 1000,
      update: (data) => data.api_token
    }
  }
}
</script>

<template>
  <ManagementLayout show>
    <template v-slot:title>Personal Access Tokens</template>

    <template v-slot:subtitle>
      Personal Access (or <code>USER</code>) tokens are used to represent a
      single user, and are typically used by Prefect Cloud clients (such as the
      Prefect Cloud CLI) to log in to any tenants the user has access to. View
      your
      <ExternalLink
        href="https://docs.prefect.io/cloud/cloud_concepts/api.html#prefect-cloud-api"
      >
        Personal Access Tokens.</ExternalLink
      >
    </template>

    <template v-slot:cta>
      <v-btn
        color="blue"
        data-cy="create-personal-access-token"
        class="white--text"
        @click="createTokenDialog = true"
      >
        <v-icon left>
          add
        </v-icon>
        Create a Token
      </v-btn>
    </template>

    <v-text-field
      v-if="!$vuetify.breakpoint.mdAndUp"
      v-model="search"
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
        <div v-if="$vuetify.breakpoint.mdAndUp" class="py-1 mr-2 flex">
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
              'max-width': $vuetify.breakpoint.mdAndUp ? '360px' : null
            }"
          ></v-text-field>
        </div>

        <v-data-table
          fixed-header
          class="elevation-2 rounded-none"
          :headers="headers"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :search="search"
          :items="tokens"
          :loading="$apollo.queries.tokens.loading"
          :items-per-page="10"
          :footer-props="{
            showFirstLastPage: true,
            firstIcon: 'first_page',
            lastIcon: 'last_page',
            prevIcon: 'keyboard_arrow_left',
            nextIcon: 'keyboard_arrow_right'
          }"
          no-results-text="No tokens found. Try expanding your search?"
          no-data-text="You do not have any personal access tokens yet."
        >
          <template v-slot:header.name="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>
          <template v-slot:header.created="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>
          <template v-slot:header.last_used="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>
          <template v-slot:header.expires_at="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>
          <template v-slot:item.name="{ item }">
            {{ item.name }}
          </template>

          <template v-slot:item.created="{ item }">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <span v-on="on">
                  {{ item.created ? formDate(item.created) : '' }}
                </span>
              </template>
              <span>
                {{ item.created ? formatTime(item.created) : '' }}
              </span>
            </v-tooltip>
          </template>

          <template v-slot:item.last_used="{ item }">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <span v-on="on">
                  {{ item.last_used ? formDate(item.last_used) : '' }}
                </span>
              </template>
              <span>
                {{ item.last_used ? formatTime(item.last_used) : '' }}
              </span>
            </v-tooltip>
          </template>

          <template v-slot:item.expires_at="{ item }">
            {{
              item.expires_at ? formatTimeRelative(item.expires_at) : 'Never'
            }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
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

    <ConfirmDialog
      v-model="createTokenDialog"
      :dialog-props="{ 'max-width': '500' }"
      :confirm-props="{ 'data-cy': 'submit-new-personal-access-token' }"
      :disabled="!newTokenFormFilled"
      title="Create a Personal Access token"
      confirm-text="Create"
      @cancel="
        createTokenDialog = false
        resetNewToken()
      "
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
        data-cy="new-personal-access-token-name"
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

    <ConfirmDialog
      v-model="copyTokenDialog"
      :dialog-props="{ 'max-width': '500' }"
      :cancel-props="{ 'data-cy': 'close-personal-access-token-dialog' }"
      title="Your token has been created"
      :confirm-text="tokenCopied ? 'Copied' : 'Copy'"
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
        v-model="newPersonalAccessToken"
        data-cy="personal-access-token-field"
        data-private
        class="_lr-hide"
        auto-grow
        rows="1"
        readonly
        single-line
        outlined
        spellcheck="false"
      />
    </ConfirmDialog>

    <ConfirmDialog
      v-if="tokenToDelete"
      v-model="tokenToDeleteDialog"
      type="error"
      :dialog-props="{ 'max-width': '500' }"
      :title="`Are you sure you want to revoke the token
          ${tokenToDelete.name}?`"
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

<style lang="scss">
.hidewidth {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.flex {
  display: flex;
  justify-content: flex-end;
}
</style>
