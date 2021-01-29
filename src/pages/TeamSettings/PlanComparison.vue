<script>
import ManagementLayout from '@/layouts/ManagementLayout'
import PlanCard from '@/components/PlanCard'
import ChangePlanDialog from '@/components/License/ChangePlanDialog'
import { PLANS_2021 } from '@/utils/plans'
import { mapGetters } from 'vuex'

export default {
  components: {
    ManagementLayout,
    PlanCard,
    ChangePlanDialog
  },
  data() {
    return {
      plans: Object.values(PLANS_2021),
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
      return this.plans[this.selected]
    }
  },
  created() {
    //creates a non-reactive property that isn't tracked by Vue - so that selected doesn't reset
    const name =
      this.license?.terms?.plan === 'STARTER_2021'
        ? 'FREE_2021'
        : this.license?.terms?.plan
    const plan = this.plans.findIndex(planType => planType.value === name)
    console.log(plan)
    this.selected = plan
  },
  methods: {
    excluded(feature) {
      if (
        this.planType.title === 'good' &&
        (feature.plan === 'better' || feature.plan === 'best')
      ) {
        return true
      } else if (this.planType.title === 'better' && feature.plan === 'best') {
        return true
      } else {
        return false
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
            flex-direction: row;
            justify-content: center;"
      class="py-4"
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
                <PlanCard
                  :plan="plan.title"
                  :selected="active"
                  :class="
                    Math.abs(selected - i) > 1
                      ? 'away elevation-0'
                      : Math.abs(selected - i) === 1
                      ? 'adjacent elevation-2'
                      : 'active elevation-4'
                  "
                />
              </div>
            </v-item>
          </v-col>
        </v-row>
      </v-item-group>
    </div>
    <div class="text-center pb-4">
      <v-btn
        v-if="selected === 2"
        color="primary"
        href="https://www.prefect.io/get-prefect#contact"
        target="_blank"
      >
        Contact Sales
      </v-btn>
      <ChangePlanDialog v-else :plan="planType" />
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
    flex-direction: row;"
      :style="
        $vuetify.breakpoint.mdAndDown
          ? { width: 'auto', flexWrap: 'wrap' }
          : { width: '100%' }
      "
    >
      <v-card
        :style="
          $vuetify.breakpoint.mdAndDown
            ? { flexBasis: '50%' }
            : { flexBasis: '25%' }
        "
        class="pa-3 mb-8"
      >
        <h3 class="py-2">Infrastructure</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in infrastructureFeatures" :key="i">
            <p
              class="feature-title"
              :class="{ 'not-available': excluded(feature) }"
              >{{ feature.name }}</p
            >
            <p
              class="subtitle"
              :class="{ 'not-available': excluded(feature) }"
              >{{ feature.description }}</p
            >
          </li>
        </ul>
      </v-card>
      <v-card
        :style="
          $vuetify.breakpoint.mdAndDown
            ? { flexBasis: '50%' }
            : { flexBasis: '25%' }
        "
        class="pa-3 mb-8"
      >
        <h3 class="py-2">Observability</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in observabilityFeatures" :key="i">
            <p
              class="feature-title"
              :class="{ 'not-available': excluded(feature) }"
              >{{ feature.name }}</p
            >
            <p
              class="subtitle"
              :class="{ 'not-available': excluded(feature) }"
              >{{ feature.description }}</p
            >
          </li>
        </ul>
      </v-card>
      <v-card
        :style="
          $vuetify.breakpoint.mdAndDown
            ? { flexBasis: '50%' }
            : { flexBasis: '25%' }
        "
        class="pa-3 mb-8"
      >
        <h3 class="py-2">Orchestration</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in orchestrationFeatures" :key="i">
            <p
              class="feature-title"
              :class="{ 'not-available': excluded(feature) }"
              >{{ feature.name }}</p
            >
            <p
              class="subtitle"
              :class="{ 'not-available': excluded(feature) }"
              >{{ feature.description }}</p
            >
          </li>
        </ul>
      </v-card>
      <v-card
        :style="
          $vuetify.breakpoint.mdAndDown
            ? { flexBasis: '50%' }
            : { flexBasis: '25%' }
        "
        class="pa-3 mb-8"
      >
        <h3 class="py-2">Authorization</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in authorizationFeatures" :key="i">
            <p
              class="feature-title"
              :class="{ 'not-available': excluded(feature) }"
              >{{ feature.name }}</p
            >
            <p
              class="subtitle"
              :class="{ 'not-available': excluded(feature) }"
              >{{ feature.description }}</p
            >
          </li>
        </ul>
      </v-card>
    </div>
    <div class="text-center pb-4">
      <v-btn
        v-if="selected === 2"
        color="primary"
        href="https://www.prefect.io/get-prefect#contact"
        target="_blank"
      >
        Contact Sales
      </v-btn>
      <ChangePlanDialog v-else :plan="planType" />
    </div>
  </ManagementLayout>
</template>

<style scoped>
@keyframes adjacent {
  100% {
    filter: contrast(65%);
    transform: scale(0.9);
  }
}

@keyframes away {
  100% {
    filter: contrast(35%);
    transform: scale(0.8);
  }
}

@keyframes active {
  100% {
    filter: contrast(100%);
    transform: scale(1);
  }
}

.active {
  animation: active 1s forwards;
}

.adjacent {
  animation: adjacent 1s forwards;
}

.away {
  animation: away 1s forwards;
}

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
