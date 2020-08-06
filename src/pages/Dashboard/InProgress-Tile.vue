<script>
/* eslint-disable */
import { mapGetters } from 'vuex'
import CardTitle from '@/components/Card-Title'
import ConcurrencyInfo from '@/components/ConcurrencyInfo'
import DurationSpan from '@/components/DurationSpan'
import ExternalLink from '@/components/ExternalLink'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    CardTitle,
    ConcurrencyInfo,
    DurationSpan,
    ExternalLink
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
      return this.flowRuns.filter(run => run.state == 'Running')
    },
    submitted() {
      if (!this.flowRuns) return []
      return this.flowRuns.filter(run => run.state == 'Submitted')
    },
    runs() {
      if (this.tab == 'submitted') return this.submitted
      if (this.tab == 'running') return this.runs
      return this.all
    },
    tileColor() {
      let color = this.loading ? 'grey' : '#93d2cc'

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
        ? 'In Progress Flow Runs'
        : `${this.all?.length || 0} Runs In Progress`

      if (this.tab == 'submitted') {
        title = this.loading
          ? 'Submitted Flow Runs'
          : `${this.submitted?.length || 0} Submitted Runs`
      }

      if (this.tab == 'running') {
        title = this.loading
          ? 'Running Flow Runs'
          : `${this.running?.length || 0} Running Flows`
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
        await this.$apollo.queries.upcoming.refetch()
      }
    }
  },
  methods: {},
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
      height: fullHeight ? '330px' : 'auto'
    }"
  >
    <v-progress-linear
      striped
      active
      height="5"
      value="100"
      absolute
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
            class="caption position-absolute"
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
              tab == 'running' ? 'var(--v-primary-base)' : '#fff'
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
              tab == 'submitted' ? 'var(--v-primary-base)' : '#fff'
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

    <v-card-text v-if="tab == 'upcoming'" class="pa-0 card-content">
      <v-skeleton-loader v-if="loading" type="list-item-three-line">
      </v-skeleton-loader>

      <div
        v-else-if="!loading && runs.length === 0"
        class="subtitle-1 font-weight-light"
        style="line-height: 1.25rem;"
      >
        You have no runs in progress!
      </div>

      <!-- 
      

      <v-list v-else dense>
        <v-lazy
          v-for="item in upcomingRuns"
          :key="item.id"
          :options="{
            threshold: 0.75
          }"
          min-height="44"
          transition="fade-transition"
        >
          <v-list-item dense :disabled="setToRun.includes(item.id)">
            <v-list-item-content>
              <span class="caption mb-0">
                Scheduled for
                {{ formatDateTime(item.scheduled_start_time) }}
              </span>
              <v-list-item-subtitle class="font-weight-light">
                <router-link
                  :to="{ name: 'flow', params: { id: item.flow.id } }"
                >
                  {{ item.flow.name }}
                </router-link>
                <span class="font-weight-bold">
                  <v-icon style="font-size: 12px;">
                    chevron_right
                  </v-icon>
                </span>
                <router-link
                  :to="{ name: 'flow-run', params: { id: item.id } }"
                >
                  {{ item.name }}
                </router-link>
              </v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action tile min-width="5" class="body-2">
              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-btn
                    text
                    x-small
                    aria-label="Run Now"
                    :disabled="setToRun.includes(item.id)"
                    color="primary"
                    class="vertical-button"
                    v-on="on"
                    @click="runFlowNow(item.id, item.version, item.name)"
                  >
                    <v-icon x-small dense color="primary"> fa-rocket</v-icon>
                  </v-btn>
                </template>
                <span> Run {{ item.name }} now </span>
              </v-tooltip>
            </v-list-item-action>
          </v-list-item>
        </v-lazy>
      </v-list>

      <div
        v-if="upcomingRuns && upcomingRuns.length > 3"
        class="pa-0 card-footer"
      >
      </div>
    </v-card-text>
      </v-list> -->

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
