<script>
export default {}
</script>

<template>
  <v-card v-if="showMenu" :style="menuStyle" tile>
    <v-card-title class="text-subtitle-1">
      <router-link :to="{ name: 'task-run', params: { id: menuTaskRun.id } }">
        {{ menuTaskRun.task.name
        }}{{ menuTaskRun.map_index > -1 ? `(${menuTaskRun.map_index})` : '' }}
      </router-link>
    </v-card-title>
    <v-card-text>
      <div>
        State:
        <span :style="statusStyle(tooltipTaskRun.state)"></span>
        <span class="font-weight-bold"> {{ tooltipTaskRun.state }}</span>
      </div>
      <div
        v-if="menuTaskRun.start_time || flowRun.start_time"
        class="subtitle d-flex align-end justify-space-between"
      >
        Duration:
        <DurationSpan
          class="font-weight-bold"
          :start-time="menuTaskRun.start_time || flowRun.start_time"
          :end-time="
            menuTaskRun.end_time ? menuTaskRun.end_time : flowRun.end_time
          "
        />
      </div>
      <div
        v-if="menuTaskRun.start_time || flowRun.start_time"
        class="subtitle d-flex align-end justify-space-between"
      >
        Start:
        <span class="font-weight-bold">
          {{ formatDate(menuTaskRun.start_time || flowRun.start_time) }}
        </span>
      </div>
      <div
        v-if="menuTaskRun.end_time || flowRun.end_time"
        class="subtitle d-flex align-end justify-space-between"
      >
        End:
        <span class="font-weight-bold">
          {{ formatDate(menuTaskRun.end_time || flowRun.end_time) }}
        </span>
      </div>
      <div
        v-if="menuTaskRun.state_timestamp"
        class="subtitle d-flex align-end justify-space-between"
      >
        Updated:
        <span class="font-weight-bold">
          {{ formatDate(menuTaskRun.state_timestamp) }}
        </span>
      </div>
      <div class="subtitle d-flex align-end justify-space-between">
        Max Retries:
        <span class="font-weight-bold">
          {{ menuTaskRun.task.max_retries || 0 }}
        </span>
      </div>
      <div class="subtitle d-flex align-end justify-space-between">
        Retry delay:
        <span class="font-weight-bold">
          {{ menuTaskRun.task.retry_delay || 0 }}
        </span>
      </div>
      <v-divider class="my-2" />
      <div class="text-subtitle-1">
        <div>Message:</div>
        <div class="font-weight-bold">
          {{ menuTaskRun.state_message || 'No message' }}
        </div>
      </div>
      <v-divider class="my-2" />
      <div class="text-subtitle-1">
        <div>Result:</div>
        <div class="font-weight-bold">
          {{ menuTaskRun.state_result || 'No result' }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
