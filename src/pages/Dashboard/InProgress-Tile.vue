<script>
import { mapGetters } from 'vuex'
import CancelAll from '@/components/Nav/SystemActionsTiles/CancelAll'
import CardTitle from '@/components/Card-Title'
import ConcurrencyInfo from '@/components/ConcurrencyInfo'
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    CancelAll,
    CardTitle,
    ConcurrencyInfo,
    DurationSpan
  },
  mixins: [formatTime],
  props: {
    projectId: {
      required: false,
      type: String,
      default: () => null
    }
  },
  data() {
    return {
      loadingKey: 0,
      overlay: false,
      tab: 'all'
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    loading() {
      return this.loadingKey > 0
    },
    all() {
      if (!this.flowRuns) return []
      return this.flowRuns
    },
    running() {
      if (!this.flowRuns) return []
      return this.flowRuns.filter(
        run => run.state == 'Running' || run.state == 'Cancelling'
      )
    },
    submitted() {
      if (!this.flowRuns) return []
      return this.flowRuns.filter(run => run.state == 'Submitted')
    },
    cancellable() {
      if (this.tab == 'submitted') return this.submitted
      if (this.tab == 'running') return this.running
      return this.flowRuns.filter(run => run.state !== 'Cancelling')
    },
    runs() {
      if (this.tab == 'submitted') return this.submitted
      if (this.tab == 'running') return this.running
      return this.all
    },
    tileColor() {
      let color = this.loading ? 'grey' : 'InProgress'

      if (this.tab == 'submitted') {
        color = 'Submitted'
      }

      if (this.tab == 'running') {
        color = 'Running'
      }

      return color
    },
    title() {
      let title = this.loading
        ? 'In progress flow runs'
        : `${this.all?.length || 0} runs in progress`

      if (this.tab == 'submitted') {
        title = this.loading
          ? 'Submitted flow runs'
          : `${this.submitted?.length || 0} submitted runs`
      }

      if (this.tab == 'running') {
        title = this.loading
          ? 'Running flow runs'
          : `${this.running?.length || 0} running flows`
      }

      return title
    },
    titleIcon() {
      let icon = 'filter_drama'

      if (this.tab == 'submitted') {
        icon = 'filter_drama'
      }

      if (this.tab == 'running') {
        icon = 'filter_drama'
      }

      return icon
    }
  },
  watch: {
    async tenant(val) {
      if (val) {
        await this.$apollo.queries.flowRuns.refetch()
      }
    }
  },
  methods: {
    refetch() {
      this.$apollo.queries['flowRuns'].refetch()
      this.overlay = false
    },
    toggleOverlay() {
      this.overlay = !this.overlay
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Dashboard/in-progress-flow-runs.gql'),
      variables() {
        return {
          projectId: this.projectId ? this.projectId : null
        }
      },
      loadingKey: 'loadingKey',
      pollInterval: 3000,
      update: ({ flow_run }) => flow_run
    }
  }
}
</script>

<template>
  <v-card
    tile
    class="pb-2 position-relative d-flex flex-column"
    style="height: 100%;"
  >
    <v-progress-linear
      striped
      active
      height="5"
      value="100"
      absolute
      :indeterminate="loading"
      :color="tileColor"
    />

    <CardTitle :icon="titleIcon" :icon-color="tileColor" class="pt-2">
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
            {{ title }}
          </div>
          <ConcurrencyInfo
            v-if="isCloud"
            class="text-caption position-absolute"
            style="bottom: 2px;"
          />
        </v-col>
      </v-row>

      <div slot="action" class="d-flex align-end flex-column">
        <v-btn
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'running' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'running'
                ? 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = tab == 'running' ? 'all' : 'running'"
        >
          Running
          <v-icon small>access_time</v-icon>
        </v-btn>
        <v-btn
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'submitted' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'submitted'
                ? 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = tab == 'submitted' ? 'all' : 'submitted'"
        >
          Submitted
          <v-icon small>access_time</v-icon>
        </v-btn>
      </div>
    </CardTitle>

    <v-card-text class="pa-0">
      <v-overlay v-if="overlay" absolute z-index="1">
        <CancelAll :flow-runs="cancellable" @finish="refetch" />
      </v-overlay>

      <v-skeleton-loader v-else-if="loading" type="list-item-three-line">
      </v-skeleton-loader>

      <v-list v-else-if="!loading && runs.length === 0" class="card-content">
        <v-list-item>
          <v-list-item-avatar class="mr-0">
            <v-icon class="mb-1" :color="tileColor">
              warning
            </v-icon>
          </v-list-item-avatar>

          <v-list-item-content class="my-0 py-3">
            <div
              class="text-subtitle-1 font-weight-light"
              style="line-height: 1.25rem;"
            >
              You have no
              {{
                tab == 'running'
                  ? 'running flows'
                  : tab == 'submitted'
                  ? 'submitted runs'
                  : 'runs in progress'
              }}
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-list v-else class="card-content">
        <v-slide-x-transition mode="out-in" leave-absolute group>
          <v-lazy
            v-for="run in runs"
            :key="run.id"
            :options="{
              threshold: 0.75
            }"
            min-height="40px"
            transition="fade"
            :class="run.state == 'Cancelling' ? 'blue-grey lighten-5' : ''"
          >
            <div>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="d-flex align-center">
                    <div
                      class="text-truncate d-inline-block"
                      style="max-width: 50%;"
                    >
                      <router-link
                        :class="
                          run.state == 'Cancelling' ? 'text--disabled' : ''
                        "
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
                      class="text-truncate d-inline-block text--disabled"
                      style="max-width: 35%;"
                    >
                      <router-link
                        :class="
                          run.state == 'Cancelling' ? 'text--disabled' : ''
                        "
                        :to="{ name: 'flow-run', params: { id: run.id } }"
                      >
                        {{ run.name }}
                      </router-link>
                    </div>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="run.state == 'Cancelling'">
                    Cancelling...
                  </v-list-item-subtitle>
                  <v-list-item-subtitle v-else-if="run.start_time">
                    Running for
                    <DurationSpan
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

    <v-spacer />

    <v-card-actions class="py-0">
      <v-spacer />
      <v-btn
        v-if="overlay || (cancellable && cancellable.length > 0)"
        small
        depressed
        :plain="overlay"
        :color="overlay ? 'white' : 'primary'"
        width="74"
        text
        style="z-index: 2;"
        @click="toggleOverlay"
      >
        {{ overlay ? 'Close' : 'Stop all' }}
      </v-btn>
    </v-card-actions>
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
  height: 100%;
  max-height: 210px;
  overflow-y: auto;
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
