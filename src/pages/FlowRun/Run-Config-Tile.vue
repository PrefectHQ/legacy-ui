<script>
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
  computed: {},
  methods: {}
}
</script>

<template>
  <v-row no-gutters>
    <v-col>
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
        {{ flowRun.run_config }}
      </div>
    </v-col>
  </v-row>
</template>

<style lang="scss">
.center-absolute {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
