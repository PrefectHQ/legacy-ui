<script>
import { runConfigs } from '@/utils/runConfigs'
import Label from '@/components/Label'
export default {
  components: {
    Label
  },
  props: {
    flowRun: {
      required: true,
      type: Object
    }
  },
  data() {
    return {}
  },
  computed: {
    runConfig() {
      return runConfigs[this.flowRun.run_config.type]
    },
    argList() {
      let argList = {}
      for (let arg in this.flowRun.run_config) {
        const info = this.runConfig.args.find(a => a.arg === arg)
        if (info?.label) {
          argList[info.label] = this.flowRun.run_config[arg]
        } else if (
          arg.includes('job_template') ||
          arg.includes('task_definition')
        ) {
          const override = this.runConfig.args[0].options.find(
            a => a.arg === arg
          )
          argList[override.label] = this.flowRun.run_config[arg]
        } else if (arg === 'labels') {
          argList['Labels'] = this.flowRun.labels
        }
      }
      return argList
    }
  },
  methods: {}
}
</script>

<template>
  <v-row v-if="flowRun.run_config == null" no-gutters
    ><v-col>
      <div
        class="text-center position-absolute center-absolute text-h5 utilGrayDark--text"
        style="z-index: 1;"
      >
        This run has no
        <span class="font-weight-medium">
          <v-icon small color="primary" class="ml-1">
            fa-cogs
          </v-icon>
          Run Config</span
        >! You can learn how to set a run config in the
        <a
          href="https://docs.prefect.io/orchestration/ui/flow.html#run"
          target="_blank"
        >
          Flow Run Docs</a
        >.
      </div></v-col
    ></v-row
  >
  <v-card v-else>
    <div class="config-type py-2 d-flex align-center justify-start px-4 my-2">
      <div class="text-center" style="width: 50px;">
        <i :class="runConfig.icon" class="fa-2x pi-2x"> </i>
      </div>

      <div class="ml-2">
        <span class="text-h6 mr-2"> {{ runConfig.label }}</span>
      </div>
    </div>
    <div
      v-for="(arg, i) of Object.keys(argList)"
      :key="i"
      class="row-divider py-2"
    >
      <v-row>
        <v-col cols="6">
          <v-card-subtitle class="text-h5">{{ arg }}</v-card-subtitle>
        </v-col>
        <v-col cols="6">
          <v-card-text v-if="arg === 'Labels'">
            <span v-for="(label, j) in argList[arg]" :key="j"
              ><Label disabled>{{ label }}</Label></span
            ></v-card-text
          >
          <v-card-text v-else class="text-subtitle-1">{{
            argList[arg]
          }}</v-card-text>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<style lang="scss">
.config-type {
  border: 2px solid;
  border-color: var(--v-utilGrayLight-base) !important;
  height: 80px;
}

.row-divider:not(:last-child) {
  position: relative;

  &::after {
    background-color: var(--v-utilGrayLight-base);
    bottom: 0;
    content: '';
    height: 1px;
    margin: auto;
    position: absolute;
    width: 100%;
  }
}
.center-absolute {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
