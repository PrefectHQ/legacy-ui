<script>
import { mapActions, mapGetters } from 'vuex'

import ConfirmDialog from '@/components/ConfirmDialog'
import InvitationsTable from '@/pages/TeamSettings/Members/Invitations-Table'
import ManagementLayout from '@/layouts/ManagementLayout'
import MembersTable from '@/pages/TeamSettings/Members/Members-Table'
import { EMAIL_REGEX } from '@/utils/regEx'
import { ROLE_MAP, ROLE_COLOR_MAP } from '@/utils/roles.js'

import ExternalLink from '@/components/ExternalLink.vue'

export default {
  components: {
    ConfirmDialog,
    ExternalLink,
    InvitationsTable,
    ManagementLayout,
    MembersTable
  },
  data() {
    return {
      users: 0,
      invitations: 0,
      // Current tab
      tab: 'members',

      // Alert data
      alertShow: false,
      alertMessage: '',
      alertType: null,

      // Dialogs
      dialogInviteUser: false,

      // Inputs
      inviteEmailInput: null,
      roleInput: 'TENANT_ADMIN',
      searchInput: '',

      // Forms
      inviteFormValid: true,

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
      isLoadingMembersTable: true,

      // Signal passed as prop to MembersTable
      // MembersTable watches this data attribute & refetches members every time this value changes.
      membersSignal: 0,

      // Signal passed as prop to InvitationsTable
      // InvitationsTable watches this data attribute & refetches invites every time this value changes.
      inviteSignal: 0,

      // Role maps
      roleMap: ROLE_MAP,
      roleColorMap: ROLE_COLOR_MAP
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['user']),
    ...mapGetters('license', ['license', 'hasPermission', 'allowedUsers']),
    totalAllowedUsers() {
      return this.allowedUsers() ?? Infinity
    },
    insufficientUsers() {
      return this.users >= this.totalAllowedUsers
    },
    permissionsCheck() {
      return (
        this.hasPermission('create', 'membership') &&
        this.hasPermission('update', 'membership') &&
        this.hasPermission('delete', 'membership') &&
        this.hasPermission('feature', 'custom-role')
      )
    },
    roleSelectionMap() {
      return [
        {
          role: 'TENANT_ADMIN',
          label: 'Administrator',
          color: 'cloudUIPrimaryBlue'
        },
        {
          role: 'USER',
          label: 'User',
          color: 'codeBlueBright'
        },
        {
          role: 'READ_ONLY_USER',
          label: 'Read-Only',
          color: 'cloudUIPrimaryDark'
        }
      ]
    },
    totalUsers() {
      return this.users + this.invitations
    },
    filteredRoles() {
      if (!this.roles) return []
      let rolesToRM = ['RUNNER']
      if (!this.hasPermission('license', 'admin')) {
        rolesToRM = ['ENTERPRISE_LICENSE_ADMIN', 'RUNNER']
      }
      return this.roles.filter(role => !rolesToRM.includes(role.name))
    }
  },
  watch: {
    tenant() {
      this.membersSignal++
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
    ...mapActions('alert', ['setAlert']),
    handleAlert(type, message) {
      this.setAlert({
        alertShow: true,
        alertMessage: message,
        alertType: type
      })
    },
    handleUpdateInvitations(event) {
      if (event) {
        this.invitations = event.length
      }
    },
    handleUpdateUsers(event) {
      this.isLoadingMembersTable = false
      if (event) {
        this.users = event.length
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
              role_id: this.roleInput
            }
          },
          errorPolicy: 'all'
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
      } else if (res?.errors) {
        this.handleAlert('error', res?.errors[0]?.message)
        this.dialogInviteUser = false
        this.inviteEmailInput = null
      }
      this.isInvitingUser = false
    },
    resetInviteUserDialog() {
      this.$refs['invite-user-form'].reset()
      this.$nextTick(() => {
        this.inviteEmailInput = null
        this.inviteError = null
        this.roleInput = 'TENANT_ADMIN'
      })
    }
  },
  apollo: {
    roles: {
      query: require('@/graphql/TeamSettings/roles.gql'),
      loadingKey: 'loading',
      variables() {
        return {}
      },
      pollInterval: 10000,
      update: data => data.auth_role || []
    }
  }
}
</script>

<template>
  <ManagementLayout :show="!isLoadingMembersTable" control-show>
    <template #title>Team Members</template>

    <template #subtitle>
      <span v-if="permissionsCheck">
        View your team's members, manage permissions, and send invitations
      </span>
      <span v-else data-cy="non-admin-message">
        View the other members of {{ tenant.name }}
      </span>
    </template>

    <template v-if="hasPermission('create', 'membership-invitation')" #cta>
      <v-btn
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
          <router-link :to="'/team/account'"> Account Page</router-link>
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
          :role-color-map="roleColorMap"
          :role-map="roleMap"
          :roles="filteredRoles"
          :search="searchInput"
          :tenant="tenant"
          :user="user"
          :refetch-signal="membersSignal"
          @load-end="handleUpdateUsers($event)"
          @successful-action="handleAlert('success', $event)"
          @failed-action="handleAlert('error', $event)"
        ></MembersTable>
      </v-tab-item>

      <!-- PENDING INVITATIONS TABLE -->
      <v-tab-item value="pending" eager>
        <InvitationsTable
          :permissions-check="hasPermission('delete', 'membership-invitation')"
          :role-color-map="roleColorMap"
          :role-map="roleMap"
          :search="searchInput"
          :tenant="tenant"
          :user="user"
          :refetch-signal="inviteSignal"
          @successful-action="handleAlert('success', $event)"
          @failed-action="handleAlert('error', $event)"
          @load-end="handleUpdateInvitations($event)"
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
      :disabled="
        totalUsers >= totalAllowedUsers || !inviteFormValid || isInvitingUser
      "
      :dialog-props="{
        'max-width': '600'
      }"
      @cancel="resetInviteUserDialog"
      @confirm="inviteUser"
    >
      <v-form ref="invite-user-form" v-model="inviteFormValid">
        <v-alert
          v-if="totalUsers >= totalAllowedUsers"
          class="mx-auto my-4 mb-12"
          border="left"
          colored-border
          elevation="2"
          type="warning"
          tile
          icon="warning"
        >
          <p>
            Your team has no users available;
            <router-link :to="'/plans'">upgrade your plan</router-link> to get
            more users and access to more features!
          </p>
        </v-alert>

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
          :disabled="!hasPermission('feature', 'custom-role')"
          prepend-icon="supervised_user_circle"
          :color="roleColorMap[roleInput]"
          :items="filteredRoles"
          :rules="[rules.required]"
          item-text="name"
          item-value="id"
          item-disabled="disabled"
        >
          <template #item="{item}">
            {{ roleMap[item.name] ? roleMap[item.name] : item.name }}
          </template>
          <template #selection="{item}">
            {{ roleMap[item.name] ? roleMap[item.name] : item.name }}
          </template>
        </v-select>

        <div
          v-if="!hasPermission('feature', 'custom-role')"
          class="text-caption"
        >
          Looking for role-based access controls? This feature is only available
          on Enterprise plans; check out our
          <ExternalLink href="https://prefect.io/pricing"
            >pricing page</ExternalLink
          >
          for more details.
        </div>
      </v-form>
    </ConfirmDialog>
  </ManagementLayout>
</template>
