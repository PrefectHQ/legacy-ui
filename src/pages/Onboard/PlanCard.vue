<script>
export default {
  props: {
    plan: {
      required: true,
      type: String
    },
    selected: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      plans: {
        good: {
          name: 'Starter',
          price: 0,
          taskRuns: 10000,
          additionalCost: '0.0025',
          users: 5,
          history: 'week'
        },
        better: {
          name: 'Standard',
          price: 500,
          taskRuns: 10000,
          additionalCost: '0.0050',
          users: 10,
          history: 'month'
        },
        best: {
          name: 'Enterprise',
          price: 'contact',
          taskRuns: 10000,
          additionalCost: 0.0025,
          users: 'unlimited',
          history: 'year'
        }
      }
    }
  },
  computed: {
    activePlan() {
      return this.plans[this.plan]
    },
    monthlyCost() {
      if (this.activePlan.price == 'contact') {
        return 'Contact Sales'
      }
      return `$${this.activePlan.price}/month`
    }
  }
}
</script>
<template>
  <v-card
    :class="{ 'elevation-0': !selected }"
    :style="{
      filter: selected ? '' : 'contrast(50%)'
    }"
    class="pa-3"
  >
    <h2>{{ activePlan.name }}</h2>
    <v-list>
      <v-list-item two-line>
        <v-list-item-icon style="margin-left: 0;"
          ><v-icon
            class="pi-flow-run"
            style="color: var(--v-primary-base);"
          ></v-icon
        ></v-list-item-icon>
        <span
          style="flex-direction: column;
        text-align: left;"
        >
          <v-list-item-title
            >{{ activePlan.taskRuns }} runs per month</v-list-item-title
          >
          <v-list-item-subtitle
            >Additional runs start at ${{
              activePlan.additionalCost
            }}</v-list-item-subtitle
          >
        </span>
      </v-list-item>
      <v-list-item>
        <v-list-item-icon
          ><v-icon
            class="fas fa-user"
            style="color: var(--v-primary-base);"
          ></v-icon></v-list-item-icon
        >{{ activePlan.users }} users</v-list-item
      >
      <v-list-item>
        <v-list-item-icon
          ><v-icon
            class="fas fa-history"
            style="color: var(--v-primary-base);"
          ></v-icon></v-list-item-icon
        >1 {{ activePlan.history }} result history</v-list-item
      >
    </v-list>
    <div class="display-1 text-center">{{ monthlyCost }}</div>
  </v-card>
</template>
