<script>
import { mapGetters } from 'vuex'
import { roundedOneAgo } from '@/utils/dateTime'
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
    }
  },
  data() {
    return {
      failures: null,
      loading: 0,
      queryError: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    hasError() {
      return this.queryError && !this.failures
    },
    stateColor() {
      if (this.loading > 0) return 'secondaryGray'
      if (this.hasError) return 'gray'
      if (this.failureCount > 0) return 'failRed'
      return 'Success'
    },
    cardTitle() {
      if (this.hasError) return 'Failed flows'
      return `${this.failureCount} failed flows`
    },
    failureCount() {
      if (this.failures?.length) {
        return this.failures.length
      }
      return 0
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
    onIntersect([entry]) {
      this.$apollo.queries.failures.skip = !entry.isIntersecting
    }
  },
  apollo: {
    failures: {
      query: require('@/graphql/Dashboard/flow-failures.gql'),
      variables() {
        return {
          projectId: this.projectId ? this.projectId : null,
          heartbeat: roundedOneAgo(this.selectedDateFilter)
        }
      },
      loadingKey: 'loading',
      error() {
        this.queryError = true
      },
      pollInterval: 30000,
      update: data => {
        return data.flow_run.sort((a, b) => {
          if (new Date(a.state_timestamp) < new Date(b.state_timestamp)) {
            return 1
          } else {
            return -1
          }
        })
      }
    }
  }
}
</script>

<template>
  <v-card
    v-intersect="{ handler: onIntersect }"
    class="py-2 position-relative"
    tile
    style="height: 100%;"
  >
    <v-system-bar :color="stateColor" :height="5" absolute>
      <!-- We should include a state icon here when we've got those -->
      <!-- <v-icon>{{ flow.flow_runs[0].state }}</v-icon> -->
    </v-system-bar>

    <v-tooltip top>
      <template #activator="{ on }">
        <CardTitle
          :title="cardTitle"
          icon="pi-flow"
          :icon-color="stateColor"
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
        Filter on flow run scheduled start time
      </span>
    </v-tooltip>

    <v-card-text class="pa-0">
      <v-list class="card-content">
        <v-slide-y-reverse-transition v-if="loading > 0" leave-absolute group>
          <v-skeleton-loader key="skeleton" type="list-item-three-line">
          </v-skeleton-loader>
        </v-slide-y-reverse-transition>
        <v-slide-y-reverse-transition v-else-if="hasError" leave-absolute group>
          <v-list-item key="error" color="grey">
            <v-list-item-avatar class="mr-0">
              <v-icon class="error--text">
                error
              </v-icon>
            </v-list-item-avatar>
            <v-list-item-content class="my-0 py-3">
              <div
                class="d-inline-block text-subtitle-1 font-weight-light"
                style="line-height: 1.25rem;"
              >
                Something went wrong while trying to fetch failed flow
                information. Please try refreshing your page. If this error
                persists, return to this page after a few minutes.
              </div>
            </v-list-item-content>
          </v-list-item>
        </v-slide-y-reverse-transition>

        <v-slide-y-reverse-transition
          v-else-if="failureCount"
          leave-absolute
          group
        >
          <v-lazy
            v-for="failure in failures"
            :key="failure.flow_id"
            :options="{
              threshold: 0.75
            }"
            min-height="40px"
            transition="slide-y"
          >
            <v-list-item
              :to="{
                name: 'flow',
                params: { id: failure.flow.flow_group_id }
              }"
            >
              <v-list-item-content>
                <v-list-item-title>
                  <div
                    class="text-truncate d-inline-block"
                    style="max-width: 95%;"
                  >
                    {{ failure.flow.name }}
                  </div>
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDateTime(failure.state_timestamp) }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-avatar>
                <v-icon>arrow_right</v-icon>
              </v-list-item-avatar>
            </v-list-item>
          </v-lazy>
        </v-slide-y-reverse-transition>
        <v-slide-y-transition v-else leave-absolute group>
          <v-list-item key="no-data" color="grey">
            <v-list-item-avatar class="mr-0">
              <v-icon class="green--text">check</v-icon>
            </v-list-item-avatar>
            <v-list-item-content class="my-0 py-0">
              <div
                class="text-subtitle-1 font-weight-light"
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
    </v-card-text>
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
  overflow-y: auto;
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
