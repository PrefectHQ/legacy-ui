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
      freezeScrollEvents: false,
      hasScrolled: false,
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
    sortedLogs(val) {
      this.previousFirst = this.currentFirst
      this.currentFirst = val[0]?.id
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
      if (this.freezeScrollEvents) return
      this.hasScrolled = true
      const el = e.currentTarget || e.target
      if (el?.scrollTop <= 100 && !this.loading) {
        console.log('scroll triggered')
        this.offset += 50
      }
    },
    toggleShow() {
      this.show = !this.show

      if (this.show) {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },
    scrollToBottom() {
      this.$refs['virtual-scroller'].scrollToBottom()

      this.freezeScrollEvents = true
      setTimeout(() => {
        this.freezeScrollEvents = false
      }, 1000)
    },
    handleTopOfLogs() {
      console.log('hello')
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
          this.freezeScrollEvents = true

          data?.log.forEach(log => {
            if (!this.logIds.includes(log.id)) {
              log.formattedTimestamp = this.formatDateTime(log.timestamp)
              this.logIds.push(log.id)
              this.logs.push(log)
            }
          })

          const height =
            this.virtualContainer.scrollHeight -
            this.virtualContainer.clientHeight
          const scroll = this.virtualContainer.scrollTop

          console.dir(this.virtualContainer)
          console.log(
            this.virtualContainer.scrollHeight,
            this.virtualContainer.clientHeight,
            this.virtualContainer.scrollTop
          )

          this.$nextTick(() => {
            if (!this.hasScrolled) {
              this.hasScrolled = true
              this.scrollToBottom()
            } else {
              const newHeight =
                this.virtualContainer.scrollHeight -
                this.virtualContainer.clientHeight

              console.log(
                this.virtualContainer.scrollHeight,
                this.virtualContainer.clientHeight,
                this.virtualContainer.scrollTop
              )

              console.log(scroll, height, newHeight)
              // The 500 here is pretty hacky; the client height seems to be
              // an inaccurate way of determining scroll positioning
              // even though the heights themselves are accurate
              this.$refs['virtual-scroller'].$el.scrollTop =
                scroll + (newHeight - height)
              setTimeout(() => {
                this.freezeScrollEvents = false
              }, 1000)
            }
          })
        }

        return data
      }
    }
  }
}
</script>

<template>
  <div class="logs-container">
    <div @click="toggleShow">click me</div>
    <div>
      <span class="mr-2">loading: {{ loading }}</span>
    </div>

    <DynamicScroller
      v-if="show"
      ref="virtual-scroller"
      class="virtual-scroller"
      :min-item-size="40"
      :items="sortedLogs"
      key-field="id"
      @scroll.native="handleScroll"
    >
      <!-- @scroll.native="handleScroll" -->
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
              {{ index }} {{ item.formattedTimestamp }}
            </span>
            {{ item.message }}
          </div>
        </DynamicScrollerItem>
      </template>
      <template #after>
        <div id="bottom">
          Hey! I'm a message displayed before the items!
        </div>
      </template>
    </DynamicScroller>
  </div>
</template>

<style lang="scss" scoped>
.logs-container {
  height: 100%;
  overscroll-behavior-y: none;
}

.virtual-scroller {
  // The virtual scroller requires an explicit height or max-height
  // for scrolling methods to work properly
  height: 100%;
  max-height: calc(100vh - 80px);
  //   max-height: calc(100vh - 64px);
  overflow-y: auto;
  overscroll-behavior-y: contain;
  //   scroll-behavior: smooth;
}
</style>
