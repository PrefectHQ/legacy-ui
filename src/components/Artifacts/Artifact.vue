<script>
/* eslint-disable vue/no-v-html */
import { artifact_parser } from '@/utils/markdownParser'
import '@/styles/atelier-sulphurpool-light.css'

export default {
  props: {
    artifact: {
      type: Object,
      required: true
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
  <div
    class="artifact md grey--text text--darken-3 mx-4"
    v-html="mdParser(artifact.data.markdown)"
  >
  </div>
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
