<script>
import BarChart from '@/components/Visualizations/BarChart.vue'
import CardTitle from '@/components/Card-Title'
import { mapGetters } from 'vuex'
import debounce from 'lodash.debounce'
import ScheduleToggle from '@/components/ScheduleToggle'
import { formatTime } from '@/mixins/formatTimeMixin'
import moment from 'moment'
import TimelineTooltip from '@/components/TimelineTooltip'

const serverHeaders = [
  // Can add this with icons later
  // {
  //   text: 'Archived',
  //   value: 'archived',
  //   width: 5
  // },
  {
    text: 'Name',
    value: 'name',
    width: 20
  },
  {
    text: 'Schedule',
    value: 'schedule',
    sortable: false,
    align: 'center',
    width: 20
  },
  {
    text: 'Project',
    value: 'project.name',
    sortable: false,
    width: 15
  },
  {
    text: 'Version',
    value: 'version',
    sortable: false,
    width: 10
  }
]

const serverHeadersPost = [
  {
    text: 'Run History',
    value: 'flow_runs',
    sortable: false,
    width: 25
  }
]

const cloudHeaders = [
  {
    text: 'Created By',
    value: 'created_by.username',
    sortable: false,
    width: 10
  }
]

export default {
  components: {
    BarChart,
    CardTitle,
    ScheduleToggle,
    TimelineTooltip
  },
  filters: {},
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
      flows: [],
      limit: 10,
      loading: 0,
      runsLoadingKey: 0,
      page: 1,
      search:
        this.$route && this.$route.query && this.$route.query.flows
          ? this.$route.query.flows
          : null,
      showArchived:
        this.$route && this.$route.query && this.$route.query.archived,
      sortBy: 'name',
      sortDesc: false,
      tooltip: null
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    headers() {
      return [
        ...serverHeaders,
        ...(this.isCloud ? cloudHeaders : []),
        ...serverHeadersPost
      ]
    },
    placeholderMessage() {
      if (this.$vuetify.breakpoint.mdAndUp) {
        return `Search by flow name, id, ${
          !this.isCloud ? 'or' : ''
        } version group id ${this.isCloud ? ', or creator' : ''} `
      }
      return ''
    },
    searchFormatted() {
      if (!this.search) return null
      return `%${this.search}%`
    },
    validUUID() {
      if (!this.search) return false

      const UUIDRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/

      // Call .trim() to get rid of whitespace on the ends of the
      // string before making the query
      return UUIDRegex.test(this.search.trim())
    }
  },
  watch: {
    search(val) {
      this.$router.replace({
        query: { ...this.$route.query, flows: val }
      })
    },
    showArchived(val) {
      let query = { ...this.$route.query }

      if (val) {
        query.archived = true
      } else {
        delete query.archived
      }
      this.$router.replace({
        query: query
      })
    }
  },
  methods: {
    _barMouseout() {
      this.tooltip = null
    },
    _barMouseover(d) {
      if (d.data.end_time) {
        d.data.display_end_time = this.formatTime(d.data.end_time)
      }

      if (d.data.start_time) {
        d.data.display_start_time = this.formatTime(d.data.start_time)
      }

      if (d.data.scheduled_start_time) {
        d.data.display_scheduled_start_time = this.formatTime(
          d.data.scheduled_start_time
        )
      }

      d.status_style = this.statusStyle(d.data.state)

      this.tooltip = d
    },
    _barClick(d) {
      this.$router.push({
        name: 'flow-run',
        params: {
          id: d.id
        }
      })
    },
    async handleTableSearchInput(e) {
      this.loading++
      this.debounceSearch(e)
    },
    prepFlowRuns(flowGroupId) {
      if (!this.flowRuns) return []

      const computedStyle = getComputedStyle(document.documentElement)

      return this.flowRuns
        .filter(run => run.flow.flow_group_id == flowGroupId)
        .reverse()
        .map(d => {
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
          d.opacity = 1
          d.flow_group_id = d.flow.flow_group_id
          return d
        })
    },
    formatTime(timestamp) {
      if (!timestamp) throw new Error('Did not recieve a timestamp')

      let t = moment(timestamp).tz(this.timezone),
        shortenedTz = moment()
          .tz(this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
          .zoneAbbr()

      let timeObj = t ? t : moment(timestamp)

      let formatted = timeObj.calendar(null, {
        sameDay: 'h:mma',
        sameElse: 'MMMM D, YYYY [at] h:mma'
      })
      return `${formatted} ${shortenedTz}`
    },
    statusStyle(state) {
      return {
        'border-radius': '50%',
        display: 'inline-block',
        'background-color': `var(--v-${state}-base)`,
        height: '1rem',
        width: '1rem'
      }
    },
    debounceSearch: debounce(function(e) {
      this.loading = 0
      this.search = e
    }, 500)
  },
  apollo: {
    flows: {
      query() {
        return require('@/graphql/Dashboard/flows.js').default(this.isCloud)
      },
      variables() {
        let sortBy = {}
        if (this.sortBy) {
          if (this.isCloud && this.sortBy.includes('created_by.username')) {
            sortBy['created_by'] = {}
            sortBy['created_by']['username'] = this.sortDesc ? 'desc' : 'asc'
          } else if (Object.keys(this.sortBy) < 1) {
            sortBy = { flows: { name: 'asc' } }
          } else {
            sortBy[`${this.sortBy}`] = this.sortDesc ? 'desc' : 'asc'
          }
        }

        let searchParams = [
          { archived: { _eq: this.showArchived ? null : false } },
          { project_id: { _eq: this.projectId ? this.projectId : null } }
        ]

        let flowSearchParams = [
          {
            name: { _ilike: this.searchFormatted }
          }
        ]
        let flowGroupSearchParams = [
          {
            flows: {
              name: { _ilike: this.searchFormatted }
            }
          }
        ]

        // This lets us control the params we pass to the _or expression
        // let searchParams = []
        // if (this.validUUID) {
        //   searchParams.push({ id: { _eq: this.search } })
        //   searchParams.push({
        //     id: { _eq: this.searchFormatted }
        //   })
        // }

        // searchParams.push({
        //   name: { _ilike: this.searchFormatted }
        // })

        if (this.isCloud) {
          flowSearchParams.push({
            created_by: { username: { _ilike: this.searchFormatted } }
          })
          flowGroupSearchParams.push({
            flows: {
              created_by: { username: { _ilike: this.searchFormatted } }
            }
          })
        }

        return {
          limit: this.limit,
          offset: this.limit * (this.page - 1),
          orderBy: sortBy,
          flowGroupSearchParams: {
            flows: {
              _and: [...searchParams, { _or: [...flowSearchParams] }]
            }
          },
          flowSearchParams: {
            _and: [...searchParams, { _or: [...flowSearchParams] }]
          }
        }
      },
      loadingKey: 'loading',
      pollInterval: 60000,
      update: data => {
        return data?.flows.map(group => {
          const flow = group.flows?.[0]
          return {
            id: group.id,
            archived: flow.archived,
            flow: flow,
            flow_group: group,
            name: flow.name,
            project: flow.project,
            version: flow.version
          }
        })
      }
    },
    flowCount: {
      query: require('@/graphql/Dashboard/flow-count.gql'),
      variables() {
        // This lets us control the params we pass to the _or expression
        let searchParams = []
        if (this.validUUID) {
          searchParams.push({ id: { _eq: this.search } })
          searchParams.push({
            flow_group_id: { _eq: this.searchFormatted }
          })
        }

        searchParams.push({ name: { _ilike: this.searchFormatted } })

        if (this.isCloud) {
          searchParams.push({
            created_by: { username: { _ilike: this.searchFormatted } }
          })
        }

        return {
          archived: this.showArchived ? null : false,
          projectId: this.projectId ? this.projectId : null,
          searchParams: searchParams
        }
      },
      loadingKey: 'loading',
      pollInterval: 60000,
      update: data => data?.flowCount?.aggregate?.count
    },
    flowRuns: {
      query: require('@/graphql/Dashboard/last-flow-runs.gql'),
      variables() {
        return {
          flowIds: this.flows.map(group => group.id)
        }
      },
      skip() {
        return !this.flows
      },
      pollInterval: 60000,
      loadingKey: 'runsLoadingKey'
    }
  }
}
</script>

<template>
  <v-card class="pa-2" tile>
    <CardTitle title="Flows" icon="pi-flow">
      <div slot="action" class="flex align-center justify-end">
        <v-text-field
          :value="search"
          class="flow-search"
          dense
          hide-details
          single-line
          solo
          flat
          :placeholder="placeholderMessage"
          prepend-inner-icon="search"
          autocomplete="new-password"
          @input="handleTableSearchInput"
        />
      </div>
    </CardTitle>

    <v-card-text class="pa-0">
      <v-data-table
        fixed-header
        :search.sync="search"
        :mobile-breakpoint="960"
        :loading="loading > 0"
        :header-props="{ 'sort-icon': 'arrow_drop_up' }"
        :items="flows"
        :headers="headers"
        :page.sync="page"
        :items-per-page.sync="limit"
        class="ma-2"
        must-sort
        :no-data-text="
          `You have no flows${projectId ? ' in this project!' : '!'}`
        "
        :server-items-length="flowCount"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :class="{ 'fixed-table': $vuetify.breakpoint.mdAndUp }"
        :footer-props="{
          showFirstLastPage: true,
          firstIcon: 'first_page',
          itemsPerPageOptions: [5, 10, 15, 25, 50],
          lastIcon: 'last_page',
          prevIcon: 'keyboard_arrow_left',
          nextIcon: 'keyboard_arrow_right'
        }"
      >
        <template v-slot:item.name="{ item }">
          <div class="truncate">
            <router-link
              class="link"
              :data-cy="
                'flow-link|' +
                  item.name +
                  '|' +
                  (item.archived ? 'archived' : 'active') +
                  '-' +
                  item.version
              "
              :to="{
                name: 'flow',
                params: { id: item.id, tenant: tenant.slug }
              }"
            >
              <span>{{ item.name }}</span>
            </router-link>
          </div>
        </template>

        <template v-slot:item.schedule="{ item }">
          <ScheduleToggle :flow="item.flow" :flow-group="item.flow_group" />
        </template>

        <template v-slot:item.project="{ item }">
          <div class="truncate">
            <router-link
              class="link"
              :to="{
                name: 'project',
                params: { id: item.project.id, tenant: tenant.slug }
              }"
            >
              <span>{{ item.project.name }}</span>
            </router-link>
          </div>
        </template>

        <template v-slot:item.flow_runs="{ item }">
          <div class="position-relative allow-overflow">
            <BarChart
              :items="prepFlowRuns(item.id)"
              :loading="runsLoadingKey > 0"
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
              v-if="tooltip && tooltip.data.flow_group_id == item.id"
              class="barchart-tooltip v-tooltip__content text-left"
            >
              <TimelineTooltip :tooltip="tooltip" />
            </div>
          </div>
        </template>

        <template v-slot:item.created_by.username="{ item }">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <span v-on="on">
                {{ item.created_by ? item.created_by.username : null }}
              </span>
            </template>
            <span>
              {{ item.created_by ? item.created_by.username : null }}
            </span>
          </v-tooltip>
        </template>

        <!-- eslint-disable vue/no-template-shadow -->
        <template v-slot:body.append="{ headers }">
          <td :colspan="headers.length">
            <v-row justify="end">
              <v-switch
                v-model="showArchived"
                class="archived-checkbox mr-3"
                label="Show Archived"
              ></v-switch>
            </v-row>
          </td>
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

.v-data-table {
  font-size: 0.9rem !important;

  // stylelint-disable-next-line
  .v-data-table__wrapper {
    overflow: visible !important;
  }

  th {
    font-size: inherit !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  td {
    overflow: visible !important;
  }
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
