<script>
import { mapGetters } from 'vuex'

import CardTitle from '@/components/Card-Title'

export default {
  components: {
    CardTitle
  },

  props: {
    agent: {
      type: Object,
      required: true
    }
  },
  data() {
    return {}
  },
  computed: {
    ...mapGetters('agent', ['staleThreshold', 'unhealthyThreshold']),
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant'])
  },
  methods: {}
}
</script>

<template>
  <v-card tile class="agent-card px-2 pb-3" style="overflow-y: auto;">
    <CardTitle title="Agent Config" icon="pi-agent"> </CardTitle>

    <v-card-text class="py-0">
      <v-list>
        <v-list-item class="pa-0">
          <v-list-item-content class="pa-0">
            <v-list-item-title>
              Agent Config Id
            </v-list-item-title>
            <v-list-item-subtitle>
              <!-- <truncate :content="agent.id">
                {{ agent.config.id || unknown }}</truncate
              > -->
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item two-line class="pa-0">
          <v-list-item-content class="pa-0 overflow-scroll">
            <v-list-item-title>
              Config Details
            </v-list-item-title>
            {{ agent.config }}
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-card-actions class="pa-0"> </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.bottom-right-loaded {
  bottom: 4px;
  right: -2px;
}

.bottom-right-loading {
  bottom: 12px;
  right: -16px;
}

.pointer {
  cursor: pointer;
}

.fa-robot {
  color: var(--v-secondaryGray-base);
  float: right;
  font-size: 1.8em;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.overflow-scroll {
  overflow: scroll;
}
</style>
