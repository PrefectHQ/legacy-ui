<script>
import CardTitle from '@/components/Card-Title'
import LastTenRuns from '@/components/LastTenRuns'
import { mapGetters } from 'vuex'
import debounce from 'lodash.debounce'
import ScheduleToggle from '@/components/ScheduleToggle'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    CardTitle,
    LastTenRuns,
    ScheduleToggle
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
      headers: [
        {
          text: 'Name',
          value: 'name',
          width: '15%'
        },
        {
          text: 'Schedule',
          value: 'schedule',
          sortable: false,
          align: 'center',
          width: '10%'
        },
        {
          text: 'Created By',
          value: 'created_by.username',
          align: 'center',
          width: '12%'
        },
        {
          text: 'Version',
          value: 'version',
          align: 'center',
          width: '10%'
        },
        {
          text: 'Last Run',
          value: 'start_time',
          // making sortable false for now as sorting by the flow_run_aggregate.max.start_time makes a really slow query
          sortable: false,
          align: 'center',
          width: '12%'
        },
        {
          text: 'Run History',
          value: 'flow_runs',
          sortable: false,
          align: 'center',
          width: '15%'
        }
      ],
      flows: [],
      limit: 10,
      loading: 0,
      page: 1,
      search:
        this.$route && this.$route.query && this.$route.query.flows
          ? this.$route.query.flows
          : null,
      showArchived:
        this.$route && this.$route.query && this.$route.query.archived,
      sortBy: 'name',
      sortDesc: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    placeholderMessage() {
      if (this.$vuetify.breakpoint.mdAndUp) {
        return 'Search by flow name, id, version group id or creator'
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
    async handleTableSearchInput(e) {
      this.loading++
      this.debounceSearch(e)
    },
    startDate(item) {
      // As not all flow runs have a start time or heartbeat, the query returns in order by scheduled_start_time - this sort finds the latest heartbeat
      const frs = item.flow_runs.slice()
      frs.sort((a, b) => (a.heartbeat > b.heartbeat ? -1 : 1))
      const time = frs[0]?.start_time
      return this.formDate(time)
    },
    startTime(item) {
      // As not all flow runs have a start time or heartbeat, the query returns in order by scheduled_start_time - this sort finds the latest heartbeat
      const frs = item.flow_runs.slice()
      frs.sort((a, b) => (a.heartbeat > b.heartbeat ? -1 : 1))
      const time = frs[0]?.start_time
      return this.formatTime(time)
    },
    copyTextToClipboard(text) {
      return new Promise(res =>
        navigator.clipboard.writeText(text).then(() => {
          res()
        })
      )
    },
    debounceSearch: debounce(function(e) {
      this.loading = 0
      this.search = e
    }, 500)
  },
  apollo: {
    flows: {
      query: require('@/graphql/Dashboard/flows.gql'),
      variables() {
        let sortBy = {}
        if (this.sortBy) {
          if (this.sortBy.includes('created_by.username')) {
            sortBy['created_by'] = {}
            sortBy['created_by']['username'] = this.sortDesc ? 'desc' : 'asc'
          } else if (Object.keys(this.sortBy) < 1) {
            sortBy = { name: 'asc' }
          } else {
            sortBy[`${this.sortBy}`] = this.sortDesc ? 'desc' : 'asc'
          }
        }

        // This lets us control the params we pass to the _or expression
        let searchParams = []
        if (this.validUUID) {
          searchParams.push({ id: { _eq: this.search } })
          searchParams.push({
            flow_group_id: { _eq: this.searchFormatted }
          })
        }

        searchParams.push({ name: { _ilike: this.searchFormatted } })

        searchParams.push({
          created_by: { username: { _ilike: this.searchFormatted } }
        })

        return {
          archived: this.showArchived ? null : false,
          limit: this.limit,
          offset: this.limit * (this.page - 1),
          orderBy: sortBy,
          projectId: this.projectId ? this.projectId : null,
          searchParams: searchParams
        }
      },
      loadingKey: 'loading',
      pollInterval: 3000,
      update: data => data?.flows
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

        searchParams.push({
          created_by: { username: { _ilike: this.searchFormatted } }
        })

        return {
          archived: this.showArchived ? null : false,
          projectId: this.projectId ? this.projectId : null,
          searchParams: searchParams
        }
      },
      loadingKey: 'loading',
      pollInterval: 10000,
      update: data => data?.flowCount?.aggregate?.count
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
          solo
          single-line
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
          <v-tooltip top>
            <template v-slot:activator="{ on }">
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
                  params: { id: item.flow_group_id, tenant: tenant.slug }
                }"
              >
                <span v-on="on">{{ item.name }}</span>
              </router-link>
            </template>
            <span>{{ item.name }}</span>
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

        <template v-slot:item.start_time="{ item }">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <span v-on="on">
                {{ startDate(item) }}
              </span>
            </template>
            <span>
              {{ startTime(item) }}
            </span>
          </v-tooltip>
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

        <template v-slot:item.id="{ item }">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <span v-if="$vuetify.breakpoint.smAndUp" v-on="on">
                {{ item.id }}
              </span>
              <span v-else v-on="on"> {{ item.id.substring(0, 5) }}... </span>
            </template>
            <span>
              {{ item.id }}
            </span>
          </v-tooltip>
        </template>

        <template v-slot:item.flow_group_id="{ item }">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <div
                class="hidewidth cursor-pointer"
                v-on="on"
                @click="copyTextToClipboard(item.flow_group_id)"
              >
                <span v-if="$vuetify.breakpoint.smAndUp" v-on="on">
                  {{ item.flow_group_id }}
                </span>
                <span v-else v-on="on">
                  {{ item.flow_group_id.substring(0, 5) }}...
                </span>
              </div>
            </template>

            <span>Click to copy ID</span>
          </v-tooltip>
        </template>

        <template v-slot:item.schedule="{ item }">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <span v-on="on">
                <ScheduleToggle
                  v-if="!item.archived"
                  :schedules="item.schedules"
                />
              </span>
            </template>
            <span>
              {{
                item.schedules.length
                  ? item.schedules[0].active
                    ? 'Active'
                    : 'Paused'
                  : 'No schedule set'
              }}
            </span>
          </v-tooltip>
        </template>

        <template v-slot:item.flow_runs="{ item }">
          <LastTenRuns
            v-if="item.flow_runs.length"
            :flow-runs="item.flow_runs"
            class="last-ten-runs"
          />
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

  td,
  th {
    font-size: inherit !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

.archived-checkbox {
  label {
    font-size: 0.9rem;
  }

  .v-icon {
    font-size: 20px !important;
  }
}
</style>
