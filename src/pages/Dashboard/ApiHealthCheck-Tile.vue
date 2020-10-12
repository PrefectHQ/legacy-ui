<script>
import { mapGetters } from 'vuex'
import CardTitle from '@/components/Card-Title'

export default {
  components: {
    CardTitle
  },
  data() {
    return {}
  },
  computed: {
    ...mapGetters('api', [
      'connected',
      'connecting',
      'backend',
      'connectionMessage',
      'url'
    ]),
    cardColor() {
      if (this.connected) return 'Success'
      if (this.connecting) return 'grey'
      return 'Failed'
    },
    cardIcon() {
      if (this.connected) return 'signal_cellular_4_bar'
      if (this.connecting) return 'signal_cellular_connected_no_internet_4_bar'
      return 'signal_cellular_off'
    }
  }
}
</script>

<template>
  <v-card tile class="py-2 position-relative">
    <v-system-bar :height="5" absolute :color="cardColor" />
    <CardTitle :loading="connecting" :icon="cardIcon" :icon-color="cardColor">
      <v-row slot="title" no-gutters class="d-flex align-center justify-start">
        <div>API Status</div>
        <a
          v-if="!connected"
          class="ml-3"
          href="https://docs.prefect.io/core/concepts/configuration.html#environment-variables"
          target="_blank"
        >
          <v-tooltip top>
            <template #activator="{ on }">
              <v-icon color="grey darken-1" v-on="on">info</v-icon>
            </template>
            <span>
              <div>This is the most recent message:</div>
              <div class="my-4 font-italic font-weight-medium">
                {{ connectionMessage }}
              </div>
              <div>
                Did you set the
                <span class="font-weight-bold">graphql_url</span> variable in
                <span class="font-weight-bold">~/.prefect/config.toml</span>
                correctly before starting Prefect Server?
              </div>
              <div>
                Click this icon to read more about configuring Prefect.
              </div>
            </span>
          </v-tooltip>
        </a>
      </v-row>
    </CardTitle>
    <v-list dense>
      <v-list-item>
        <v-list-item-avatar class="mr-0">
          <v-progress-circular
            v-if="connecting"
            indeterminate
            :size="15"
            :width="2"
            color="primary"
          />
          <v-icon v-else-if="!connected" class="Failed--text">
            priority_high
          </v-icon>
          <v-icon v-else class="Success--text">
            check
          </v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <div
            class="subtitle-1 font-weight-light"
            style="line-height: 1.25rem;"
          >
            <span v-if="connected">Connected</span>
            <span v-else-if="connecting">Attempting to connect...</span>
            <span v-else>Couldn't connect</span>
          </div>
          <div class="font-weight-medium">
            {{ url }}
          </div>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>
