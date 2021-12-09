<script>
import CardTitle from '@/components/Card-Title'
import CloudHookForm from '@/components/CloudHookForm'
import { cloudHookMixin } from '@/mixins/cloudHookMixin'
import { mapGetters } from 'vuex'

export default {
  components: { CardTitle, CloudHookForm },
  mixins: [cloudHookMixin],
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
      createNewCloudHook: false,
      error: {
        createCloudHook: null
      },
      loading: {
        createCloudHook: false
      }
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('license', ['permissions']),
    ...mapGetters('license', ['hasPermission']),
    containerClass() {
      return !this.cloudHooks ? ['py-12', 'text-center'] : []
    }
  },
  methods: {
    stateGroup(states) {
      if (this.stateGroupAll(states)) return 'All'
      if (this.stateGroupFailed(states)) return 'Failed'
      if (this.stateGroupFinished(states)) return 'Finished'
      if (this.stateGroupSuccess(states)) return 'Success'
      return 'Custom'
    },
    onIntersect([entry]) {
      this.$apollo.queries.cloudHooks.skip = !entry.isIntersecting
    }
  },
  apollo: {
    cloudHooks: {
      query: require('@/graphql/Flow/cloud-hooks.gql'),
      variables() {
        return {
          id: this.flow.version_group_id
        }
      },
      pollInterval: 10000,
      update: data => {
        if (!data?.cloud_hook?.length) return
        return data.cloud_hook.sort((a, b) => {
          return a.name > b.name ? 1 : a.name < b.name ? -1 : 0
        })
      }
    }
  }
}
</script>

<template>
  <v-card v-intersect="{ handler: onIntersect }" class="pa-2 mt-2" outlined>
    <CardTitle title="Cloud Hooks" icon="cloud" />

    <v-card-text class="pl-12">
      <div class="text-body-1" style="max-width: 1000px;">
        Cloud Hooks allow you to send notifications to Slack, email, or any
        other endpoint when your flow enters a given state. For example, send a
        Slack message to your team when a production-critical flow has failed,
        along with the reason for the failure, so you can respond immediately.
        Note that some Cloud Hooks such as email are only available with Prefect
        Cloud.
      </div>

      <v-row>
        <v-col cols="12" class="pt-0">
          <v-row>
            <v-col cols="12">
              <v-dialog v-model="createNewCloudHook" max-width="700">
                <template #activator="{ onD }">
                  <v-tooltip top>
                    <template #activator="{ on }">
                      <div
                        class="pb-1 text-center"
                        :class="containerClass"
                        :style="{
                          display: !cloudHooks ? 'block' : 'inline-block'
                        }"
                        v-on="on"
                      >
                        <v-btn
                          color="primary"
                          :small="!!cloudHooks"
                          :large="!cloudHooks"
                          :disabled="!hasPermission('create', 'cloud-hook')"
                          @click="createNewCloudHook = true"
                          v-on="onD"
                        >
                          <v-icon left>cloud</v-icon> New Cloud Hook
                        </v-btn>
                        <div v-if="!cloudHooks" class="mt-8 text-body-1">
                          <span class="font-weight-bold">{{ flow.name }}</span>
                          has no Cloud Hooks! Create one using the button above.
                        </div>
                      </div>
                    </template>
                    <span v-if="!hasPermission('create', 'cloud-hook')">
                      You don't have permission to create new Cloud Hooks.
                    </span>
                    <span v-else>
                      Create a new Cloud Hook for this Flow
                    </span>
                  </v-tooltip>
                </template>

                <v-card tile class="pa-2">
                  <CardTitle title="New Cloud Hook" icon="cloud" />

                  <v-card-text class="pl-12">
                    <CloudHookForm
                      v-if="createNewCloudHook"
                      :editable="
                        hasPermission('create', 'cloud-hook') &&
                          hasPermission('delete', 'cloud-hook')
                      "
                      edit-on-render
                      :version-group-id-prop="flow.version_group_id"
                      @close="createNewCloudHook = false"
                      @update="$apollo.queries.cloudHooks.refetch()"
                    />
                  </v-card-text>
                </v-card>
              </v-dialog>

              <!-- Do we have any docs on this? -->
              <!--             
            Read more about it
            <a
              href=""
              target="_blank"
            >
              here </a
            >. -->
            </v-col>
          </v-row>

          <div class="mt-4">
            <v-row no-gutters>
              <v-col cols="12">
                <v-expansion-panels focusable tile hover flat>
                  <v-expansion-panel
                    v-for="item in cloudHooks"
                    :key="item.id"
                    :style="{
                      'border-left': `2px solid var(--v-${stateGroupColor(
                        stateGroup(item.states)
                      )}-base) !important`
                    }"
                  >
                    <v-lazy
                      :options="{
                        threshold: 0.75
                      }"
                      min-height="40px"
                      transition="fade"
                    >
                      <div>
                        <v-expansion-panel-header>
                          <v-progress-linear
                            :active="item.loading"
                            :indeterminate="item.loading"
                            :color="stateGroupColor(stateGroup(item.states))"
                            background-opacity="0"
                            absolute
                            bottom
                          />

                          <v-list-item class="pl-0">
                            <v-list-item-content>
                              <v-list-item-title>
                                <v-row no-gutters>
                                  <v-col
                                    cols="2"
                                    class="d-flex align-center justify-center"
                                  >
                                    <v-icon left class="mr-6">
                                      {{ typeIcon(item.type) }}
                                    </v-icon>
                                  </v-col>
                                  <v-col
                                    class="d-flex align-center justify-space-between"
                                  >
                                    <div class="justify-self-start">
                                      <div
                                        class="text-subtitle-1 font-weight-medium"
                                      >
                                        {{ item.name }}
                                      </div>
                                      <div class="text-body-2">
                                        {{ typeTitle(item.type) }}
                                      </div>
                                    </div>
                                    <div class="justify-self-end">
                                      <v-tooltip bottom>
                                        <template #activator="{ on }">
                                          <div v-on="on" @click.stop>
                                            <div class="vertical-button">
                                              <v-switch
                                                v-model="item.active"
                                                hide-details
                                                class="v-input--vertical"
                                                color="primary"
                                                :loading="item.loading"
                                                :disabled="
                                                  (!hasPermission(
                                                    'create',
                                                    'cloud-hook'
                                                  ) &&
                                                    !hasPermission(
                                                      'delete',
                                                      'cloud-hook'
                                                    )) ||
                                                    item.loading
                                                "
                                                @change="
                                                  _handleSetCloudHookStatusChange(
                                                    $event,
                                                    item
                                                  )
                                                "
                                              >
                                                <template #label>
                                                  <v-btn
                                                    tile
                                                    small
                                                    text
                                                    disabled
                                                    class="mb-1"
                                                  >
                                                    {{
                                                      item.active ? 'On' : 'Off'
                                                    }}
                                                  </v-btn>
                                                </template>
                                              </v-switch>
                                            </div>
                                          </div>
                                        </template>
                                        <span
                                          v-if="
                                            !hasPermission(
                                              'update',
                                              'cloud-hook'
                                            )
                                          "
                                        >
                                          You don't have permission to change
                                          Cloud Hook states.
                                        </span>
                                        <span v-else>
                                          {{
                                            item.active
                                              ? 'Deactivate'
                                              : 'Activate'
                                          }}
                                          this Cloud Hook
                                        </span>
                                      </v-tooltip>
                                    </div>
                                  </v-col>
                                  <v-col
                                    v-if="$vuetify.breakpoint.smAndUp"
                                    cols="4"
                                    class="d-flex align-center justify-end"
                                  >
                                    <div class="text-body-2">
                                      <span v-if="$vuetify.breakpoint.mdAndUp">
                                        States:
                                      </span>
                                      <v-chip
                                        label
                                        dark
                                        :color="
                                          stateGroupColor(
                                            stateGroup(item.states)
                                          )
                                        "
                                        class="ml-2"
                                      >
                                        {{ stateGroup(item.states) }}
                                      </v-chip>
                                    </div>
                                  </v-col>
                                </v-row>
                              </v-list-item-title>
                            </v-list-item-content>
                          </v-list-item>
                        </v-expansion-panel-header>

                        <v-expansion-panel-content>
                          <CloudHookForm
                            :hook="item"
                            :editable="
                              hasPermission('create', 'cloud-hook') &&
                                hasPermission('delete', 'cloud-hook')
                            "
                            show-controls
                            :version-group-id-prop="flow.version_group_id"
                            :loading.sync="item.loading"
                            @update="$apollo.queries.cloudHooks.refetch()"
                          />
                        </v-expansion-panel-content>
                      </div>
                    </v-lazy>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-col>
              <v-col cols="0" md="2"></v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
