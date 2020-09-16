<script>
import { mapGetters } from 'vuex'
export default {
  props: {
    flow: {
      type: Object,
      default: () => {}
    },
    flowGroup: {
      type: Object,
      default: () => {}
    },
    iconSize: {
      type: String,
      required: false,
      default: null
    },
    always: {
      type: Boolean,
      default: true
    },
    location: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      infoMessage: '',
      docsName: '',
      docsLink: ''
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('agent', ['agents']),
    agentOrLabel() {
      if (!this.agents || !this.agents.length) return 'Agent Problem'
      if (!this.labelsAlign) return 'Label Problem'
      return 'Flow and Agent Labels'
    },
    agentLabels() {
      if (this.agents) {
        const labels = this.agents.reduce((accumulator, agent) => {
          accumulator.push(agent.labels)
          return accumulator
        }, [])
        return labels
      }
      return null
    },
    flowLabels() {
      const labels = this.flowGroup?.labels || this.flow?.environment?.labels
      return labels
    },
    labelsAlign() {
      if (!this.agents) return
      if (!this.agents.length) {
        this.labelMessage(
          'You have no live Agents - scheduled flow runs will not be submitted for execution and will display as "Late".',
          'agents',
          'https://docs.prefect.io/orchestration/agents/overview.html'
        )
        return false
      }
      if (
        !this.flowLabels.length &&
        this.agentLabels.every(arrayOfLabels => arrayOfLabels.length > 0)
      ) {
        this.labelMessage(
          'To let the agent pick up this flow run, you may need to add labels to your flow.',
          'Labels and Flow Affinity',
          'https://docs.prefect.io/orchestration/agents/overview.html#flow-affinity-labels'
        )
        return false
      } else {
        let matchingLabels = 0
        if (this.agentLabels) {
          this.agentLabels.forEach(array => {
            if (this.flowLabels.every(label => array.includes(label)))
              matchingLabels++
          })
        }
        if (matchingLabels > 0) {
          this.labelMessage(
            'Your flow and agent labels look good.',
            'Labels and Flow Affinity',
            'https://docs.prefect.io/orchestration/agents/overview.html#flow-affinity-labels'
          )
          return true
        } else {
          this.labelMessage(
            'It looks like you have a label on your flow that does not match your agent labels. To let the agent pick up this flow run, you need to align your flow and agents label.',
            'Labels and Flow Affinity',
            'https://docs.prefect.io/orchestration/agents/overview.html#flow-affinity-labels'
          )
          return false
        }
      }
    }
  },
  methods: {
    labelMessage(message, docsName, link) {
      this.infoMessage = message
      this.docsName = docsName
      this.docsLink = link
    }
  }
}
</script>

<template>
  <v-menu
    v-if="always || !labelsAlign"
    :close-on-content-click="false"
    offset-y
    open-on-hover
  >
    <template v-slot:activator="{ on }">
      <v-btn text icon v-on="on">
        <v-icon
          :color="labelsAlign ? 'success' : 'deepRed'"
          :size="iconSize || 'x-large'"
        >
          label
        </v-icon>
        <v-icon
          v-if="!labelsAlign"
          class="position-absolute"
          color="white"
          size="small"
        >
          priority_high
        </v-icon>
      </v-btn>
    </template>
    <v-card tile class="pa-0" max-width="320">
      <v-card-title class="subtitle pb-1">{{ agentOrLabel }} </v-card-title>

      <v-card-text class="pt-0">
        <div class="font-weight-bold pb-4"> {{ infoMessage }}</div>
        <div
          >You can see your agent labels in the
          <router-link
            target="_blank"
            :to="{
              name: 'dashboard',
              params: { tenant: tenant.slug },
              query: { agents: '' }
            }"
          >
            <span>agents tab</span></router-link
          ></div
        >
        <div>
          You can see and edit you flow labels in the
          <router-link
            v-if="location !== 'flowPage'"
            target="_blank"
            :to="{
              name: 'flow',
              params: { id: flow.id, tenant: tenant.slug }
            }"
            >flow details tile</router-link
          ><span v-else>flow details tile</span></div
        >
        <div class="mt-4">
          For more information check-out the docs on
          <a :href="docsLink" target="_blank">{{ docsName }}</a>
          .</div
        >
      </v-card-text>
    </v-card>
  </v-menu>
</template>
