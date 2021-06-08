<script>
import { formatTime } from '@/mixins/formatTimeMixin.js'
import { IdState } from 'vue-virtual-scroller'
import { mapGetters } from 'vuex'

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
      active: false,
      flowRunLoadingKey: 0,
      taskRunLoadingKey: 0,
      taskLoadingKey: 0,
      linkCopied: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenants']),
    ...mapGetters('data', ['flows']),
    flow() {
      return this.flows?.find(f => f.id == this.flowRun?.flow_id)
    },
    logLevelIcon() {
      return logLevels[this.item.level].icon
    },
    logLevelColor() {
      if (!this.idState.active) return 'grey'
      return logLevels[this.item.level].color
    },
    logLevelText() {
      return logLevels[this.item.level].text
    },
    team() {
      return this.tenants.find(t => t.id == this.item.tenant_id)
    }
  },
  methods: {
    copyLink() {
      navigator.clipboard.writeText(
        `${window.location.origin}${this.$route.path}?id=${this.item.id}`
      )

      this.idState.linkCopied = true

      setTimeout(() => {
        this.idState.linkCopied = false
      }, 3000)
    }
  },
  apollo: {
    flowRun: {
      query: require('@/graphql/Logs/flow-run.gql'),
      variables() {
        return {
          id: this.item.object_id || this.item.flow_run_id
        }
      },
      skip() {
        return (
          !this.active &&
          this.item.object_table !== 'flow_run' &&
          !this.item.flow_run_id
        )
      },
      update(data) {
        return data?.flow_run?.[0]
      },
      loadingKey: 'flowRunLoadingKey',
      fetchPolicy: 'cache-first'
    },
    taskRun: {
      query: require('@/graphql/Logs/task-run.gql'),
      variables() {
        return {
          id: this.item.object_id || this.item.task_run_id
        }
      },
      skip() {
        return (
          !this.active &&
          this.item.object_table !== 'task_run' &&
          !this.item.task_run_id
        )
      },
      update(data) {
        return data?.task_run?.[0]
      },
      loadingKey: 'taskRunLoadingKey',
      fetchPolicy: 'cache-first'
    },
    task: {
      query: require('@/graphql/Logs/task.gql'),
      variables() {
        return {
          id: this.taskRun.task_id
        }
      },
      skip() {
        return (
          !this.active &&
          this.item.object_table !== 'task_run' &&
          !this.taskRun?.task_id
        )
      },
      update(data) {
        return data?.task?.[0]
      },
      loadingKey: 'taskLoadingKey',
      fetchPolicy: 'cache-first'
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
      <span class="mr-1">
        <v-icon small>
          {{ idState.active ? 'expand_more' : 'chevron_right' }}
        </v-icon>
      </span>

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

      <div class="ml-2 copy-link" :class="{ active: idState.linkCopied }">
        <v-icon v-ripple small @click.stop="copyLink">
          {{ idState.linkCopied ? 'check' : 'link' }}
        </v-icon>
      </div>
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

        <div class="pb-6">
          <div class="text-body-1">{{ item.id }}</div>
          <div class="text-caption text-capitalize">Id</div>
        </div>

        <div class="pb-6 log-data">
          <span v-if="item.level" class="pr-4 d-inline-block">
            <div class="text-body-2" :style="{ color: logLevelColor }">
              <v-chip :color="logLevelColor" x-small dark class="px-2 rounded">
                {{ logLevelText }}
              </v-chip>
            </div>
            <div class="text-caption text-capitalize">Level</div>
          </span>

          <span v-if="item.formattedTimestamp" class="px-4 d-inline-block">
            <div class="text-body-2">{{ item.formattedTimestamp }}</div>
            <div class="text-caption text-capitalize">Timestamp</div>
          </span>

          <span v-if="item.tenant_id" class="px-4 d-inline-block">
            <div class="text-body-2">
              <router-link
                :to="{ name: 'dashboard', params: { tenant: team.slug } }"
              >
                {{ team.name }}
              </router-link>
            </div>
            <div class="text-caption text-capitalize">Team</div>
          </span>

          <!-- TODO: Route to specific pages here -->
          <!-- e.g. the account page for license changes, a new USER page for users (members page for now), etc -->
          <!-- <span v-if="item.object_table" class="px-4 d-inline-block">
            <div class="text-body-2">{{ item.object_id }}</div>
            <div class="text-caption text-capitalize">
              {{ item.object_table }}
            </div>
          </span> -->

          <span v-if="item.flow_run_id && flow" class="px-4 d-inline-block">
            <div class="text-body-2">
              <router-link
                :to="{
                  name: 'flow',
                  params: { tenant: team.slug, id: flow.id }
                }"
              >
                {{ flow.name }}
              </router-link>
            </div>
            <div class="text-caption text-capitalize">Flow</div>
          </span>

          <span v-if="item.flow_run_id" class="px-4 d-inline-block">
            <div class="text-body-2">
              <router-link
                :to="{
                  name: 'flow-run',
                  params: { tenant: team.slug, id: item.flow_run_id }
                }"
              >
                {{ flowRun.name }}
              </router-link>
            </div>
            <div class="text-caption text-capitalize">Flow run</div>
          </span>

          <span v-if="item.task_run_id && task" class="px-4 d-inline-block">
            <div class="text-body-2">
              <router-link
                :to="{
                  name: 'task-run',
                  params: { tenant: team.slug, id: item.task_run_id }
                }"
              >
                {{ taskRun.name || task.name }}
              </router-link>
            </div>
            <div class="text-caption text-capitalize">Task run</div>
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

    .copy-link {
      opacity: 1;
    }
  }

  .row-content {
    background-color: rgba(0, 0, 0, 0.02);
    border-left: 4px solid;
    margin-left: 14px;

    .log-data {
      span:not(:last-child) {
        border-right: 1px solid rgba(0, 0, 0, 0.15);
      }
    }
  }

  .row-header {
    cursor: pointer;

    &.striped {
      background-color: rgba(0, 0, 0, 0.02);
    }

    &:hover,
    &:focus {
      background-color: $highlight-color !important;

      .copy-link {
        opacity: 1;
      }
    }
  }

  .copy-link {
    opacity: 0;
    transition: opacity 50ms;

    &.active {
      opacity: 1;
    }
  }
}

// TODO: Tweak exit transitions or remove them altogether
// when the component is recycled
// .expand-y-enter-active {
//   transition: max-height 200ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
// }

// .expand-y-leave-active {
//   transition: max-height 50ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
// }

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
