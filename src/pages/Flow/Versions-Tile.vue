<script>
import BarChart from '@/components/Visualizations/BarChart.vue'
import CardTitle from '@/components/Card-Title'
import { mapGetters } from 'vuex'
import moment from 'moment'
import { timelineMixin } from '@/mixins/timelineMixin'
import { formatTime } from '@/mixins/formatTimeMixin'
import TimelineTooltip from '@/components/TimelineTooltip'

export default {
  components: {
    BarChart,
    CardTitle,
    TimelineTooltip
  },
  mixins: [formatTime, timelineMixin],
  props: {
    flowGroupId: {
      required: true,
      type: String
    }
  },
  data() {
    return {
      headers: [
        {
          text: '',
          value: 'archived',
          sortable: false,
          width: '5%'
        },
        {
          text: 'Version',
          value: 'version',
          width: '10%'
        },
        {
          text: 'Created',
          value: 'created',
          width: '15%'
        },
        {
          text: 'Created By',
          value: 'created_by.username',
          width: '20%'
        },
        {
          text: 'Last Runs',
          value: 'flow_runs',
          sortable: false,
          width: '15%'
        }
      ],
      itemsPerPage: 5,
      loading: 0,
      page: 1,
      runsLoadingKey: 0,
      searchTerm: null,
      sortBy: 'version',
      sortDesc: true,
      tooltip: null
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    offset() {
      return this.itemsPerPage * (this.page - 1)
    },
    runsLoading() {
      return this.runsLoadingKey > 0
    },
    searchFormatted() {
      if (!this.searchTerm) return null
      return parseInt(this.searchTerm)
    }
  },
  watch: {
    itemsPerPage() {
      this.$apollo.queries.versionsRuns.refetch()
    }
  },
  methods: {
    getFlow(flowId) {
      if (!this.versions || !this.versionsRuns) return
      return this.versionsRuns.find(flow => flow.id == flowId)
    },
    prepFlowRuns(flowId) {
      if (!this.versions || !this.versionsRuns) return []
      let flow = this.getFlow(flowId)
      if (!flow) return []

      const computedStyle = getComputedStyle(document.documentElement)

      return [...flow.flow_runs].reverse().map(d => {
        if (d.start_time && d.end_time) {
          let end = new moment(d.end_time),
            start = new moment(d.start_time)
          d.duration = moment.duration(end.diff(start))
        } else {
          let now = new moment(),
            start = new moment(d.start_time)
          d.duration = moment.duration(now.diff(start))
        }

        d.color = computedStyle.getPropertyValue(`--v-${d.state}-base`)
        d.opacity = d.start_time ? 0 : 1
        d.flow_id = flowId
        return d
      })
    }
  },
  apollo: {
    versions: {
      query: require('@/graphql/Flow/flow-versions.gql'),
      variables() {
        return {
          flow_group_id: this.flowGroupId,
          limit: this.itemsPerPage,
          offset: this.offset,
          order_by: { [this.sortBy]: this.sortDesc ? 'desc' : 'asc' },
          search: this.searchFormatted
        }
      },
      loadingKey: 'loading',
      update: data => data?.flow_group_by_pk?.flows,
      pollInterval: 5000
    },
    versionsCount: {
      query: require('@/graphql/Flow/flow-versions-count.gql'),
      variables() {
        return {
          flow_group_id: this.flowGroupId,
          search: this.searchFormatted
        }
      },
      loadingKey: 'loading',
      update: data => data?.flow_group_by_pk?.flows_aggregate?.aggregate?.count,
      pollInterval: 5000
    },
    versionsRuns: {
      query: require('@/graphql/Flow/flow-versions-runs.gql'),
      variables() {
        return {
          flow_ids: this.versions?.map(v => v.id)
        }
      },
      loadingKey: 'runsLoadingKey',
      update: data => data?.flow,
      pollInterval: 5000
    }
  }
}
</script>

<template>
  <v-card class="pa-2 mt-2" tile>
    <CardTitle title="Flow Versions" icon="loop">
      <v-text-field
        slot="action"
        v-model="searchTerm"
        class="flow-search"
        dense
        solo
        prepend-inner-icon="search"
        placeholder="Search by Version"
        hide-details
      >
      </v-text-field>
    </CardTitle>

    <v-card-text class="pa-0">
      <v-data-table
        class="ma-2"
        :header-props="{ 'sort-icon': 'arrow_drop_up' }"
        :headers="headers"
        :items="versions"
        :loading="loading > 0"
        must-sort
        :page.sync="page"
        :server-items-length="versionsCount"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :items-per-page.sync="itemsPerPage"
        :footer-props="{
          showFirstLastPage: true,
          itemsPerPageOptions: [5, 10],
          firstIcon: 'first_page',
          lastIcon: 'last_page',
          prevIcon: 'keyboard_arrow_left',
          nextIcon: 'keyboard_arrow_right'
        }"
        :class="{ 'fixed-table': $vuetify.breakpoint.smAndUp }"
        calculate-widths
      >
        <template v-slot:item.version="{ item }">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <router-link
                class="link"
                :to="{
                  name: 'flow',
                  params: { id: flowGroupId, tenant: tenant.slug },
                  query: { version: item.version }
                }"
              >
                <div class="truncate" v-on="on">{{ item.version }}</div>
              </router-link>
            </template>
            <span>{{ item.name }}: Version {{ item.version }}</span>
          </v-tooltip>
        </template>

        <template v-slot:item.created="{ item }">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <span v-on="on">
                {{ formDate(item.created) }}
              </span>
            </template>
            <span>{{ formatTime(item.created) }}</span>
          </v-tooltip>
        </template>

        <template v-slot:item.archived="{ item }">
          <v-tooltip v-if="!item.archived" top>
            <template v-slot:activator="{ on }">
              <v-icon small dark color="green" v-on="on">
                pi-flow
              </v-icon>
            </template>
            <span>{{ item.archived ? 'Archived' : 'Active' }}</span>
          </v-tooltip>
          <v-tooltip v-else top>
            <template v-slot:activator="{ on }">
              <v-icon small dark color="accent-pink" v-on="on">
                archive
              </v-icon>
            </template>
            <span>{{ item.archived ? 'Archived' : 'Active' }}</span>
          </v-tooltip>
        </template>

        <template v-slot:item.flow_runs="{ item }">
          <div class="position-relative">
            <BarChart
              :items="prepFlowRuns(item.id)"
              :loading="!getFlow(item.id) && runsLoading"
              :height="50"
              :min-bands="10"
              normalize
              :padding="0"
              y-field="duration"
              @bar-click="_barClick"
              @bar-mouseout="_barMouseout"
              @bar-mouseover="_barMouseover"
            />

            <div
              v-if="tooltip && tooltip.data.flow_id == item.id"
              class="barchart-tooltip v-tooltip__content text-left"
            >
              <TimelineTooltip :tooltip="tooltip" />
              <!-- <div class="subtitle-2">
                {{ tooltip.data.name }}
              </div>

              <div
                class="d-flex align-center justify-start caption"
                style="line-height: 0.5rem;"
              >
                <div :style="statusStyle(tooltip.data.state)"></div>
                <div class="ml-2">{{ tooltip.data.state }}</div>
              </div>

              <v-divider class="my-1 white" />

              <div v-if="tooltip.data.start_time" class="caption">
                Started:
                <span class="font-weight-black">
                  {{ formatTime(tooltip.data.start_time) }}
                </span>
              </div>

              <div v-if="tooltip.data.end_time" class="caption">
                Ended:
                <span class="font-weight-black">
                  {{ formatTime(tooltip.data.end_time) }}
                </span>
              </div>

              <div
                v-if="tooltip.data.duration || tooltip.data.start_time"
                class="caption"
              >
                Duration:
                <span
                  v-if="tooltip.data.state !== 'Running'"
                  class="font-weight-black"
                >
                  {{ tooltip.data.duration | duration }}
                </span>
                <DurationSpan
                  v-else-if="tooltip.data.start_time"
                  :start-time="tooltip.data.start_time"
                  class="font-weight-black"
                />
              </div> -->
            </div>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<style lang="scss">
.fixed-table {
  table {
    table-layout: fixed;
  }
}

// stylelint-disable
.v-data-table__wrapper {
  overflow: initial !important;
}
// stylelint-enable

.v-data-table {
  font-size: 0.9rem !important;
  overflow: initial !important;

  tr {
    overflow: initial !important;
  }

  td,
  th {
    font-size: inherit !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  td {
    overflow: initial !important;
  }

  .last-ten-runs {
    overflow-x: scroll !important;
  }
}

.pointer {
  cursor: pointer;
}

.flow-search {
  border-radius: 0 !important;
  font-size: 0.85rem;

  .v-icon {
    font-size: 20px !important;
  }
}

.barchart-tooltip {
  left: 50%;
  pointer-events: none;
  position: absolute;
  text-overflow: initial;
  transform: translate(-50%);
  user-select: none;
  width: fit-content !important;
  z-index: 10;
}
</style>
