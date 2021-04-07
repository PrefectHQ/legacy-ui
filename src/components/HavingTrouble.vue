<script>
import ExternalLink from '@/components/ExternalLink'
export default { components: { ExternalLink } }
</script>

<template>
  <div style="max-width: 100%;">
    <div>
      Having trouble?
      <span class="font-weight-medium">Don't panic! </span>
    </div>
    <div class="mt-4">
      The <v-icon x-small>fab fa-slack</v-icon>&nbsp;
      <ExternalLink href="https://prefect.io/slack"
        >Prefect Slack community</ExternalLink
      >
      is a great place to ask questions, provide feedback, or just to chat!
      Check out the
      <ExternalLink
        href="https://docs.prefect.io/orchestration/server/overview.html#what-is-prefect-server"
        >Prefect documentation</ExternalLink
      >

      for tips on setting up Prefect Server, idioms for writing flows, and so
      much more. Looking for more in-depth discussion? Our
      <ExternalLink href="https://github.com/PrefectHQ/prefect/discussions/new"
        >GitHub Discussion board</ExternalLink
      >
      is a great place to present long-form ideas, technical challenges, or to
      show off your Prefect tasks and flows!

      <div class="mt-4"
        >Did you know that

        <ExternalLink href="https://www.prefect.io/cloud"
          >Prefect Cloud</ExternalLink
        >
        offers a feature-rich and fully-managed orchestration layer for your
        flows? Oh and it's also <em>free</em>.
      </div>
    </div>
  </div>
</template>
