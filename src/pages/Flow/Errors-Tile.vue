<script>
import CardTitle from '@/components/Card-Title'
import { mapGetters } from 'vuex'
import { roundedOneAgo } from '@/utils/dateTime'
import moment from '@/utils/moment'

export default {
  components: {
    CardTitle
  },
  props: {
    aggregate: {
      type: Boolean,
      default: () => false
    },
    flow: {
      required: true,
      type: Object
    },
    fullHeight: {
      required: false,
      type: Boolean,
      default: () => false
    }
  },
  data() {
    return {
      dateFilters: [
        { name: '1 Hour', value: 'hour' },
        { name: '24 Hours', value: 'day' },
        { name: '7 Days', value: 'week' },
        { name: '30 Days', value: 'month' }
      ],
      loading: 0,
      selectedDateFilter: 'day'
    }
  },
  computed: {
    ...mapGetters('user', ['timezone']),
    pollInterval() {
      return this.flow.archived ? 0 : 60000
    },
    filteredErrors() {
      return this.errors
        ?.filter(error => {
          return error.task_runs?.length > 0
        })
        .map(error => error.task_runs)
        .flat()
    }
  },
  watch: {
    flow(val, prevVal) {
      this.$apollo.queries.errors.stopPolling()

      if (this.pollInterval > 0) {
        this.$apollo.queries.errors.startPolling(this.pollInterval)
      } else {
        this.$apollo.queries.errors.refetch()
      }

      if (val.archived !== prevVal.archived && val.archived) {
        this.selectedDateFilter = 'day'
      }
    }
  },
  mounted() {
    if (this.pollInterval > 0) {
      this.$apollo.queries.errors.startPolling(this.pollInterval)
    }
  },
  methods: {
    formatTime(timestamp) {
      let timeObj = moment(timestamp).tz(this.timezone),
        shortenedTz = moment()
          .tz(this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
          .zoneAbbr()
      return `${
        timeObj ? timeObj.format('h:mma') : moment(timestamp).format('h:mma')
      } ${shortenedTz}`
    },
    formatTimeRelative(timestamp) {
      let timeObj = moment(timestamp).tz(this.timezone)
      return timeObj ? timeObj.fromNow() : moment(timestamp).fromNow()
    },
    onIntersect([entry]) {
      this.$apollo.queries.errors.skip = !entry.isIntersecting
    }
  },
  apollo: {
    errors: {
      query: require('@/graphql/Flow/errors.gql'),
      variables() {
        let variables = {
          updated: { _gte: roundedOneAgo(this.selectedDateFilter) }
        }

        if (this.aggregate) {
          variables.flow_group_id = this.flow.flow_group_id
        } else {
          variables.flow_id = this.flow.id
        }

        if (this.flow.archived) {
          variables.updated = {
            _gte: moment(this.flow.updated)
              .subtract({ hours: 24 })
              .format(),
            _lte: moment(this.flow.updated).format()
          }
        }

        return variables
      },
      loadingKey: 'loading',
      update: data => data.flow_run
    }
  }
}
</script>

<template>
  <v-card
    v-intersect="{ handler: onIntersect }"
    class="py-2 position-relative"
    tile
    :style="{
      height: fullHeight ? '100%' : 'auto'
    }"
  >
    <v-system-bar
      :color="
        flow.archived
          ? 'grey'
          : loading > 0
          ? 'secondaryGray'
          : filteredErrors && filteredErrors.length > 0
          ? 'Failed'
          : 'Success'
      "
      :height="5"
      absolute
    >
      <!-- We should include a state icon here when we've got those -->
      <!-- <v-icon>{{ flow.flow_runs[0].state }}</v-icon> -->
    </v-system-bar>
    <v-tooltip top>
      <template #activator="{ on }">
        <CardTitle
          :title="
            `${filteredErrors ? filteredErrors.length : 0} Recent Task Failures`
          "
          icon="error"
          :icon-color="
            flow.archived || loading > 0
              ? 'grey'
              : filteredErrors && filteredErrors.length > 0
              ? 'Failed'
              : 'Success'
          "
          :loading="errors && errors.length === 0 && loading > 0"
        >
          <div slot="action" v-on="on">
            <v-select
              data-public
              v-if="!flow.archived"
              v-model="selectedDateFilter"
              class="time-interval-picker"
              :items="dateFilters"
              dense
              solo
              item-text="name"
              item-value="value"
              hide-details
              flat
            >
              <template #prepend-inner>
                <v-icon color="utilGrayDark" x-small>
                  history
                </v-icon>
              </template>
            </v-select>
          </div>
        </CardTitle>
      </template>
      <span>
        Filter by when runs were last updated
      </span>
    </v-tooltip>

    <v-list class="error-card-content">
      <v-slide-y-reverse-transition
        v-if="!errors && loading > 0"
        mode="out-in"
        leave-absolute
        group
      >
        <v-skeleton-loader key="skeleton" type="list-item-three-line">
        </v-skeleton-loader>
      </v-slide-y-reverse-transition>

      <v-slide-y-reverse-transition
        v-else-if="filteredErrors && filteredErrors.length > 0"
        leave-absolute
        mode="out-in"
        group
      >
        <v-lazy
          v-for="error in filteredErrors"
          :key="error.id"
          :options="{
            threshold: 0.75
          }"
          min-height="40px"
          transition="fade"
        >
          <v-list-item
            :to="{
              name: 'task-run',
              params: { id: error.id },
              query: {
                logId: ''
              }
            }"
          >
            <v-list-item-content>
              <v-list-item-title>
                <div
                  class="text-truncate d-block ma-0 pa-0"
                  style="max-width: 95%;"
                >
                  {{ error.task.name }}
                </div>
              </v-list-item-title>
              <v-list-item-subtitle class="font-weight-light">
                <div class="text-caption">
                  {{ formatTimeRelative(error.state_timestamp) }}
                </div>

                <div
                  class="text-subtitle-2 font-weight-light Failed--text text--darken-1"
                >
                  {{ error.state_message }}
                </div>
              </v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-avatar>
              <v-icon>arrow_right</v-icon>
            </v-list-item-avatar>
          </v-list-item>
        </v-lazy>
      </v-slide-y-reverse-transition>

      <v-slide-y-transition v-else leave-absolute mode="out-in" group>
        <v-list-item key="no-data" color="grey">
          <v-list-item-avatar class="mr-0">
            <v-icon class="green--text">check</v-icon>
          </v-list-item-avatar>
          <v-list-item-content class="my-0 py-0">
            <div
              v-if="!flow.archived"
              class="text-subtitle-1 font-weight-light"
              style="line-height: 1.25rem;"
            >
              No reported errors in the last {{ selectedDateFilter }}...
              Everything looks good!
            </div>
            <div
              v-else
              class="text-subtitle-1 font-weight-light"
              style="line-height: 1.25rem;"
            >
              No errors were reported in the last
              {{ selectedDateFilter }} before this version was archived.
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-slide-y-transition>
    </v-list>

    <div v-if="errors && errors.length > 3" class="pa-0 error-footer"> </div>
  </v-card>
</template>

<style lang="scss" scoped>
.error-card-content {
  max-height: 254px;
  overflow-y: auto;
}

.error-footer {
  background-image: linear-gradient(transparent, 60%, rgba(0, 0, 0, 0.1));
  bottom: 6px;
  height: 6px !important;
  pointer-events: none;
  position: absolute;
  width: 100%;
}

.time-interval-picker {
  font-size: 0.85rem;
  margin: auto;
  margin-right: 0;
  max-width: 150px;
}

a {
  text-decoration: none !important;
}
</style>
