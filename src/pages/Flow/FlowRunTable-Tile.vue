<script>
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'
import { STATE_NAMES } from '@/utils/states'
export default {
  components: { CardTitle, DurationSpan },
  mixins: [formatTime],
  props: {
    aggregate: {
      type: Boolean,
      default: () => false
    },
    flow: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      flowRuns: null,
      flowRunsCount: null,
      headers: [
        {
          text: 'Name',
          value: 'name',
          width: '30%',
          mobile: true
        },
        {
          text: 'Scheduled Start',
          value: 'scheduled_start_time',
          align: 'start',
          width: '10%',
          mobile: false
        },
        {
          text: 'Start Time',
          value: 'start_time',
          align: 'start',
          width: '10%',
          mobile: true
        },
        {
          text: 'End Time',
          value: 'end_time',
          align: 'start',
          width: '10%',
          mobile: true
        },
        {
          text: 'Duration',
          value: 'duration',
          align: 'end',
          width: '10%',
          sortable: false,
          mobile: false
        },
        {
          text: 'State',
          value: 'state',
          align: 'end',
          width: '5%',
          mobile: true
        }
      ],
      itemsPerPage: 15,
      page: 1,
      searchTerm: null,
      sortBy: 'scheduled_start_time',
      sortDesc: true,
      state: [],
      states: STATE_NAMES.slice(1).sort()
    }
  },
  computed: {
    offset() {
      return this.itemsPerPage * (this.page - 1)
    },
    searchFormatted() {
      if (!this.searchTerm) return null
      return `%${this.searchTerm}%`
    },
    pollInterval() {
      return this.flow.archived ? 0 : 5000
    },
    headersByViewport() {
      return this.$vuetify.breakpoint.mdAndUp
        ? this.headers
        : this.headers.filter(header => header.mobile)
    }
  },
  watch: {
    flow() {
      this.$apollo.queries.flowRuns.stopPolling()
      this.$apollo.queries.flowRunsCount.stopPolling()

      if (this.pollInterval > 0) {
        this.$apollo.queries.flowRuns.startPolling(this.pollInterval)
        this.$apollo.queries.flowRunsCount.startPolling(this.pollInterval)
      } else {
        this.$apollo.queries.flowRuns.refetch()
        this.$apollo.queries.flowRunsCount.refetch()
      }
    }
  },
  mounted() {
    if (this.pollInterval > 0) {
      this.$apollo.queries.flowRuns.startPolling(this.pollInterval)
      this.$apollo.queries.flowRunsCount.startPolling(this.pollInterval)
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Flow/table-flow-runs.gql'),
      variables() {
        const orderBy = {}
        orderBy[`${this.sortBy}`] = this.sortDesc ? 'desc' : 'asc'

        let variables = {
          limit: this.itemsPerPage,
          name: this.searchFormatted,
          offset: this.offset,
          state: this.state.length === 0 ? null : this.state,
          orderBy
        }

        if (this.aggregate) {
          variables.flow_group_id = this.flow.flow_group_id
        } else {
          variables.flow_id = this.flow.id
        }

        return variables
      },
      update: data => data.flow_run
    },
    flowRunsCount: {
      query: require('@/graphql/Flow/table-flow-runs-count.gql'),
      variables() {
        let variables = {
          name: this.searchFormatted,
          state: this.state.length === 0 ? null : this.state
        }

        if (this.aggregate) {
          variables.flow_group_id = this.flow.flow_group_id
        } else {
          variables.flow_id = this.flow.id
        }

        return variables
      },
      update: data =>
        data && data.flow_run_aggregate
          ? data.flow_run_aggregate.aggregate.count
          : null
    }
  }
}
</script>

<template>
  <v-card class="pa-2 mt-2" tile>
    <CardTitle icon="pi-task-run">
      <div :slot="$vuetify.breakpoint.lgAndUp && 'title'">
        Flow Runs
      </div>

      <div
        :slot="$vuetify.breakpoint.mdAndDown ? 'title' : 'state-filter'"
        :class="{ 'd-flex': $vuetify.breakpoint.mdAndUp }"
      >
        <v-select
          v-model="state"
          outlined
          class="state-filter"
          :style="[
            $vuetify.breakpoint.mdAndUp ? { width: '280px' } : { width: '100%' }
          ]"
          dense
          flat
          solo
          hide-details
          :menu-props="{ bottom: true, offsetY: true }"
          clearable
          :items="states"
          label="Filter by state"
          multiple
        >
          <template #selection="{ item, index }">
            <v-chip
              v-if="index === 0 || index === 1"
              :color="item"
              label
              small
              text-color="white"
            >
              {{ item }}
            </v-chip>
            <span v-if="index === 2" class="grey--text text-caption">
              (+{{ state.length - 2 }})
            </span>
          </template>
        </v-select>
        <v-text-field
          slot="action"
          v-model="searchTerm"
          class="search"
          dense
          solo
          prepend-inner-icon="search"
          hide-details
          placeholder="Search for a Flow Run"
          flat
          style="min-width: 200px;"
        >
        </v-text-field>
      </div>
    </CardTitle>

    <v-card-text>
      <v-data-table
        :footer-props="{
          showFirstLastPage: true,
          itemsPerPageOptions: [10, 15, 25, 50],
          firstIcon: 'first_page',
          lastIcon: 'last_page',
          prevIcon: 'keyboard_arrow_left',
          nextIcon: 'keyboard_arrow_right'
        }"
        class="truncate-table"
        :headers="headersByViewport"
        :header-props="{ 'sort-icon': 'arrow_drop_up' }"
        :items="flowRuns || []"
        :items-per-page.sync="itemsPerPage"
        :loading="$apollo.queries.flowRuns.loading"
        must-sort
        :page.sync="page"
        :server-items-length="flowRunsCount"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :class="{ 'fixed-table': $vuetify.breakpoint.smAndUp }"
        calculate-widths
      >
        <template #item.name="{ item }">
          <truncate :content="item.name">
            <router-link
              class="link text-truncate"
              :to="{ name: 'flow-run', params: { id: item.id } }"
            >
              {{ item.name }}
            </router-link>
          </truncate>
        </template>

        <template #item.scheduled_start_time="{ item }">
          <truncate :content="formatTime(item.scheduled_start_time)">
            {{ formDate(item.scheduled_start_time) }}
          </truncate>
        </template>

        <template #item.start_time="{ item }">
          <truncate :content="formatTime(item.start_time)">
            {{ formDate(item.start_time) }}
          </truncate>
        </template>

        <template #item.end_time="{ item }">
          <truncate :content="formatTime(item.end_time)">
            {{ formDate(item.end_time) }}
          </truncate>
        </template>

        <template #item.duration="{ item }">
          <DurationSpan
            v-if="item.start_time"
            :start-time="item.start_time"
            :end-time="item.end_time"
          />
        </template>

        <template #item.state="{ item }">
          <truncate :content="item.state">
            <v-icon class="mr-1 pointer" small :color="item.state">
              brightness_1
            </v-icon>
          </truncate>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<style lang="scss">
.search {
  border-radius: 0 !important;
  font-size: 0.85rem;

  .v-icon {
    font-size: 20px !important;
  }
}

.state-filter {
  .v-label {
    font-size: 0.85rem;
  }
}
</style>
