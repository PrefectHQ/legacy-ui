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
      user: {
        email: null,
        role: null
      },

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
      disabled: false
    }
  },
  computed: {
    ...mapActions('alert', ['addNotification', 'updateNotification']),
    ...mapGetters('license', ['hasPermission']),
    ...mapGetters('user', ['invitations']),
    filteredUsers() {
      if (!this.users) return []
      return this.users.filter(
        u => !this.invitations.find(i => i.email == u.email)
      )
    }
  },
  methods: {
    testMethod(user) {
      if (!user) user = this.user
      console.log(user)
    },
    async inviteUser(user) {
      if (!user) user = this.user
      this.loading = true
      let error

      const notificationId = await this.addNotification({
        color: 'primaryLight',
        loading: true,
        text: `Inviting ${user.email}`,
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
      } catch (e) {
        switch (e?.toString()) {
          case 'This tenant already has the maximum number of users.':
            error = 'Your license already has the maximum number of users.'
            break

          case `A user with email "${user.email}" has already been invited.`:
            error = 'This user has already been invited.'
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
            text: error ? error : `${user.email} invited.`,
            loading: false,
            dismissable: true,
            timeout: 5000
          }
        })
      }
    }
  },
  apollo: {
    users: {
      query: require('@/graphql/Account/license-users.gql'),
      loadingKey: 'loadingKey',
      skip() {
        return !this.hasPermission('license', 'admin') || !this.roles
      },
      update(data) {
        if (!data) return

        return data.license_users.map(u => {
          return {
            ...u,
            role: this.roles.find(r => r.name == 'USER').id
          }
        })
      },
      fetchPolicy: 'no-cache'
    },
    roles: {
      query: require('@/graphql/TeamSettings/roles.gql'),
      loadingKey: 'loadingKey',
      update(data) {
        if (!data) return
        this.user.role = data.auth_role?.find(r => r.name == 'USER').id
        return data.auth_role?.map(r => {
          return { ...r, label: defaultRoles[r.name] || r.name }
        })
      }
    }
  }
}
</script>

<template>
  <div>
    <v-card class="utilGrayDark--text mx-4" flat outlined>
      <v-card-title class="text-h4 font-weight-light">
        Invite users
      </v-card-title>

      <v-card-text class="mt-4">
        <v-row>
          <v-col cols="12" md="6">
            <div class="d-flex flex-column align-end justify-center">
              <v-text-field
                v-model="user.email"
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
              />

              <v-autocomplete
                v-model="user.role"
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
                item-value="id"
              >
              </v-autocomplete>

              <v-btn
                class="justify-self-end"
                depressed
                color="primary"
                width="200"
                :disabled="disabled || !user.email || !user.role"
                @click.stop="testMethod"
              >
                Invite
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12">
            <div v-for="email in invitations" :key="email">
              {{ email }}
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-8" />

        <div class="text-h5 font-weight-light">
          Suggested
        </div>

        <div class="mt-4">
          <div
            v-for="u in filteredUsers"
            :key="u.id"
            class="utilGrayDark--text user-card d-inline-flex align-center justify-space-between px-3 mr-4 my-2"
            :class="{ disabled: loading || disabled }"
            :disabled="loading || loading"
          >
            {{ u.username }}

            <div class="actions d-flex align-center justify-end">
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
                item-value="id"
              >
              </v-autocomplete>
              <v-btn small depressed color="primary" @click="testMethod(u)">
                Invite
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<style lang="scss" scoped>
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
</style>
