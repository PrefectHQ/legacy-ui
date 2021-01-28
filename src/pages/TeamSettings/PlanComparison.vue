<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      plans: [
        { value: 'FREE_2021', name: 'Starter' },
        { value: 'GOOD_2021', name: 'Standard' },
        { value: 'BETTER_2021', name: 'Professional' }
      ],
      selected: null
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    planType: {
      get() {
        const match = this.plans.findIndex(
          plan => plan.value === this.license?.terms?.plan
        )
        return match >= 0 ? match : 0
      },
      set(x) {
        this.selected = x
      }
    },
    print() {
      return true
    }
  },
  methods: {
    upgrade() {
      console.log(this.selected || this.planType)
    }
  }
}
</script>
<template>
  <v-card v-if="print">
    <v-list>
      <v-list-item-group v-model="planType" color="primary">
        <v-list-item v-for="(plan, i) in plans" :key="i">
          Select {{ plan.name }}
        </v-list-item>
      </v-list-item-group>
    </v-list>
    <v-card-actions>
      <v-btn @click="upgrade">
        Upgrade
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
