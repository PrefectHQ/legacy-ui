<template>
  <span>
    <a :href="href" target="_blank">
      {{ title }}
    </a>
    <sup>
      <i
        class="v-icon notranslate material-icons theme--light"
        style="font-size: 12px !important;"
      >
        open_in_new
      </i>
    </sup>
  </span>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    href: {
      type: String,
      required: true
    }
  }
}
</script>
