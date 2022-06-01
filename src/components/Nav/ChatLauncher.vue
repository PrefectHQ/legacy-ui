<script>
export default {
  methods: {
    launchChat() {
      window.embedded_svc?.bootstrapEmbeddedService()
    }
  }
}
</script>

<template>
  <v-btn
    class="navbar-icon mx-1"
    icon
    title="Launch support chat"
    @click="launchChat()"
  >
    <i class="fad fa-comment-dots nav-bar-duotone-icon fa-2x"></i>
  </v-btn>
</template>
