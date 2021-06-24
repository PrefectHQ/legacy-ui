<script>
import { formatTime } from '@/mixins/formatTimeMixin.js'
import Row from '@/components/Logs/Row'

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
    }
  },
  watch: {
    where: {
      handler() {
        this.logs = []
        this.logIds = []
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
        console.log(this.where)
        return {
          //   is_audit_log: { _eq: true }
          where: this.where,
          // whereBefore: {...this.where, timestamp: { _gte: this.centerTimestamp }},
          // whereAfter: {...this.where, timestamp: { _gte: this.centerTimestamp }},
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
  <DynamicScroller
    v-if="show"
    ref="virtual-scroller"
    class="scroller align-self-stretch px-8 py-4"
    :class="{ blur: loading }"
    :min-item-size="40"
    :items="sortedLogs"
    key-field="id"
    @scroll.native="handleScroll"
  >
    <template #before>
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
      <div class="ml-8 my-4 text--disabled text-caption">
        End of logs
      </div>
    </template>
  </DynamicScroller>
</template>

<style lang="scss" scoped>
.scroller {
  max-height: calc(100vh - 64px);

  @media screen and (max-width: 1264px) {
    max-height: calc(100vh - 104px);
  }
}

.loader {
  left: 50%;
  position: absolute;
  top: 25px;
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

<style lang="scss">
// .scroller {
//   .vue-recycle-scroller__item-view:nth-child(even) {
//     background-color: var(--v-accentGreen-base);
//   }
// }
</style>
