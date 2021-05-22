<script>
// import moment from '@/utils/moment'
import EditableTextField from '@/components/EditableTextField'

export default {
  components: {
    EditableTextField
  },
  props: {
    task: {
      type: Object,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      isMaxRetriesLoading: false,
      isRetryDelayLoading: false
    }
  },
  methods: {
    handleSave(input, type) {
      const previousName =
        type == 'max_retry' ? this.task.max_retries : this.task.retry_delay

      if (input === previousName) return
      try {
        if (type == 'max_retry') {
          this.isMaxRetriesLoading = true
        } else if (type == 'retry_delay') {
          this.isRetryDelayLoading = true
        }

        /*
        NOTE: converts the retry_delay string into seconds
         - moment.duration(val).asSeconds()
        */

        // const { data } = await this.$apollo.mutate({
        //   mutation: require('@/graphql/Mutations/tbd.gql'),
        //   variables: {
        //     input: {
        //     }
        //   }
        // })

        // await this.$apollo.queries.tbd.refetch()
        // if (!data.tbd.success) {
        //   throw new Error(data.tbd.error)
        // }

        // this.setAlert({
        //   alertShow: true,
        //   alertMessage: ``,
        //   alertType: 'success'
        // })
      } catch {
        // this.setAlert({
        //   alertShow: true,
        //   alertMessage: '',
        //   alertType: 'error'
        // })
      } finally {
        if (type == 'max_retry') {
          this.isMaxRetriesLoading = false
        } else if (type == 'retry_delay') {
          this.isRetryDelayLoading = false
        }
      }
    }
  }
}
</script>

<template>
  <div class="mt-4">
    <v-row no-gutters>
      <v-col cols="6">
        Max Retries
      </v-col>
      <v-col cols="6" class="text-right font-weight-bold">
        <EditableTextField
          style="
          max-width: 60%;
          float: right;
          "
          :loading="isMaxRetriesLoading"
          :content="String(task.max_retries)"
          label="Max retries"
          required
          @change="handleSave($event, 'max_retry')"
        />
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col cols="6">
        Retry Delay
      </v-col>
      <v-col cols="6" class="text-right font-weight-bold">
        <EditableTextField
          style="
          max-width: 60%;
          float: right;
          "
          :content="task.retry_delay"
          :loading="isRetryDelayLoading"
          label="Retry delay"
          required
          @change="handleSave($event, 'retry_delay')"
        />
      </v-col>
    </v-row>
  </div>
</template>
