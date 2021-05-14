<script>
/* eslint-disable no-debugger, no-console */

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
      maxRetries: this.task.max_retries,
      retryDelay: this.task.retry_delay,
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
      <v-list-item-title>
        Max Retries:
        <v-text-field
          v-model="maxRetries"
          style="width: 50px;"
          type="number"
          dense
          class="mt-5 mb-5"
          hide-details
          min="0"
          max="2147483647"
        ></v-text-field>
      </v-list-item-title>

      <!-- <v-select
              v-model="interval"
              :items="intervalOptions"
              class="text-h5 mr-2"
              outlined
              dense
              hide-details
              style="max-width: 150px;"
              item-text="value"
              item-value="value"
            /> -->

      <v-text-field
        v-model="retryDelay"
        type="number"
        label="Retry Delay"
        class="text-h5"
        outlined
        dense
        hide-details
      />
      <!-- <v-list-item-subtitle class="text-caption">
        Retries
      </v-list-item-subtitle> -->

      <!-- <v-list class="pa-0 border-left border-radius-0">
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

        <v-list-item>
          
        </v-list-item>
      </v-list> -->
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
