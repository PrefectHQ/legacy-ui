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
    ...mapGetters('tenant', ['role'])
  },
  watch: {
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
        this.alertShow = true
        this.alertMessage = 'Token was successfully revoked.'
        this.alertType = 'success'
      } else {
        this.alertShow = true
        this.alertMessage = 'Something went wrong when deleting a token.'
        this.alertType = 'error'
      }
    },
    onIntersect([entry]) {
      this.$apollo.queries.tokens.skip = !entry.isIntersecting
    }
  },
  apollo: {
    tokens: {
      query: require('@/graphql/Tokens/user-tokens.gql'),
      fetchPolicy: 'network-only',
      pollInterval: 5000,
      update: data => data.api_token
    }
  }
}
</script>

<template>
  <ManagementLayout v-intersect="{ handler: onIntersect }" show>
    <template #title>Personal Access Tokens</template>

    <template #subtitle>
      <h4 class="error--text"
        ><v-icon class="error--text mr-1">error_outline</v-icon>DEPRECATED</h4
      >
      <div
        >Use the
        <router-link :to="{ name: 'keys' }"> API Keys</router-link>
        page going forward.</div
      >
      Existing tokens will continue to work, but new ones cannot be created.
      <br />
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
            class="rounded-0 elevation-1"
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
          class="elevation-2 rounded-0 truncate-table"
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
          <template #header.name="{ header }">
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
          <template #item.name="{ item }">
            {{ item.name }}
          </template>

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
            {{
              item.expires_at ? formatTimeRelative(item.expires_at) : 'Never'
            }}
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
