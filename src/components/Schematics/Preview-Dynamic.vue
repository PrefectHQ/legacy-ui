<script>
// import moment from '@/utils/moment'
import { STATE_COLORS } from '@/utils/states'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  filters: {
    typeClass: val => val.split('.').pop(),
    shortenString: str => (str.length > 20 ? str.substring(0, 20) + '...' : str)
  },
  mixins: [formatTime],
  props: {
    task: {
      type: Object,
      required: true
    },
    runs: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  data() {
    return { expanded: true }
  },
  computed: {
    resultExists() {
      return this.task.serialized_state && this.task.serialized_state._result
    }
  },
  methods: {
    runStyle(state) {
      return {
        'border-left': state
          ? `0.5rem solid ${
              this.disabled
                ? this.hex2RGBA(STATE_COLORS[state])
                : STATE_COLORS[state]
            } !important`
          : ''
      }
    }
  }
}
</script>

<template>
  <v-card-text class="full-height position-relative pa-0 caption">
    <v-list-item
      class="py-2 pr-2 pl-3"
      dense
      :to="{ name: 'task-run', params: { id: task.id } }"
      :style="runStyle(task.state)"
    >
      <v-list-item-content class="my-0 py-0">
        <v-list-item-subtitle class="caption mb-0">
          Task Run
        </v-list-item-subtitle>
        <v-list-item-title>
          {{ task.flow_run_name }} - {{ task.task.name }}
          <span v-if="task.map_index > -1"> ({{ task.map_index }})</span>
        </v-list-item-title>
        <v-list-item-subtitle class="caption">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <span v-on="on">
                <span :class="`${task.state}--text`">
                  {{ task.state }}
                </span>
                - {{ formDate(task.state_timestamp) }}
              </span>
            </template>
            <span>
              {{ formatTime(task.state_timestamp) }}
            </span>
          </v-tooltip>
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-avatar class="body-2">
        <v-icon class="grey--text text--darken-2">
          arrow_right
        </v-icon>
      </v-list-item-avatar>
    </v-list-item>

    <v-list-item
      dense
      class="py-2 pr-2 pl-5"
      :to="{ name: 'task', params: { id: task.task.id } }"
    >
      <v-list-item-content class="my-0 py-0">
        <v-list-item-subtitle class="caption mb-0">
          Task
        </v-list-item-subtitle>
        <v-list-item-title>
          {{ task.task.name }}
        </v-list-item-title>
      </v-list-item-content>

      <v-list-item-avatar class="body-2">
        <v-icon class="grey--text">
          arrow_right
        </v-icon>
      </v-list-item-avatar>
    </v-list-item>

    <v-divider></v-divider>

    <v-card-text class="pb-0 pl-3 pr-2 caption">
      <v-row>
        <v-col cols="12" class="pb-0 pt-0">
          <span class="black--text">Task Run State Message:</span>
        </v-col>
        <v-col cols="12" class="pt-0">
          {{ task.state_message }}
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="6" class="pt-0">
          <span class="black--text">Max retries:</span>
        </v-col>
        <v-col cols="6" class="text-right pt-0">
          {{ task.task.max_retries }}
        </v-col>
      </v-row>

      <v-row v-if="task.task.max_retries > 0">
        <v-col cols="6" class="pt-0">
          <span class="black--text">Retry delay:</span>
        </v-col>
        <v-col cols="6" class="text-right pt-0">
          {{ task.task.retry_delay }}
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="6" class="pt-0">
          <span class="black--text">Class:</span>
        </v-col>
        <v-col cols="6" class="text-right pt-0">
          {{ task.task.type | typeClass }}
        </v-col>
      </v-row>

      <v-row v-if="resultExists">
        <v-col cols="6" class="pt-0">
          <span class="black--text">Result Type:</span>
        </v-col>
        <v-col cols="6" class="text-right pt-0">
          {{ task.serialized_state._result.type | typeClass }}
        </v-col>
      </v-row>

      <v-row v-if="resultExists">
        <v-col cols="6" class="pt-0">
          <span class="black--text">Result Location:</span>
        </v-col>
        <v-col cols="6" class="text-right pt-0">
          <v-tooltip top>
            <template v-slot:activator="{ on }">
              <span v-on="on">
                {{
                  task.serialized_state._result.location ||
                    'None' | shortenString
                }}
              </span>
            </template>
            <div>
              {{ task.serialized_state._result.location || 'None' }}
            </div>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-actions v-if="runs && runs.length > 0" class="px-0 py-0">
      <v-list dense style="width: 100%;" class="py-0">
        <v-list-group v-model="expanded" no-action dense value="true">
          <template v-slot:activator>
            <v-list-item-content class="pa-0">
              <v-list-item-title class="body-2 d-flex align-end">
                <v-icon class="black--text mr-6" small>trending_up</v-icon>
                <span class="font-weight-black mr-1">
                  {{ runs.length }}
                </span>
                Mapped Run{{ runs.length > 1 ? 's' : '' }}
              </v-list-item-title>
            </v-list-item-content>
          </template>

          <template v-slot:appendIcon>
            <v-list-item-avatar class="mr-0">
              <v-icon>arrow_drop_down</v-icon>
            </v-list-item-avatar>
          </template>

          <v-divider></v-divider>

          <v-list-item-group class="mapped-tasks-container">
            <v-lazy
              v-for="run in runs"
              :key="run.id"
              :options="{
                threshold: 0.75
              }"
              min-height="40px"
              transition="fade"
            >
              <v-list-item
                dense
                two-line
                class="px-2 py-1"
                :to="{ name: 'task-run', params: { id: run.id } }"
                :style="runStyle(run.state)"
              >
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-list-item-content v-on="on">
                      <v-list-item-title>
                        {{ run.state }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="caption">
                        {{ run.state_message }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </template>
                  <span>
                    {{ run.state_message }}
                  </span>
                </v-tooltip>
                <v-list-item-avatar class="caption" style="min-width: 85px;">
                  {{ formatTime(run.state_timestamp) }}
                </v-list-item-avatar>
              </v-list-item>
            </v-lazy>
          </v-list-item-group>
        </v-list-group>
      </v-list>
    </v-card-actions>
  </v-card-text>
</template>

<style lang="scss" scoped>
.mapped-tasks-container {
  max-height: 20vh;
  overflow: scroll;
}
</style>
