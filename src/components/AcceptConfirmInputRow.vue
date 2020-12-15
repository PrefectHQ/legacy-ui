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
    },
    tooltips: {
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
      <div class="text-truncate" v-html="label"></div>
      <div class="text-right">
        <v-tooltip :disabled="!tooltips" bottom
          ><template #activator="{on}"
            ><v-btn
              color="primary"
              data-cy="choose-tenant"
              text
              v-on="on"
              @click="confirm = 'accept'"
            >
              <v-icon>
                check
              </v-icon>
            </v-btn></template
          >Accept team invite</v-tooltip
        >

        <v-tooltip :disabled="!tooltips" bottom
          ><template #activator="{on}"
            ><v-btn color="error" text v-on="on" @click="confirm = 'decline'">
              <v-icon>
                close
              </v-icon>
            </v-btn></template
          >Decline team invite</v-tooltip
        >
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
            :loading="loading"
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
