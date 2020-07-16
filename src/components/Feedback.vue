<script>
import LogRocket from 'logrocket'

export default {
  data() {
    return {
      feedback: '',
      error: false,
      submitting: false,
      success: false
    }
  },
  methods: {
    async sendFeedback() {
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/support/send-feedback.gql'),
          variables: {
            type: 'Cloud Feedback',
            message: this.feedback
          }
        })
        if (data?.send_feedback?.success) {
          this.success = true
          this.feedback = ''
          setTimeout(() => {
            this.$emit('close')
          }, 2000)
        } else {
          this.error = true
        }
      } catch (error) {
        LogRocket.captureException(error)
        this.error = true
        throw new Error(error)
      }
    },
    async submit() {
      if (!this.feedback) {
        this.error = true
        return
      }

      this.submitting = true
      await this.sendFeedback()
      this.submitting = false
    },
    reset() {
      this.error = false
      this.success = false
    }
  }
}
</script>

<template>
  <v-card tile>
    <v-card-title class="pb-1">
      We would love your feedback!
    </v-card-title>
    <v-card-subtitle class="mt-0 mb-4">
      Let us know how we can make Prefect Cloud a better experience for you.
    </v-card-subtitle>
    <v-card-text>
      <v-scroll-x-transition mode="out-in">
        <div v-if="success" key="message" class="body-2" style="height: 157px;">
          <v-icon small color="green">
            check
          </v-icon>
          Your feedback has been submitted. Thank you!
        </div>
        <v-textarea
          v-else
          key="input"
          v-model="feedback"
          label="How can we help?"
          outlined
          dense
          required
          @input="reset"
        />
      </v-scroll-x-transition>
      <div
        :style="{
          height: '20px',
          position: 'relative',
          top: '-12px'
        }"
      >
        <v-scroll-x-transition>
          <div v-if="error" class="body-2">
            <v-icon small color="error">
              error
            </v-icon>
            Something went wrong while submitting your feedback. Please try
            again.
          </div>
        </v-scroll-x-transition>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text @click="$emit('close')">
        Cancel
      </v-btn>
      <v-btn
        :disabled="!feedback"
        color="primary"
        :loading="submitting"
        @click="submit"
      >
        Submit
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.message-height {
  height: 30px;
}
</style>
