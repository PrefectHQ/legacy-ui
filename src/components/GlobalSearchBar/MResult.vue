<script>
/* eslint-disable vue/no-v-html */
// Added this line to disable to the v-html
// console warning since we know we can trust the
// data coming from the GraphQL server
export default {
  computed: {
    typeName() {
      return 'Marvin says:'
    }
  }
}
</script>

<template>
  <div class="search-result">
    <v-list-item-content>
      <v-list-item-subtitle>{{ typeName }}</v-list-item-subtitle>

      <v-list-item-subtitle class="id-subtitle">
        Here I am, brain the size of a planet and they ask me to tell you about
        Prefect....
      </v-list-item-subtitle>
    </v-list-item-content>
  </div>
</template>

<style lang="scss" scoped>
.search-result {
  cursor: pointer;
  min-width: 15rem;
}

.id-subtitle {
  font-size: 0.6rem !important;
}

.text--secondary {
  background-color: #123456 !important;
}
</style>
