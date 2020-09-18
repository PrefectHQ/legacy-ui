<script>
import { mapGetters } from 'vuex'
// import { mapMutations } from 'vuex'

import CardTitle from '@/components/Card-Title'
import moment from '@/utils/moment'

export default {
  components: {
    CardTitle
  },
  data() {
    return {
      loading: 0,
      queryError: false
    }
  },
  computed: {
    ...mapGetters('agent', ['staleThreshold', 'unhealthyThreshold', 'agents']),
    ...mapGetters('api', ['isCloud']),
    agentTracker() {
      return this.agents?.reduce(
        (tracker, agent) => {
          const secondsSinceLastQuery = moment().diff(
            moment(agent.last_queried),
            'seconds'
          )

          if (secondsSinceLastQuery < 60 * this.staleThreshold) {
            tracker.healthy++
          } else if (secondsSinceLastQuery < 60 * this.unhealthyThreshold) {
            tracker.stale++
          } else {
            tracker.unhealthy++
          }

          return tracker
        },
        {
          healthy: 0,
          stale: 0,
          unhealthy: 0
        }
      )
    },
    cardTitle() {
      if (!this.agents) return '0 Agents'

      return `${this.agents?.length} ${
        this.agents?.length === 1 ? 'Agent' : 'Agents'
      }`
    },
    hasError() {
      return this.queryError && !this.agents
    },
    isLoading() {
      return this.loading > 0
    },
    statusColor() {
      if (this.isLoading) return 'secondaryGray'
      if (
        this.hasError ||
        (this.agentTracker?.healthy === 0 &&
          this.agentTracker?.stale === 0 &&
          this.agentTracker?.unhealthy > 0)
      )
        return 'error'

      if (
        this.agents?.length === 0 ||
        this.agentTracker?.stale > 0 ||
        this.agentTracker?.unhealthy > 0
      ) {
        return 'warning'
      }

      return 'success'
    }
  }
  // watch: {
  //   agents(val) {
  //     this.setAgents(val)
  //   }
  // },
  // methods: {
  //   ...mapMutations('agent', ['setAgents'])
  // },
  // apollo: {
  //   agents: {
  //     query() {
  //       return require('@/graphql/Agent/agents.js').default(this.isCloud)
  //     },
  //     loadingKey: 'loading',
  //     pollInterval: 3000,
  //     update: data => {
  //       return data.agent
  //     }
  //   }
  // }
}
</script>

<template>
  <v-card class="py-2 position-relative" style="height: 330px;" tile>
    <v-system-bar :color="statusColor" :height="5" absolute>
      <!-- We should include a state icon here when we've got those -->
      <!-- <v-icon>{{ flow.flow_runs[0].state }}</v-icon> -->
    </v-system-bar>

    <CardTitle
      :title="cardTitle"
      icon="pi-agent"
      :icon-color="statusColor"
      icon-class="mb-1"
      :loading="isLoading"
      :data-cy="
        'agents-tile-healthy-count|' + (agentTracker ? agentTracker.healthy : 0)
      "
    />

    <v-list class="card-content">
      <v-slide-y-reverse-transition v-if="isLoading" leave-absolute group>
        <v-skeleton-loader key="loading" type="list-item-avatar">
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
              class="inline-block text-subtitle-1 font-weight-light"
              style="line-height: 1.25rem;"
            >
              Something went wrong while trying to fetch running agents. Please
              try refreshing your page. If this error persists, return to this
              page after a few minutes.
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-slide-y-reverse-transition>

      <v-slide-y-reverse-transition v-else leave-absolute group>
        <v-list-item
          v-if="agents && agents.length === 0"
          key="no-agents"
          color="grey"
        >
          <v-list-item-avatar class="mr-0">
            <v-icon class="warning--text mb-1">
              warning
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content class="my-0 py-3">
            <div
              class=" text-subtitle-1 font-weight-light"
              style="line-height: 1.25rem;"
            >
              You do not have any agents querying Prefect Cloud for flow runs.
            </div>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          v-if="agentTracker.healthy > 0"
          key="healthy-agents"
          color="grey"
        >
          <v-list-item-avatar class="mr-0">
            <v-icon class="green--text">
              check
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content class="my-0 py-3">
            <div
              class=" text-subtitle-1 font-weight-light"
              style="line-height: 1.25rem;"
            >
              <span class="font-weight-medium">{{ agentTracker.healthy }}</span>
              agent{{ agentTracker.healthy === 1 ? '' : 's' }}
              {{ agentTracker.healthy === 1 ? 'is' : 'are' }} querying Cloud for
              flow runs
            </div>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          v-if="agentTracker.stale > 0"
          key="stale-agents"
          color="grey"
        >
          <v-list-item-avatar class="mr-0">
            <v-icon class="warning--text mb-1">
              warning
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content class="my-0 py-3">
            <div
              class="text-subtitle-1 font-weight-light"
              style="line-height: 1.25rem;"
            >
              <span class="font-weight-medium">{{ agentTracker.stale }}</span>
              agent{{ agentTracker.stale === 1 ? '' : 's' }}
              {{ agentTracker.stale === 1 ? 'has' : 'have' }}
              not queried Cloud for flow runs in the last
              {{
                staleThreshold === 1 ? 'minute' : `${staleThreshold} minutes`
              }}
            </div>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          v-if="agentTracker.unhealthy > 0"
          key="unhealthy-agents"
          color="grey"
        >
          <v-list-item-avatar class="mr-0">
            <v-icon class="error--text mb-1">
              error
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content class="my-0 py-3">
            <div
              class="text-subtitle-1 font-weight-light"
              style="line-height: 1.25rem;"
            >
              <span>
                <span class="font-weight-medium">
                  {{ agentTracker.unhealthy }}
                </span>
                agent{{ agentTracker.unhealthy === 1 ? '' : 's' }}
                {{ agentTracker.unhealthy === 1 ? 'has' : 'have' }}
                not queried Cloud for flow runs in the last
                {{
                  unhealthyThreshold === 1
                    ? 'minute'
                    : `${unhealthyThreshold} minutes`
                }}
              </span>
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-slide-y-reverse-transition>
    </v-list>

    <v-card-actions>
      <v-spacer />
      <v-btn small color="primary" text @click="$emit('view-details-clicked')">
        View details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.bottom-right {
  bottom: 0;
  right: 0;
}

.card-content {
  height: 100%;
  max-height: 210px;
  overflow-y: scroll;
}

.time-interval-picker {
  font-size: 0.85rem;
  margin: auto;
  margin-right: 0;
  max-width: 150px;
}

.position-relative {
  position: relative;
}

a {
  text-decoration: none !important;
}
</style>
