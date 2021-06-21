<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    team: {
      required: true,
      type: Object
    },
    loading: {
      type: Boolean,
      required: false,
      default: false
    },
    users: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    selected() {
      return this.team.id == this.tenant.id
    }
  },
  mounted() {
    console.log(this.team)
  }
}
</script>

<template>
  <div
    class="utilGrayDark--text mx-4 team-card d-flex align-center justify-start px-6 rounded"
    :class="{ selected: selected, disabled: loading }"
    flat
    outlined
    :disabled="loading"
  >
    <div style="max-width: 200px; width: 100%;">
      <div class="text-truncate font-weight-light text-h5">
        {{ team.name }}
      </div>

      <div v-show="selected" class="text-overline mt-n2">Current</div>
    </div>

    <div class="ml-8">
      <v-avatar
        v-for="u in users"
        :key="u.id"
        color="primary"
        size="32"
        class="white--text rounded-circle text-uppercase"
        >{{
          u.first_name && u.last_name
            ? u.first_name[0] + u.last_name[1]
            : u.username[0] + u.username[1]
        }}</v-avatar
      >
    </div>

    <v-spacer />

    <div v-if="!selected" class="actions d-flex align-center justify-center">
      <v-btn icon :disabled="loading">
        <v-icon>sync_alt</v-icon>
      </v-btn>
      <v-btn icon :disabled="loading" @click.stop="$emit('remove')">
        <v-icon>delete</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.team-card {
  background-color: var(--v-appForeground-base);
  border: thin solid rgba(0, 0, 0, 0.12);
  height: 78px;
  transition: all 150ms;

  &.disabled {
    backdrop-filter: blur(10px);
  }

  .actions {
    opacity: 0;
  }

  &:hover {
    .actions {
      opacity: 1;
    }
  }
}
</style>
