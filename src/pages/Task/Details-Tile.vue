<script>
import CardTitle from '@/components/Card-Title'
import RetriesEdit from '@/components/RetriesEdit'

import Parameters from '@/components/Parameters'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  filters: {
    typeClass: val => val.split('.').pop()
  },
  components: {
    CardTitle,
    Parameters,
    RetriesEdit
  },
  mixins: [formatTime],
  props: {
    lastRun: {
      type: Object,
      required: false,
      default: () => null
    },
    loading: {
      type: Boolean,
      required: false,
      default: () => false
    },
    task: {
      type: Object,
      required: false,
      default: () => null
    },
    fullHeight: {
      required: false,
      type: Boolean,
      default: () => false
    }
  }
}
</script>

<template>
  <v-card
    class="pa-2"
    tile
    :style="{
      height: fullHeight ? '100%' : 'auto'
    }"
  >
    <v-system-bar
      :color="!loading && lastRun ? lastRun.state : 'grey'"
      :height="5"
      absolute
    >
    </v-system-bar>
    <CardTitle
      :loading="loading"
      :title="task ? task.name : null"
      icon="pi-task"
    />

    <v-card-text class="pl-12">
      <v-list-item
        v-if="!loading"
        dense
        two-line
        :to="{ name: 'flow', params: { id: task.flow.id } }"
        class="px-0"
      >
        <v-list-item-content>
          <span class="text-caption mb-0">
            Flow
          </span>
          <v-list-item-title class="text-body-2">
            <span>{{ task.flow.name }}</span>
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            Version {{ task.flow.version }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-skeleton-loader v-else type="list-item-two-line" />

      <v-list-item
        v-if="!loading && task && task.description"
        dense
        class="px-0"
      >
        <v-list-item-content>
          <v-list-item-subtitle class="text-caption">
            Description
          </v-list-item-subtitle>
          <div class="text-caption">{{ task.description }} </div>
        </v-list-item-content>
      </v-list-item>

      <v-list-item dense class="pa-0">
        <v-list-item-content>
          <v-list-item-subtitle class="text-caption">
            <v-row no-gutters>
              <v-col cols="6">
                Created
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                <span v-if="!loading">{{ formatTime(task.created) }}</span>
                <v-skeleton-loader v-else type="text" />
              </v-col>
            </v-row>
            <v-row no-gutters>
              <v-col cols="6">
                Class
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                <span v-if="!loading"> {{ task.type | typeClass }}</span>
                <v-skeleton-loader v-else type="text" />
              </v-col>
            </v-row>
            <v-row no-gutters>
              <v-col cols="6">
                Trigger
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                <span v-if="!loading">{{ task.trigger | typeClass }}</span>
                <v-skeleton-loader v-else type="text" />
              </v-col>
            </v-row>

            <!-- <v-row no-gutters>
              <v-col cols="6">
                Max Retries
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                <span v-if="!loading">{{ task.max_retries }}</span>
                <v-skeleton-loader v-else type="text" />
              </v-col>
            </v-row>
            <v-row v-if="!loading && task.max_retries" no-gutters>
              <v-col cols="6">
                Retry Delay
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                {{ task.retry_delay }}
              </v-col>
            </v-row> -->
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <RetriesEdit :task="task" />

      <v-list-item
        v-if="!loading && $options.filters.typeClass(task.type) == 'Parameter'"
        two-line
        class="px-0"
      >
        <v-list-item-content>
          <v-list-item-subtitle class="text-caption">
            <span class="mb-0">
              Parameter:
            </span>
            <Parameters
              :parameters="
                task.flow.parameters.filter(param => param.name == task.name)
              "
              hide-title
            ></Parameters>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-card-text>
  </v-card>
</template>
