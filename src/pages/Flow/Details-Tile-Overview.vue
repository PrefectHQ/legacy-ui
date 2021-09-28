<script>
import { formatTime } from '@/mixins/formatTimeMixin'
import LabelEdit from '@/components/LabelEdit'
import PrefectSchedule from '@/components/PrefectSchedule'

export default {
  components: {
    LabelEdit,
    PrefectSchedule
  },
  mixins: [formatTime],
  props: {
    flow: {
      type: Object,
      required: true
    },
    flowGroup: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    hasUser() {
      return this.flow?.created_by
    }
  }
}
</script>

<template>
  <v-list class="card-content">
    <v-list-item dense>
      <v-list-item-content>
        <v-list-item-subtitle class="text-caption">
          Created <span v-if="hasUser">by</span>
        </v-list-item-subtitle>
        <div v-if="hasUser" class="text-subtitle-2">
          {{ flow.created_by.username }}
        </div>
        <div class="text-caption" :class="{ 'font-weight-bold': !hasUser }">
          {{ formatTime(flow.created) }}
        </div>
      </v-list-item-content>
    </v-list-item>

    <v-list-item v-if="flow.core_version" dense>
      <v-list-item-content>
        <v-list-item-subtitle class="text-caption">
          Prefect Core Version:
        </v-list-item-subtitle>
        <div class="text-subtitle-2">{{ flow.core_version }}</div>
      </v-list-item-content>
    </v-list-item>

    <v-list-item dense>
      <v-list-item-content>
        <v-list-item-subtitle class="text-caption">
          Schedule
        </v-list-item-subtitle>
        <div class="text-subtitle-2">
          <PrefectSchedule
            v-if="flow.schedule || flowGroup.schedule"
            :schedule="flow.schedule ? flow.schedule : flowGroup.schedule"
          />
          <span v-else>None</span>
        </div>
      </v-list-item-content>
    </v-list-item>

    <LabelEdit :flow="flow" :flow-group="flowGroup" />
  </v-list>
</template>

<style lang="scss">
.card-content {
  max-height: 207px;
  overflow-y: auto;
}
</style>
