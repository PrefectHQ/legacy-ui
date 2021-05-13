<script>
export default {
  props: {
    task: {
      type: Object,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      menu: false,
      interval: 'second',
      intervalOptions: [
        {
          value: 'second',
          min: 1,
          max: 720
        },
        {
          value: 'minute',
          min: 1,
          max: 720
        },
        {
          value: 'hour',
          min: 1,
          max: 168
        }
      ]
    }
  }
}
</script>

<template>
  <v-list-item dense class="px-0">
    <v-list-item-content style="overflow-x: auto;">
      <v-list-item-subtitle class="text-caption">
        Retries

        <v-menu :close-on-content-click="false" offset-y open-on-hover>
          <template #activator="{ on }">
            <v-btn text icon x-small class="mr-2" v-on="on">
              <v-icon>
                info
              </v-icon>
            </v-btn>
          </template>
          <v-card tile class="pa-0" max-width="320">
            <v-card-title class="subtitle pb-1">Retries</v-card-title>

            <v-card-text class="pt-0">
              Information regarding retries

              <a
                href="https://docs.prefect.io/orchestration/execution/overview.html#labels"
                target="_blank"
                >the docs on retries</a
              >.
            </v-card-text>
          </v-card>
        </v-menu>

        <v-list class="pa-0 border-left border-radius-0">
          <v-list-item class="px-3">
            <v-list-item-content>
              <v-list-item-subtitle>
                Max Retries: {{ task.max_retries }}
              </v-list-item-subtitle>

              <v-list-item-subtitle v-if="task.max_retries">
                Retry Delay: {{ task.retry_delay }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-list-item-subtitle>
    </v-list-item-content>

    <v-list-item-action class="ma-0 mb-11">
      <v-menu v-model="menu" :close-on-content-click="false" offset-x>
        <template #activator="{ on: menu, attrs }">
          <v-tooltip top>
            <template #activator="{ on: tooltip }">
              <div v-on="tooltip">
                <v-btn
                  x-small
                  icon
                  aria-label="Add label"
                  color="primary"
                  v-bind="attrs"
                  v-on="menu"
                >
                  <v-icon>
                    edit
                  </v-icon>
                </v-btn>
              </div>
            </template>

            <span>Edit retries</span>
          </v-tooltip>
        </template>
        <v-card style="width: 400px;">
          <v-divider></v-divider>

          <v-list>
            <v-list-item>
              <v-text-field
                v-model="maxRetries"
                label="Max Retries"
                type="number"
                outlined
                dense
                class="mt-5 mb-5"
                hide-details
                min="0"
                max="2147483647"
              ></v-text-field>
            </v-list-item>

            <v-list-item>
              <v-select
                v-model="interval"
                :items="intervalOptions"
                class="text-h5 mr-2"
                outlined
                dense
                hide-details
                style="max-width: 150px;"
                item-text="value"
                item-value="value"
              />

              <v-text-field
                v-model="retryDelay"
                type="number"
                label="Retry Delay"
                class="text-h5"
                outlined
                dense
                hide-details
              />

              <!-- <v-text-field
                label="Retry Delay (Seconds)"
                type="number"
                min="60"
                max="2147483647"
              /> -->
            </v-list-item>
          </v-list>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn text @click="menu = false">
              Cancel
            </v-btn>
            <v-btn color="primary" text @click="menu = false">
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>
    </v-list-item-action>
  </v-list-item>
</template>
