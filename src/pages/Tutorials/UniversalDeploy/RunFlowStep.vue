<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant'])
  },
  methods: {
    goToProject() {
      this.$router.push({
        name: 'project',
        params: { tenant: this.tenant.slug, id: this.projectId }
      })
    }
  }
}
</script>

<template>
  <div>
    <p>
      You can now run your flow from Prefect Cloud!
    </p>

    <p>
      Once you click the "Finish Tutorial" button below, you will be navigated
      to your registered flow's project page. From there, you can run your flow
      and watch it get picked up and executed by your running local agent.
    </p>

    <h4 class="mt-8 mb-4">Universal Deploy and Labels</h4>

    <p>
      You may have noticed that both your registered flow and your local agent
      have
      <a
        href="https://docs.prefect.io/cloud/execution/overview.html#labels"
        target="_blank"
        rel="norefferer"
        >labels</a
      >
      associated with them. Specifically, your may have noticed that your flow
      had a single label set to the hostname of your local machine (e.g.
      "Janes-MacBook.local") and your agent had <i>many</i> labels, one of which
      was <i>also</i> the hostname of your machine.
    </p>

    <p>
      This hostname label ensures that
      <b>
        only local agents started on this machine can execute your registered
        flow.
      </b>
      Without labels, your flow might get picked up by other agents running in
      your infrastructure, or your locally running agent would attempt to
      execute other flows - potentially even flows that it can't access!
    </p>

    <p>
      Labels are a powerful feature of Prefect Cloud, providing fine control
      over exactly what flows your agents can execute. Keep an eye out for an
      upcoming tutorial that will cover running a flow with custom labels.
    </p>

    <v-btn class="mt-6" color="primary" @click="goToProject">
      Finish tutorial
    </v-btn>
  </div>
</template>
