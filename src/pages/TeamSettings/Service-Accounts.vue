<script>
import { mapGetters } from 'vuex'

import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import ManagementLayout from '@/layouts/ManagementLayout'
import ServiceAccountsTable from '@/pages/TeamSettings/Service-Accounts-Table'

export default {
  components: {
    Alert,
    ConfirmDialog,
    ManagementLayout,
    ServiceAccountsTable
  },
  data() {
    return {
      // Alert data
      alertShow: false,
      alertMessage: '',
      alertType: null,

      // Dialogs
      dialogAddServiceAccount: false,

      // Inputs
      searchInput: '',
      serviceAccountNameInput: null,

      // Forms
      serviceAccountFormValid: true,

      inviteError: null,

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
    ...mapGetters('license', ['license']),
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    }
  },
  watch: {
    tenant() {
      this.serviceAccountsSignal++
    }
  },
  methods: {
    handleAlert(type, message) {
      this.alertType = type
      this.alertMessage = message
      this.alertShow = true
    },
    async addServiceAccount() {
      this.isCreatingServiceUser = true
      this.inviteError = null

      const res = await this.$apollo
        .mutate({
          mutation: require('@/graphql/User/create-service-account.gql'),
          variables: {
            tenant_id: this.tenant.id,
            name: this.serviceAccountNameInput
          }
        })
        .catch(({ graphQLErrors }) => {
          return { error: graphQLErrors }
        })

      if (res?.data?.create_service_account?.id) {
        this.serviceAccountsSignal++
        this.dialogAddServiceAccount = false
        this.serviceAccountNameInput = null
      }

      this.isCreatingServiceUser = false
    },
    resetServiceAccountDialog() {
      this.serviceAccountNameInput = null
      this.inviteError = null
      this.$refs['service-user-form'].reset()
    }
  }
}
</script>

<template>
  <ManagementLayout>
    <template #title>Service Accounts</template>

    <template #subtitle>
      <span v-if="isTenantAdmin">
        View your team's members, manage permissions, and send invitations
      </span>
    </template>

    <template v-if="isTenantAdmin" #cta>
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

    <v-card tile>
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
          :is-tenant-admin="isTenantAdmin"
          :search="searchInput"
          :tenant="tenant"
          :user="user"
          :refetch-signal="serviceAccountsSignal"
          @successful-action="handleAlert('success', $event)"
          @failed-action="handleAlert('error', $event)"
        ></ServiceAccountsTable>
      </v-card-text>
    </v-card>

    <!-- SERVICE ACCOUNT ADD DIALOG -->
    <ConfirmDialog
      v-if="isTenantAdmin"
      v-model="dialogAddServiceAccount"
      title="Add a new service account"
      confirm-text="Add"
      :error="inviteError"
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

    <Alert
      v-model="alertShow"
      :type="alertType"
      :message="alertMessage"
      :offset-x="$vuetify.breakpoint.mdAndUp ? 256 : 56"
    ></Alert>
  </ManagementLayout>
</template>
