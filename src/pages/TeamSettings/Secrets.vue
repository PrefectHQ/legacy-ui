<script>
import { mapGetters } from 'vuex'
import CodeInput from '@/components/CustomInputs/CodeInput'
import ManagementLayout from '@/layouts/ManagementLayout'
import ConfirmDialog from '@/components/ConfirmDialog'
import Alert from '@/components/Alert'
import { tryParseJson } from '@/utils/json'

export default {
  components: {
    Alert,
    ConfirmDialog,
    ManagementLayout,
    CodeInput
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
      itemsPerPage: 10,
      rowsPerPageItems: [10, 15, 20, -1],

      // Table search
      search: null,

      // Input rules
      errorMessage: '',
      rules: {
        required: val => !!val || 'This field is required.'
      },

      // Dialogs
      secretModifyDialog: false,
      secretDeleteDialog: false,

      // Create/modify secret name & value input
      secretNameInput: null,
      secretValueInput: '',

      // Secret selected for modification/deletion
      selectedSecret: null,

      // Store previous secret name when modifying secret
      // This is used to delete the secret with that name and create a new secret with a separate value
      previousSecretName: null,

      //secretsInfoCard
      secretsInfo: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('license', ['hasPermission']),
    permissionsCheck() {
      return !this.hasPermission('update', 'secret')
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
      this.selectedTypeIndex = 0
    },
    async validateAndSetSecret() {
      if (!this.secretNameInput || !this.$refs.secretValueInput.validate()) {
        this.handleAlert('error', 'Cannot save with errors in form.')
        return
      }

      await this.setSecret()
    },
    async setSecret() {
      this.isSettingSecret = true

      if (this.isSecretUpdate) {
        await this.deleteSecret(
          { name: this.previousSecretName },
          { isModifying: true }
        )
      }
      const value =
        tryParseJson(this.secretValueInput) ?? this.secretValueInput ?? []
      const secretResult = await this.$apollo.mutate({
        mutation: require('@/graphql/Secrets/set-secret.gql'),
        variables: {
          name: this.secretNameInput,
          value
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
        if (!this.permissionsCheck) {
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
    <template #title>Secrets </template>

    <template #subtitle>
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

    <template v-if="!permissionsCheck" #cta>
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

    <template v-if="permissionsCheck" #alerts>
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
        You don't have permission to manage secrets.
      </v-alert>
    </template>

    <!-- SEARCH (MOBILE) -->
    <v-text-field
      v-if="!$vuetify.breakpoint.mdAndUp && !permissionsCheck"
      v-model="search"
      class="rounded-0 elevation-1 mb-1"
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
          v-if="$vuetify.breakpoint.mdAndUp && !permissionsCheck"
          class="py-1 mr-2 flex"
        >
          <v-text-field
            v-if="!permissionsCheck"
            v-model="search"
            class="rounded-0 elevation-1"
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
          v-if="!permissionsCheck"
          fixed-header
          :headers="headers"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :search="search"
          :items="secretNames"
          :items-per-page.sync="itemsPerPage"
          sort-by="name"
          class="elevation-2 rounded-0 truncate-table"
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
          <template #header.name="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>

          <!-- ACTIONS -->
          <template #item.actions="{ item }">
            <v-tooltip bottom>
              <template #activator="{ on }">
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
              <template #activator="{ on }">
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
      :dialog-props="{ 'max-width': '75vh' }"
      :loading="isSettingSecret"
      :title="isSecretUpdate ? 'Modify Secret' : 'Create New Secret'"
      @cancel="resetSelectedSecret"
      @confirm="validateAndSetSecret"
      data-private
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
        :messages="
          secretExists
            ? 'A secret with this this name already exists. Clicking CONFIRM will overwrite it.'
            : null
        "
        :rules="[rules.required]"
        placeholder="Secret Name"
        prepend-inner-icon="vpn_key"
        validate-on-blur
      />

      <code-input
        v-if="secretModifyDialog"
        ref="secretValueInput"
        v-model="secretValueInput"
        class="text-body-1"
        placeholder="Secret value"
        :editors="['text', 'json']"
      />
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
