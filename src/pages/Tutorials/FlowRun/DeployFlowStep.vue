<script>
import '@/styles/atelier-sulphurpool-light.css'
export default {
  props: {
    complete: {
      required: true,
      type: Boolean
    },
    projectId: {
      required: true,
      type: String
    }
  },
  data() {
    return {
      flowId: null
    }
  },
  methods: {
    async deployFlow() {
      try {
        // Import the demo flow from the JSON file
        const flow = await import('@/assets/demo-flow/demo-flow')

        // Deploy the demo flow
        const result = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/deploy-flow.gql'),
          variables: {
            project_id: this.projectId,
            serialized_flow: flow.default
          }
        })

        this.flowId = result.data.create_flow.id

        this.$emit('flow-deployed', this.flowId)
      } catch (error) {
        this.$toasted.error(
          'Failed to deploy flow. Please wait a few moments and try again',
          { duration: 3000 }
        )

        throw error
      }
    }
  }
}
</script>

<template>
  <v-container>
    <v-row v-if="!flowId && !complete">
      Now that you've successfully created a project, it's time to deploy a
      flow! We've got a demo flow ready to go, which is stored in a Docker image
      on our public Dockerhub repository. The code for this demo flow is shown
      here:

      <v-card flat class="my-6">
        <pre style="font-size: 12px;">
  import prefect
  from prefect import task, Flow
  from prefect.environments.storage import Docker


  @task(name="Welcome", slug="welcome-task")
  def welcome_logger():
      logger = prefect.context["logger"]
      with open("/ascii-welcome.txt", "r") as f:
          lines = "\n\n" + "".join(f.readlines()) + "\n\n"

      logger.info(lines)

  storage = Docker(
      registry_url="prefecthq",
      image_name="flows",
      image_tag="welcome-flow",
      files={"welcome.txt": "/ascii-welcome.txt"},
  )
  f = Flow("Welcome Flow", tasks=[welcome_logger], storage=storage)
        </pre>
      </v-card>
      When you click the "Deploy Flow" button, we will copy the metadata
      associated with this flow into your newly created project. The code itself
      remains stored only in the Docker container storing this flow.
    </v-row>
    <v-row v-else>
      Excellent! We've added the demo flow to your project. Next, it's time to
      get an agent running!
    </v-row>
    <v-row class="pt-9">
      <v-btn
        color="primary"
        :disabled="!!flowId || complete"
        @click="deployFlow"
      >
        Deploy Flow
      </v-btn>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
.flow-code {
  padding-right: 100px;
}
</style>
