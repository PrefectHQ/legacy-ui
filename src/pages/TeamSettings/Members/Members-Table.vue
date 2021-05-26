<script>
import ConfirmDialog from '@/components/ConfirmDialog'
import { mapGetters } from 'vuex'

export default {
  components: {
    ConfirmDialog
  },
  props: {
    // Check admin privileges
    isTenantAdmin: {
      type: Boolean,
      required: true
    },
    // Number that updates every time tenantUsers should be refetched
    refetchSignal: {
      type: Number,
      required: true
    },
    // Mapping between role & role color
    roleColorMap: {
      type: Object,
      required: true
    },
    // Mapping between role & displayed role text
    roleMap: {
      type: Object,
      required: true
    },
    // Search input
    search: {
      type: String,
      required: true
    },
    // Tenant information
    tenant: {
      type: Object,
      required: true
    },
    // Current user information
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      // Dialogs
      dialogModifyRole: false,
      dialogRemoveUser: false,

      // Table headers
      allHeaders: [
        {
          mobile: false,
          text: this.$vuetify.breakpoint.mdAndUp ? 'First Name' : 'First',
          value: 'firstName',
          align: 'left',
          width: '15%'
        },
        {
          mobile: false,
          text: this.$vuetify.breakpoint.mdAndUp ? 'Last Name' : 'Last',
          value: 'lastName',
          align: 'left',
          width: '15%'
        },
        {
          mobile: true,
          text: 'Email',
          value: 'email',
          width: '20%'
        },
        {
          mobile: false,
          text: 'Username',
          value: 'username',
          width: '20%'
        },
        {
          mobile: true,
          text: 'Role',
          value: 'role',
          align: 'left',
          width: '20%'
        },
        {
          mobile: true,
          text: '',
          value: 'actions',
          align: 'end',
          sortable: false,
          width: '10%'
        }
      ],

      // Table items (populated by Apollo query)
      membersItems: [],

      // Loading states
      isFetchingMembers: false,
      isRemovingUser: false,
      isSettingRole: false,

      // Inputs
      roleInput: 'USER',

      // Selected user
      // Set when modifying a user's role or removing user membership
      selectedUser: null
    }
  },
  computed: {
    ...mapGetters('license', ['permissions', 'hasPermission']),
    headers() {
      return this.$vuetify.breakpoint.mdAndUp
        ? this.allHeaders
        : this.allHeaders.filter(header => header.mobile)
    },
    deleteSelfWarning() {
      return this.user.email === this.selectedUser.email
    },
    hasRBAC() {
      return this.permissions?.includes('feature:basic-rbac')
    }
  },
  watch: {
    refetchSignal() {
      this.$apollo.queries.tenantUsers.refetch()
    }
  },
  methods: {
    async removeUser(membershipId) {
      this.isRemovingUser = true

      const res = await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/delete-membership.gql'),
        variables: { membershipId }
      })

      if (res?.data?.delete_membership?.success) {
        this.$emit(
          'successful-action',
          'The user has been removed from your team.'
        )
        this.$apollo.queries.tenantUsers.refetch()
      } else {
        this.$emit(
          'failed-action',
          'Something went wrong while trying to remove this member from your team. Please try again.'
        )
      }

      this.isRemovingUser = false
      this.dialogRemoveUser = false
      this.selectedUser = null
    },
    async updateRole(membershipId, role) {
      this.isSettingRole = true

      const res = await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/set-membership-role.gql'),
        variables: { membershipId, role }
      })

      if (res?.data?.set_membership_role?.id) {
        this.$emit('successful-action', "The user's role has been updated")
        this.$apollo.queries.tenantUsers.refetch()
      } else {
        this.$emit(
          'failed-action',
          'Something went wrong while trying to update your role. Please try again.'
        )
      }

      this.isSettingRole = false
      this.dialogModifyRole = false
      this.selectedUser = null
    }
  },
  apollo: {
    tenantUsers: {
      query: require('@/graphql/Tenant/tenant-users.gql'),
      watchLoading(isLoading) {
        this.isFetchingMembers = isLoading
      },
      result({ data }) {
        if (!data) return

        this.membersItems = data.tenantUsers
          .filter(user =>
            user.memberships.find(mem => mem.tenant_id == this.tenant.id)
          )
          .filter(user => user.account_type === 'USER')
          .map(user => {
            let membership = user.memberships.find(
              mem => mem.tenant_id == this.tenant.id
            )
            return {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              userId: user.id,
              role: membership.role_detail.name,
              membershipId: membership.id
            }
          })

        this.$emit('load-end', this.membersItems)
        return data
      },
      error() {
        this.$emit(
          'failed-action',
          'Something went wrong while trying to fetch your team members. Please try again.'
        )
        this.$emit('load-end')
      },
      fetchPolicy: 'no-cache',
      skip() {
        return !this.tenant
      },
      pollInterval: 15000
    }
  }
}
</script>

<template>
  <div>
    <v-data-table
      fixed-header
      :headers="headers"
      :header-props="{ 'sort-icon': 'arrow_drop_up' }"
      :items="membersItems"
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
      :search="search"
      no-results-text="No members found. Try expanding your search?"
      no-data-text="This team does not have any members yet."
    >
      <!-- HEADERS -->
      <template #header.email="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #header.username="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #header.firstName="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #header.lastName="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>
      <template #header.role="{ header }">
        <span class="text-subtitle-2">{{ header.text }}</span>
      </template>

      <!-- ROLE -->
      <template #item.role="{ item }">
        <v-chip small dark :color="roleColorMap[item.role] || 'secondaryLight'">
          {{ roleMap[item.role] || 'Unknown' }}
        </v-chip>
      </template>

      <!-- ACTIONS -->
      <template v-if="isTenantAdmin" #item.actions="{ item }">
        <v-tooltip v-if="hasPermission('feature', 'basic-rbac')" bottom>
          <template #activator="{ on }">
            <v-btn
              text
              fab
              x-small
              color="primary"
              v-on="on"
              @click="
                selectedUser = item
                roleInput = selectedUser.role
                dialogModifyRole = true
              "
            >
              <v-icon>edit</v-icon>
            </v-btn>
          </template>
          Modify this user's role
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              text
              fab
              x-small
              color="error"
              v-on="on"
              @click="
                selectedUser = item
                dialogRemoveUser = true
              "
            >
              <v-icon>delete</v-icon>
            </v-btn>
          </template>
          Remove user
        </v-tooltip>
      </template>
    </v-data-table>

    <!-- MODIFY USER ROLE DIALOG -->
    <ConfirmDialog
      v-if="selectedUser"
      v-model="dialogModifyRole"
      :dialog-props="{ 'max-width': '600' }"
      :title="`Modify ${selectedUser.email}'s role`"
      :disabled="isSettingRole"
      :loading="isSettingRole"
      confirm-text="Save"
      @cancel="roleInput = 'USER'"
      @confirm="updateRole(selectedUser.membershipId, roleInput)"
    >
      <v-select
        v-model="roleInput"
        class="mt-6"
        outlined
        dense
        autofocus
        label="Role"
        :color="roleColorMap[roleInput]"
        prepend-icon="supervised_user_circle"
        :items="['TENANT_ADMIN', 'USER', 'READ_ONLY_USER']"
      >
        <template #item="{ item }">
          {{ roleMap[item] }}
        </template>
        <template #selection="{ item }">
          {{ roleMap[item] }}
        </template>
      </v-select>
    </ConfirmDialog>

    <!-- DELETE USER DIALOG -->
    <ConfirmDialog
      v-if="selectedUser"
      v-model="dialogRemoveUser"
      type="error"
      :title="
        deleteSelfWarning
          ? `Are you sure you want to remove yourself from ${tenant.name}?`
          : `Are you sure you want to remove ${selectedUser.email} from your team?`
      "
      :dialog-props="{ 'max-width': '600' }"
      :disabled="isRemovingUser"
      :loading="isRemovingUser"
      @confirm="removeUser(selectedUser.membershipId)"
    >
      <div v-if="deleteSelfWarning" class="red--text"
        >Are you sure you want to remove yourself from {{ tenant.name }}? You'll
        no longer be able to access your run data associated with
        {{ tenant.name }}.
      </div>
      <div v-else>
        <span class="font-weight-bold">{{ selectedUser.username }}</span>
        will no longer be able to access your team account.</div
      >
    </ConfirmDialog>
  </div>
</template>
