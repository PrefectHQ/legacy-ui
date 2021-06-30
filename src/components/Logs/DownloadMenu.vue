<script>
export default {
  props: {
    filter: {
      type: Object,
      required: true
    },
    buttonClass: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      menu: false,
      outputType: 'text',
      outputOptions: [
        { text: 'JSON', ext: '.json', value: 'json', icon: 'fad fa-file-code' },
        { text: 'CSV', ext: '.csv', value: 'csv', icon: 'fad fa-file-csv' },
        {
          text: 'Plain Text',
          ext: '.txt',
          value: 'text',
          icon: 'fad fa-file-alt'
        }
      ]
    }
  },
  methods: {
    download() {}
  }
}
</script>

<template>
  <v-menu v-model="menu" :close-on-content-click="false" offset-y>
    <template #activator="{ on, attrs }">
      <v-btn icon depressed :class="buttonClass" v-bind="attrs" v-on="on">
        <v-icon class="fad fa-file-download" />
      </v-btn>
    </template>

    <div class="appForeground elevation-1 pa-4">
      <div class="font-weight-light text-h5">Download logs</div>

      <v-select
        v-model="outputType"
        outlined
        label="File type"
        :items="outputOptions"
        dense
        offset-y
        multiple
        menu-props="auto, offsetY"
        hide-details
        class="mt-4"
        style="width: 300px;"
      >
        <template #item="{ item }">
          <div>
            <v-icon :class="item.icon" small />
            <span class="ml-1">
              {{ item.text }}
              <span class="ml-2 text-caption text--disabled">
                ({{ item.ext }})
              </span>
            </span>
          </div>
        </template>

        <template #selection="{ item }">
          <div>
            <v-icon color="primary" :class="item.icon" small />
            <span class="ml-1">
              {{ item.text }}
              <span class="ml-2 text-caption text--disabled">
                ({{ item.ext }})
              </span>
            </span>
          </div>
        </template>
      </v-select>

      <div class="mt-4 d-flex align-center justify-end">
        <v-btn class="ml-2" depressed small text @click="menu = false">
          Close
        </v-btn>

        <v-btn
          class="ml-2"
          color="primary"
          depressed
          small
          :disabled="!outputType"
          @click="download"
        >
          Download
        </v-btn>
      </div>
    </div>
  </v-menu>
</template>

<style lang="scss" scoped>
/* // */
</style>
