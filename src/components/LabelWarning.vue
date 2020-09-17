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
    location: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      infoMessage: ''
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
      return this.agents?.reduce((accumulator, agent) => {
        accumulator.push(agent.labels)
        return accumulator
      }, [])
    },
    flowLabels() {
      return this.flowGroup?.labels || this.flow?.environment?.labels
    },
    docsName() {
      if (!this.agents?.length) return 'agents'
      return 'Labels and Flow Affinity'
    },
    docsLink() {
      if (!this.agents?.length)
        return 'https://docs.prefect.io/orchestration/agents/overview.html'
      return 'https://docs.prefect.io/orchestration/agents/overview.html#flow-affinity-labels'
    },
    labelsAlign() {
      if (!this.agents?.length) {
        this.labelMessage(
          'You have no live Agents - scheduled flow runs will not be submitted for execution and might display as "Late".'
        )
        return false
      }
      if (
        !this.flowLabels?.length &&
        this.agentLabels.every(arrayOfLabels => arrayOfLabels.length > 0)
      ) {
        this.labelMessage(
          'You have no currently running Agents configured to pick up flows without labels; you may need to add labels to your flow.'
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
          this.labelMessage('Your flow and agent labels look good.')
          return true
        } else {
          this.labelMessage(
            'It looks like no currently running Agent has this flow's full set of labels. To allow an Agent to run this flow, you need to have at least one Agent whose labels include all of those on the flow.'
          )
          return false
        }
      }
    }
  },
  methods: {
    labelMessage(message) {
      this.infoMessage = message
    }
  }
}
</script>

<template>
  <v-menu
    v-if="!labelsAlign"
    :close-on-content-click="false"
    offset-y
    open-on-hover
  >
    <template v-slot:activator="{ on }">
      <v-btn left x-small icon class="lefty" v-on="on">
        <v-icon color="failRed">
          fa-tag
        </v-icon>
        <v-icon
          v-if="!labelsAlign"
          class="position-absolute"
          color="white"
          size="x-small"
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
          >.</div
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
          For more information check out the docs on
          <a :href="docsLink" target="_blank">{{ docsName }}</a>
          .</div
        >
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<style lang="scss" scoped>
.lefty {
  justify-content: left;
}
</style>
