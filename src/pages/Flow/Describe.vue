<script>
/* eslint-disable vue/no-v-html */
import { artifact_parser } from '@/utils/markdownParser'
import '@/styles/atelier-sulphurpool-light.scss'

export default {
  props: {
    flow: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      flowDescription: this.flow.description,
      textArea: false
    }
  },
  computed: {
    print() {
      console.log(this.flowDescription)
      return true
    }
  },
  methods: {
    mdParser(md) {
      return artifact_parser(md)
    }
  }
}
</script>

<template>
  <v-row v-if="print" no-gutters class="pb-0">
    <v-col>
      <div
        v-if="flow.description && !textArea"
        class="artifact md grey--text text--darken-3
            mx-4 px-8"
        v-html="mdParser(flowDescription)"
      >
      </div>
      <div
        v-else-if="!textArea"
        class="text-h5 
          grey--text text--darken-2 px-8"
      >
        This flow has no <span class="font-weight-medium"> description</span>.
        You can add one here or learn more about flow descriptions in the
        <a href="https://docs.prefect.io/api/latest/flow.html" target="_blank">
          Flow API Docs</a
        >.
      </div>
      <div v-if="textArea">
        <v-textarea v-model="flowDescription" height="100%"> </v-textarea>
        <div class="px-8 text-right">
          <v-btn color="primary" @click="textArea = false"
            >Update Description</v-btn
          >
        </div>
      </div>

      <div v-if="!textArea" class="pa-8 text-right">
        <v-btn icon @click="textArea = true"
          ><v-icon color="codePink">edit</v-icon></v-btn
        >
      </div>
    </v-col>
  </v-row>
</template>

<style lang="scss">
.artifact {
  margin-top: 0;

  .table-wrapper {
    max-height: 400px;
  }

  table {
    border: 1px solid rgb(176, 190, 197) !important;
    border-collapse: collapse;
    border-color: rgb(176, 190, 197) !important;
  }

  td {
    padding: 4px 8px;
  }

  thead {
    th:not(:empty) {
      border-bottom: thin solid rgba(0, 0, 0, 0.12);
      border-top: 1px solid rgb(176, 190, 197);
      font-size: 1rem;
      padding: 4px 8px;
      position: sticky;
      text-align: left;
      top: 0;
      z-index: 1;
    }

    th:first-of-type {
      border-left: thin solid rgb(176, 190, 197);
    }

    th:last-of-type {
      border-right: thin solid rgb(176, 190, 197);
    }
  }

  tbody {
    tr:not(:empty) {
      border: 1px solid rgb(176, 190, 197);
      border-bottom: thin solid rgba(0, 0, 0, 0.12);
      transition: background-color 50ms ease-in-out;

      &:focus,
      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    tr:last-of-type:not(:empty) {
      border-bottom: 1px solid rgb(176, 190, 197);
    }
  }

  h1:first-of-type {
    margin-top: 0 !important;
  }
}
</style>
