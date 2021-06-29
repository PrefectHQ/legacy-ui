<script>
import { formatTime } from '@/mixins/formatTimeMixin.js'
import Row from '@/components/Logs/Row'
import throttle from 'lodash.throttle'
import Velocity from 'velocity-animate'

export default {
  components: { Row },
  mixins: [formatTime],
  props: {
    where: {
      type: Object,
      required: false,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      centerTimestamp: null,
      currentFirst: null,
      previousFirst: null,
      currentScrollPosition: 0,
      firstLoad: false,
      ignoreNextScroll: false,
      lastScroll: 0,
      loadingKey: 0,
      logByPkLoadingKey: 0,
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
    },
    handleScroll: function() {
      return throttle(e => this.rawHandleScroll(e), 1500, {
        leading: true,
        trailing: false
      })
    }
  },
  watch: {
    where: {
      handler(val, oldVal) {
        if (JSON.stringify(val) === JSON.stringify(oldVal)) return
        this.logs = []
        this.logIds = []
        this.$apollo.queries['log'].refetch()
      },
      deep: true
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.virtualContainer = document.querySelector(
        '.vue-recycle-scroller__item-wrapper'
      )
    })
  },
  beforeDestroy() {},
  methods: {
    rawHandleScroll(e) {
      if (this.ignoreNextScroll) {
        this.ignoreNextScroll = false
        return
      }
      const st = this.$refs['virtual-scroller'].$el.scrollTop

      // MDN says that using the deltaY attribute isn't always the best indicator of
      // scroll direction. We use it here in the edge case where the aren't enough logs on the page
      // but we still want to fetch more logs if the user scrolls up
      if (
        (st <= 0 && !this.loading && st < this.lastScroll) ||
        (e.deltaY < 0 && st === 0 && this.lastScroll === 0 && !this.loading)
      ) {
        this.offset += 50
      }

      this.lastScroll = st
    },
    scrollToBottom() {
      this.$refs['virtual-scroller'].scrollToBottom()
    },
    handleTopOfLogs() {
      this.offset += 50
    },
    beforeEnter: function(el) {
      el.style.opacity = 0
      el.style.height = 0
    },
    enter: function(el, done) {
      setTimeout(function() {
        Velocity(
          el,
          { opacity: 1, height: '68px' },
          { complete: done, duration: 250 }
        )
      }, 0)
    },
    leave: function(el, done) {
      setTimeout(function() {
        Velocity(
          el,
          { opacity: 0, height: 0 },
          { complete: done, duration: 250 }
        )
      }, 0)
    }
  },
  apollo: {
    log: {
      query: require('@/graphql/Logs/logs.gql'),
      variables() {
        console.log(this.where)
        return {
          where: this.where,
          limit: 50,
          offset: this.offset
        }
      },
      loadingKey: 'loadingKey',
      skip() {
        return this.logByPkLoadingKey > 0
      },
      result({ data, loading }) {
        if (data?.log && !loading) {
          this.ignoreNextScroll = true
          this.handleScroll.cancel()

          data?.log.forEach(log => {
            if (!this.logIds.includes(log.id)) {
              log.formattedTimestamp = this.logsDateTime(log.timestamp)
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
    },
    logByPk: {
      query: require('@/graphql/Logs/log-by-pk.gql'),
      variables() {
        return {
          id: this.$route.query?.id
        }
      },
      loadingKey: 'logByPkLoadingKey',
      skip() {
        return !this.$route.query?.id
      },
      result({ data, loading }) {
        if (!data?.log_by_pk || loading) return
        this.centerTimestamp = data.log_by_pk.timestamp
        return data.log_by_pk
      }
    }
  }
}
</script>

<template>
  <!-- Using wheel.native event here because the scroll event doesn't work if the container
    height is larger than its content (since no scroll event is fired in that case)
    It should be safe to use on all browsers we support. For more info see: https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
  -->
  <DynamicScroller
    v-if="show"
    ref="virtual-scroller"
    class="scroller pb-8"
    :class="{ blur: loading }"
    :min-item-size="30"
    :items="sortedLogs"
    key-field="id"
    @wheel.native="handleScroll"
  >
    <template #before>
      <transition
        tag="div"
        :css="false"
        @before-enter="beforeEnter"
        @enter="enter"
        @leave="leave"
      >
        <div
          v-if="loading"
          key="1"
          class="loader d-flex align-center justify-center"
        >
          <v-progress-circular
            color="primary"
            :size="50"
            :width="6"
            indeterminate
          />
        </div>
      </transition>
    </template>

    <template #default="{ item, index, active }">
      <DynamicScrollerItem
        :item="item"
        :active="active"
        :size-dependencies="[item.message]"
        :data-index="index"
      >
        <Row :index="index" :item="item" />
      </DynamicScrollerItem>
    </template>
    <template #after>
      <div
        v-if="!loading && sortedLogs.length == 0"
        class="ml-5 my-4 text--disabled text-h6 font-weight-light"
      >
        No logs found; try expanding your search?
      </div>
    </template>
  </DynamicScroller>
</template>

<style lang="scss" scoped>
.scroller {
  height: 100%;
  max-height: calc(100% - 64px);
  width: 100%;
}

.loader {
  height: 74px;
}
</style>
