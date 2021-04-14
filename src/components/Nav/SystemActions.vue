<script>
import { mapActions, mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  mixins: [formatTime],
  data() {
    return {
      cancelLoading: false,
      clockInterval: null,
      queueLoading: false,
      queuePaused: this.tenant?.settings?.work_queue_paused,
      time: Date.now()
    }
  },
  computed: {
    ...mapGetters('data', ['flows']),
    ...mapGetters('tenant', ['tenant']),
    flowIds() {
      return this.flows.map(f => f.id)
    }
  },
  watch: {
    'tenant.settings.work_queue_paused'(val) {
      console.log(val)
      this.queuePaused = val
    }
  },
  mounted() {
    clearInterval(this.clock)
    this.clockInterval = setInterval(() => {
      this.time = Date.now()
    }, 1000)
  },
  beforeDestroy() {
    clearInterval(this.clockInterval)
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapActions('tenant', ['getTenants']),
    close() {
      console.log('close')
      this.$emit('close')
    },
    async cancelAll() {
      this.cancelLoading = true

      try {
        const { data } = await this.$apollo.query({
          query: require('@/graphql/Nav/flow-runs.gql'),
          variables: {
            flowIds: this.flowIds
          }
        })

        console.log(data)

        if (data?.flow_run) {
          const mutation = require('@/graphql/Nav/cancel-flow-run.gql')
          data.flow_run.map(async run => {
            console.log(run)
            const res = await this.$apollo.mutate({
              mutation: mutation,
              variables: {
                flowRunId: run.id
              }
            })
            console.log(res)
          })
        }
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage: e,
          alertType: 'error'
        })
      } finally {
        this.cancelLoading = false
      }
    },
    async haltWork() {
      this.queueLoading = true

      try {
        const { data } = await this.$apollo.mutate({
          mutation: require(`@/graphql/Nav/${
            this.queuePaused ? 'resume' : 'pause'
          }-tenant-work-queue.gql`),
          variables: {
            tenantId: this.tenant.id
          }
        })

        if (data?.tenant_work_queue_result?.success) {
          console.log(data.tenant_work_queue_result)
          await this.getTenants()

          this.queuePaused = this.tenant.settings.work_queue_paused
        }
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage: e,
          alertType: 'error'
        })
      } finally {
        this.queueLoading = false
      }
      // console.log(res)
    }
  }
}
</script>

<template>
  <div class="system-grid">
    <!-- @click="haltWork" -->
    <div
      class="rounded system-action-container d-flex flex-column align-center justify-center"
    >
      <!-- <v-switch
        color="warning"
        hide-details
        class="pl-3 large-switch"
        :input-value="queuePaused"
        :loading="queueLoading"
        @change.stop="haltWork"
      /> -->

      <div class="system-icon mx-auto" :class="{ active: queuePaused }">
        <i class="fad fa-film" />
      </div>

      <div class="text-h6 white--text mt-6 mb-2">
        Work queue
      </div>

      <input class="large-switch work-queue" type="checkbox" />
    </div>
  </div>
  <!-- <v-system-bar height="30" style="width: 100%;"> -->
  <!-- <div class="d-flex align-center justify-end px-4 system-actions">
    <v-spacer />

    <MenuTooltip nudge-left hide-close>
      <template #activator>
        <div class="mr-2" tabindex="0">
          <span v-if="queueLoading">
            <i class="fal fa-spinner-third" />
          </span>
          <v-icon v-else v-ripple color="white">
            {{ haltWork ? 'pause' : 'play_button' }}
          </v-icon>
        </div>
      </template>
    </MenuTooltip>

    <MenuTooltip hide-close>
      <template #activator>
        <div class="mr-2" tabindex="0">
          <span v-if="cancelLoading">
            <i class="fal fa-spinner-third" />
          </span>
          <v-icon v-else v-ripple color="white">stop</v-icon>
        </div>
      </template>
    </MenuTooltip>


  </div> -->
  <!-- </v-system-bar> -->
  <!-- <v-toolbar
    dense
    flat
    color="transparent"
    class="system-actions mx-16 align-center"
    tag="div"
    height="64"
  >
    <v-spacer></v-spacer>

    <v-toolbar-items>
      <div class="text-center mr-6 cursor-pointer" @click="haltWork">
        <div class="text-caption text-small white--text ">
          Pause work
        </div>

        <v-switch
          color="warning"
          hide-details
          class="pl-3"
          :input-value="queuePaused"
          :loading="queueLoading"
          @change.stop="haltWork"
        />
      </div>

      <div class="text-center cursor-pointer" @click="cancelAll">
        <div class="text-caption text-small white--text">Cancel all</div>

        <v-btn x-small fab depressed class="pa-0">
          <v-icon medium>stop</v-icon>
        </v-btn>
      </div>
    </v-toolbar-items>
  </v-toolbar> -->
</template>

<style lang="scss" scoped>
$cellsize: 200px;

.system-grid {
  max-width: 764px;
  text-align: center;

  .system-action-container {
    // background-color: var(--v-primary-base);
    backdrop-filter: blur(4px);
    color: #fff;
    display: inline-block;
    margin: 16px;
    // filter: ;
    height: $cellsize;
    width: $cellsize;
  }
}

.large-switch {
  appearance: none;
  width: 124px;
  height: 48px;
  display: inline-block;
  position: relative;
  border-radius: 50px;
  overflow: hidden;
  outline: none;
  border: none;
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.35);
  transition: background-color ease 0.3s;

  &::before {
    background: var(--v-warning-base);
    content: 'Active Paused';
    display: block;
    position: absolute;
    z-index: 2;
    width: 44px;
    height: 44px;
    left: 2px;
    top: 2px;
    border-radius: 50%;
    font: 14px/44px “Source Code Pro”;
    text-transform: uppercase;
    font-weight: bold;
    text-indent: -56px;
    word-spacing: 48px;
    color: #fff;
    white-space: nowrap;
    transition: all cubic-bezier(0.3, 1.5, 0.7, 1) 0.3s;
  }

  &:checked {
    background-color: rgba(59, 141, 255, 0.15);
  }

  &:checked::before {
    background: var(--v-primary-base);
    left: 78px;
  }
}
</style>
