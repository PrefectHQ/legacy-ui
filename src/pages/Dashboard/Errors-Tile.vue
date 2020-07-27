//Really want failed tasks //But searching by task times out the DB // So search
by flow and flow run? But then need to re-do a lot of client side filtering and
then re-query

<script>
import { mapGetters, mapMutations } from 'vuex'
import { oneAgo } from '@/utils/dateTime'
import CardTitle from '@/components/Card-Title'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    CardTitle
  },
  mixins: [formatTime],
  props: {
    projectId: {
      type: String,
      default: null
    },
    fullHeight: {
      required: false,
      type: Boolean,
      default: () => false
    }
  },
  data() {
    return {
      failures: [],
      flowIds: [],
      loading: 0,
      queryError: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    hasError() {
      return this.queryError && !this.failures
    },
    displayFailures() {
      if (!this.failures) return null
      const sorted = this.sortFailures(this.failures)
      return sorted
    },
    failureCount() {
      return this.failures.length
    }
  },
  watch: {
    tenant(val) {
      this.failures = []

      if (val) {
        this.failures = []

        setTimeout(() => {
          // this.$apollo.queries.failuresCount.refetch()
          this.$apollo.queries.failures.refetch()
        }, 1000)
      }
    }
  },
  methods: {
    ...mapMutations('sideDrawer', ['openDrawer']),
    failedRuns(failure) {
      const failedRuns = failure.filter(run => {
        return run.state === 'Failed'
      })
      return failedRuns.length
    },
    totalRuns(failure) {
      return failure.length
    },
    sortFailures(failures) {
      return failures.sort((flowRunA, flowRunB) => {
        if (flowRunA?.failed_count && flowRunB?.failed_count) {
          const aFailurePercentage =
            flowRunA.failed_count.aggregate.count /
            flowRunA.runs_count.aggregate.count
          const bFailurePercentage =
            flowRunB.failed_count.aggregate.count /
            flowRunB.runs_count.aggregate.count

          if (aFailurePercentage > bFailurePercentage) {
            return -1
          } else if (aFailurePercentage < bFailurePercentage) {
            return 1
          }
          return 0
        }
        return 0
      })
    },
    calcHeartBeat() {
      return oneAgo(this.selectedDateFilter)
    }
  },
  apollo: {
    failures: {
      query: require('@/graphql/Dashboard/failures.gql'),
      variables() {
        return {
          // flowIds: null,
          heartbeat: oneAgo(this.selectedDateFilter)
        }
      },
      // skip: true,
      loadingKey: 'loading',
      //Update this to be an alert!
      error() {
        this.queryError = true
      },
      pollInterval: 30000,
      update: data => {
        return data.task_run
      }
    }
  }
}
</script>

<template>
  <v-card
    v-if="hasError"
    class="py-2 position-relative"
    tile
    style="height: 100%;"
  >
    <v-slide-y-reverse-transition leave-absolute group>
      <v-list-item key="error" color="grey">
        <v-list-item-avatar class="mr-0">
          <v-icon class="error--text">
            error
          </v-icon>
        </v-list-item-avatar>
        <v-list-item-content class="my-0 py-3">
          <div
            class="inline-block subtitle-1 font-weight-light"
            style="line-height: 1.25rem;"
          >
            Something went wrong while trying to fetch Task failures
            information. Please try refreshing your page. If this error
            persists, return to this page after a few minutes.
          </div>
        </v-list-item-content>
      </v-list-item>
    </v-slide-y-reverse-transition>
  </v-card>
  <v-card v-else class="py-2 position-relative" tile style="height: 100%;">
    <v-system-bar
      :color="
        loading > 0 ? 'secondaryGray' : failureCount ? 'failRed' : 'Success'
      "
      :height="5"
      absolute
    >
      <!-- We should include a state icon here when we've got those -->
      <!-- <v-icon>{{ flow.flow_runs[0].state }}</v-icon> -->
    </v-system-bar>

    <v-tooltip top>
      <template v-slot:activator="{ on }">
        <CardTitle
          :title="`${failureCount} Failed Tasks`"
          icon="pi-task"
          :icon-color="
            loading > 0 ? 'grey' : failureCount ? 'failRed' : 'Success'
          "
          :loading="loading > 0"
        >
          <div slot="action" v-on="on">
            <v-select
              v-model="selectedDateFilter"
              class="time-interval-picker"
              :items="shortDateFilters"
              dense
              solo
              item-text="name"
              item-value="value"
              hide-details
              flat
            >
              <template v-slot:prepend-inner>
                <v-icon color="black" x-small>
                  history
                </v-icon>
              </template>
            </v-select>
          </div>
        </CardTitle>
      </template>
      <span>
        Filter by when flows were last updated
      </span>
    </v-tooltip>

    <v-list dense class="card-content">
      <v-slide-y-reverse-transition v-if="loading > 0" leave-absolute group>
        <v-skeleton-loader key="skeleton" type="list-item-three-line">
        </v-skeleton-loader>
      </v-slide-y-reverse-transition>

      <v-slide-y-reverse-transition
        v-else-if="failureCount"
        leave-absolute
        group
      >
        <v-lazy
          v-for="failure in displayFailures"
          :key="failure.id"
          :options="{
            threshold: 0.75
          }"
          min-height="40px"
          transition="fade"
        >
          <ApolloQuery
            :query="
              gql => gql`
                query($taskId: uuid, $heartbeat: timestamptz) {
                  task(where: { id: { _eq: $taskId } }) {
                    task_runs(where: { updated: { _gte: $heartbeat } }) {
                      id
                      state
                    }
                  }
                }
              `
            "
            :poll-interval="50000"
            :variables="{
              taskId: failure.task.id,
              heartbeat: calcHeartBeat()
            }"
          >
            <!-- eslint-disable-next-line -->
            <template v-slot="{ result: { loading, error, data } }">
              <!-- Loading -->
              <div v-if="loading" class="loading apollo"
                ><v-skeleton-loader key="skeleton" type="list-item-three-line">
                </v-skeleton-loader
              ></div>
              <!-- Error -->
              <div v-else-if="error"
                ><v-list-item class="text-truncate">
                  <v-list-item-title class="subtitle-2 red--text">
                    An error occurred fetching this task information.
                  </v-list-item-title></v-list-item
                ></div
              ><!-- Result -->
              <div v-else-if="data && data.task" class="result apollo">
                <v-list-item
                  class="text-truncate"
                  :to="{
                    name: 'task',
                    params: { id: failure.task.id }
                  }"
                >
                  <v-list-item-content>
                    <v-list-item-title class="subtitle-2">
                      <router-link
                        class="link"
                        :to="{
                          name: 'task',
                          params: { id: failure.task.id }
                        }"
                        >{{ failure.task.name }}</router-link
                      >
                    </v-list-item-title>

                    <v-list-item-subtitle>
                      {{ failedRuns(data.task[0].task_runs) }}
                      /
                      {{ totalRuns(data.task[0].task_runs) }}
                      Runs failed
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-avatar
                    ><v-icon>arrow_right</v-icon></v-list-item-avatar
                  >
                </v-list-item> </div
              ><div v-else-if="data"> No info :(</div>
              <!-- No result -->
              <div v-else class="no-result apollo"
                ><v-skeleton-loader key="skeleton" type="list-item-three-line">
                </v-skeleton-loader
              ></div>
            </template>
          </ApolloQuery>
        </v-lazy>
      </v-slide-y-reverse-transition>
      <v-slide-y-transition v-else leave-absolute group>
        <v-list-item key="no-data" color="grey">
          <v-list-item-avatar class="mr-0">
            <v-icon class="green--text">check</v-icon>
          </v-list-item-avatar>
          <v-list-item-content class="my-0 py-0">
            <div
              class="subtitle-1 font-weight-light"
              style="line-height: 1.25rem;"
            >
              No reported failures in the last {{ selectedDateFilter }}...
              Everything looks good!
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-slide-y-transition>
    </v-list>
    <div v-if="failures && failures.length > 3" class="pa-0 footer"> </div>
  </v-card>
</template>

<style lang="scss" scoped>
.time-interval-picker {
  font-size: 0.85rem;
  margin: auto;
  margin-right: 0;
  max-width: 150px;
}

.card-content {
  height: 100%;
  max-height: 254px;
  overflow-y: scroll;
}

.footer {
  background-image: linear-gradient(transparent, 60%, rgba(0, 0, 0, 0.1));
  bottom: 6px;
  height: 6px !important;
  pointer-events: none;
  position: absolute;
  width: 100%;
}
</style>
