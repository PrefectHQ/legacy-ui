<script>
import { mapActions } from 'vuex'

export default {
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      deletingConfig: false,
      copiedText: {}
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    copyToClipboard(value) {
      this.copiedText = {}
      this.copiedText[value] = true
      navigator.clipboard.writeText(value)

      setTimeout(() => {
        this.copiedText = {}
        this.copiedText[value] = false
      }, 600)
    },
    async deleteConfig(id) {
      this.deletingConfig = true
      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/Automations/delete-agent-config.gql'),
          variables: {
            agentConfigInput: {
              agent_config_id: id
            }
          }
        })
        this.setAlert({
          alertShow: true,
          alertMessage: 'Agent config deleted',
          alertType: 'info'
        })
      } catch (error) {
        this.setAlert({
          alertShow: true,
          alertMessage: `${error}`,
          alertType: 'error'
        })
      } finally {
        this.$emit('refetch', id)
        this.deletingConfig = false
      }
    }
  }
}
</script>

<template>
  <v-menu :close-on-content-click="false" offset-y>
    <template #activator="{ on, attrs }">
      <v-btn class="px-2" text small fab v-bind="attrs" v-on="on">
        <v-icon>more_horiz</v-icon>
      </v-btn>
    </template>
    <v-card class="pa-4">
      <div>
        <v-btn
          text
          plain
          class="cursor-pointer show-icon-hover-focus-only pa-0 text-subtitle-1"
          role="button"
          @click="copyToClipboard(`--agent-config-id ${config.id}`)"
        >
          <v-icon color="primary" class="mr-2">
            {{
              copiedText[`--agent-config-id ${config.id}`]
                ? 'check'
                : 'file_copy'
            }}
          </v-icon>
          <span class="text-subtitle-1" style="text-transform: none;">
            --agent-config-id {{ config.id }}
          </span>
        </v-btn>
      </div>
      <div class="mt-2">
        <v-btn
          text
          plain
          class="cursor-pointer show-icon-hover-focus-only pa-0 text-subtitle-1"
          role="button"
          :loading="deletingConfig"
          @click="deleteConfig(config.id)"
        >
          <v-icon color="red" class="mr-2">
            delete
          </v-icon>
          <span class="text-subtitle-1" style="text-transform: none;">
            Delete
          </span>
        </v-btn>
      </div>
    </v-card>
  </v-menu>
</template>
