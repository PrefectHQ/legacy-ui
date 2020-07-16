<script>
import TutorialLayout from '@/layouts/TutorialLayout'

import { mapGetters } from 'vuex'

export default {
  components: {
    TutorialLayout,
    AgentRunnerTokenStep: () =>
      import('@/pages/Tutorials/UniversalDeploy/AgentRunnerTokenStep'),
    CreatePersonalAccessTokenStep: () =>
      import('@/pages/Tutorials/FlowRun/CreatePersonalAccessTokenStep'),
    CreateProjectStep: () =>
      import('@/pages/Tutorials/FlowRun/CreateProjectStep'),
    LocalEnvironmentStep: () =>
      import('@/pages/Tutorials/UniversalDeploy/LocalEnvironmentStep'),
    RunFlowStep: () => import('@/pages/Tutorials/UniversalDeploy/RunFlowStep'),
    UniversalDeployStep: () =>
      import('@/pages/Tutorials/UniversalDeploy/UniversalDeployStep'),
    WriteFlowStep: () =>
      import('@/pages/Tutorials/UniversalDeploy/WriteFlowStep')
  },
  data() {
    return {
      projectId: null,
      projectName: null,
      currentStep: 1
    }
  },
  computed: {
    ...mapGetters('tenant', ['role'])
  },
  methods: {
    handleProjectSelection(project) {
      this.projectId = project.projectId
      this.projectName = project.projectName
      this.nextStep()
    },
    handleStepClick(selectedStep, furthestStep) {
      if (selectedStep > furthestStep) return
      this.currentStep = selectedStep
    },
    nextStep() {
      this.currentStep++
    }
  }
}
</script>

<template>
  <TutorialLayout
    :step-count="7"
    :step-number="currentStep"
    @step-click="handleStepClick"
  >
    <template v-slot:title>
      Universal Deploy
    </template>

    <template v-slot:description>
      <span>
        This tutorial guides you through writing a simple flow and deploying it
        using
        <a
          href="https://docs.prefect.io/core/PINs/PIN-13-Universal-Deploy.html#pin-13-universal-cloud-deploys"
          target="_blank"
          rel="”noreferrer”"
          >Universal Deploy</a
        >, which allows you to register a flow with Prefect Cloud and run it
        without configuring external storage.
      </span>
    </template>

    <template v-slot:alert>
      <span v-if="role === 'READ_ONLY_USER'">
        As a read-only user, you will not be able to complete this tutorial.
      </span>

      <span v-else>
        Universal Deploy is available for Prefect Core versions
        <span class="font-weight-bold">0.8.0</span> and above. Refer to
        <router-link class="link" :to="{ name: 'flow-run-tutorial' }"
          >this tutorial</router-link
        >
        if you are using versions
        <span class="font-weight-bold">0.7.3</span> or below.
      </span>
    </template>

    <!-- STEP 1 -->
    <template v-slot:tutorial-step-1-title>
      Set up your local environment
    </template>
    <template v-slot:tutorial-step-1-content>
      <LocalEnvironmentStep @next="nextStep"></LocalEnvironmentStep>
    </template>

    <!-- STEP 2 -->
    <template v-slot:tutorial-step-2-title>
      Run a simple flow using Prefect Core
    </template>
    <template v-slot:tutorial-step-2-content>
      <WriteFlowStep @next="nextStep"></WriteFlowStep>
    </template>

    <!-- STEP 3 -->
    <template v-slot:tutorial-step-3-title>
      Log into Prefect Cloud from the CLI
    </template>
    <template v-slot:tutorial-step-3-content>
      <CreatePersonalAccessTokenStep
        @next="nextStep"
      ></CreatePersonalAccessTokenStep>
    </template>

    <!-- STEP 4 -->
    <template v-slot:tutorial-step-4-title>
      Create an agent token
    </template>
    <template v-slot:tutorial-step-4-content>
      <AgentRunnerTokenStep @next="nextStep"></AgentRunnerTokenStep>
    </template>

    <!-- STEP 5 -->
    <template v-slot:tutorial-step-5-title>
      Select a project
    </template>
    <template v-slot:tutorial-step-5-content>
      <CreateProjectStep
        :complete="!!projectName"
        @project-submitted="handleProjectSelection"
      ></CreateProjectStep>
    </template>

    <!-- STEP 6 -->
    <template v-slot:tutorial-step-6-title>
      Deploy your flow with Universal Deploy
    </template>
    <template v-slot:tutorial-step-6-content>
      <UniversalDeployStep
        :project-name="projectName"
        @next="nextStep"
      ></UniversalDeployStep>
    </template>

    <!-- STEP 7 -->
    <template v-slot:tutorial-step-7-title>
      Run your flow in Prefect Cloud
    </template>
    <template v-slot:tutorial-step-7-content>
      <RunFlowStep v-if="projectId" :project-id="projectId"></RunFlowStep>
    </template>
  </TutorialLayout>
</template>
