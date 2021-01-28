<script>
import ManagementLayout from '@/layouts/ManagementLayout'
import PlanCard from '@/components/PlanCard'
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    ManagementLayout,
    PlanCard
  },
  data() {
    return {
      plans: [
        { value: 'FREE_2021', name: 'good' },
        { value: 'STARTER_2021', name: 'better' },
        { value: 'BETTER_2021', name: 'best' }
      ],
      selected: 0,
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
    ...mapGetters('license', ['license']),
    ...mapGetters('tenant', ['tenant']),
    planType() {
      return this.plans[this.selected].value
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async changePlan() {
      try {
        console.log(this.selected, this.planType)
        await this.$apollo.mutate({
          mutation: require('@/graphql/License/create-usage-based-license.gql'),
          variables: {
            input: {
              tenant_id: this.tenant.id,
              plan_name: this.planType
            }
          }
        })
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage:
            'There was an error changing your plan.  Please try again or contact help@prefect.io',
          alertType: 'error'
        })
        console.log(e)
      }
    }
  }
}
</script>

<template>
  <ManagementLayout>
    <template #title>Prefect Plans</template>

    <div
      style="display: flex;
            flex-direction: row;"
      class="py-8"
    >
      <v-item-group v-model="selected" mandatory>
        <v-row>
          <v-col
            v-for="(plan, i) in plans"
            :key="i"
            cols="12"
            md="4"
            class="pa-0"
          >
            <v-item v-slot="{ active, toggle }">
              <div @click="toggle">
                <PlanCard :plan="plan.name" :selected="active" />
              </div>
            </v-item>
          </v-col>
        </v-row>
      </v-item-group>
    </div>
    <div class="text-center">
      <v-btn
        v-if="selected === 2"
        color="primary"
        href="https://www.prefect.io/get-prefect#contact"
        target="_blank"
      >
        Contact Sales
      </v-btn>
      <v-btn v-else color="primary" @click="changePlan">Change Plan</v-btn>
    </div>
    All plans come with:
    <v-list>
      <v-list-item v-for="(feature, i) in basicFeatures" :key="i">
        <v-list-item-content>
          <v-list-item-title v-text="feature.name"></v-list-item-title>
          <v-list-item-subtitle
            v-text="feature.description"
          ></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    Additionally, this plan includes:
    <div
      style="display: flex;
            flex-direction: row;"
    >
      <div>
        <h3>Infrasctructure</h3>
        <v-list>
          <v-list-item v-for="(feature, i) in infrastructureFeatures" :key="i">
            <v-list-item-content>
              <v-list-item-title v-text="feature.name"></v-list-item-title>
              <v-list-item-subtitle
                v-text="feature.description"
              ></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
      <div>
        <h3>Observability</h3>
        <v-list>
          <v-list-item v-for="(feature, i) in observabilityFeatures" :key="i">
            <v-list-item-content>
              <v-list-item-title v-text="feature.name"></v-list-item-title>
              <v-list-item-subtitle
                v-text="feature.description"
              ></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
      <div>
        <h3>Orchestration</h3>
        <v-list>
          <v-list-item v-for="(feature, i) in orchestrationFeatures" :key="i">
            <v-list-item-content>
              <v-list-item-title v-text="feature.name"></v-list-item-title>
              <v-list-item-subtitle
                v-text="feature.description"
              ></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
      <div>
        <h3>Authorization</h3>
        <v-list>
          <v-list-item v-for="(feature, i) in authorizationFeatures" :key="i">
            <v-list-item-content>
              <v-list-item-title v-text="feature.name"></v-list-item-title>
              <v-list-item-subtitle
                v-text="feature.description"
              ></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
    </div>
  </ManagementLayout>
</template>
