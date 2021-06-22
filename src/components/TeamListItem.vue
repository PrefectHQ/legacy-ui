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
    ...mapGetters('license', ['license']),
    selected() {
      return this.team.id == this.tenant.id
    },
    isRoot() {
      return !!this.team.stripe_customer
    }
  },
  methods: {}
}
</script>

<template>
  <div
    class="utilGrayDark--text team-card d-flex align-center justify-start px-6 rounded"
    :class="{ selected: selected, disabled: loading, root: isRoot }"
    flat
    outlined
    :disabled="loading"
  >
    <div
      class="pr-8"
      style="border-right: thin solid #eee; max-width: 350px; width: 100%;"
    >
      <div class="text-truncate font-weight-light text-h5">
        {{ team.name }}
      </div>

      <div v-show="isRoot" class="text-overline mt-n2">Root</div>
    </div>

    <router-link
      class="ml-8 d-flex align-center justify-start text-decoration-none"
      :to="{ name: 'members', params: { tenant: team.slug } }"
    >
      <v-avatar
        v-for="u in users.slice(0, 3)"
        :key="u.id"
        :color="u.avatar_color"
        size="32"
        class="white--text rounded-circle text-uppercase ml-n3 user-select-none"
        style="border: thin solid #fff;"
      >
        <truncate :content="u.username">
          {{
            u.first_name && u.last_name
              ? u.first_name[0] + u.last_name[1]
              : u.username[0] + u.username[1]
          }}
        </truncate>
      </v-avatar>

      <v-avatar
        v-if="users.length > 3"
        color="grey lighten-3"
        :size="users.length - 3 > 100 ? '42' : '32'"
        class="rounded-circle text-uppercase ml-n3 user-select-none utilGrayDark--text"
        style="border: thin solid #fff;"
      >
        +{{ users.length - 3 }}
      </v-avatar>
    </router-link>

    <v-spacer />

    <div class="actions d-flex align-center justify-center">
      <truncate
        :content="selected ? 'You\'re logged in to this team.' : 'Switch team'"
      >
        <v-btn
          icon
          :disabled="selected || loading"
          title="Switch team"
          @click.stop="$emit('click')"
        >
          <v-icon>sync_alt</v-icon>
        </v-btn>
      </truncate>

      <truncate
        :content="isRoot ? 'The root team can\'t be deleted.' : 'Remove team'"
      >
        <v-btn
          icon
          :disabled="isRoot || loading"
          :title="isRoot ? 'The root team can\'t be deleted.' : 'Remove team'"
          @click.stop="$emit('remove')"
        >
          <v-icon>delete</v-icon>
        </v-btn>
      </truncate>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.team-card {
  background-color: var(--v-appForeground-base);
  border: thin solid rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
  height: 78px;
  transition: all 150ms;
  width: 100%;

  &.selected {
    border-left: 6px solid var(--v-primary-base);
  }

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
