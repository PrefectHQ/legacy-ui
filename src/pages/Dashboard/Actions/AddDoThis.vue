<script>
export default {
  computed: {},
  methods: {
    handleAddAction() {
      this.$emit('close-action')
    }
  }
}
</script>

<template>
  <v-card>
    <div class="text-right">
      <v-btn icon @click="handleAddAction"><v-icon>close</v-icon></v-btn>
    </div>
    <div>
      Action Type
    </div>
  </v-card>
</template>
