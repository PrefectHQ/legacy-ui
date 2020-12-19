<script>
export default {
  props: {
    projectName: {
      type: String,
      required: false,
      default: 'Hello, World!'
    }
  },
  data() {
    return {
      codeCopied: false
    }
  },
  computed: {
    projectNameEscaped() {
      if (!this.projectName) return
      return this.projectName.replace(/"/g, '\\"')
    }
  },
  methods: {
    copyCode() {
      this.codeCopied = true

      navigator.clipboard.writeText(
        document
          .getElementById('ud-code')
          .innerText.replace(/\n- (.*)/g, '')
          .replace(/\+\s/g, '')
          .replace(/\n{3,}/g, '\n\n')
      )

      setTimeout(() => {
        this.codeCopied = false
      }, 2000)
    }
  }
}
</script>

<template>
  <div>
    <p>
      We're almost there! With a very slight modification to our flow code, we
      will be able to register our flow with Prefect Cloud and get a local agent
      running:
    </p>

    <v-btn x-small class="float-right mr-2 mt-2" @click="copyCode">
      {{ codeCopied ? 'Copied!' : 'Copy' }}
    </v-btn>

    <div
      class="text-body-1 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-3 mt-4 pb-0"
      style="border: 1px solid #b0bec5 !important;"
    >
      <pre id="ud-code" class="code-block" style="font-size: 12px;">
import prefect
from prefect import task, Flow

@task
def hello_task():
    logger = prefect.context.get("logger")
    logger.info("Hello world!")

flow = Flow("hello-flow", tasks=[hello_task])

<div class="d-inline-block code-removed w-100"><span>- </span>flow.run()</div>

<div class="d-inline-block code-added w-100"><span>+ </span>flow.register(project_name="{{ projectNameEscaped }}")</div>
<div class="d-inline-block code-added w-100"><span>+ </span>flow.run_agent()</div>
    </pre>
    </div>

    <p>
      Click "Copy" above to copy the updated flow code. Paste the code into your
      interactive Python REPL session. If all goes well, you should see the
      local agent process start to run. If you're seeing the error message "No
      agent API token provided", try passing in the agent token explicitly to
      the
      <kbd>run_agent()</kbd> method:
    </p>

    <div
      class="text-body-1 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-3 mt-4 pb-0"
      style="border: 1px solid #b0bec5 !important;"
    >
      <pre style="font-size: 12px;">
<div class="d-inline-block code-added w-100"><span>+ </span>flow.run_agent(token="&lt;YOUR_RUNNER_TOKEN&gt;")</div>
    </pre>
    </div>

    <p>
      And that's it! Your flow is now registered with Prefect Cloud, and an
      agent process is running on your local machine waiting to execute your
      flow runs. For now, your flow is stored on your local machine in your
      <kbd>~/.prefect</kbd> directory. You can configure this later through the
      use of
      <a
        href="https://docs.prefect.io/cloud/execution/storage_options.html#local"
        target="_blank"
        rel="noreferrer"
      >
        Storage.
      </a>
    </p>

    <p>
      We call this pattern "Universal Deploy" because all it requires is a
      working Python environment to create a Prefect Deployment!
    </p>

    <v-btn class="mt-6" color="primary" @click="$emit('next')">
      Continue
    </v-btn>
  </div>
</template>

<style lang="scss" scoped>
.code-added {
  background-color: #e6ffee;
}

.code-removed {
  background-color: #feeef0;
}

.w-100 {
  width: 100%;
}
</style>
