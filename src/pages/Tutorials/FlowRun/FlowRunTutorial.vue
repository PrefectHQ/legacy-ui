<script>
import TutorialLayout from '@/layouts/TutorialLayout'

import { mapGetters } from 'vuex'

export default {
  components: {
    TutorialLayout,
    CreateProjectStep: () =>
      import('@/pages/Tutorials/FlowRun/CreateProjectStep'),
    CreatePersonalAccessTokenStep: () =>
      import('@/pages/Tutorials/FlowRun/CreatePersonalAccessTokenStep'),
    DeployFlowStep: () => import('@/pages/Tutorials/FlowRun/DeployFlowStep'),
    RunAFlowStep: () => import('@/pages/Tutorials/FlowRun/RunAFlowStep'),
    RunLocalAgentStep: () =>
      import('@/pages/Tutorials/FlowRun/RunLocalAgentStep')
  },
  data() {
    return {
      state: {
        agentToken: null,
        flowId: null,
        flowRunId: null,
        projectId: null,
        projectName: null,
        stepNumber: 1,
        personalAccessToken: null,
        stepCount: 6
      }
    }
  },
  computed: {
    ...mapGetters('license', ['hasPermission'])
  },
  watch: {
    state: {
      handler(state) {
        localStorage.setItem(
          'flow_run_tutorial_workflow_state',
          JSON.stringify(state)
        )
      },
      deep: true
    }
  },
  mounted() {
    const state = localStorage.getItem('flow_run_tutorial_workflow_state')
    if (state) {
      this.state = JSON.parse(state)
    }
  },
  // I'm not sure yet what the intended behaviour should be:
  // for now, we only remove the local storage token if the component is
  // destroyed, meaning it's removed from Vue through the normal
  // lifecycle. This means if the user navigates away, this will reset,
  // otherwise if they close the browser and come back to it, it'll persist.
  beforeDestroy() {
    localStorage.removeItem('flow_run_tutorial_workflow_state')
  },
  methods: {
    handleAgentTokenGenerated(agentToken) {
      this.state.agentToken = agentToken
    },
    handleFlowDeployed(flowId) {
      this.state.flowId = flowId
      this.nextStep()
    },
    handleFlowRunCreated(flowRunId) {
      this.state.flowRunId = flowRunId
    },
    handleProjectSubmitted(project) {
      this.state.projectId = project.projectId
      this.state.projectName = project.projectName
      this.nextStep()
    },
    handleStepClick(selectedStep, furthestStep) {
      if (selectedStep > furthestStep) return
      this.state.stepNumber = selectedStep
    },
    nextStep() {
      this.state.stepNumber++
    },
    setPersonalAccessToken(token) {
      this.state.personalAccessToken = token
    }
  }
}
</script>

<template>
  <TutorialLayout
    :step-count="state.stepCount"
    :step-number="state.stepNumber"
    @step-click="handleStepClick"
  >
    <template #title>
      Running a Flow
    </template>

    <template #description>
      <span>
        This tutorial guides you through the process of creating a project,
        authenticating with Prefect Cloud, and running a flow through a
        <a
          href="https://docs.prefect.io/cloud/agent/docker.html"
          target="_blank"
        >
          Docker agent.
        </a>
        For more details, please see our
        <a href="https://docs.prefect.io/cloud/" target="_blank">
          documentation.
        </a>
      </span>
    </template>

    <template #alert>
      <span
        v-if="
          !hasPermission('create', 'run') && !hasPermission('create', 'project')
        "
      >
        You don't have the required permissions to complete this tutorial.
      </span>
    </template>

    <!-- STEP 1 -->
    <template #tutorial-step-1-title>
      Select a project
    </template>
    <template #tutorial-step-1-content>
      <CreateProjectStep
        :complete="!!state.projectId"
        @project-submitted="handleProjectSubmitted"
      />
    </template>

    <!-- STEP 2 -->
    <template #tutorial-step-2-title>
      Deploy your flow
    </template>
    <template #tutorial-step-2-content>
      <DeployFlowStep
        v-if="state.projectId"
        :complete="!!state.flowId"
        :project-id="state.projectId"
        @flow-deployed="handleFlowDeployed"
      />
    </template>

    <!-- STEP 3 -->
    <template #tutorial-step-3-title>
      Set up your local environment
    </template>
    <template #tutorial-step-3-content>
      <p>
        Next, we need to make sure you have a working Python 3.6+ environment
        with the latest version of Prefect installed. You can install the latest
        version of Prefect from the command line using the package manager of
        your choice, such as
        <code>pip</code> or <code>conda</code>:
      </p>
      <p>
        <kbd>pip install prefect -U</kbd>
        <br />
        <kbd>conda install prefect -c conda-forge</kbd>
      </p>
      <p>
        Prefect Cloud also requires <b>Docker</b> to build and execute flows.
        Install Docker, Docker for Windows, or Docker for Mac

        <a href="https://docs.docker.com/install/" target="_blank"> here</a>.
      </p>
      <p>
        Once you install Docker, make sure your local Docker daemon is running.
      </p>

      <v-btn color="primary" class="mt-6 mb-0" @click="nextStep">
        Continue
      </v-btn>
    </template>

    <!-- STEP 4 -->
    <template #tutorial-step-4-title>
      Log into Prefect Cloud from the CLI
    </template>
    <template #tutorial-step-4-content>
      <CreatePersonalAccessTokenStep
        @set-token="setPersonalAccessToken"
        @next="nextStep"
      />
    </template>

    <!-- STEP 5 -->
    <template #tutorial-step-5-title>
      Run a Docker agent locally
    </template>
    <template #tutorial-step-5-content>
      <RunLocalAgentStep
        :agent-token-prop="state.agentToken"
        @agent-token-generated="handleAgentTokenGenerated"
        @next="nextStep"
      />
    </template>

    <!-- STEP 6 -->
    <template #tutorial-step-6-title>
      Run the flow
    </template>
    <template #tutorial-step-6-content>
      <RunAFlowStep
        v-if="state.flowId"
        :flow-id="state.flowId"
        :flow-run-id="state.flowRunId"
        @flow-run-created="handleFlowRunCreated"
      />
    </template>
  </TutorialLayout>
</template>
