<script>
/* eslint-disable vue/no-v-html */
import { artifact_parser } from '@/utils/markdownParser'
import '@/styles/atelier-sulphurpool-light.scss'
import CardTitle from '@/components/Card-Title'

export default {
  components: {
    CardTitle
  },
  props: {
    description: {
      type: String,
      required: false,
      default: ''
    },
    flowGroupId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      flowDescription: this.description,
      textArea: false
    }
  },
  computed: {
    print() {
      console.log('fd', !!this.flowDescription, 'd', !!this.description)
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
  <v-card class="pa-2 mt-2" tile>
    <CardTitle title="Flow Description" icon="history_edu">
      <div slot="action" class="d-flex align-end justify-center flex-column">
        <v-btn
          class="pr-4"
          small
          :disabled="textArea"
          icon
          @click="textArea = true"
          ><v-icon>edit</v-icon></v-btn
        >
      </div>
    </CardTitle>

    <v-card-text v-if="print" class="full-height position-relative">
      <div
        v-if="description && !textArea"
        class="artifact md grey--text text--darken-3
            mx-4 px-8"
        v-html="mdParser(flowDescription)"
      >
      </div>
      <div
        v-else-if="!textArea"
        class="subtitle-1
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
    </v-card-text>
  </v-card>
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
