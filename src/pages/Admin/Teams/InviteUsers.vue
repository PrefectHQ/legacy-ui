<script>
import { mapActions, mapGetters } from 'vuex'
import { EMAIL_REGEX } from '@/utils/regEx'

const defaultRoles = {
  USER: 'User',
  READ_ONLY_USER: 'Read only',
  TENANT_ADMIN: 'Administrator',
  ENTERPRISE_LICENSE_ADMIN: 'License Administrator',
  RUNNER: 'Runner'
}

export default {
  data() {
    return {
      invitation: {
        email: null,
        role: null
      },

      invitations: [],
      roles: [],
      users: [],

      // Input rules
      rules: {
        email: value =>
          EMAIL_REGEX.test(value) || 'Please enter a valid email address.',
        required: value => !!value || 'This field is is required.'
      },

      roleColorMap: {
        CUSTOM: 'codePink',
        USER: 'codeBlueBright',
        READ_ONLY_USER: 'cloudUIPrimaryDark',
        TENANT_ADMIN: 'cloudUIPrimaryBlue',
        PENDING: 'accentOrange'
      },
      loadingKey: 0,
      loading: false,
      disabled: false,
      addedUsers: [],
      removedInvitations: []
    }
  },
  computed: {
    ...mapGetters('license', ['hasPermission']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['user']),
    filteredUsers() {
      if (!this.users) return []
      return this.users.filter(
        u =>
          !this.invitations.find(i => i.email == u.email) &&
          this.user.email !== u.email
      )
    }
  },
  methods: {
    ...mapActions('alert', ['addNotification', 'updateNotification']),
    async inviteUser(user) {
      this.loading = true
      let error

      this.addedUsers.push(user.id)

      const notificationId = await this.addNotification({
        color: 'primaryLight',
        loading: true,
        text: `Inviting <span class="font-weight-medium">${user.email}</span>`,
        dismissable: false
      })

      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/create-membership-invitation.gql'),
          variables: {
            input: {
              email: user.email,
              role: user.role
            }
          }
        })

        await this.$apollo.queries['invitationsQuery']?.refetch()
      } catch (e) {
        switch (e?.toString()) {
          case 'This tenant already has the maximum number of users.':
            error = 'Your license already has the maximum number of users.'
            break

          case `Error: GraphQL error: A user with email "${user.email}" already has a membership in tenant ${this.tenant.id}.`:
          case `A user with email "${user.email}" has already been invited.`:
            error = `<span class="font-weight-medium">${user.email}</span> has already been invited.`
            break
          default:
            error = e?.toString()
            break
        }
      } finally {
        this.loading = false
        await this.updateNotification({
          id: notificationId,
          notification: {
            color: error ? 'error' : 'primary',
            text: error
              ? error
              : `<span class="font-weight-medium">${user.email}</span> invited.`,
            loading: false,
            dismissable: true,
            timeout: 5000
          }
        })

        if (!error) this.invitation.email = null
      }
    },
    async uninviteUser(invitation) {
      let error

      this.removedInvitations.push(invitation.id)

      const notificationId = await this.addNotification({
        color: 'primaryLight',
        loading: true,
        text: `Removing invitation for <span class="font-weight-medium">${invitation.email}</span>`,
        dismissable: false
      })

      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/delete-membership-invitation.gql'),
          variables: {
            membershipInvitationId: invitation.id
          }
        })

        await this.$apollo.queries['invitationsQuery']?.refetch()
      } catch (e) {
        error = e?.toString()
      } finally {
        this.loading = false
        await this.updateNotification({
          id: notificationId,
          notification: {
            color: error ? 'error' : 'primary',
            text: error
              ? error
              : `Invitation for <span class="font-weight-medium">${invitation.email}</span> removed.`,
            loading: false,
            dismissable: true,
            timeout: 5000
          }
        })
      }
    }
  },
  apollo: {
    invitationsQuery: {
      query: require('@/graphql/Account/invitations.gql'),
      loadingKey: 'loadingKey',
      update(data) {
        if (!data) return []
        this.invitations = data.membership_invitation.sort(
          (a, b) => new Date(b.created) - new Date(a.created)
        )

        this.addedUsers = []
        this.removedInvitations = []
        return data.membership_invitation
      }
    },
    usersQuery: {
      query: require('@/graphql/Account/license-users.gql'),
      loadingKey: 'loadingKey',
      skip() {
        return (
          !this.hasPermission('license', 'admin') || this.roles.length === 0
        )
      },
      update(data) {
        if (!data) return
        const users = data.license_users.map(u => {
          return {
            ...u,
            role: this.roles.find(r => r.name == 'USER').name
          }
        })
        this.users = users
        this.addedUsers = []
        this.removedInvitations = []
        return users
      },
      fetchPolicy: 'no-cache'
    },
    rolesQuery: {
      query: require('@/graphql/TeamSettings/roles.gql'),
      loadingKey: 'loadingKey',
      update(data) {
        if (!data) return
        const roles = data.auth_role?.map(r => {
          return { ...r, label: defaultRoles[r.name] || r.name }
        })
        this.roles = roles
        this.invitation.role = data.auth_role?.find(r => r.name == 'USER').name
        return roles
      }
    }
  }
}
</script>

<template>
  <div>
    <v-card class="containing-card utilGrayDark--text mx-4" flat outlined>
      <v-card-title class="text-h4 font-weight-light">
        Add users to your team
      </v-card-title>

      <v-card-text class="mt-4">
        <v-row>
          <v-col cols="12" md="6" class="pr-8">
            <div class="d-flex flex-column align-end justify-center">
              <v-text-field
                v-model="invitation.email"
                class="mb-3 align-self-stretch"
                dense
                label="Email"
                data-cy="invite-email"
                prepend-icon="alternate_email"
                outlined
                autocomplete="new-password"
                :rules="[rules.email]"
                validate-on-blur
                full-width
                :disabled="loading"
              />

              <v-autocomplete
                v-model="invitation.role"
                outlined
                dense
                :allow-overflow="false"
                auto-select-first
                label="Role"
                class="align-self-stretch"
                data-cy="invite-role"
                prepend-icon="supervised_user_circle"
                :items="roles"
                :rules="[rules.required]"
                item-text="label"
                item-value="name"
                :disabled="loading"
              >
              </v-autocomplete>

              <v-btn
                class="justify-self-end"
                depressed
                color="primary"
                width="200"
                :disabled="
                  disabled || !invitation.email || !invitation.role || loading
                "
                @click.stop="inviteUser(invitation)"
              >
                Invite
              </v-btn>
            </div>
          </v-col>
          <v-col
            cols="12"
            md="6"
            class="pl-8"
            :style="{
              'border-left': $vuetify.breakpoint.smAndDown
                ? null
                : 'thin solid #eee'
            }"
          >
            <div class="text-h5 font-weight-light">
              Invitations
            </div>

            <div v-if="invitations.length > 0" class="mt-2 invitations-section">
              <transition-group name="user-wrapper" mode="out-in" tag="div">
                <div
                  v-for="inv in invitations"
                  :key="inv.id"
                  class="invitation d-inline-flex align-center justify-space-between"
                  :class="{ disabled: removedInvitations.includes(inv.id) }"
                >
                  <div class="text-truncate text-body-1 font-weight-light">
                    {{ inv.email }}
                  </div>

                  <v-btn
                    class="actions"
                    icon
                    x-small
                    depressed
                    :disabled="loading"
                    @click="uninviteUser(inv)"
                  >
                    <v-icon color="error">delete</v-icon>
                  </v-btn>
                </div>
              </transition-group>
            </div>

            <div v-else class="font-weight-light">None</div>
          </v-col>
        </v-row>

        <v-divider class="my-8" />

        <transition name="fade" mode="out-in">
          <div v-if="filteredUsers.length > 0">
            <div class="text-h5 font-weight-light">
              Suggested
            </div>

            <div v-if="filteredUsers.length > 0" class="mt-4">
              <transition-group name="user-wrapper" mode="out-in">
                <div
                  v-for="u in filteredUsers"
                  :key="u.id"
                  class="utilGrayDark--text user-card d-inline-flex align-center justify-space-between px-3 mr-4 my-2 text-body-1"
                  :class="{
                    disabled: addedUsers.includes(u.id)
                  }"
                >
                  <div class="text-truncate">
                    {{
                      u.first_name || u.last_name
                        ? u.first_name + ' ' + u.last_name
                        : u.username
                    }}
                  </div>

                  <div class="actions d-flex align-center justify-end ml-auto">
                    <v-autocomplete
                      v-model="u.role"
                      outlined
                      dense
                      class="actions-role"
                      hide-details
                      :allow-overflow="false"
                      auto-select-first
                      single-line
                      label="Role"
                      :items="roles"
                      item-text="label"
                      item-value="name"
                      :disabled="addedUsers.includes(u.id)"
                      style="width: 200px;"
                    >
                    </v-autocomplete>
                    <v-btn
                      small
                      depressed
                      color="primary"
                      @click="inviteUser(u)"
                    >
                      Invite
                    </v-btn>
                  </div>
                </div>
              </transition-group>
            </div>
          </div>
        </transition>
      </v-card-text>

      <v-card-actions class="d-flex align-center justify-center mt-8">
        <v-btn
          :to="'/admin/teams'"
          depressed
          color="primary"
          style="width: 300px;"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<style lang="scss" scoped>
.containing-card {
  transition: height 150ms;
}

.user-card {
  background-color: var(--v-appForeground-base);
  border-left: thin solid rgba(0, 0, 0, 0.12);
  height: 48px;
  max-width: 500px;
  transition: all 150ms;
  width: 100%;

  .actions {
    .actions-role {
      transform: scale(0.8);
    }
  }
}

.disabled {
  cursor: progress;
  opacity: 0.4;
  user-select: none;
}

.user-wrapper {
  &-enter,
  &-leave-to,
  &-leave-active {
    opacity: 0;
    transform: translateY(30px);
  }

  &-leave-active {
    position: absolute;
  }
}

.invitations-section {
  max-height: 175px;
  overflow: scroll;

  .invitation {
    border-left: 2px solid var(--v-primary-base);
    max-width: 300px;
    padding: 4px 16px 4px 12px;
    margin-bottom: 6px;
    width: 50%;

    .actions {
      opacity: 0;
      transition: opacity 10ms;
    }

    &:hover {
      .actions {
        opacity: 1;
      }
    }
  }
}
</style>
