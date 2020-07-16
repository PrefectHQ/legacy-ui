<script>
import { mapGetters } from 'vuex'

import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import ManagementLayout from '@/layouts/ManagementLayout'

export default {
  components: {
    Alert,
    ConfirmDialog,
    ManagementLayout
  },
  data() {
    return {
      // Alert data
      alertShow: false,
      alertMessage: '',
      alertType: null,

      // Table headers
      headers: [
        {
          text: 'Name',
          value: 'name',
          sortable: true
        },
        {
          text: '',
          value: 'actions',
          align: 'right',
          sortable: false
        }
      ],

      // Loading states
      isFetchingSecrets: true,
      isDeletingSecret: false,
      isSettingSecret: false,

      // Distinguish between creating & modifying secret
      isSecretUpdate: false,

      // How many rows are displayed at a time,
      itemsPerPage: 20,
      rowsPerPageItems: [20, 50, 100],

      // Table search
      search: null,

      // Input rules
      rules: {
        required: val => !!val || 'This field is required.'
      },

      // Dialogs
      secretModifyDialog: false,
      secretDeleteDialog: false,

      // Create/modify secret name & value input
      secretNameInput: null,
      secretValueInput: null,

      // Secret selected for modification/deletion
      selectedSecret: null,

      // Store previous secret name when modifying secret
      // This is used to delete the secret with that name and create a new secret with a separate value
      previousSecretName: null
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    isReadOnlyUser() {
      return this.role === 'READ_ONLY_USER'
    },
    secretExists() {
      if (!this.secretNames) return false

      if (this.selectedSecret?.name === this.secretNameInput) {
        return false
      }

      return this.secretNames
        ?.map(secret => secret.name)
        .includes(this.secretNameInput)
    }
  },
  watch: {
    tenant() {
      this.$apollo.queries.secretNames.refetch()
    }
  },
  methods: {
    async deleteSecret(secret, opts = {}) {
      this.isDeletingSecret = true

      const secretResult = await this.$apollo.mutate({
        mutation: require('@/graphql/Secrets/delete-secret.gql'),
        variables: {
          name: secret.name
        }
      })

      if (secretResult?.data?.delete_secret?.success) {
        if (!opts.isModifying) {
          this.$apollo.queries.secretNames.refetch()
          this.secretDeleteDialog = false
          this.handleAlert('success', 'Secret deleted.')
        }
      } else {
        this.handleAlert(
          'error',
          'Something went wrong while trying to delete this secret. Please try again. If this error persists, reach out to help@prefect.io.'
        )
      }

      this.isDeletingSecret = false
    },
    handleAlert(type, message) {
      this.alertType = type
      this.alertMessage = message
      this.alertShow = true
    },
    openSecretModifyDialog(secret) {
      this.selectedSecret = secret
      this.isSecretUpdate = true
      this.previousSecretName = secret.name
      this.secretNameInput = secret.name
      this.secretModifyDialog = true
    },
    openSecretDeleteDialog(secret) {
      this.selectedSecret = secret
      this.secretDeleteDialog = true
    },
    resetSelectedSecret() {
      this.selectedSecret = null
      this.secretNameInput = null
      this.secretValueInput = null
    },
    async setSecret() {
      this.isSettingSecret = true

      if (this.isSecretUpdate) {
        await this.deleteSecret(
          { name: this.previousSecretName },
          { isModifying: true }
        )
      }

      let value

      try {
        value = JSON.parse(this.secretValueInput)
      } catch {
        try {
          value = String.raw`${this.secretValueInput}`
        } catch {
          value = JSON.stringify(this.secretValueInput)
        }
      }

      const secretResult = await this.$apollo.mutate({
        mutation: require('@/graphql/Secrets/set-secret.gql'),
        variables: {
          name: this.secretNameInput,
          value: value || []
        }
      })

      if (this.isSecretUpdate) this.isSettingSecret = false

      if (secretResult?.data?.set_secret?.success) {
        this.$apollo.queries.secretNames.refetch()
        this.secretModifyDialog = false
        this.resetSelectedSecret()
        this.handleAlert(
          'success',
          `Secret ${this.isSecretUpdate ? 'updated' : 'added'}.`
        )
      } else {
        this.handleAlert(
          'error',
          `Something went wrong when ${
            this.isSecretUpdate ? 'updating' : 'creating'
          } this secret. Please try again. If this error persists, please contact help@prefect.io.`
        )
      }

      this.isSettingSecret = false
      this.secretNameInput = null
      this.secretValueInput = null
    }
  },
  apollo: {
    secretNames: {
      query: require('@/graphql/Tenant/tenant-secret-names.gql'),
      result() {
        this.isFetchingSecrets = false
      },
      update(data) {
        return data?.secret_names?.map(name => ({ name: name, value: null }))
      },
      // skip() {
      //   return this.isReadOnlyUser
      // },
      error() {
        this.isFetchingSecrets = false
        if (!this.isReadOnlyUser) {
          this.handleAlert(
            'error',
            'Something went wrong while trying to fetch secrets. Please try again. If this error persists, please contact help@prefect.io.'
          )
        }
      },
      fetchPolicy: 'network-only'
    }
  }
}
</script>

<template>
  <ManagementLayout :show="!isFetchingSecrets" control-show>
    <template v-slot:title>Secrets</template>

    <template v-slot:subtitle>
      Manage the
      <a
        href="https://docs.prefect.io/cloud/cloud_concepts/secrets.html"
        target="_blank"
        rel="noopener noreferrer"
        >secrets</a
      >
      <sup>
        <v-icon x-small>
          open_in_new
        </v-icon>
      </sup>
      required by your team's flow executions
    </template>

    <template v-if="!isReadOnlyUser" v-slot:cta>
      <v-btn
        color="primary"
        class="white--text"
        large
        @click="
          previousSecretName = null
          isSecretUpdate = false
          secretModifyDialog = true
        "
      >
        <v-icon left>
          add
        </v-icon>
        Add Secret
      </v-btn>
    </template>

    <template v-if="isReadOnlyUser" v-slot:alerts>
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
        Read-only users cannot create secrets.
      </v-alert>
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
      placeholder="Search for a secret"
      prepend-inner-icon="search"
      autocomplete="new-password"
    ></v-text-field>

    <v-card tile class="mx-auto">
      <v-card-text class="pa-0">
        <!-- SEARCH (DESKTOP) -->
        <div
          v-if="$vuetify.breakpoint.mdAndUp && !isReadOnlyUser"
          class="py-1 mr-2 flex"
        >
          <v-text-field
            v-if="!isReadOnlyUser"
            v-model="search"
            class="rounded-none elevation-1"
            solo
            dense
            hide-details
            single-line
            placeholder="Search for a secret"
            prepend-inner-icon="search"
            autocomplete="new-password"
            :style="{
              'max-width': $vuetify.breakpoint.mdAndUp ? '360px' : null
            }"
          ></v-text-field>
        </div>

        <!-- TABLE -->
        <v-data-table
          v-if="!isReadOnlyUser"
          fixed-header
          :headers="headers"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :search="search"
          :items="secretNames"
          :items-per-page.sync="itemsPerPage"
          sort-by="name"
          class="elevation-2 rounded-none"
          :footer-props="{
            firstIcon: 'first_page',
            itemsPerPageOptions: rowsPerPageItems,
            lastIcon: 'last_page',
            nextIcon: 'keyboard_arrow_right',
            prevIcon: 'keyboard_arrow_left',
            showFirstLastPage: true
          }"
          no-results-text="No secrets found. Try expanding your search?"
          no-data-text="Your team does not have any secrets yet."
        >
          <!-- HEADERS -->
          <template v-slot:header.name="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>

          <!-- ACTIONS -->
          <template v-slot:item.actions="{ item }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-btn
                  text
                  fab
                  x-small
                  color="primary"
                  v-on="on"
                  @click="openSecretModifyDialog(item)"
                >
                  <v-icon>edit</v-icon>
                </v-btn>
              </template>
              Modify secret
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-btn
                  text
                  fab
                  x-small
                  color="error"
                  v-on="on"
                  @click="openSecretDeleteDialog(item)"
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Delete secret
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <ConfirmDialog
      v-model="secretModifyDialog"
      :dialog-props="{ 'max-width': '500' }"
      :disabled="!(secretNameInput && secretValueInput)"
      :loading="isSettingSecret"
      :title="isSecretUpdate ? 'Modify Secret' : 'Create New Secret'"
      @cancel="resetSelectedSecret"
      @confirm="setSecret"
    >
      <span v-if="!isSecretUpdate">
        Add a secret that will allow your team to access sensitive data during
        flow executions.
      </span>

      <v-text-field
        v-model="secretNameInput"
        class="_lr-hide mt-6"
        data-private
        :autofocus="!isSecretUpdate"
        single-line
        outlined
        dense
        :rules="[rules.required]"
        placeholder="Secret Name"
        prepend-inner-icon="vpn_key"
        validate-on-blur
      />
      <v-textarea
        v-model="secretValueInput"
        class="_lr-hide mt-2"
        style="max-height: 400px;"
        data-private
        :autofocus="isSecretUpdate"
        outlined
        dense
        placeholder="Secret Value"
        prepend-inner-icon="lock"
        row-height="4"
      />
      <v-fade-transition>
        <v-alert
          v-if="secretExists"
          class="mt-3"
          border="left"
          colored-border
          elevation="2"
          type="warning"
          tile
          dense
        >
          <div class="subtitle-2 font-weight-light">
            A secret already exists with this name. By selecting CONFIRM, you
            will override this secret with a new value.
          </div>
        </v-alert>
      </v-fade-transition>
    </ConfirmDialog>

    <ConfirmDialog
      v-model="secretDeleteDialog"
      type="error"
      confirm-text="Delete"
      :dialog-props="{ 'max-width': '500' }"
      :loading="isDeletingSecret"
      title="Are you sure you want to delete this secret?"
      @confirm="deleteSecret(selectedSecret)"
    >
      This action cannot be undone.
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
