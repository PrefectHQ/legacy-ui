<script>
import ManagementLayout from '@/layouts/ManagementLayout'
import PlanCard from '@/components/PlanCard'
export default {
  components: {
    ManagementLayout,
    PlanCard
  },
  data() {
    return {
      basicFeatures: {
        a: {
          name: 'Robust Scheduling',
          description:
            'Create custom schedules including business days, offsets, and blackout windows, or fall back on good old cron.'
        },
        b: {
          name: 'Intelligent Scheduling',
          description:
            'Schedule varying parameter values or even where your runs should occur'
        },
        c: {
          name: 'Artifacts',
          description: 'Publish custom data and render it in the Prefect UI'
        },
        d: {
          name: 'Mapping',
          description: 'Dynamically generate parallel pipelines at runtime'
        },
        e: {
          name: 'Retries',
          description:
            'Advanced checkpointing and real-time state reporting protect you from the unexpected'
        },
        f: {
          name: 'Run History',
          description:
            'Use the Prefect UI to manage all of your flow runs, no matter how often or where they run'
        },
        g: {
          name: 'Dataflow Automation',
          description:
            'Pass data between tasks for complex processing and advanced analytics'
        },
        h: {
          name: 'Caching',
          description:
            'Persist the results of complex tasks with custom validation logic'
        },
        i: {
          name: 'Versioning',
          description:
            "Every Prefect flow is automatically versioned, so you're always up-to-date"
        }
      },
      infrastructureFeatures: {
        a: {
          name: 'Hosted Orchestration Platform',
          description:
            'Focus on your code while Prefect Cloud manages a highly-available orchestration API',
          plan: 'good'
        },
        b: {
          name: 'Performance',
          description:
            'Run tasks as fast as your internet connection allows for',
          plan: 'good'
        },
        c: {
          name: 'API Security',
          description: 'Permission access via API tokens',
          plan: 'good'
        },
        d: {
          name: 'Automatic Updates',
          description:
            'Prefect Cloud releases every two weeks with new features and performance enhancements',
          plan: 'good'
        },
        e: {
          name: 'Raise Rate Limits',
          description: 'TK',
          plan: 'best'
        }
      },
      observabilityFeatures: {
        a: {
          name: 'Log Management',
          description: 'Stream, filter, and examine all of your workflow logs',
          plan: 'good'
        },
        b: {
          name: 'Advanced Alerting',
          description: 'Configure notifications when custom criteria are met',
          plan: 'better'
        },
        c: {
          name: 'Flow SLAs',
          description: 'Set SLAs for late or long-running workflows',
          plan: 'better'
        },
        d: {
          name: 'Agent SLAs',
          description: 'Set SLAs for agents to ensure uptime',
          plan: 'better'
        },
        e: {
          name: 'History Retention',
          description: 'Track one year of run history',
          plan: 'best'
        },
        f: {
          name: 'Audit Trail',
          description: 'Track every action taken via the Prefect API',
          plan: 'best'
        }
      },
      orchestrationFeatures: {
        a: {
          name: 'Stateless Deployments',
          description:
            'Spin up and tear down agent deployments with ease - Prefect Cloud manages all state for you',
          plan: 'good'
        },
        b: {
          name: 'Multiple Execution Environments',
          description:
            'Promote your workflows from dev to prod with a single API call, or schedule them to run in multiple places at once!',
          plan: 'good'
        },
        c: {
          name: 'Secrets',
          description: 'Manage sensitive information',
          plan: 'good'
        },
        d: {
          name: 'Advanced Automation',
          description:
            'Automatically configure API actions when custom criteria are met',
          plan: 'better'
        },
        e: {
          name: 'Concurrency Limits',
          description:
            'Set concurrency limits at the flow or task level to control access to resources',
          plan: 'better'
        }
      },
      authorizationFeatures: {
        a: {
          name: 'Team Management',
          description:
            'Get a complete view of everyone who can access your workflows',
          plan: 'good'
        },
        b: {
          name: 'Read-Only Users',
          description:
            'Invite analyts to work with the output of your workflows',
          plan: 'better'
        },
        c: {
          name: 'RBAC',
          description: 'Assign roles to users to control access',
          plan: 'best'
        },
        d: {
          name: 'Custom Permissions',
          description:
            'Assign granular permissions, including per-project limits',
          plan: 'best'
        },
        e: {
          name: 'SSO',
          description: 'Log in to Prefect Cloud via SSO',
          plan: 'best'
        },
        f: {
          name: 'Custom Roles',
          description: 'Create and assign custom roles',
          plan: 'best'
        }
      }
    }
  },
  computed: {
    included() {
      return true
    }
  }
}
</script>

<template>
  <ManagementLayout>
    <template #title>Prefect Plans</template>

    <div
      style="display: flex;
            flex-direction: row;
            justify-content: center;"
      class="py-8"
    >
      <PlanCard plan="good" selected />
      <span><PlanCard plan="better"/></span>
      <span><PlanCard plan="best"/></span>
    </div>

    <v-card class="pa-3 mb-8">
      <h3 class="py-2">All plans come with:</h3>
      <ul
        style="column-count: 2;
    column-gap: 40px;
    list-style-type: none;"
      >
        <li
          v-for="(feature, i) in basicFeatures"
          :key="i"
          style="flex-direction: column;"
        >
          <p class="feature-title">{{ feature.name }}</p>
          <p class="subtitle">{{ feature.description }}</p>
        </li>
      </ul>
    </v-card>

    <h2>Additionally, this plan includes:</h2>

    <div
      style="display: flex;
            flex-direction: row;
            width: 100%;"
    >
      <v-card style="width: 25%;" class="pa-3 mb-8">
        <h3 class="py-2">Infrastructure</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in infrastructureFeatures" :key="i">
            <p class="feature-title" :class="{ 'not-available': !included }">{{
              feature.name
            }}</p>
            <p class="subtitle" :class="{ 'not-available': !included }">{{
              feature.description
            }}</p>
          </li>
        </ul>
      </v-card>
      <v-card style="width: 25%;" class="pa-3 mb-8">
        <h3 class="py-2">Observability</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in observabilityFeatures" :key="i">
            <p class="feature-title" :class="{ 'not-available': !included }">{{
              feature.name
            }}</p>
            <p class="subtitle" :class="{ 'not-available': !included }">{{
              feature.description
            }}</p>
          </li>
        </ul>
      </v-card>
      <v-card style="width: 25%;" class="pa-3 mb-8">
        <h3 class="py-2">Orchestration</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in orchestrationFeatures" :key="i">
            <p class="feature-title" :class="{ 'not-available': !included }">{{
              feature.name
            }}</p>
            <p class="subtitle" :class="{ 'not-available': !included }">{{
              feature.description
            }}</p>
          </li>
        </ul>
      </v-card>
      <v-card style="width: 25%;" class="pa-3 mb-8">
        <h3 class="py-2">Authorization</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in authorizationFeatures" :key="i">
            <p class="feature-title" :class="{ 'not-available': !included }">{{
              feature.name
            }}</p>
            <p class="subtitle" :class="{ 'not-available': !included }">{{
              feature.description
            }}</p>
          </li>
        </ul>
      </v-card>
    </div>
  </ManagementLayout>
</template>

<style scoped>
.feature-title {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
  margin-bottom: 4px;
  text-align: left;
}

.subtitle {
  color: #444;
  font-size: 0.875rem;
}

.not-available {
  color: rgba(0, 0, 0, 0.25);
}
</style>
