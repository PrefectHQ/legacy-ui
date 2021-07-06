<script>
import Container from '@/components/Logs/Container'
import DownloadMenu from '@/components/Logs/DownloadMenu'
import Filters from '@/components/Logs/Filters'
import FilterMenu from '@/components/Logs/FilterMenu'
import { mapGetters } from 'vuex'

export default {
  components: {
    Container,
    DownloadMenu,
    Filters,
    FilterMenu
  },
  props: {
    run: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      filter: null
    }
  },
  computed: {
    ...mapGetters('license', ['hasPermission']),
    ...mapGetters('tenant', ['tenant']),
    where() {
      console.log(this.filter)
      return {
        ...this.filter,
        is_audit_log: { _eq: false },
        tenant_id: { _eq: this.tenant.id }
      }
    },
    userHasPermission() {
      return this.hasPermission('read', 'log')
    }
  }
}
</script>

<template>
  <div class="run-logs">
    <div
      v-if="userHasPermission"
      class="py-1 px-4 d-flex align-center justify-end toolbar"
    >
      <Filters
        class="mr-auto"
        :filter="filter"
        @filter-click="$refs['filter-menu'].openMenu()"
      />
      <FilterMenu
        ref="filter-menu"
        v-model="filter"
        button-class="mr-2"
        hide-type
      />
      <DownloadMenu :filter="where" />
    </div>

    <div v-if="userHasPermission" class="logs">
      <Container :where="where" />
    </div>
    <v-container
      v-else
      class="text-h5 text-center blue-grey--text d-flex align-center justify-center"
      style="height: 400px;"
      fluid
    >
      <div>
        <i class="fad fa-lock-alt fa-3x" />
        <div class="mt-6">
          You don't have permission to view run logs
        </div>
      </div>
    </v-container>
  </div>
</template>

<style lang="scss" scoped>
.run-logs {
  .spacer {
    padding-top: 84px;
  }

  .toolbar {
    box-sizing: content-box;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  .logs {
    background-color: var(--v-appForeground-base);
    box-shadow: inset 0px 2px 1px -1px rgb(0 0 0 / 20%),
      0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%);
    height: calc(100vh - 255px);
    overflow-y: hidden !important;

    @media screen and (max-width: 1264px) {
      height: calc(100vh - 233px);
    }
  }
}
</style>

<style lang="scss">
html {
  overscroll-behavior: none !important;
}
</style>
