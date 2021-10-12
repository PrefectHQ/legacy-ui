<script>
import { formatTime } from '@/mixins/formatTimeMixin'
export default {
  mixins: [formatTime],
  props: {
    index: {
      type: Number,
      required: true
    },
    log: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      linkCopied: false
    }
  },
  computed: {
    logLevelColorMapper() {
      const vuetifyThemeColors = this.$vuetify.theme.themes.light

      return {
        CRITICAL: vuetifyThemeColors.error,
        DEBUG: vuetifyThemeColors.secondaryGray,
        ERROR: vuetifyThemeColors.error,
        INFO: vuetifyThemeColors.info,
        WARNING: vuetifyThemeColors.warning
      }
    },
    source() {
      return this.log?.name?.replace('prefect.', '')
    }
  },
  mounted() {
    this.emitRender()
  },
  updated() {
    this.emitRender()
  },
  methods: {
    copyLogLink() {
      setTimeout(() => {
        this.linkCopied = true
        navigator.clipboard.writeText(
          `${window.location.origin}${this.$route.path}?logs=&logId=${this.log.id}`
        )

        setTimeout(() => {
          this.linkCopied = false
        }, 3000)
      }, 100) // Should match log-copy transition duration
    },
    hasRunLink(message) {
      if(message.includes('Flow Run: https://')) {
      return true
      } 
      return false
    },
    getUrl(link) {
      return link.split(': ')[1]
    },
    // Let parent know if the rendered log's ID is equal to the log ID query param
    emitRender() {
      if (this.isQueriedLog()) {
        this.$emit('query-log-rendered')
      }
    },
    // Determine whether log's ID is equal to the log ID provided via query param
    isQueriedLog() {
      return this.log.id === this.$route.query.logId
    },
    // Determine the log-level color based on the passed-in log level ("DEBUG", "ERROR", etc)
    logLevelColor(logLevel) {
      return (
        this.logLevelColorMapper[logLevel] ||
        this.$vuetify.theme.themes.light.secondaryGray
      )
    }
  }
}
</script>

<template>
  <div
    class="log-row d-flex pr-12 justify-start align-center"
    :class="{
      'log-row-color-1': !isQueriedLog() && index % 2 === 0,
      'log-row-color-2': !isQueriedLog() && index % 2 !== 0,
      'log-row-color-queried': isQueriedLog()
    }"
    tabindex="0"
  >
    <div class="log-actions">
      <div class="log-link">
        <v-tooltip right>
          <template #activator="{ on }">
            <v-btn
              color="blue-grey lighten-1"
              text
              x-small
              @click="copyLogLink"
              v-on="on"
            >
              <transition name="log-copy" mode="out-in">
                <v-icon v-if="linkCopied" key="copied">check</v-icon>
                <v-icon v-else key="not-copied">link</v-icon>
              </transition>
            </v-btn>
          </template>
          <span>
            {{ linkCopied ? 'Copied!' : 'Copy log URL to clipboard' }}
          </span>
        </v-tooltip>
      </div>
    </div>

    <div class="log-info text-caption py-2 text-left">
      <v-tooltip top>
        <template #activator="{ on }">
          <div class="log-datetime utilGrayMid--text" v-on="on">
            {{ logTime(log.timestamp) }}
          </div>
        </template>
        <span>{{ logDate(log.timestamp) }}</span>
      </v-tooltip>
      <div class="log-level d-flex align-center justify-start">
        <v-icon :color="logLevelColor(log.level)" x-small>lens</v-icon>
        <span class="text-truncate ml-1 text-small-caps">{{ log.level }}</span>
      </div>
      <div class="log-name text-caption font-weight-light">
        <span class="text-truncate">{{ source }}</span>
      </div>
    </div>

    <div class="ml-10 py-1">
      <span v-if="hasRunLink(log.message)"><a target="_blank" :href="getUrl(log.message)">{{ log.message }}</a></span>
      <span class="log-message" v-else>{{ log.message }}</span>
    </div>

    <div v-if="log.task_run_id" class="justify-self-end log-router-link">
      <v-tooltip top>
        <template #activator="{ on }">
          <v-btn
            class="log-router-button vertical-button"
            color="blue-grey lighten-1"
            small
            text
            tile
            :to="{
              name: 'task-run',
              params: {
                id: log.task_run_id
              }
            }"
            v-on="on"
          >
            <v-icon>chevron_right</v-icon>
            To Task Run
          </v-btn>
        </template>
        <span>
          Navigate to the task run associated with this log
        </span>
      </v-tooltip>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.log-copy-enter-active,
.log-copy-leave-active {
  transition: opacity 100ms;
}

.log-copy-enter,
.log-copy-leave-to {
  opacity: 0;
}

.log-router-link {
  height: 100%;
  position: absolute;
  right: 0;

  a {
    height: 100% !important;
  }
}

.log-link,
.log-router-link {
  opacity: 0;

  &:focus,
  &:hover {
    opacity: 1;
  }
}

.log-row {
  position: relative;

  /* stylelint-disable a11y/selector-pseudo-class-focus */
  &:hover {
    .log-link,
    .log-router-link {
      opacity: 1;
    }
  }

  &:focus {
    z-index: 10;
  }
  /* stylelint-enable a11y/selector-pseudo-class-focus */
}

.log-info {
  display: block;
  width: 100px;
}

.log-row-color-1 {
  background-color: var(--v-appForeground-base);
}

.log-row-color-2 {
  background-color: var(--v-appBackground-base);
}

.log-row-color-queried {
  background-color: var(--v-primaryLight-base);
}

.log-message {
  font-family: 'Source Code Pro', monospace;
  white-space: pre-wrap; // Needed to format log messages properly
}
</style>
