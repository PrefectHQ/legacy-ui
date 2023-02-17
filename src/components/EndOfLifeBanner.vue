<script>
import { mapGetters } from 'vuex'
export default {
  components: {},
  props: {
    pageScroll: {
      type: Boolean,
      required: false,
      default: () => false
    }
  },
  data() {
    return {
      dismissed: false
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud'])
  }
}
</script>

<template>
  <v-banner :value="!dismissed">
    <template #default>
      <div class="d-flex align-center">
        <v-avatar slot="icon" color="primary" size="40">
          <v-icon color="white"> warning </v-icon>
        </v-avatar>
        <div class="ml-4"> Prefect Cloud 1 is dying :( </div>
        <v-btn
          class="ml-auto"
          width="40"
          height="40"
          icon
          text
          dark
          color="error"
          @click="dismissed = !dismissed"
        >
          <v-icon> close </v-icon>
        </v-btn>
      </div>
    </template>
  </v-banner>
</template>
