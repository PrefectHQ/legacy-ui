<script>
import { formatTime } from '@/mixins/formatTimeMixin.js'
import { IdState } from 'vue-virtual-scroller'

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
  }
}
</script>

<template>
  <div class="row-container" :class="{ active: idState.active }">
    <div
      class="row-header text-truncate"
      @click="idState.active = !idState.active"
    >
      <span class="text-caption text--disabled">
        {{ item.formattedTimestamp }}
      </span>
      {{ item.message }}
    </div>

    <transition name="expand-y">
      <div v-if="idState.active" class="row-content px-4">
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
.row-container {
  .row-header:hover {
    background-color: #eee;
    cursor: pointer;
    transition: all 50ms;
  }

  &.active {
    // background-color: #284;
  }

  .row-content {
    border-left: 4px solid var(--v-primary-base);
  }
}

.expand-y-enter-active,
.expand-y-leave-active {
  max-height: 200px;
  overflow: hidden;
  transition: max-height 500ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.expand-y-enter,
.expand-y-leave-to {
  max-height: 0;
}
</style>
