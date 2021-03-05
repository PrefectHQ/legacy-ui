<script>
/* eslint-disable vue/no-v-html */
// Added this line to disable to the v-html
// console warning since we've hard-coded the data
export default {
  props: {
    searchResult: {
      required: true,
      type: Object,
      validator: result => {
        return result.id && result.name
      }
    },
    // This is a reference to the parent passed in by the VAutoComplete
    // component. It contains important search highlighting methods
    // but we don't use it for much else. It's typed as an Object
    // and we're making sure the .genFilteredText() method exists on the
    // passed prop.
    parent: {
      type: Object,
      required: true,
      validator: parent => {
        return parent.genFilteredText
      }
    }
  }
}
</script>

<template>
  <div class="search-result">
    <v-list-item-content>
      <!-- the .genFilteredText() method calls a number of downstream methods
       on the parent component. This allows us to show where the user input
      matches the results we're returning to them.
      Since it returns HTML, we need to use the Vue HTML injector, otherwise
      it'll be inserted as plaintext. -->
      <v-list-item-title
        v-html="`${parent.genFilteredText(searchResult.name)}`"
      />
      <v-list-item-subtitle class="id-subtitle">
        {{ searchResult.id }}
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
</style>
