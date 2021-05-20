<script>
import { formatTime } from '@/mixins/formatTimeMixin.js'
import Toolbar from '@/components/Logs/Toolbar'
// import Row from '@/components/Logs/Row'

export default {
  //   props: {
  //     auditLogs: {
  //       type: Boolean,
  //       default: false
  //     },
  //     taskRunId: {
  //       type: String,
  //       default: null
  //     },
  //     flowRunId: {
  //       type: String,
  //       default: null
  //     },
  //     objectTable: {
  //       type: String,
  //       default: null
  //     },
  //     objectId: {
  //       type: String,
  //       default: null
  //     },
  //     tenantId: {
  //       type: String,
  //       default: null
  //     }
  //   }
  components: { Toolbar },
  mixins: [formatTime],
  data() {
    return {
      currentFirst: null,
      previousFirst: null,
      currentScrollPosition: 0,
      firstLoad: false,
      ignoreNextScroll: false,
      lastScroll: 0,
      loadingKey: 0,
      logs: [],
      logIds: [],
      offset: 0,
      previousContainerHeight: 0,
      search: null,
      show: true,
      virtualContainer: null
    }
  },
  computed: {
    sortedLogs() {
      const logs = [...this.logs]
      return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    },
    loading() {
      return this.loadingKey > 0
    }
  },
  watch: {},
  mounted() {
    this.$nextTick(() => {
      this.virtualContainer = document.querySelector(
        '.vue-recycle-scroller__item-wrapper'
      )
    })
  },
  beforeDestroy() {},
  methods: {
    handleScroll(e) {
      if (this.ignoreNextScroll) {
        this.ignoreNextScroll = false
        return
      }
      const el = e.currentTarget || e.target

      if (
        el?.scrollTop <= 5 &&
        !this.loading &&
        el?.scrollTop < this.lastScroll
      ) {
        this.offset += 50
      }

      this.lastScroll = el?.scrollTop || 0
    },
    scrollToBottom() {
      this.$refs['virtual-scroller'].scrollToBottom()
    },
    handleTopOfLogs() {
      this.offset += 50
    }
  },
  apollo: {
    log: {
      query: require('@/graphql/Logs/logs.gql'),
      variables() {
        return {
          //   is_audit_log: { _eq: true }
          where: {},
          limit: 100,
          offset: this.offset
        }
      },
      loadingKey: 'loadingKey',
      result({ data, loading }) {
        if (data?.log && !loading) {
          this.ignoreNextScroll = true

          data?.log.forEach(log => {
            if (!this.logIds.includes(log.id)) {
              log.formattedTimestamp = this.formatDateTime(log.timestamp)
              this.logIds.push(log.id)
              this.logs.push(log)
            }
          })

          const height = this.virtualContainer.scrollHeight
          const scroll = this.virtualContainer.scrollTop

          if (!this.firstLoad) {
            this.firstLoad = true
            this.ignoreNextScroll = true
            this.scrollToBottom()
          } else {
            setTimeout(() => {
              const newHeight = this.virtualContainer.scrollHeight

              this.$refs['virtual-scroller'].$el.scrollTop =
                scroll + (newHeight - height)

              setTimeout(() => {
                this.$refs['virtual-scroller'].$el.scrollBy({
                  top: -160,
                  behavior: 'smooth'
                })
              }, 150)
            }, 50)
          }
        }

        return data
      }
    }
  }
}
</script>

<template>
  <div class="logs-container white px-12 pt-10 ">
    <Toolbar />

    <div class="virtual-scroller-container">
      <transition name="appear-y">
        <div v-if="loading" class="rounded-circle white loader pa-2">
          <v-progress-circular
            color="primary"
            :size="50"
            :width="6"
            indeterminate
          />
        </div>
      </transition>

      <DynamicScroller
        v-if="show"
        ref="virtual-scroller"
        class="virtual-scroller"
        :class="{ blur: loading }"
        :min-item-size="40"
        :items="sortedLogs"
        key-field="id"
        @scroll.native="handleScroll"
      >
        <template #default="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[item.message]"
            :data-index="index"
          >
            <div
              :key="item.id"
              style="height: 30px;"
              :style="{
                color:
                  currentFirst == item.id
                    ? '#FF5733'
                    : previousFirst == item.id
                    ? '#85C1E9'
                    : '#00'
              }"
              class="text-truncate"
            >
              <span class="text-caption text--disabled">
                {{ item.formattedTimestamp }}
              </span>
              {{ item.message }}
            </div>
          </DynamicScrollerItem>
        </template>
        <template #after>
          <div>
            Hey! I'm a message displayed after items!
          </div>
        </template>
      </DynamicScroller>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.logs-container {
  height: 100%;
  overflow: hidden;
  overscroll-behavior-y: contain;
  position: relative;
  width: 100%;
}

.virtual-scroller-container {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.logs-toolbar {
  left: 50%;
  position: absolute;
  transform: translate(-50%);
  width: calc(100% - 96px);
  z-index: 1;
}

.loader {
  left: 50%;
  position: absolute;
  top: 25px;
}

.virtual-scroller {
  // The virtual scroller requires an explicit height or max-height
  // for scrolling methods to work properly
  height: 100%;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  overscroll-behavior-y: contain;

  &.blur {
    filter: blur(1px);
  }
}

.appear-y-enter-active,
.appear-y-leave-active {
  transition: all 300ms cubic-bezier(0, 0, 0.2, 1);
}

.appear-y-enter,
.appear-y-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
