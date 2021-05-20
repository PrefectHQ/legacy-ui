<script>
import moment from '@/utils/moment'

export default {
  props: {
    task: {
      type: Object,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      isLoading: false,
      isReadOnly: true,
      maxRetries: this.task.max_retries,
      retryDelay: this.task.retry_delay,
      interval: 'second',
      intervalOptions: [
        {
          value: 'second',
          min: 1,
          max: 720
        },
        {
          value: 'minute',
          min: 1,
          max: 720
        },
        {
          value: 'hour',
          min: 1,
          max: 168
        }
      ]
    }
  },

  computed: {
    disableSave() {
      return Number(this.maxRetries) !== this.task.max_retries ||
        this.retryDelay !== this.task.retry_delay
        ? false
        : true
    }
  },
  methods: {
    handleSave() {
      this.isLoading = true
      this.isReadOnly = true
      const result = new Promise(resolve => {
        setTimeout(() => {
          resolve({
            task: {
              maxRetries: this.maxRetries,
              retryDelay: moment.duration(this.retryDelay).asSeconds()
            }
          })
        }, 3000)
      })
      result.then(res => {
        this.isLoading = false
      })
    },
    handleEdit() {
      this.isReadOnly = !this.isReadOnly

      if (
        this.retryDelay !== this.task.retry_delay ||
        this.maxRetries !== this.task.max_retries
      ) {
        this.retryDelay = this.task.retry_delay
        this.maxRetries = this.task.max_retries
      }
    }
  }
}
</script>

<template>
  <div class="position-relative  mt-5">
    <div class="d-flex justify-end align-end mb-1" style="width: 100%;">
      <v-btn
        x-small
        class="text-normal mr-2"
        depressed
        color="utilGrayLight"
        title="Edit"
        @click="handleEdit"
      >
        {{ !isReadOnly ? 'Cancel' : 'Edit' }}
      </v-btn>

      <v-btn
        x-small
        class="text-normal mr-2"
        depressed
        color="utilGrayLight"
        title="Edit"
        :disabled="disableSave"
        @click="handleSave"
        :loading="isLoading"
      >
        Save
      </v-btn>
    </div>

    <div>
      <v-row no-gutters align="center" class="my-4 position-relative">
        <v-col cols="6" class="pr-3">
          Max Retries
        </v-col>
        <v-col cols="6" class="pl-3">
          <v-text-field
            v-model="maxRetries"
            type="number"
            class="text-body-1"
            hide-details
            outlined
            dense
            :readonly="isReadOnly"
          />
        </v-col>

        <v-col cols="6" class="pr-3 mt-5">
          Retry Delay
        </v-col>
        <v-col cols="6" class="pl-3 mt-5">
          <v-text-field
            v-model="retryDelay"
            class="text-body-1"
            hide-details
            outlined
            dense
            :readonly="isReadOnly"
          />
        </v-col>

        <!-- <v-col cols="3" class="pl-3 mt-5">
          <v-select
            v-model="interval"
            :items="intervalOptions"
            outlined
            dense
            hide-details
            item-text="value"
            item-value="value"
          />
        </v-col> -->
      </v-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.v-input--is-readonly {
  background-color: rgba(0, 0, 0, 0.03) !important;
}
</style>
