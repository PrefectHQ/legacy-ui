<script>
import { mapGetters } from 'vuex'
import CardTitle from '@/components/Card-Title'
import LogRocket from 'logrocket'

export default {
  components: { CardTitle },
  props: {
    flow: {
      required: true,
      type: Object
    },
    flowGroup: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      error: {
        heartbeat: null,
        lazarus: null,
        project: null,
        versionLocking: null
      },
      loading: {
        heartbeat: false,
        lazarus: false,
        project: false,
        versionLocking: false
      },
      selected: {
        projectId: this.flow.project.id,
        versionLockingEnabled: this.flowGroup.settings.version_locking_enabled,
        heartbeatEnabled: this.flowGroup.settings.heartbeat_enabled,
        lazarusEnabled: this.flowGroup.settings.lazarus_enabled
      }
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('license', ['permissions', 'hasPermission']),
    sortedProjects() {
      if (!this.projects) return []
      return [...this.projects].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { ignorePunctuation: true })
      )
    },
    isVersionLocked() {
      return this.flowGroup.settings.version_locking_enabled
    },
    isHeartbeatEnabled() {
      return this.flowGroup.settings.heartbeat_enabled
    },
    isLazarusEnabled() {
      return this.flowGroup.settings.lazarus_enabled
    },
    permissionsCheck() {
      return !this.hasPermission('update', 'flow')
    },
    projectHasChanged() {
      return this.selected.projectId !== this.flow.project.id
    },
    versionLockingPermitted() {
      return this.permissions?.includes('feature:version-locking')
    }
  },
  methods: {
    async _handleHeartbeatChange() {
      this.loading.heartbeat = true

      try {
        const updateHeartbeat = !this.selected.heartbeatEnabled
          ? await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/disable-flow-heartbeat.gql'),
              variables: {
                input: {
                  flow_id: this.flow.id
                }
              },
              errorPolicy: 'all'
            })
          : await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/enable-flow-heartbeat.gql'),
              variables: {
                input: {
                  flow_id: this.flow.id
                }
              },
              errorPolicy: 'all'
            })

        setTimeout(() => {
          let status = updateHeartbeat.data
            ? updateHeartbeat.data.enable_flow_heartbeat ||
              updateHeartbeat.data.disable_flow_heartbeat
            : false

          if (!status || !status.success) {
            this.error.heartbeat = status.errors[0].message
            this.loading.heartbeat = false
          } else {
            let heartbeatCheckInterval
            heartbeatCheckInterval = setInterval(() => {
              if (this.isHeartbeatEnabled == this.selected.heartbeatEnabled) {
                clearInterval(heartbeatCheckInterval)
                this.loading.heartbeat = false
              }
            }, 500)
          }
        }, 500)
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Flow Settings',
            stage: 'Heartbeat Update'
          }
        })
        this.loading.heartbeat = false
        this.error.heartbeat = e
      }
    },
    async _handleLazarusChange() {
      this.loading.lazarus = true

      try {
        const updateLazarus = !this.selected.lazarusEnabled
          ? await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/disable-flow-lazarus-process.gql'),
              variables: {
                input: {
                  flow_id: this.flow.id
                }
              },
              errorPolicy: 'all'
            })
          : await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/enable-flow-lazarus-process.gql'),
              variables: {
                input: {
                  flow_id: this.flow.id
                }
              },
              errorPolicy: 'all'
            })
        setTimeout(() => {
          let status = updateLazarus.data
            ? updateLazarus.data.enable_flow_lazarus_process ||
              updateLazarus.data.disable_flow_lazarus_process
            : false

          if (!status || !status.success) {
            this.error.lazarus = status.errors[0].message
            this.loading.lazarus = false
          } else {
            let lazarusCheckInterval
            lazarusCheckInterval = setInterval(() => {
              if (this.isLazarusEnabled == this.selected.lazarusEnabled) {
                clearInterval(lazarusCheckInterval)
                this.loading.lazarus = false
              }
            }, 500)
          }
        }, 500)
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Flow Settings',
            stage: 'Lazarus Update'
          }
        })
        this.loading.lazarus = false
        this.error.lazarus = e
      }
    },
    async _handleProjectChange() {
      this.loading.project = true

      try {
        const changeProject = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/update-flow-project.gql'),
          variables: {
            input: {
              project_id: this.selected.projectId,
              flow_id: this.flow.id
            }
          },
          errorPolicy: 'all'
        })

        setTimeout(() => {
          if (!changeProject.data || !changeProject.data.update_flow_project) {
            this.error.project = changeProject.errors[0].message
            this.loading.project = false
          } else {
            let projectCheckInterval
            projectCheckInterval = setInterval(() => {
              if (this.flow.project.id == this.selected.projectId) {
                clearInterval(projectCheckInterval)
                this.loading.project = false
              }
            }, 500)
          }
        }, 500)
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Flow Settings',
            stage: 'Project Change'
          }
        })
        this.loading.project = false
        this.error.project = e
      }
    },
    async _handleVersionLockingChange() {
      this.loading.versionLocking = true

      try {
        const updateVersionLocking = !this.selected.versionLockingEnabled
          ? await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/disable-flow-version-lock.gql'),
              variables: {
                input: {
                  flow_id: this.flow.id
                }
              },
              errorPolicy: 'all'
            })
          : await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/enable-flow-version-lock.gql'),
              variables: {
                input: {
                  flow_id: this.flow.id
                }
              },
              errorPolicy: 'all'
            })
        setTimeout(() => {
          let status = updateVersionLocking.data
            ? updateVersionLocking.data.enable_flow_version_lock ||
              updateVersionLocking.data.disable_flow_version_lock
            : false

          if (!status || !status.success) {
            this.error.versionLocking = status.errors[0].message
            this.loading.versionLocking = false
          } else {
            let versionLockingCheckInterval
            versionLockingCheckInterval = setInterval(() => {
              if (this.isVersionLocked == this.selected.versionLockingEnabled) {
                clearInterval(versionLockingCheckInterval)
                this.loading.versionLocking = false
              }
            }, 500)
          }
        }, 500)
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Flow Settings',
            stage: 'Heartbeat Update'
          }
        })

        this.loading.versionLocking = false
        this.error.versionLocking = e
      }
    },
    onIntersect([entry]) {
      this.$apollo.queries.projects.skip = !entry.isIntersecting
    }
  },
  apollo: {
    projects: {
      query: require('@/graphql/Flow/project-names.gql'),
      pollInterval: 10000,
      update: data => data.project
    }
  }
}
</script>

<template>
  <v-card
    v-intersect="{ handler: onIntersect }"
    class="pa-2 pb-6 mt-2"
    outlined
  >
    <CardTitle title="Flow Settings" icon="settings" />

    <v-card-text class="pl-12" style="max-width: 1000px;">
      <v-row>
        <v-col cols="12" class="pb-0">
          <div class="text-h6 primary--text">
            <!-- We don't really have the visual language necessary to use these I think -->
            <!-- <v-icon class="mr-3">pi-project</v-icon> -->
            Project
          </div>
        </v-col>
        <v-col cols="12" class="pt-0">
          <v-row no-gutters>
            <v-col cols="12" md="6" sm="8">
              <v-tooltip bottom>
                <template #activator="{ on }">
                  <div v-on="on">
                    <v-select
                      data-public
                      v-model="selected.projectId"
                      :items="sortedProjects"
                      item-value="id"
                      item-text="name"
                      label="Select project"
                      hide-details
                      single-line
                      :menu-props="{ contentClass: 'custom-list-item' }"
                      prepend-inner-icon="pi-project mr-1"
                      :disabled="permissionsCheck || loading.project"
                    />
                  </div>
                </template>
                <span v-if="permissionsCheck">
                  You don't have permission to move flows between projects.
                </span>
                <span v-else>
                  Move this flow to a new project.
                </span>
              </v-tooltip>
            </v-col>
            <v-col cols="12" md="4" align-self="center">
              <v-tooltip bottom>
                <template #activator="{ on }">
                  <div style="display: inline-block;" v-on="on">
                    <v-btn
                      :disabled="
                        permissionsCheck ||
                          !projectHasChanged ||
                          loading.project
                      "
                      :loading="loading.project"
                      small
                      color="primary"
                      :class="$vuetify.breakpoint.mdAndUp ? 'ml-4' : 'mt-4'"
                      @click="_handleProjectChange"
                    >
                      Save
                    </v-btn>
                  </div>
                </template>
                <span v-if="permissionsCheck">
                  You don't have permission to move flows between projects.
                </span>
                <span v-else>
                  Move this flow to a new project.
                </span>
              </v-tooltip>
            </v-col>
          </v-row>

          <div class="mt-4">
            Projects are a method of organizing your Flows. Read more about
            projects
            <a
              href="https://docs.prefect.io/cloud/concepts/projects.html#creating-a-project"
              target="_blank"
            >
              here
            </a>
            <sup>
              <v-icon x-small color="primary">
                open_in_new
              </v-icon>
            </sup>
            .
          </div>
        </v-col>
      </v-row>
      <v-row v-if="isCloud" class="mt-8">
        <v-col cols="12" class="pb-0">
          <div class="text-h6 primary--text">
            <!-- We don't really have the visual language necessary to use these I think -->
            <!-- <v-icon class="mr-3">lock</v-icon> -->
            Version Locking
          </div>
        </v-col>
        <v-col cols="12" class="pt-0">
          <v-tooltip bottom>
            <template #activator="{ on }">
              <div class="pb-1" style="display: inline-block;" v-on="on">
                <v-switch
                  v-model="selected.versionLockingEnabled"
                  hide-details
                  color="primary"
                  :loading="loading.versionLocking"
                  :disabled="
                    permissionsCheck ||
                      !hasPermission('feature', 'version-locking') ||
                      loading.versionLocking
                  "
                  @change="_handleVersionLockingChange"
                >
                  <template #label>
                    <label>
                      Version Locking
                      <span
                        :class="
                          isVersionLocked
                            ? 'prefect--text'
                            : 'grey--text text--darken-2'
                        "
                        class="font-weight-medium"
                      >
                        {{ isVersionLocked ? 'Enabled' : 'Disabled' }}
                      </span>
                    </label>
                  </template>
                </v-switch>
              </div>
            </template>
            <span v-if="permissionsCheck">
              You don't have permission to modify flow settings.
            </span>
            <span v-if="!hasPermission('feature', 'version-locking')">
              Your team doesn't have access to version locking.
            </span>
            <span v-else>
              {{ isVersionLocked ? 'Disable' : 'Enable' }} version locking for
              this flow and its tasks.
            </span>
          </v-tooltip>

          <div class="mt-4">
            Version locking ensures that this flow and its tasks run
            <i>just once</i>. Read more about it
            <a
              href="https://docs.prefect.io/cloud/concepts/flows.html#flow-settings"
              target="_blank"
            >
              here
            </a>
            <sup>
              <v-icon x-small color="primary">
                open_in_new
              </v-icon> </sup
            >.
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-8">
        <v-col cols="12" class="pb-0">
          <div class="text-h6 primary--text">
            <!-- We don't really have the visual language necessary to use these I think -->
            <!-- <v-icon class="mr-3">favorite</v-icon> -->
            Heartbeat
          </div>
        </v-col>
        <v-col cols="12" class="pt-0">
          <v-tooltip bottom>
            <template #activator="{ on }">
              <div class="pb-1" style="display: inline-block;" v-on="on">
                <v-switch
                  v-model="selected.heartbeatEnabled"
                  hide-details
                  color="primary"
                  :loading="loading.heartbeat"
                  :disabled="permissionsCheck || loading.heartbeat"
                  @change="_handleHeartbeatChange"
                >
                  <template #label>
                    <label>
                      Heartbeat
                      <span
                        :class="
                          isHeartbeatEnabled
                            ? 'prefect--text'
                            : 'grey--text text--darken-2'
                        "
                        class="font-weight-medium"
                      >
                        {{ isHeartbeatEnabled ? 'Enabled' : 'Disabled' }}
                      </span>
                    </label>
                  </template>
                </v-switch>
              </div>
            </template>
            <span v-if="permissionsCheck">
              You don't have permission to modify flow settings.
            </span>
            <span v-else>
              {{ isHeartbeatEnabled ? 'Disable' : 'Enable' }} heartbeats for
              this flow.
            </span>
          </v-tooltip>

          <div class="mt-4">
            Heartbeats are sent by Prefect Core every 30 seconds and are used to
            confirm the flow run and its associated task runs are healthy; runs
            missing four heartbeats in a row are marked as
            <v-chip class="mx-1" label small color="Failed" dark>
              Failed
            </v-chip>
            by the
            <a
              href="https://docs.prefect.io/cloud/concepts/services.html#zombie-killer"
              target="_blank"
            >
              Zombie Killer
            </a>
            <sup>
              <v-icon x-small color="primary">
                open_in_new
              </v-icon> </sup
            >. You can read more about heartbeats
            <a
              href="https://docs.prefect.io/cloud/concepts/flows.html#flow-settings"
              target="_blank"
              >here
            </a>
            <sup>
              <v-icon x-small color="primary">
                open_in_new
              </v-icon> </sup
            >.
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-8">
        <v-col cols="12" class="pb-0">
          <div class="text-h6 primary--text">
            <!-- We don't really have the visual language necessary to use these I think -->
            <!-- <v-icon class="mr-3">fas fa-book-dead</v-icon> -->
            Lazarus Process
          </div>
        </v-col>
        <v-col cols="12" class="pt-0">
          <v-tooltip bottom>
            <template #activator="{ on }">
              <div class="pb-1" style="display: inline-block;" v-on="on">
                <v-switch
                  v-model="selected.lazarusEnabled"
                  hide-details
                  color="primary"
                  :loading="loading.lazarus"
                  :disabled="permissionsCheck || loading.lazarus"
                  @change="_handleLazarusChange"
                >
                  <template #label>
                    <label>
                      Lazarus
                      <span
                        :class="
                          isLazarusEnabled
                            ? 'prefect--text'
                            : 'grey--text text--darken-2'
                        "
                        class="font-weight-medium"
                      >
                        {{ isLazarusEnabled ? 'Enabled' : 'Disabled' }}
                      </span>
                    </label>
                  </template>
                </v-switch>
              </div>
            </template>
            <span v-if="permissionsCheck">
              You don't have permission to modify flow settings.
            </span>
            <span v-else>
              {{ isLazarusEnabled ? 'Disable' : 'Enable' }} Lazarus for this
              flow.
            </span>
          </v-tooltip>

          <div class="mt-4">
            The Lazarus process is responsible for rescheduling distressed flow
            runs. Read more about Lazarus
            <a
              href="https://docs.prefect.io/cloud/concepts/services.html#lazarus"
              target="_blank"
              >here
            </a>
            <sup>
              <v-icon x-small color="primary">
                open_in_new
              </v-icon> </sup
            >.
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
