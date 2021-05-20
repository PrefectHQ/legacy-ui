<script>
// Virtual scroller (support dynamic item heights)
// import VueVirtualScroller from 'vue-virtual-scroll-list'

import { formatTime } from '@/mixins/formatTimeMixin.js'
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
  mixins: [formatTime],
  data() {
    return {
      currentFirst: null,
      previousFirst: null,
      currentScrollPosition: 0,
      firstLoad: false,
      ignoreNextScroll: false,
      loadingKey: 0,
      logs: [],
      logIds: [],
      offset: 0,
      previousContainerHeight: 0,
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
  watch: {
    sortedLogs() {
      //   this.previousFirst = this.currentFirst
      //   this.currentFirst = val[0]?.id
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.virtualContainer = document.querySelector(
        '.vue-recycle-scroller__item-wrapper'
      )

      console.log(this.virtualContainer)
      //   this.virtualContainer.addEventListener('scroll', this.handleScroll)
    })
  },
  beforeDestroy() {
    // this.virtualContainer.removeEventListener('scroll', this.handleScroll)
  },
  //   updated() {
  //     this.show = false

  //     setTimeout(() => {
  //       this.show = true
  //     }, 1000)
  //   },
  methods: {
    handleScroll(e) {
      if (this.ignoreNextScroll) {
        this.ignoreNextScroll = false
        return
      }
      const el = e.currentTarget || e.target
      if (el?.scrollTop <= 100 && !this.loading) {
        console.log('scroll triggered')
        this.offset += 50
      }
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
  <div class="logs-container">
    <transition name="appear-y">
      <v-progress-circular
        v-if="loading"
        color="primary"
        class="loader"
        :size="50"
        :width="5"
        indeterminate
      />
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
</template>

<style lang="scss" scoped>
.logs-container {
  height: 100%;
  overflow: hidden;
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
