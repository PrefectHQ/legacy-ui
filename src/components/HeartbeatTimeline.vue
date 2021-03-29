<script>
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  mixins: [formatTime],
  props: {
    items: {
      type: Array,
      required: false,
      default: () => []
    },
    loading: {
      type: Number,
      required: false,
      default: () => 0
    },
    type: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapGetters('user', ['timezone'])
  },
  methods: {
    icon(item) {
      let icon

      switch (item.__typename) {
        case 'flow_run':
          icon = 'pi-flow-run'
          break
        case 'task_run_state':
          icon = 'compare_arrows'
          break
        case 'task_run':
          icon = 'pi-task-run'
          break
      }
      return icon
    },
    routeTo(item) {
      let routeName
      switch (this.type) {
        case 'project':
          routeName = 'flow'
          break
        case 'flow':
        case 'flow_run':
          routeName = 'flow-run'
          break
        case 'task':
        case 'task_run':
          routeName = 'task-run'
          break
        default:
          routeName = '/'
          break
      }

      return {
        name: routeName,
        params: { id: this.type == 'project' ? item.flow?.id : item.id }
      }
    },
    timelineItemTitle(item) {
      let name
      switch (this.type) {
        case 'project':
          name = item.flow?.name
          break
        case 'flow':
          name = item.name
          break
        case 'flow_run':
          name = item.name
          break
        case 'task_run':
          name = item.name || item.task.name
          break
        case 'task_run_state':
          name = item.message
          break
        default:
          name = ''
          break
      }

      return name
    }
  }
}
</script>

<template>
  <v-expansion-panels accordion hover>
    <v-progress-linear
      :active="loading > 0"
      indeterminate
      color="primary"
      absolute
    />

    <v-timeline
      class="heartbeat-timeline timeline-flat"
      dense
      reverse
      style="width: 100%;"
    >
      <v-slide-x-transition group mode="out-in" leave-absolute>
        <v-timeline-item
          v-if="items.length === 0 && loading > 0"
          key="skeleton"
          small
          color="grey"
        >
          <v-row class="align-center">
            <v-col cols="2">
              <v-skeleton-loader type="text"></v-skeleton-loader>
            </v-col>
            <v-col cols="7">
              <v-skeleton-loader type="text"></v-skeleton-loader>
              <v-skeleton-loader type="text"></v-skeleton-loader>
            </v-col>
            <v-col cols="3">
              <v-divider class="small-divider" />
            </v-col>
          </v-row>
        </v-timeline-item>

        <v-timeline-item
          v-else-if="items.length === 0 && loading === 0"
          key="no-data"
          color="grey"
        >
          <v-list-item>
            <v-list-item-content class="my-0 py-0">
              <v-list-item-title>
                No activity
              </v-list-item-title>
            </v-list-item-content>
            <v-divider class="small-divider" />
          </v-list-item>
        </v-timeline-item>

        <v-timeline-item
          v-for="item in items"
          :key="item.id"
          small
          :color="item.state"
          fill-dot
          :icon="item.map_index > -1 ? 'dynamic_feed' : ''"
          class="pb-2"
        >
          <v-expansion-panel
            :key="item.id"
            class="position-relative pl-2 pr-14"
            style="background-color: transparent;"
            active-class="highlight-icon"
          >
            <v-expansion-panel-header hide-actions class="pl-2 py-0 pr-8">
              <div class="d-flex" style="max-width: 100%;">
                <v-icon class="flex-grow-0 flex-shrink-0" left small>
                  {{ icon(item) }}
                </v-icon>

                <div
                  class="text-body-2 utilGrayMid--text flex-grow-1 flex-shrink-0 py-2"
                  style="max-width: 100%;"
                >
                  <div class="text-caption">
                    {{ item.state }}
                    {{
                      item.state == 'Scheduled'
                        ? `for ${formatDateTime(item.scheduled_start_time)}`
                        : ''
                    }}
                  </div>

                  <div
                    class="text-subtitle-1 utilGrayDark--text mt-n1 text-truncate"
                  >
                    {{ timelineItemTitle(item) }}
                    <v-icon v-if="item.map_index > -1" x-small class="mx-1"
                      >dynamic_feed</v-icon
                    >
                    <span
                      v-if="item.map_index > -1 && !item.name"
                      class="text-body-2"
                      >{{ item.map_index }}</span
                    >
                  </div>

                  <div
                    v-if="item.state_message"
                    class="text-caption text-truncate"
                  >
                    {{ item.state_message }}
                  </div>

                  <div v-else-if="item.name" class="text-caption text-truncate">
                    {{ item.name }}
                  </div>
                </div>
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content
              class="ml-2 pl-0 highlighted-border"
              :style="{
                'border-left': `3px solid var(--v-${item.state}-base)`
              }"
            >
              <div v-if="type !== 'task_run_state'" class="text-body-1">
                <router-link class="link" :to="routeTo(item)">
                  {{ timelineItemTitle(item) }}
                  <span
                    v-if="item.map_index > -1 && !item.name"
                    class="text-caption mb-2"
                  >
                    (Mapped Child {{ item.map_index }})
                  </span>
                </router-link>
              </div>

              <div v-if="type == 'project'" class="text-subtitle-2">
                <router-link
                  class="link"
                  :to="{ name: 'flow-run', params: { id: item.id } }"
                >
                  {{ item.name }}
                </router-link>
              </div>

              <div v-if="type == 'task'">
                <router-link
                  class="link"
                  :to="{ name: 'task-run', params: { id: item.id } }"
                >
                  Task Run
                </router-link>
              </div>

              <div class="mb-1 text-caption">
                {{ formatTime(item.state_timestamp || item.timestamp) }}
              </div>

              <div v-if="item.message">
                <div class="font-weight-medium">Message: </div>
                {{ item.message }}
              </div>
              <div v-else-if="item.state_message" class="mt-2">
                <div class="font-weight-medium">State Message: </div>
                {{ item.state_message }}
              </div>
              <div v-else-if="item.result" class="mt-2">
                <div class="font-weight-medium">Result: </div>
                {{ item.result }}
              </div>

              <v-divider />
            </v-expansion-panel-content>

            <div
              class="text-caption d-flex justify-end align-center position-absolute timeline-timestamp"
            >
              <v-tooltip top>
                <template #activator="{ on }">
                  <span v-on="on">
                    {{ shortTime(item.state_timestamp || item.timestamp) }}
                  </span>
                </template>
                <span>
                  {{ formatTime(item.state_timestamp || item.timestamp) }}
                </span>
              </v-tooltip>

              <div class="small-divider ml-1">
                <v-divider class="small-divider" />
              </div>
            </div>
          </v-expansion-panel>
        </v-timeline-item>
      </v-slide-x-transition>
    </v-timeline>
  </v-expansion-panels>
</template>

<style lang="scss">
// stylelint-disable
.heartbeat-timeline {
  overflow: hidden;

  &::before {
    right: calc(23px - 1px) !important;
  }

  .small-divider {
    width: 15px;
  }

  .v-timeline-item__divider {
    min-width: 46px !important;
  }

  .v-timeline-item__body {
    max-width: calc(100% - 46px) !important;
  }

  .timeline-timestamp {
    right: 0;
    top: 50%;
    transform: translate(0, -50%);
    transition: all 150ms;
  }

  .highlight-icon {
    i {
      color: var(--v-primary-base) !important;
    }
  }
}
// stylelint-enable

.timeline-flat {
  .v-expansion-panel {
    &::before {
      box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.2), 0 0 0 0 rgba(0, 0, 0, 0.14),
        0 0 0 0 rgba(0, 0, 0, 0.12) !important;
    }
  }
}
</style>
