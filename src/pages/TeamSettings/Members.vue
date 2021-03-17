<script>
import { mapGetters } from 'vuex'

import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import InvitationsTable from '@/pages/TeamSettings/Members/Invitations-Table'
import ManagementLayout from '@/layouts/ManagementLayout'
import MembersTable from '@/pages/TeamSettings/Members/Members-Table'
import ServiceAccountsTable from '@/pages/TeamSettings/Members/Service-Accounts-Table'
import { EMAIL_REGEX } from '@/utils/regEx'

export default {
  components: {
    Alert,
    ConfirmDialog,
    InvitationsTable,
    ManagementLayout,
    MembersTable,
    ServiceAccountsTable
  },
  data() {
    return {
      // Current tab
      tab: 'members',

      // Alert data
      alertShow: false,
      alertMessage: '',
      alertType: null,

      // Dialogs
      dialogInviteUser: false,
      dialogAddServiceAccount: false,

      // Inputs
      inviteEmailInput: null,
      roleInput: null,
      searchInput: '',
      serviceAccountNameInput: null,

      // Forms
      inviteFormValid: true,
      serviceAccountFormValid: true,

      inviteError: null,
      fullUsers: null,
      fullInvitations: null,
      readOnlyInvitations: null,
      readOnlyUsers: null,

      // Input rules
      rules: {
        email: value =>
          EMAIL_REGEX.test(value) || 'Please enter a valid email address.',
        required: value => !!value || 'This field is is required.'
      },

      // Loading states
      isInvitingUser: false,
      isCreatingServiceUser: false,
      isLoadingMembersTable: true,

      // Signal passed as prop to MembersTable
      // MembersTable watches this data attribute & refetches members every time this value changes.
      membersSignal: 0,

      // Signal passed as prop to ServiceAccountsTable
      // MembersTable watches this data attribute & refetches members every time this value changes.
      serviceAccountsSignal: 0,

      // Signal passed as prop to InvitationsTable
      // InvitationsTable watches this data attribute & refetches invites every time this value changes.
      inviteSignal: 0,

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
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['user']),
    ...mapGetters('license', ['license']),
    allowedFullUsers() {
      return this.license?.terms?.users ?? Infinity
    },
    allowedReadOnlyUsers() {
      return 0
    },
    insufficientUsers() {
      return (
        this.allowedFullUsers <= this.totalFullUsers &&
        this.allowedReadOnlyUsers <= this.totalReadOnlyUsers
      )
    },
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    },
    roleSelectionMap() {
      return [
        {
          role: 'TENANT_ADMIN',
          label: 'Administrator',
          color: 'cloudUIPrimaryBlue',
          disabled: this.totalFullUsers >= this.allowedFullUsers
        },
        {
          role: 'USER',
          label: 'User',
          color: 'codeBlueBright',
          disabled: this.totalFullUsers >= this.allowedFullUsers
        }
        // {
        //   role: 'READ_ONLY_USER',
        //   label: 'Read-Only',
        //   color: 'cloudUIPrimaryDark',
        //   disabled: this.totalReadOnlyUsers >= this.allowedReadOnlyUsers
        // }
      ]
    },
    totalMembers() {
      return this.totalFullUsers + this.totalReadOnlyUsers
    },
    totalFullUsers() {
      return this.fullInvitations + this.fullUsers
    },
    totalReadOnlyUsers() {
      return this.readOnlyInvitations + this.readOnlyUsers
    }
  },
  watch: {
    tenant() {
      this.membersSignal++
      this.serviceAccountsSignal++
      this.inviteSignal++
    }
  },
  mounted() {
    // Hacky fix for a bizarre bug where the tab slider doesn't show up on mount.
    setTimeout(() => {
      // Get the width of a tab.
      const tabWidth = document.getElementsByClassName('v-tab')[0].offsetWidth

      // The tab slider doesn't render because it's width is set at 0.
      // To fix this, set the slider's width equal to the tab width.
      document.getElementsByClassName(
        'v-tabs-slider-wrapper'
      )[0].style.width = `${tabWidth}px`

      // Bonus - this creates an animation for the slider on mount, so that's pretty nice.
    }, 400)
  },
  methods: {
    handleAlert(type, message) {
      this.alertType = type
      this.alertMessage = message
      this.alertShow = true
    },
    handleUpdateInvitations(event) {
      if (event?.readOnlyInvitations && event?.fullInvitations) {
        this.readOnlyInvitations = event.readOnlyInvitations.length
        this.fullInvitations = event.fullInvitations.length
      }
    },
    loadEnd(event) {
      this.isLoadingMembersTable = false
      if (event?.fullUsers && event?.readOnlyUsers) {
        this.fullUsers = event.fullUsers.length
        this.readOnlyUsers = event.readOnlyUsers.length
      }
    },
    async inviteUser() {
      this.isInvitingUser = true
      this.inviteError = null

      const res = await this.$apollo
        .mutate({
          mutation: require('@/graphql/Tenant/create-membership-invitation.gql'),
          variables: {
            input: {
              email: this.inviteEmailInput,
              role: this.roleInput
            }
          }
        })
        .catch(({ graphQLErrors }) => {
          let error
          switch (graphQLErrors[0].message) {
            case 'This tenant already has the maximum number of users.':
              this.inviteError =
                'Your team already has the maximum number of users.'
              if (this.readOnlyInvitations > 0 || this.fullInvitations > 0)
                this.tab = 'pending'
              break

            case 'This tenant already has the maximum number of read-only users.':
              this.inviteError =
                'Your team already has the maximum number of read-only users.'
              if (this.readOnlyInvitations > 0 || this.fullInvitations > 0)
                this.tab = 'pending'
              break

            case `A user with email "${this.inviteEmailInput}" has already been invited to tenant ${this.tenant.id}.`:
              this.inviteError = 'This user has already been invited.'
              break
          }
          return { error: error }
        })

      if (res?.data?.create_membership_invitation?.id) {
        //this text is part of the onboard E2E test - please update test if you change
        this.handleAlert('success', 'Your invitation has been sent!')
        this.inviteSignal++
        this.dialogInviteUser = false
        this.inviteEmailInput = null
        this.tab = 'pending'
      }

      this.isInvitingUser = false
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
    resetInviteUserDialog() {
      this.inviteEmailInput = null
      this.roleInput = null
      this.inviteError = null
      this.$refs['invite-user-form'].reset()
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
  <ManagementLayout :show="!isLoadingMembersTable" control-show>
    <template #title>Team Members</template>

    <template #subtitle>
      <span v-if="isTenantAdmin">
        View your team's members, manage permissions, and send invitations
      </span>
      <span v-else data-cy="non-admin-message">
        View the other members of {{ tenant.name }}
      </span>
    </template>

    <template v-if="isTenantAdmin" #cta>
      <v-btn
        v-if="tab === 'service-accounts'"
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
      <v-btn
        v-else
        :disabled="insufficientUsers"
        color="primary"
        class="white--text"
        large
        data-cy="invite-member"
        @click="dialogInviteUser = true"
      >
        <v-icon left>
          person_add
        </v-icon>
        Invite
      </v-btn>
    </template>

    <template v-if="insufficientUsers" #alerts>
      <v-alert
        class="mx-auto"
        border="left"
        colored-border
        elevation="2"
        type="warning"
        tile
        icon="lock"
        max-width="600"
      >
        <p>
          Your team has no users available. You can add more from the
          <router-link :to="{ name: 'account' }"> Account Page</router-link>
        </p>
      </v-alert>
    </template>

    <v-text-field
      v-if="!$vuetify.breakpoint.mdAndUp"
      v-model="searchInput"
      class="rounded-0 elevation-1 mb-1"
      solo
      dense
      hide-details
      single-line
      placeholder="Search by name or email"
      prepend-inner-icon="search"
      autocomplete="new-password"
    ></v-text-field>
    <v-tabs
      v-model="tab"
      class="elevation-2"
      :grow="!$vuetify.breakpoint.mdAndUp"
    >
      <!-- DESKTOP TABS -->
      <template v-if="$vuetify.breakpoint.mdAndUp">
        <v-tab
          href="#members"
          :style="{
            'min-width': '160px'
          }"
        >
          <v-icon class="mr-2">people</v-icon>
          Users
        </v-tab>
        <v-tab
          href="#service-accounts"
          :style="{
            'min-width': '160px'
          }"
        >
          <v-icon class="mr-2">engineering</v-icon>
          Service Accounts
        </v-tab>
        <v-tab
          href="#pending"
          :style="{
            'min-width': '160px'
          }"
        >
          <v-badge
            bordered
            color="codePink"
            :content="readOnlyInvitations + fullInvitations"
            :value="readOnlyInvitations + fullInvitations"
            left
            offset-x="10"
            offset-y="10"
            top
            overlap
          >
            <v-icon class="mr-2">mail</v-icon>
          </v-badge>
          Invitations
        </v-tab>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="searchInput"
          class="rounded-0 mt-1 mr-2"
          solo
          dense
          hide-details
          single-line
          placeholder="Search by name or email"
          prepend-inner-icon="search"
          autocomplete="new-password"
          :style="{
            'max-width': '360px'
          }"
        ></v-text-field>
      </template>

      <!-- MOBILE/TABLET STYLES -->
      <template v-else>
        <v-tab href="#members">
          <v-icon class="mr-2">people</v-icon>
          Users
        </v-tab>
        <v-tab href="#service-accounts">
          <v-icon class="mr-2">engineering</v-icon>
          Service Accounts
        </v-tab>
        <v-tab href="#pending">
          <v-badge
            bordered
            color="codePink"
            :content="readOnlyInvitations + fullInvitations"
            :value="readOnlyInvitations + fullInvitations"
            left
            offset-x="10"
            offset-y="10"
            top
            overlap
          >
            <v-icon class="mr-2">mail</v-icon>
            Invitations
          </v-badge>
        </v-tab>
      </template>

      <!-- MEMBERS TABLE -->
      <v-tab-item value="members">
        <MembersTable
          :is-tenant-admin="isTenantAdmin"
          :role-color-map="roleColorMap"
          :role-map="roleMap"
          :search="searchInput"
          :tenant="tenant"
          :user="user"
          :refetch-signal="membersSignal"
          @load-end="loadEnd($event)"
          @successful-action="handleAlert('success', $event)"
          @failed-action="handleAlert('error', $event)"
        ></MembersTable>
      </v-tab-item>

      <v-tab-item value="service-accounts" eager>
        <ServiceAccountsTable
          :is-tenant-admin="isTenantAdmin"
          :search="searchInput"
          :tenant="tenant"
          :user="user"
          :refetch-signal="serviceAccountsSignal"
          @load-end="loadEnd($event)"
          @successful-action="handleAlert('success', $event)"
          @failed-action="handleAlert('error', $event)"
        ></ServiceAccountsTable>
      </v-tab-item>

      <!-- PENDING INVITATIONS TABLE -->
      <v-tab-item value="pending" eager>
        <InvitationsTable
          :is-tenant-admin="isTenantAdmin"
          :role-color-map="roleColorMap"
          :role-map="roleMap"
          :search="searchInput"
          :tenant="tenant"
          :user="user"
          :refetch-signal="inviteSignal"
          @successful-action="handleAlert('success', $event)"
          @failed-action="handleAlert('error', $event)"
          @update-invitations="handleUpdateInvitations($event)"
        ></InvitationsTable>
      </v-tab-item>
    </v-tabs>

    <!-- INVITE DIALOG -->
    <ConfirmDialog
      v-model="dialogInviteUser"
      title="Invite a new team member"
      confirm-text="Send"
      :error="inviteError"
      :loading="isInvitingUser"
      :disabled="!inviteFormValid || isInvitingUser"
      :dialog-props="{
        'max-width': '600'
      }"
      @cancel="resetInviteUserDialog"
      @confirm="inviteUser"
    >
      <v-form ref="invite-user-form" v-model="inviteFormValid">
        <v-alert
          v-if="
            totalFullUsers >= allowedFullUsers &&
              totalReadOnlyUsers >= allowedReadOnlyUsers
          "
          class="mx-auto my-4 mb-12"
          border="left"
          colored-border
          elevation="2"
          type="warning"
          tile
          icon="warning"
        >
          <p>
            Your team has no users available. You won't be able to invite new
            users until you add more users from the
            <router-link :to="{ name: 'account' }"> Account Page</router-link>
          </p>
        </v-alert>

        <v-alert
          v-else-if="totalFullUsers >= allowedFullUsers"
          class="mx-auto my-4 mb-12"
          border="left"
          colored-border
          elevation="2"
          type="warning"
          tile
          icon="warning"
        >
          <p>
            Your team has no full users available. You'll only be able to add
            Read-Only users until you add more from the
            <router-link :to="{ name: 'account' }"> Account Page</router-link>
          </p>
        </v-alert>

        <!-- <v-alert
          v-else-if="totalReadOnlyUsers >= allowedReadOnlyUsers"
          class="mx-auto my-4 mb-12"
          border="left"
          colored-border
          elevation="2"
          type="warning"
          tile
          icon="warning"
        >
          <p>
            Your team has no Read-Only users available.
            <a
              href="https://www.prefect.io/get-prefect#contact"
              target="_blank"
            >
              Contact us
            </a>
            to increase the number of Read-Only users in your team.
          </p>
        </v-alert> -->

        <v-text-field
          v-model="inviteEmailInput"
          class="mb-3"
          autofocus
          label="Email"
          data-cy="invite-email"
          prepend-icon="alternate_email"
          outlined
          autocomplete="new-password"
          :rules="[rules.required, rules.email]"
          validate-on-blur
        />
        <v-select
          v-model="roleInput"
          outlined
          :menu-props="{ offsetY: true }"
          label="Role"
          data-cy="invite-role"
          prepend-icon="supervised_user_circle"
          :color="roleColorMap[roleInput]"
          :items="roleSelectionMap"
          :rules="[rules.required]"
          item-text="label"
          item-value="role"
          item-disabled="disabled"
        >
        </v-select>
      </v-form>
    </ConfirmDialog>

    <!-- SERVICE ACCOUNT ADD DIALOG -->
    <ConfirmDialog
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
      <v-form ref="service-user-form" v-model="serviceAccountFormValid">
        <v-text-field
          v-model="serviceAccountNameInput"
          class="mb-3"
          autofocus
          label="Account Name"
          data-cy="service-account"
          prepend-icon="engineering"
          outlined
          autocomplete="new-password"
          :rules="[rules.required]"
          validate-on-blur
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
