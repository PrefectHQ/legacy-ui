<script>
import isFunction from 'lodash/isFunction'

export default {
  name: 'Tree',
  props: {
    activeIds: {
      type: Array,
      required: false,
      default: () => []
    },

    depth: {
      type: Number,
      required: false,
      default: () => 0
    },
    icon: {
      type: String,
      required: false,
      default: () => null
    },
    iconActive: {
      type: String,
      required: false,
      default: () => null
    },
    id: {
      type: [String, Number],
      required: false,
      default: () => 0
    },
    idToMatch: {
      type: [String, Number],
      required: false,
      default: () => 0
    },
    items: {
      type: [Array, Function],
      required: false,
      default: () => null
    },
    link: {
      type: [Object, String],
      required: false,
      default: () => null
    },
    options: {
      type: Object,
      required: false,
      default: () => {
        return {}
      }
    },
    name: {
      type: String,
      required: false,
      default: () => null
    },
    type: {
      type: String,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      // These _ data props allow us to manipulate local component state without throwing warnings
      active_: null,
      icon_: null,
      iconActive_: null,
      name_: null,
      children_: null,
      childrenCallback: null,

      loading: false,
      open: false
    }
  },
  computed: {
    activeRoute() {
      return this.$route.params?.id == this.idToMatch
    },
    canExpand() {
      return this.items || this.children_?.length
    }
  },
  watch: {
    active_(val) {
      if (val && !this.open) {
        this.toggle()
      }
    },
    activeIds: {
      deep: true,
      handler: function() {
        this.active_ = this.activeIds.includes(this.id)
      }
    },

    items(val) {
      this.children_ = val
    },
    icon(val) {
      this.icon_ = val
    },
    iconActive(val) {
      this.iconActive_ = val
    },
    name(val) {
      this.name_ = val
    }
  },
  mounted() {
    this.active_ = this.activeIds.includes(this.id)

    this.icon_ = this.icon
    this.iconActive_ = this.iconActive
    this.name_ = this.name

    if (isFunction(this.items)) {
      this.childrenCallback = this.items
    } else {
      this.children_ = [...(this.items ?? [])]
    }
  },
  methods: {
    clickHandler() {
      if (this.canExpand) return this.toggle()
      const data = { id: this.id, type: this.type }
      return this.select(data)
    },
    close() {
      this.open = false

      let i = 0

      while (this.$refs[`leaf_${i}`]?.[0]) {
        this.$refs[`leaf_${i}`]?.[0]?.close()
        ++i
      }
    },
    async select(data) {
      this.$emit('select', data)
    },
    async toggle() {
      // if this item is being closed,
      // we can skip the rest
      if (this.open) return (this.open = false)

      if (isFunction(this.items)) {
        this.loading = true
        const data = await this.items({ id: this.id, name: this.name })

        this.children_ = data
        this.loading = false
      }

      this.open = true
    }
  }
}
</script>

<template>
  <div>
    <component
      :is="canExpand ? 'div' : 'router-link'"
      v-if="icon || name_"
      :class="['pl-' + (depth - 1) * 4, { 'leaf-active': active_ }]"
      class="cursor-pointer d-flex justify-start align-center py-1 leaf"
      :to="canExpand ? null : link"
      tabindex="0"
      @click.stop="clickHandler"
      @keyup.enter="clickHandler"
    >
      <div class="icon-block flex-shrink-0">
        <span v-if="loading" key="loading-spinner">
          <i class="fas fa-spinner-third fa-spin fa-sm" />
        </span>

        <v-icon
          v-else-if="canExpand"
          class="drop-arrow"
          :class="open && 'open'"
          small
        >
          keyboard_arrow_right
        </v-icon>
      </div>

      <div class="icon-block flex-shrink-0">
        <v-icon :color="open ? 'primaryDark' : 'grey'" size="20" class="mr-2">
          {{ open && iconActive_ ? iconActive_ : icon_ }}
        </v-icon>
      </div>

      <div
        class="text-subtitle-1 text-truncate flex-grow-1"
        :class="{ 'font-weight-medium': active_ }"
      >
        {{ name_ }}
      </div>

      <router-link
        v-if="!activeRoute"
        class="mr-2 text-caption px-1 d-flex align-center justify-space-between view-button"
        :to="link"
        @click.native.stop="select({ id: id, type: type })"
      >
        <div>View</div>
        <v-icon small>
          arrow_right
        </v-icon>
      </router-link>

      <div v-else class="mr-2 text-caption px-1 grey--text">
        Current
      </div>
    </component>

    <div v-if="depth == 0 || (open && children_ && children_.length > 0)">
      <tree
        v-for="(child, i) in children_"
        :id="child.id"
        :ref="`leaf_${i}`"
        :key="child.id"
        :id-to-match="child.idToMatch"
        :depth="depth + 1"
        :icon="child.icon"
        :icon-active="child.iconActive"
        :link="child.link"
        :name="child.name"
        :items="child.children"
        :type="child.type"
        :active-ids="activeIds"
        :options="options"
        @select="select"
      />
    </div>

    <div
      v-else-if="
        open &&
          children_ &&
          children_.length === 0 &&
          options.noData &&
          options.noData[depth]
      "
      class="font-italic text-body-2 grey--text text--darken-1"
      :class="'pl-' + depth * 8"
    >
      ({{ options.noData[depth] }})
    </div>
  </div>
</template>

<style lang="scss" scoped>
.drop-arrow {
  transform: rotate(0);
  transition: 50ms transform linear;

  &.open {
    transform: rotate(90deg);
  }
}

.icon-block {
  height: 24px;
  width: 24px;
}

/* stylelint-disable */

.leaf {
  color: unset;
  text-decoration: inherit;
  user-select: none;

  .view-button {
    color: unset;
    opacity: 0;
    text-decoration: inherit;
  }

  &:focus,
  &:hover,
  &:focus-within {
    background-color: rgba(0, 0, 0, 0.03);
    outline: none;

    .view-button {
      color: var(--v-secondary-base) !important;
      opacity: 0.5;

      &:focus,
      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
        opacity: 1;
        outline: none;
      }
    }
  }

  &.leaf-active {
    color: var(--v-primaryDark-base);
  }
}

/* stylelint-enable */
</style>
