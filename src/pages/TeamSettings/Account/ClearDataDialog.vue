<script>
import { mapGetters } from 'vuex'
import gql from 'graphql-tag'

const loadingMessages = [
  'Extracting flow data',
  'Halting schematic processes',
  'Untangling task dependencies',
  'Severing terminal nodes',
  'Flushing connections',
  'Cleaning up'
]

export default {
  data() {
    return {
      confirmInput: null,
      dataLoading: false,
      error: null,
      formValid: false,
      loading: false,
      loadingMessage: loadingMessages[0],
      loadingMessageInterval: null,
      success: false,
      timeout: null,
      show: false,

      // Data to clear - populated on show
      flows: [],
      memberships: [],
      membershipInvitations: [],
      projects: [],
      secrets: [],
      tokens: [],
      dataMapping: {
        projects: {
          label: 'Project',
          count: null,
          icon: 'pi-project'
        },
        flows: {
          label: 'Flow',
          count: null,
          icon: 'pi-flow'
        },
        memberships: {
          label: 'User',
          count: null,
          icon: 'people'
        }
      },

      // Form rules
      rules: {
        confirm: value => value == this.tenant.slug || 'Input is incorrect.',
        required: value => !!value || 'This field is is required.'
      }
    }
  },
  computed: {
    ...mapGetters('license', ['hasPermission']),
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('user', ['user']),
    activeClearScreen() {
      if (this.success) return 'success'
      if (this.loading) return 'loading'
      if (this.error) return 'error'
      return 'form'
    },
    isTenantAdmin() {
      return (
        this.hasPermission('delete', 'project') &&
        this.hasPermission('delete', 'membership') &&
        this.hasPermission('delete', 'api-key') &&
        this.hasPermission('delete', 'secret')
      )
    },
    confirmDisabled() {
      return (
        !this.formValid ||
        this.dataLoading ||
        this.confirmInput !== this.tenant.slug
      )
    },
    noDataToClear() {
      return (
        this.memberships &&
        this.membershipInvitations &&
        this.projects &&
        this.flows &&
        this.secrets &&
        this.tokens &&
        this.memberships?.length == 0 &&
        this.membershipInvitations?.length == 0 &&
        this.projects?.length == 0 &&
        this.flows?.length == 0 &&
        this.secrets?.length == 0 &&
        this.tokens?.length == 0
      )
    }
  },
  watch: {
    tenant() {
      this.$apollo.queries.data.refetch()
    },
    async show(val) {
      clearTimeout(this.timeout)
      this.confirmInput = null
      if (!val) return

      this.dataLoading = true

      const { data } = await this.$apollo.query({
        query: require('@/graphql/TeamSettings/data-to-clear.gql'),
        fetchPolicy: 'no-cache'
      })
      this.timeout = setTimeout(() => {
        if (
          data?.memberships &&
          data?.membershipInvitations &&
          data?.project &&
          data?.flow &&
          data?.secret_names &&
          data?.api_token
        ) {
          this.memberships = data.memberships.filter(m => m.id !== this.user.id)
          this.membershipInvitations = data.membershipInvitations
          this.projects = data.project
          this.flows = data.flow
          this.secrets = data.secret_names
          this.tokens = data.api_token
          this.dataMapping.memberships.count = this.memberships.length
          this.dataMapping.projects.count = this.projects.length
          this.dataMapping.flows.count = this.flows.length
        }

        this.dataLoading = false
      }, 1500)
    }
  },
  methods: {
    _close() {
      this.show = false
      this.$apollo.queries.data.refetch()
      setTimeout(() => {
        this.teamName = false
        this.loading = false
        this.error = false
        this.success = false
        this.confirmInput = null
        this.flows = []
        this.memberships = []
        this.membershipInvitations = []
        this.projects = []
      }, 500)

      clearTimeout(this.timeout)
    },
    clearMutation() {
      let mutation = ''

      this.memberships.map((membership, i) => {
        mutation += `
          delete_membership_${i}: delete_membership(input: { membership_id: "${membership.memberships[0]?.id}" }) {
            success
          }
        `
      })

      this.membershipInvitations.map((invitation, i) => {
        mutation += `
          delete_membership_invitation_${i}: delete_membership_invitation(input: { invitation_id: "${invitation.id}" }) {
            success
          }
        `
      })

      this.projects.map((project, i) => {
        mutation += `
          delete_project_${i}: delete_project(input: { project_id: "${project.id}" }) {
            success
          }
        `
      })

      this.tokens.map((token, i) => {
        mutation += `
          delete_api_token_${i}: delete_api_token(input: { token_id: "${token.id}" }) {
            success
          }
        `
      })

      this.secrets.map((secret, i) => {
        mutation += `
          delete_secret_${i}: delete_secret(input: { name: "${secret}" }) {
            success
          }
        `
      })

      return gql`
        mutation ClearData {
          ${mutation}
        }
      `
    },

    async clearData() {
      clearTimeout(this.timeout)
      this.loading = true

      if (!this.noDataToClear) {
        this.updateLoadingMessage(0, 2500)

        const { data } = await this.$apollo.mutate({
          mutation: this.clearMutation()
        })

        if (
          data?.delete_membership_0?.success ||
          data?.delete_membership_invitation_0?.success ||
          data?.delete_project_0?.success ||
          data?.delete_api_token_0?.success ||
          data?.delete_secret_0?.success
        ) {
          this.timeout = setTimeout(() => {
            this.loading = false
            this.success = true
            this.loadingMessage = loadingMessages[0]
            this.$emit('cleared')
            clearTimeout(this.timeout)
          }, 10000)
        } else {
          this.timeout = setTimeout(() => {
            this.loading = false
            this.error = true
            this.loadingMessage = loadingMessages[0]
            clearTimeout(this.timeout)
          }, 2000)
        }
      }
    },
    updateLoadingMessage(i, max) {
      if (i && i >= loadingMessages.length) return
      this.loadingMessageInterval = setTimeout(() => {
        this.loadingMessage = loadingMessages[i]
        this.updateLoadingMessage(i + 1, max)
      }, Math.floor(Math.random() * max) + 1000)
    }
  },
  apollo: {
    data: {
      query: require('@/graphql/TeamSettings/data-to-clear.gql'),
      result({ data }) {
        if (!data) return
      },
      update(data) {
        this.memberships = data?.memberships?.filter(m => m.id !== this.user.id)
        this.membershipInvitations = data?.membershipInvitations
        this.projects = data?.project
        this.flows = data?.flow
        this.secrets = data?.secret_names
        this.tokens = data?.api_token
        this.dataMapping.memberships.count =
          this.memberships?.filter(m => m.account_type !== 'SERVICE').length + 1
        this.dataMapping.projects.count = this.projects?.length
        this.dataMapping.flows.count = this.flows?.length
      },
      fetchPolicy: 'no-cache'
    }
  }
}
</script>

<template>
  <v-card data-cy="data-card" tile class="h-100 d-flex flex-column">
    <v-card-title class="mb-2 text-h4 font-weight-light">
      Your data
    </v-card-title>

    <v-card-subtitle>
      See and clear the data in your account such as projects, flows, members
      and secrets
    </v-card-subtitle>
    <v-card-text>
      <v-alert
        v-if="!isTenantAdmin"
        class="mx-auto mb-12"
        border="left"
        colored-border
        elevation="2"
        type="warning"
        tile
        icon="lock"
        max-width="540"
      >
        Only your team's administrators can modify these settings.
      </v-alert>
      <transition name="fade-expand" mode="out-in">
        <div v-show="activeClearScreen == 'form'" class=" pa-6">
          <v-row>
            <v-col
              v-for="data in dataMapping"
              :key="data.title"
              class="d-flex flex-column justify-center align-center"
              cols="4"
            >
              <div>
                <v-icon>{{ data.icon }}</v-icon>
              </div>
              <div class="my-1 text-center" style="width: 100%;">
                <v-skeleton-loader
                  v-if="dataLoading || data.count === null"
                  type="heading"
                  tile
                  class="mx-auto text-center mt-1"
                ></v-skeleton-loader>
                <span v-else class="font-weight-bold text-h5">
                  {{ data.count.toLocaleString() }}
                </span>
              </div>

              <div>
                {{
                  data.label +
                    ((data.count && data.count > 1) || data.count == 0
                      ? 's'
                      : '')
                }}
              </div>
            </v-col>
          </v-row>
        </div>
      </transition>
      <transition name="fade-expand" mode="out-in">
        <v-alert
          v-if="show"
          v-show="activeClearScreen == 'form'"
          class="mx-auto"
          border="left"
          colored-border
          :color="dataLoading ? 'primary' : null"
          :type="!dataLoading && !noDataToClear ? 'warning' : 'success'"
          elevation="0"
          tile
          max-width="400"
          transition="fade"
        >
          <template v-if="dataLoading" #prepend>
            <v-progress-circular
              :size="28"
              :width="4"
              color="primary"
              class="mr-4"
              indeterminate
            ></v-progress-circular>
          </template>

          <v-fade-transition mode="out-in">
            <div v-if="dataLoading" class="text-h5">
              Analyzing...
            </div>

            <div v-else-if="!dataLoading && !noDataToClear">
              <div class="text-h5">
                <span class="font-weight-bold">WARNING:</span> This can't be
                undone.
              </div>
              <div>
                This will remove all of your team's projects, members, flows,
                tasks, schematics, secrets, API tokens, runs, and logs.
              </div>
            </div>

            <div v-else>
              <div class="text-h5">
                You have no data to remove!
              </div>
            </div>
          </v-fade-transition>
        </v-alert>
      </transition>

      <transition name="fade-expand" mode="out-in">
        <div
          v-show="activeClearScreen == 'form' && !noDataToClear"
          v-if="show"
          class="mt-10 px-12"
        >
          <div>
            To confirm, type
            <span class="font-weight-bold"> your tenant URL slug </span>
            below:
          </div>
          <v-form v-model="formValid">
            <v-text-field
              v-if="isTenantAdmin"
              v-model="confirmInput"
              autocomplete="off"
              class="my-1"
              placeholder="Type your tenant URL slug"
              single-line
              outlined
              :rules="[rules.required, rules.confirm]"
              color="primary"
              :loading="loading"
            >
            </v-text-field>
          </v-form>
        </div>
      </transition>

      <transition name="fade-expand" mode="out-in">
        <div
          v-show="activeClearScreen == 'form'"
          v-if="show"
          class="text-right px-6"
        >
          <v-spacer></v-spacer>

          <v-btn text @click="_close">
            Close
          </v-btn>
          <v-btn
            v-if="!noDataToClear"
            color="red"
            class="white--text"
            depressed
            :disabled="confirmDisabled"
            :loading="loading"
            @click="clearData"
          >
            Clear all data?
          </v-btn>
        </div>
      </transition>

      <transition name="fade-expand" mode="out-in">
        <v-alert
          v-if="show"
          v-show="activeClearScreen == 'error'"
          class="mx-auto mb-0 py-10"
          border="left"
          colored-border
          elevation="0"
          type="error"
          tile
          transition="fade"
        >
          <div class="text-h6">
            <span class="font-weight-bold">Error:</span> We're sorry, something
            went wrong.
          </div>
          <div>
            If the issue persists, please contact us via email at
            <span class="primary--text">support@prefect.io</span> or on our
            <router-link :to="'/help'">Support page</router-link>
          </div>

          <template #close>
            <div class="text-right">
              <v-btn v-if="show" depressed color="primary" @click="_close">
                Close
              </v-btn>
            </div>
          </template>
        </v-alert>
      </transition>

      <transition name="fade-expand" mode="out-in">
        <div
          v-if="show"
          v-show="
            activeClearScreen == 'success' || activeClearScreen == 'loading'
          "
          class="pa-6 text-center"
        >
          <div class="text-h5 word-break-normal mb-3 black--text">
            {{
              loading ? loadingMessage + '...' : 'All data has been removed.'
            }}
          </div>

          <div class="loading-container ma-auto my-10">
            <div :class="loading ? '' : 'solid'" class="circle"></div>
            <div v-if="!loading" class="check"></div>
          </div>

          <div v-if="!loading" class="text-right">
            <v-btn depressed color="primary" @click="_close">
              Close
            </v-btn>
          </div>
        </div>
      </transition>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        v-if="!show && isTenantAdmin"
        color="primary"
        :disabled="noDataToClear"
        depressed
        small
        @click="show = true"
        >Clear Data
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss">
.text-center {
  // stylelint-disable
  .v-skeleton-loader__heading {
    margin: auto !important;
  }
  // stylelint-enable
}
</style>

<style lang="scss" scoped>
$container-size: 10em;
$circle-stroke: 10px;
$check-stroke: 10px;
$circle-size: $container-size;
$check-height: $circle-size/2;
$check-width: $check-height/2.5;
$check-left: ($container-size/6 + $container-size/8);
$color: var(--v-prefect-base);
$color-success: var(--v-prefect-base);

.h-100 {
  height: 100%;
}

.loading-container {
  height: $container-size;
  position: relative;
  vertical-align: top;
  width: $container-size;

  .circle {
    animation: circle-indeterminate 1.2s infinite linear;
    border: $circle-stroke solid var(--v-secondaryGrayLight-base);
    border-left-color: $color;
    border-radius: 50%;
    height: $circle-size;
    width: $circle-size;

    &.solid {
      border-color: $color-success;
    }
  }

  .check {
    &::after {
      animation: draw-check 0.75s ease;
      border-color: $color-success;
      border-style: solid;
      border-width: $check-stroke $check-stroke 0 0;
      content: '';
      height: $check-height;
      left: $check-left;
      opacity: 1;
      position: absolute;
      top: $check-height/0.85;
      transform: scaleX(-1) rotate(135deg);
      transform-origin: left top;
      width: $check-width;
    }
  }

  @keyframes circle-indeterminate {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes draw-check {
    0% {
      height: 0;
      width: 0;
    }

    20% {
      height: 0;
      width: $check-width;
    }

    40% {
      height: $check-height;
      width: $check-width;
    }

    100% {
      height: $check-height;
      width: $check-width;
    }
  }
}
</style>
