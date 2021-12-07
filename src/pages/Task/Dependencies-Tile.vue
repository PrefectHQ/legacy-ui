<script>
import CardTitle from '@/components/Card-Title'
import SchematicFlow from '@/components/Schematics/Schematic-Flow'
import { mapGetters } from 'vuex'

export default {
  filters: {
    typeClass: val => val.split('.').pop()
  },
  components: {
    CardTitle,
    SchematicFlow
  },
  props: {
    downstreamCount: {
      type: Number,
      required: false,
      default: () => null
    },
    flow: {
      type: Object,
      required: false,
      default: () => {}
    },
    loading: {
      type: Boolean,
      required: false,
      default: () => false
    },
    tasks: {
      type: Array,
      required: true
    },
    upstreamCount: {
      type: Number,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      expanded: true,
      showCards: true,
      task: this.tasks.find(task => task.id == this.$route.params.id)
    }
  },
  computed: {
    ...mapGetters('user', ['timezone']),
    subtitle() {
      return `${this.upstreamCount} Upstream • ${this.downstreamCount} Downstream`
    }
  },
  watch: {
    '$route.query.schematic'(val) {
      this.setTask(val)
    },
    tasks() {
      this.setTask(this.$route.query.schematic)
    }
  },
  methods: {
    setTask(id) {
      if (!id) {
        this.task = null
      } else {
        this.task = this.tasks.find(task => task.id == id)
      }
    }
  }
}
</script>

<template>
  <v-card class="pa-2" tile>
    <CardTitle title="Dependencies" icon="share" :subtitle="subtitle">
      <div slot="action" class="d-flex align-end justify-center flex-column">
        <v-checkbox
          v-model="showCards"
          dense
          label="Show Cards"
          color="primary"
          class="my-0 mr-4"
          hide-details
        ></v-checkbox>
      </div>
    </CardTitle>

    <v-card-text class="full-height position-relative">
      <SchematicFlow
        v-if="!loading"
        :tasks="tasks"
        :show-cards="showCards"
        :schematic-id="flow ? flow.id : null"
      />
      <v-skeleton-loader v-else type="image" />
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.full-height {
  min-height: 68vh;
}

.task-tile {
  right: 1rem;
  top: 1rem;
  width: 250px;
}
</style>
