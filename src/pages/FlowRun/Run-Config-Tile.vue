<script>
import { runConfigs } from '@/utils/runConfigs'
export default {
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
          argList['Labels'] = arg['labels']
        }
      }
      return argList
    }
  },
  methods: {}
}
</script>

<template>
  <v-card>
    <div
      v-if="flowRun.run_config == null"
      class="text-center text-h5 utilGrayDark--text"
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
    </div>
    <div v-else>
      <div class="config-type py-2 d-flex align-center justify-start px-4 my-2">
        <div class="text-center" style="width: 50px;">
          <i :class="runConfig.icon" class="fa-2x pi-2x"> </i>
        </div>

        <div class="w-100 ml-2">
          <span class="text-h6 mr-2"> {{ runConfig.label }}</span>
        </div>
      </div>
      <v-row class="row-divider" no-gutters>
        <v-col>
          <div
            v-for="(arg, i) of Object.keys(argList)"
            :key="i"
            class="config-container py-2"
          >
            <v-card-subtitle class="text-h5">{{ arg }}</v-card-subtitle>
            <div class="text-subtitle-1 utilGrayDark--text">{{
              argList[arg]
            }}</div>
          </div>
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
.config-container {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 400px));
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
</style>
