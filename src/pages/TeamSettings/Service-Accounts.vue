<script>
import { mapActions, mapGetters } from 'vuex'

import ConfirmDialog from '@/components/ConfirmDialog'
import ManagementLayout from '@/layouts/ManagementLayout'
import ServiceAccountsTable from '@/pages/TeamSettings/Service-Accounts-Table'

export default {
  components: {
    ConfirmDialog,
    ManagementLayout,
    ServiceAccountsTable
  },
  data() {
    return {
      // Dialogs
      dialogAddServiceAccount: false,

      // Inputs
      searchInput: '',
      serviceAccountNameInput: null,

      // Forms
      serviceAccountFormValid: true,

      accountCreationError: null,

      // Input rules
      rules: {
        required: value => !!value || 'This field is is required.'
      },

      // Loading states
      isCreatingServiceUser: false,

      // Signal passed as prop to ServiceAccountsTable
      // MembersTable watches this data attribute & refetches members every time this value changes.
      serviceAccountsSignal: 0
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['user']),
    ...mapGetters('license', ['license', 'hasPermission']),
    permissionsCheck() {
      return (
        this.hasPermission('create', 'service-account') &&
        this.hasPermission('update', 'service-account') &&
        this.hasPermission('delete', 'service-account')
      )
    }
  },
  watch: {
    tenant() {
      this.serviceAccountsSignal++
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    handleAlert(type, message) {
      this.setAlert({
        alertShow: true,
        alertMessage: message,
        alertType: type
      })
    },
    async addServiceAccount() {
      this.isCreatingServiceUser = true
      this.accountCreationError = null

      try {
        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/User/create-service-account.gql'),
          variables: {
            tenant_id: this.tenant.id,
            name: this.serviceAccountNameInput
          }
        })

        if (res?.data?.create_service_account?.id) {
          this.serviceAccountsSignal++
          this.dialogAddServiceAccount = false
          this.serviceAccountNameInput = null
        }
      } catch (e) {
        this.accountCreationError = `There was an error creating your service account:
            ${e}`
      } finally {
        this.isCreatingServiceUser = false
      }
    },
    resetServiceAccountDialog() {
      this.serviceAccountNameInput = null
      this.accountCreationError = null
      this.$refs['service-user-form'].reset()
    }
  }
}
</script>

<template>
  <ManagementLayout>
    <template #title>Service Accounts</template>

    <template #subtitle>
      <span v-if="permissionsCheck">
        Manage service accounts and their API keys
      </span>
      <span v-else
        >Service Accounts are only available to Administrator accounts</span
      >
    </template>

    <template v-if="permissionsCheck" #cta>
      <v-btn
        color="primary"
        class="white--text"
        large
        data-cy="invite-service-account"
        @click="dialogAddServiceAccount = true"
      >
        <v-icon left>
          person_add
        </v-icon>
        Add Service Account
      </v-btn>
    </template>

    <v-card v-if="permissionsCheck" tile>
      <v-card-text class="pa-0">
        <v-text-field
          v-if="!$vuetify.breakpoint.mdAndUp"
          v-model="searchInput"
          class="rounded-0 elevation-1 mb-1"
          solo
          dense
          hide-details
          single-line
          placeholder="Search by name"
          prepend-inner-icon="search"
          autocomplete="new-password"
        ></v-text-field>

        <ServiceAccountsTable
          :permissions-check="permissionsCheck"
          :search="searchInput"
          :tenant="tenant"
          :refetch-signal="serviceAccountsSignal"
          @successful-action="handleAlert('success', $event)"
          @failed-action="handleAlert('error', $event)"
        ></ServiceAccountsTable>
      </v-card-text>
    </v-card>

    <!-- SERVICE ACCOUNT ADD DIALOG -->
    <ConfirmDialog
      v-if="permissionsCheck"
      v-model="dialogAddServiceAccount"
      title="Add a new service account"
      confirm-text="Add"
      :error="accountCreationError"
      :loading="isCreatingServiceUser"
      :disabled="!serviceAccountFormValid || isCreatingServiceUser"
      :dialog-props="{
        'max-width': '600'
      }"
      @cancel="resetServiceAccountDialog"
      @confirm="addServiceAccount"
    >
      <v-form
        ref="service-user-form"
        v-model="serviceAccountFormValid"
        @submit.prevent
      >
        <v-text-field
          v-model="serviceAccountNameInput"
          class="mb-3"
          autofocus
          label="Account Name"
          data-cy="service-account"
          prepend-icon="engineering"
          outlined
          :rules="[rules.required]"
          @keydown.enter="addServiceAccount"
        />
      </v-form>
    </ConfirmDialog>
  </ManagementLayout>
</template>
