<script>
/* eslint-disable vue/no-v-html */
export default {
  props: {
    label: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      confirm: false
    }
  },
  methods: {
    accept() {
      this.$emit('accept')
    },
    decline() {
      this.$emit('decline')
    }
  }
}
</script>

<template>
  <div>
    <div v-if="!confirm" class="d-flex align-center justify-space-between">
      <div class="truncate" v-html="label"></div>
      <div class="text-right">
        <v-btn
          color="primary"
          data-cy="choose-tenant"
          text
          @click="confirm = 'accept'"
        >
          <v-icon>
            check
          </v-icon>
        </v-btn>

        <v-btn color="error" text @click="confirm = 'decline'">
          <v-icon>
            close
          </v-icon>
        </v-btn>
      </div>
    </div>

    <div v-else>
      <v-row no-gutters>
        <v-col cols="9">
          <v-btn
            v-if="confirm == 'accept'"
            data-cy="accept-invitation"
            color="primary"
            block
            text
            :loading="loading"
            outlined
            @click="accept"
          >
            Accept
          </v-btn>
          <v-btn
            v-if="confirm == 'decline'"
            color="error"
            block
            text
            outlined
            @click="decline"
          >
            Decline
          </v-btn>
        </v-col>
        <v-col cols="3" class="px-1">
          <v-btn v-if="!!confirm" block text @click="confirm = false">
            <v-icon small>close</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cancel-button {
  position: absolute;
  right: 0;
  top: 0;
}
</style>
