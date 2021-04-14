<script>
import { mapActions, mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

import WorkQueue from '@/components/Nav/SystemActionsTiles/WorkQueue'

export default {
  components: {
    WorkQueue
  },
  mixins: [formatTime],
  data() {
    return {
      cancelLoading: false,
      clockInterval: null,
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
  mounted() {
    clearInterval(this.clock)
    this.clockInterval = setInterval(() => {
      this.time = Date.now()
    }, 1000)

    window.addEventListener('keydown', this.close)
  },
  beforeDestroy() {
    clearInterval(this.clockInterval)
    window.removeEventListener('keydown', this.close)
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    close(e) {
      if (e?.key == 'Escape') {
        this.$emit('close')
      }
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
    }
  }
}
</script>

<template>
  <div class="system-grid">
    <!-- @click="haltWork" -->
    <WorkQueue />

    <!-- <div
      class="rounded system-action-container d-flex flex-column align-center justify-center"
    >
      <div class="system-icon mx-auto" :class="{ active: !queuePaused }">
        <i class="fad fa-film" />
      </div>

      <div class="text-h6 utilGrayDark--text mt-6 mb-2">
        Cancel all runs
      </div>

      <input
        :checked="!queuePaused"
        :indeterminate="queueLoading"
        class="large-switch work-queue"
        type="checkbox"
        @change.stop="haltWork"
      />
    </div> -->
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
    background-color: #455a64;
    display: inline-block;
    margin: 16px;
    height: $cellsize;
    width: $cellsize;
  }
}
</style>
