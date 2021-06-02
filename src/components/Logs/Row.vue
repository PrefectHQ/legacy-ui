<script>
import { formatTime } from '@/mixins/formatTimeMixin.js'
import { IdState } from 'vue-virtual-scroller'

const logLevels = {
  DEFAULT: {
    text: 'Default',
    color: '#85e783',
    icon: 'radio_button_checked'
  },
  DEBUG: {
    text: 'Debug',
    color: '#937eff',
    icon: 'bug_report'
  },
  INFO: {
    text: 'Info',
    color: '#2196f3',
    icon: 'info'
  },
  WARN: {
    text: 'Warn',
    color: '#ffdd37',
    icon: 'report_problem'
  },
  ERROR: {
    text: 'Error',
    color: '#ff5252',
    icon: 'warning_amber'
  },
  CRITICAL: {
    text: 'Critical',
    color: '#d50000',
    icon: 'warning'
  }
}

export default {
  mixins: [
    IdState({
      // You can customize this
      idProp: vm => vm.item.id
    }),
    formatTime
  ],
  props: {
    index: {
      type: Number,
      required: true
    },
    item: {
      type: Object,
      default() {
        return {}
      }
    }
  },
  idState() {
    return {
      active: false
    }
  },
  computed: {
    logLevelIcon() {
      return logLevels[this.item.level].icon
    },
    logLevelColor() {
      if (!this.idState.active) return 'grey'
      return logLevels[this.item.level].color
    }
  }
}
</script>

<template>
  <div class="row-container" :class="{ active: idState.active }">
    <div
      class="row-header text-truncate d-flex justify-start align-center py-1 px-2"
      :class="{ striped: index % 2 === 0 }"
      tabindex="0"
      @click="idState.active = !idState.active"
      @keyup.enter="idState.active = !idState.active"
    >
      <span class="mr-3">
        <v-icon :color="logLevelColor" small>
          {{ logLevelIcon }}
        </v-icon>
      </span>

      <span class="text-truncate mr-4">
        {{ item.message }}
      </span>

      <span class="text-caption text--disabled ml-auto">
        {{ item.formattedTimestamp }}
      </span>
    </div>

    <transition name="expand-y">
      <div
        v-if="idState.active"
        class="row-content px-4"
        :style="{ 'border-color': logLevelColor }"
      >
        <div class="py-6">
          <div class="text-body-1">{{ item.message }}</div>
          <div class="text-caption text-capitalize">Log</div>
        </div>

        <div>
          <span class="mr-4 d-inline-block">
            <div class="text-body-2">{{ item.level }}</div>
            <div class="text-caption text-capitalize">Level</div>
          </span>

          <span class="d-inline-block">
            <div class="text-body-2">{{ item.formattedTimestamp }}</div>
            <div class="text-caption text-capitalize">Time</div>
          </span>
        </div>

        <div class="py-6">
          <span class="mr-4 d-inline-block">
            <div class="text-body-2">{{ item.tenant_id }}</div>
            <div class="text-caption text-capitalize">Team</div>
          </span>

          <span class="d-inline-block">
            <div class="text-body-2">{{ item.object_id }}</div>
            <div class="text-caption text-capitalize">
              {{ item.object_table }}
            </div>
          </span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
$highlight-color: rgba(224, 224, 255, 0.5);

.row-container {
  &:hover,
  &:focus {
    outline: none;

    .row-header {
      background-color: $highlight-color;
    }
  }

  &.active .row-header {
    background-color: $highlight-color !important;
  }

  .row-content {
    border-left: 4px solid;
    margin-left: 14px;
  }

  .row-header {
    cursor: pointer;

    &.striped {
      background-color: rgba(0, 0, 0, 0.02);
    }

    &:hover {
      background-color: $highlight-color !important;
    }
  }
}

.expand-y-enter-active,
.expand-y-leave-active {
  max-height: 200px;
  overflow: hidden;
  transition: max-height 200ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.expand-y-enter,
.expand-y-leave-to {
  max-height: 0;
}
</style>
