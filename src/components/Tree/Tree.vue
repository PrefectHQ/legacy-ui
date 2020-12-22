<script>
import isFunction from 'lodash.isfunction'

export default {
  name: 'Tree',
  props: {
    activeIds: {
      type: Array,
      required: false,
      default: () => []
    },
    id: {
      type: [String, Number],
      required: false,
      default: () => 0
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
    name: {
      type: String,
      required: false,
      default: () => null
    },
    items: {
      type: [Array, Function],
      required: false,
      default: () => null
    },
    type: {
      type: String,
      required: false,
      default: () => null
    },
    options: {
      type: Object,
      required: false,
      default: () => {
        return {}
      }
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
    canExpand() {
      return this.items || this.children_?.length
    }
  },
  watch: {
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
    async select(data) {
      this.$emit('select', data)
    },
    async toggle(e) {
      // if this item is being closed,
      // we can skip the rest
      console.log(e)
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
    <v-list-item
      v-if="icon || name_"
      class="pa-0"
      dense
      :input-value="active_"
      :class="'pl-' + (depth - 1) * 4"
      :disabled="loading"
    >
      <v-list-item-avatar
        class="my-0 mr-0 cursor-pointer"
        tile
        size="20"
        v-on="canExpand ? { click: toggle } : {}"
      >
        <span v-if="loading" key="loading-spinner">
          <i class="fas fa-spinner-third fa-spin fa-sm" />
        </span>
        <v-icon
          v-else-if="canExpand"
          class="drop-arrow"
          :class="open && 'open'"
          small
        >
          arrow_right
        </v-icon>
      </v-list-item-avatar>

      <v-list-item-content class="cursor-pointer pa-0">
        <div
          v-ripple
          style="
            height: 40px;
            line-height: 40px;
            user-select: none;
          "
          class="px-2"
          @click.stop="select({ id: id, type: type })"
          @click.self="toggle"
        >
          <v-icon :color="open ? 'primaryDark' : 'grey'" size="20" class="mr-2">
            {{ open && iconActive_ ? iconActive_ : icon_ }}
          </v-icon>

          {{ name_ }}
        </div>
      </v-list-item-content>
    </v-list-item>
    <div v-if="depth == 0 || (open && children_ && children_.length > 0)">
      <tree
        v-for="child in children_"
        :id="child.id"
        :key="child.id"
        :depth="depth + 1"
        :icon="child.icon"
        :icon-active="child.iconActive"
        :name="child.name"
        :items="child.children"
        :type="child.type"
        :active-ids="activeIds"
        :options="options"
        @select="select"
      />
    </div>

    <v-list-item
      v-else-if="
        open &&
          children_ &&
          children_.length === 0 &&
          options.noData &&
          options.noData[depth]
      "
      class="pa-0"
      dense
      :class="'pl-' + depth * 5"
    >
      <v-list-item-content
        class="font-italic text-body-2 grey--text text--darken-1"
      >
        ({{ options.noData[depth] }})
      </v-list-item-content>
    </v-list-item>
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
</style>
