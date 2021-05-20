<script>
export default {
  data() {
    return {
      menu: false,
      date: null,
      search: null
    }
  }
}
</script>

<template>
  <div
    class="logs-toolbar d-flex align-center justify-start blue-grey lighten-2 py-3 px-2 rounded elevation-1"
  >
    <div>
      <v-icon class="d-inline-block" large color="white">
        search
      </v-icon>

      <v-text-field
        v-model="search"
        class="d-inline-block white rounded text-body-1"
        filled
        rounded
        dense
        hide-details
      />
    </div>

    <v-spacer />

    <v-menu
      ref="menu"
      v-model="menu"
      :close-on-content-click="false"
      :return-value.sync="date"
      transition="scale-transition"
      offset-y
      min-width="auto"
    >
      <template #activator="{ on, attrs }">
        <v-text-field
          v-model="date"
          prepend-icon="date_range"
          class="rounded text-body-1"
          filled
          rounded
          dense
          readonly
          hide-details
          v-bind="attrs"
          v-on="on"
        />
      </template>

      <v-date-picker v-model="date" no-title range scrollable>
        <v-spacer></v-spacer>
        <v-btn text color="primary" @click="menu = false">
          Cancel
        </v-btn>
        <v-btn text color="primary" @click="$refs.menu.save(date)">
          OK
        </v-btn>
      </v-date-picker>
    </v-menu>
  </div>
</template>

<style lang="scss" scoped>
/* */
</style>
