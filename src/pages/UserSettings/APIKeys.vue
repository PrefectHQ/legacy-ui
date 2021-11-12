<script>
import { setTimeout } from 'timers'
import { mapGetters } from 'vuex'
import { pollsTenantsMixin } from '@/mixins/polling/pollsTenantsMixin'
import DateTime from '@/components/DateTime'

import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import ManagementLayout from '@/layouts/ManagementLayout'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    DateTime,
    Alert,
    ConfirmDialog,
    ManagementLayout
  },
  mixins: [formatTime, pollsTenantsMixin],
  data() {
    return {
      createKeyDialog: false,
      copyKeyDialog: false,
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
        { text: 'Expires', value: 'expires_at' },
        { text: 'Tenant', value: 'tenant' },
        {
          text: '',
          value: 'actions',
          align: 'right',
          sortable: false
        }
      ],
      search: null,
      //key
      newKey: '',
      newKeyName: '',
      newKeyTenant: null,
      creatingKey: false,
      keys: [],
      keyCopied: false,
      keyToDelete: false,
      keyToDeleteDialog: false,
      expiresAt: null,
      label: 'Expiry Date',
      hint: 'Leave blank for an expiry of 2100-01-01 UTC',
      warning:
        'You have selected a time in the past.  Your API key will have an expiry of 2100-01-01 UTC'
    }
  },
  computed: {
    ...mapGetters('user', ['user']),
    ...mapGetters('tenant', ['tenants', 'tenant']),
    newKeyFormFilled() {
      return !!this.newKeyName && !!this.newKeyTenant
    },
    localExpiryDate() {
      return this.formDate('2100-01-01T00:00:00+00:00')
    }
  },

  watch: {
    keyToDeleteDialog(value) {
      if (!value) {
        this.keyToDelete = false
      }
    }
  },
  mounted() {
    return (this.newKeyTenant = this.tenant)
  },
  methods: {
    clearAlert() {
      this.alertShow = false
      this.alertMessage = ''
      this.alertType = null
    },
    copyNewKey() {
      var copyText = document.querySelector('#new-api-key')
      copyText.select()
      document.execCommand('copy')
      this.keyCopied = true
      setTimeout(() => {
        this.keyCopied = false
      }, 2000)
    },
    async createAPIKey(variables) {
      this.creatingKey = true
      const result = await this.$apollo.mutate({
        mutation: require('@/graphql/Tokens/create-api-key.gql'),
        variables
      })

      if (
        result?.data?.create_api_key?.id &&
        result?.data?.create_api_key?.key
      ) {
        this.resetNewKey()
        this.newKey = result.data.create_api_key.key
        this.copyKeyDialog = true
        this.$apollo.queries.keys.refetch()
      } else {
        this.alertShow = true
        this.alertMessage = 'Something went wrong when creating an API key.'
        this.alertType = 'error'
      }
      this.creatingKey = false
    },
    async deleteKey(key) {
      const result = await this.$apollo.mutate({
        mutation: require('@/graphql/Tokens/delete-api-key.gql'),
        variables: {
          id: key.id
        }
      })
      if (result?.data?.delete_api_key?.success) {
        this.keyToDeleteDialog = false
        this.alertShow = true
        this.alertMessage = 'API key was successfully revoked.'
        this.alertType = 'success'
        this.$apollo.queries.keys.refetch()
      } else {
        this.alertShow = true
        this.alertMessage = 'Something went wrong when deleting this API key.'
        this.alertType = 'error'
      }
    },
    resetNewKey() {
      this.newKeyName = ''
      this.newKey = ''
      this.newKeyTenant = this.tenant
      this.expiresAt = null
      this.createKeyDialog = false
      this.copyKeyDialog = false
    }
  },
  apollo: {
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
        this.keys = data.auth_api_key
          .filter(key => key.user_id === this.user.id)
          .map(key => {
            const defaultTenant = this.tenants.find(
              ({ id }) => id === key.default_tenant_id
            )
            return {
              id: key.id,
              name: key.name,
              created_at: key.created,
              expires: key.expires_at,
              tenant: defaultTenant?.name,
              user_id: key.user_id
            }
          })
      },
      update: data => data
    }
  }
}
</script>

<template>
  <ManagementLayout show>
    <template #title>API Keys</template>

    <template #subtitle>
      API keys are used to represent a single user, and are typically used by
      Prefect Cloud clients (such as the Prefect Cloud CLI) to perform actions
      within Prefect.
    </template>

    <template #cta>
      <v-btn
        color="blue"
        data-cy="create-api-key"
        class="white--text"
        @click="createKeyDialog = true"
      >
        <v-icon left>
          add
        </v-icon>
        Create an API key
      </v-btn>
    </template>

    <v-text-field
      v-if="!$vuetify.breakpoint.mdAndUp"
      v-model="search"
      solo
      dense
      hide-details
      single-line
      placeholder="Search for an API Key"
      prepend-inner-icon="search"
      autocomplete="new-password"
    ></v-text-field>

    <v-card tile>
      <v-card-text class="pa-0">
        <div v-if="$vuetify.breakpoint.mdAndUp" class="py-1 mr-2 flex">
          <v-text-field
            v-model="search"
            class="rounded-0 elevation-1"
            solo
            dense
            hide-details
            single-line
            placeholder="Search for an API Key"
            prepend-inner-icon="search"
            autocomplete="new-password"
            :style="{
              'max-width': $vuetify.breakpoint.mdAndUp ? '360px' : null
            }"
          ></v-text-field>
        </div>

        <v-data-table
          fixed-header
          class="elevation-2 rounded-0 truncate-table"
          :headers="headers"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :search="search"
          :items="keys"
          :loading="$apollo.queries.keys.loading"
          :items-per-page="10"
          :footer-props="{
            showFirstLastPage: true,
            firstIcon: 'first_page',
            lastIcon: 'last_page',
            prevIcon: 'keyboard_arrow_left',
            nextIcon: 'keyboard_arrow_right'
          }"
          no-results-text="No API keys found. Try expanding your search?"
          no-data-text="You do not have any API keys yet."
        >
          <template #header.name="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.created="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.expires_at="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.tenant="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
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
          <template #item.actions="{ item }">
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
                    keyToDeleteDialog = true
                  "
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Revoke API key
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <ConfirmDialog
      v-model="createKeyDialog"
      :dialog-props="{ 'max-width': '500' }"
      :confirm-props="{ 'data-cy': 'submit-new-api-key' }"
      :disabled="!newKeyFormFilled"
      title="Create an API key"
      confirm-text="Create"
      :loading="creatingKey"
      @cancel="
        createKeyDialog = false
        resetNewKey()
      "
      @confirm="
        createAPIKey({
          user_id: user.id,
          name: newKeyName,
          expires_at: expiresAt,
          tenant_id: newKeyTenant.id
        })
      "
    >
      <v-text-field
        v-model="newKeyName"
        class="mb-3"
        single-line
        data-cy="new-api-key-name"
        placeholder="API Key Name"
        autofocus
        outlined
        dense
      />
      <DateTime
        v-model="expiresAt"
        class="mb-3"
        warning="
          You have selected a time in the past; as a result, your API key will have already expired.
        "
        :text-field-props="{
          outlined: true,
          dense: true,
          hint: `Leave blank to never expire this key`,
          label: 'API Key Expiration',
          persistentHint: true
        }"
      />
      <v-select
        v-model="newKeyTenant"
        outlined
        dense
        return-object
        label="Tenant"
        :items="tenants"
        item-text="name"
        item-value="id"
      >
      </v-select>
    </ConfirmDialog>

    <ConfirmDialog
      v-model="copyKeyDialog"
      :dialog-props="{ 'max-width': '500' }"
      :cancel-props="{ 'data-cy': 'close-api-key-dialog' }"
      title="Your key has been created"
      :confirm-text="keyCopied ? 'Copied' : 'Copy'"
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
        v-model="newKey"
        data-cy="api-key-field"
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
      v-if="keyToDelete"
      v-model="keyToDeleteDialog"
      type="error"
      :dialog-props="{ 'max-width': '500' }"
      :title="
        `Are you sure you want to revoke the API key
          ${keyToDelete.name}?`
      "
      confirm-text="Revoke"
      @confirm="deleteKey(keyToDelete)"
    >
      Once you delete this key, you will not be able to use it again to interact
      with the Prefect Cloud API.
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
