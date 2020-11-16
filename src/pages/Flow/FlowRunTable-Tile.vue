<script>
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'

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
          width: '20%'
        },
        {
          text: 'Scheduled Start',
          value: 'scheduled_start_time',
          align: 'start',
          width: '18%'
        },
        {
          text: 'Start Time',
          value: 'start_time',
          align: 'start',
          width: '18%'
        },
        { text: 'End Time', value: 'end_time', align: 'start', width: '18%' },
        { text: 'Duration', value: 'duration', align: 'end', width: '15%' },
        { text: 'State', value: 'state', align: 'end', width: '10%' }
      ],
      itemsPerPage: 15,
      page: 1,
      searchTerm: null,
      sortBy: 'scheduled_start_time',
      sortDesc: true
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
        let variables = { name: this.searchFormatted }

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
    <CardTitle title="Flow Runs" icon="pi-flow-run">
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
        style="min-width: 400px;"
      >
      </v-text-field>
    </CardTitle>

    <v-card-text>
      <v-data-table
        :footer-props="{
          showFirstLastPage: true,
          itemsPerPageOptions: [5, 15, 25, 50],
          firstIcon: 'first_page',
          lastIcon: 'last_page',
          prevIcon: 'keyboard_arrow_left',
          nextIcon: 'keyboard_arrow_right'
        }"
        class="truncate-table"
        :headers="headers"
        :header-props="{ 'sort-icon': 'arrow_drop_up' }"
        :items="flowRuns || []"
        :items-per-page.sync="itemsPerPage"
        :loading="$apollo.queries.flowRuns.loading"
        must-sort
        :page.sync="page"
        :server-items-length="flowRunsCount"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :class="{ 'fixed-table': this.$vuetify.breakpoint.smAndUp }"
        calculate-widths
      >
        <template #item.name="{ item }">
          <truncate :content="item.name">
            <router-link
              class="link truncate"
              :to="{ name: 'flow-run', params: { id: item.id } }"
            >
              {{ item.name }}
            </router-link>
          </truncate>
        </template>

        <template #item.scheduled_start_time="{ item }">
          <truncate :content="formDate(item.scheduled_start_time)">
            {{ formDate(item.scheduled_start_time) }}
          </truncate>
        </template>

        <template #item.start_time="{ item }">
          <v-tooltip top>
            <template #activator="{ on }">
              <span v-on="on">{{ formDate(item.start_time) }}</span>
            </template>
            <span>{{ formatTime(item.start_time) }}</span>
          </v-tooltip>
        </template>

        <template #item.end_time="{ item }">
          <v-tooltip top>
            <template #activator="{ on }">
              <span v-on="on">{{ formDate(item.end_time) }}</span>
            </template>
            <span>{{ formatTime(item.end_time) }}</span>
          </v-tooltip>
        </template>

        <template #item.duration="{ item }">
          <DurationSpan
            v-if="item.start_time"
            :start-time="item.start_time"
            :end-time="item.end_time"
          />
        </template>

        <template #item.state="{ item }">
          <v-tooltip top>
            <template #activator="{ on }">
              <v-icon class="mr-1 pointer" small :color="item.state" v-on="on">
                brightness_1
              </v-icon>
            </template>
            <span>{{ item.state }}</span>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.search {
  border-radius: 0 !important;
  font-size: 0.85rem;

  .v-icon {
    font-size: 20px !important;
  }
}
</style>
