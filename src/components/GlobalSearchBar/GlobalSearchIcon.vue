<script>
export default {
  props: {
    type: {
      required: true,
      type: String,
      validator: label => {
        return typeof label == 'string'
      }
    }
  },
  computed: {
    resultIcon() {
      switch (this.type) {
        case 'flow':
          return 'pi-flow'
        case 'flow_run':
          return 'pi-flow-run'
        case 'task':
          return 'pi-task'
        case 'task_run':
          return 'pi-task-run'
        case 'project':
          return 'pi-project'
        default:
          return ''
      }
    }
  }
}
</script>

<template>
  <v-list-item-avatar>
    <v-icon>{{ resultIcon }}</v-icon>
  </v-list-item-avatar>
</template>
