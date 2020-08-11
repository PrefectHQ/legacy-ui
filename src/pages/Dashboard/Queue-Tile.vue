<script>
import { mapGetters } from 'vuex'
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    CardTitle,
    DurationSpan
  },
  mixins: [formatTime],
  props: {
    projectId: {
      required: false,
      type: String,
      default: () => null
    },
    fullHeight: {
      required: false,
      type: Boolean,
      default: () => false
    }
  },
  data() {
    return {
      loadingKey: 0,
      tab: 'all'
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    loading() {
      return this.loadingKey > 0
    },
    runs() {
      if (!this.flowRuns) return []
      return this.flowRuns
    }
  },
  watch: {
    async tenant(val) {
      if (val) {
        await this.$apollo.queries.flowRuns.refetch()
      }
    }
  },
  methods: {},
  apollo: {
    flowRuns: {
      query: require('@/graphql/Dashboard/queued-flow-runs.gql'),
      variables() {
        return {
          projectId: this.projectId ? this.projectId : null
        }
      },
      loadingKey: 'loadingKey',
      pollInterval: 3000,
      update({ flow_run }) {
        if (!flow_run) return
        return flow_run
      }
    }
  }
}
</script>

<template>
  <v-card
    class="pb-2"
    tile
    :style="{
      height: fullHeight ? '330px' : 'auto',
      'max-width': '100%',
      overflow: 'hidden'
    }"
  >
    <v-progress-linear
      active
      height="5"
      absolute
      :indeterminate="loading"
      color="primary"
    />

    <CardTitle icon="list" icon-color="Queued" class="pt-2">
      <v-row slot="title" no-gutters class="d-flex align-center">
        <v-col cols="8">
          <div>
            <div
              v-if="loading"
              style="
                display: inline-block;
                height: 20px;
                overflow: hidden;
                width: 20px;"
            >
              <v-skeleton-loader type="avatar" tile></v-skeleton-loader>
            </div>
            {{ runs.length }} Queued
          </div>
        </v-col>
      </v-row>
    </CardTitle>

    <v-card-text class="pa-0 card-content">
      <v-skeleton-loader v-if="loading" type="list-item-three-line">
      </v-skeleton-loader>

      <v-list v-else-if="!loading && runs.length === 0">
        <v-list-item>
          <v-list-item-avatar class="mr-0">
            <v-icon class="mb-1" color="primary">
              check
            </v-icon>
          </v-list-item-avatar>

          <v-list-item-content class="my-0 py-3">
            <div
              class="subtitle-1 font-weight-light"
              style="line-height: 1.25rem;"
            >
              Your queue is clear
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-list v-else>
        <v-slide-x-transition mode="out-in" leave-absolute group>
          <v-lazy
            v-for="run in runs"
            :key="run.id"
            :options="{
              threshold: 0.75
            }"
            min-height="40px"
            transition="fade"
          >
            <div>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="d-flex align-center">
                    <div
                      class="truncate d-inline-block"
                      style="max-width: 50%;"
                    >
                      <router-link
                        :to="{
                          name: 'flow',
                          params: { id: run.flow.flow_group_id }
                        }"
                      >
                        {{ run.flow.name }}
                      </router-link>
                    </div>
                    <div class="font-weight-bold d-inline-block">
                      <v-icon style="font-size: 12px;">
                        chevron_right
                      </v-icon>
                    </div>

                    <div
                      class="truncate d-inline-block"
                      style="max-width: 35%;"
                    >
                      <router-link
                        :to="{ name: 'flow-run', params: { id: run.id } }"
                      >
                        {{ run.name }}
                      </router-link>
                    </div>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="run.start_time">
                    Queued for
                    <DurationSpan
                      v-if="false"
                      class="font-weight-bold"
                      :start-time="run.start_time"
                    />
                  </v-list-item-subtitle>
                  <v-list-item-subtitle v-else-if="run.state == 'Submitted'">
                    Submitted for execution
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-divider class="my-1 mx-4 grey lighten-4" />
            </div>
          </v-lazy>
        </v-slide-x-transition>
      </v-list>

      <div v-if="runs && runs.length > 3" class="pa-0 card-footer"> </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
a {
  text-decoration: none !important;
}

.button-transition {
  transition: border-right 150ms linear;
}

.w-100 {
  width: 100% !important;
}

.card-content {
  max-height: 254px;
  overflow-y: scroll;
}

.card-footer {
  background-image: linear-gradient(transparent, 60%, rgba(0, 0, 0, 0.1));
  bottom: 6px;
  height: 6px !important;
  pointer-events: none;
  position: absolute;
  width: 100%;
}
</style>
