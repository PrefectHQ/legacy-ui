<script>
import { mapActions } from 'vuex'
export default {
  data() {
    return {
      loading: false,
      name: null
    }
  },
  computed: {
    disabled() {
      return !this.name
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    handleClose() {
      this.$emit('close')
    },
    async handleSave() {
      this.loading = true

      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-agent-config.gql'),
          variables: {
            input: {
              name: this.name
            }
          }
        })

        this.$emit('save', data?.create_agent_config)
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage: `${e}`,
          alertType: 'error'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<template>
  <div>
    <div>
      <v-col class="mb-4 pa-0" cols="12" sm="6" lg="3">
        <v-text-field
          v-model="name"
          outlined
          hide-details
          dense
          label="Config name"
        />
      </v-col>
    </div>
    <v-btn
      text
      color="utilGrayMid"
      class="light-weight-text mr-1 px-2"
      @click="handleClose"
    >
      <span style="text-transform: none;">Cancel</span>
    </v-btn>
    <v-btn
      color="primary"
      elevation="0"
      :loading="loading"
      :disabled="disabled"
      @click="handleSave"
    >
      <span style="text-transform: none;">Save</span>
    </v-btn>
  </div>
</template>
