<script>
import CardTitle from '@/components/Card-Title'
import SchematicFlow from '@/components/Schematics/Schematic-Flow'
import { mapGetters } from 'vuex'

export default {
  components: {
    CardTitle,
    SchematicFlow
  },
  props: {
    flow: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      expanded: true,
      showCards: true,
      tasks: []
    }
  },
  computed: {
    ...mapGetters('user', ['timezone'])
  },
  watch: {},
  methods: {},
  apollo: {
    flow_by_pk: {
      query: require('@/graphql/Schematics/flow.gql'),
      variables() {
        return {
          id: this.flow.id
        }
      },
      skip() {
        return !this.flow
      },
      update(data) {
        if (data.flow_by_pk) {
          this.tasks = data.flow_by_pk.tasks
        } else {
          this.tasks = []
        }

        return data.flow_by_pk
      }
    }
  }
}
</script>

<template>
  <v-card class="pa-2 mt-2" tile>
    <CardTitle title="Schematic" icon="pi-schematic">
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
        :schematic-id="flow.id"
        :show-cards="showCards"
        :tasks="tasks"
      />
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
  width: 25%;
}
</style>
