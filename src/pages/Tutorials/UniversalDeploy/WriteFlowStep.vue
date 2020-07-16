<script>
export default {
  data() {
    return {
      codeCopied: false
    }
  },
  methods: {
    copyCode() {
      this.codeCopied = true

      navigator.clipboard.writeText(
        document.getElementById('ud-code-before').innerText
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
      Now let's write a simple flow that logs the string "Hello world!":
    </p>

    <v-btn x-small class="float-right" @click="copyCode">
      {{ codeCopied ? 'Copied!' : 'Copy' }}
    </v-btn>

    <pre id="ud-code-before" style="font-size: 12px;">
import prefect
from prefect import task, Flow

@task
def hello_task():
    logger = prefect.context.get("logger")
    logger.info("Hello world!")

flow = Flow("hello-flow", tasks=[hello_task])

flow.run()
    </pre>

    <p>
      Paste the code above into an interactive Python REPL session. You should
      see the following logs after running
      <code>flow.run()</code> :
    </p>

    <div class="logs-block pa-3 mt-6">
      [2020-01-08 23:49:00,239] INFO - prefect.FlowRunner | Beginning Flow run
      for 'hello-flow'
      <br />
      [2020-01-08 23:49:00,242] INFO - prefect.FlowRunner | Starting flow run.
      <br />
      [2020-01-08 23:49:00,249] INFO - prefect.TaskRunner | Task 'hello_task':
      Starting task run...
      <br />
      [2020-01-08 23:49:00,249] INFO - prefect.Task: hello_task | Hello world!
      <br />
      [2020-01-08 23:49:00,251] INFO - prefect.TaskRunner | Task 'hello_task':
      finished task run for task with final state: 'Success'
      <br />
      [2020-01-08 23:49:00,252] INFO - prefect.FlowRunner | Flow run SUCCESS:
      all reference tasks succeeded
    </div>

    <p class="mt-6">
      If you're running into issues, check that your Python environment is
      properly set up to run Prefect. Refer to the Prefect Core
      <a
        href="https://docs.prefect.io/core/getting_started/installation.html#installation"
        target="_blank"
        rel="”noreferrer”"
        >Installation</a
      >
      documentation for further details.
    </p>

    <v-btn class="mt-6" color="primary" @click="$emit('next')">
      Continue
    </v-btn>
  </div>
</template>

<style lang="scss" scoped>
.logs-block {
  background-color: #f6f6f6;
  border-radius: 4px;
  font-family: 'Source Code Pro', monospace;
  font-size: 0.85em;
}
</style>
