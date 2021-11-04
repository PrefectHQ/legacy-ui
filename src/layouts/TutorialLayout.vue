<script>
import range from 'lodash/range'

export default {
  props: {
    stepCount: {
      type: Number,
      required: true
    },
    stepNumber: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      furthestStep: 1
    }
  },
  computed: {
    stepRange() {
      return range(1, this.stepCount + 1)
    }
  },
  watch: {
    stepNumber() {
      if (this.stepNumber > this.furthestStep) {
        this.furthestStep = this.stepNumber
      }
    }
  }
}
</script>

<template>
  <v-container class="fill-height mt-6" fluid justify-center>
    <v-layout align-content-start fill-height wrap style="max-width: 1440px;">
      <v-flex xs12>
        <div class="text-h5 full-width mb-3">
          <slot name="title"></slot>
        </div>
      </v-flex>

      <v-flex xs12>
        <p class="mb-3">
          <slot name="description"></slot>
        </p>
      </v-flex>

      <v-flex v-if="$slots.alert" xs12>
        <blockquote
          class="blockquote blockquote-border-left mb-3 text-body-2 px-4 py-2"
        >
          <slot name="alert"></slot>
        </blockquote>
      </v-flex>

      <v-flex xs12>
        <v-container>
          <v-row>
            <v-stepper :value="stepNumber" vertical class="full-width">
              <template v-for="step in stepRange">
                <v-stepper-step
                  :key="`title-${step}`"
                  :complete="stepNumber > step"
                  :step="step"
                  :class="{ 'clickable-step': step <= furthestStep }"
                  class="text-h6 font-weight-light"
                  @click="$emit('step-click', step, furthestStep)"
                >
                  <slot :name="`tutorial-step-${step}-title`"></slot>
                </v-stepper-step>

                <v-stepper-content :key="`content-${step}`" :step="step">
                  <v-card flat class="mb-6">
                    <v-card-text class="pa-0 text-body-1 black--text">
                      <slot :name="`tutorial-step-${step}-content`"></slot>
                    </v-card-text>
                  </v-card>
                </v-stepper-content>
              </template>
            </v-stepper>
          </v-row>
        </v-container>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<style lang="scss">
.blockquote-border-left {
  border-left: 3px solid var(--v-primary-base);
}

.clickable-step {
  cursor: pointer;

  &:focus,
  &:hover {
    background-color: var(--v-secondaryGrayLight-base);
  }

  /* stylelint-disable selector-class-pattern */
  .v-stepper__step__step {
    background-color: var(--v-primary-base) !important;
  }

  .v-stepper__label {
    color: var(--v-secondaryGrayDark-base) !important;
    text-shadow: none !important;
  }
  /* stylelint-enable selector-class-pattern */
}

.full-width {
  width: 100%;
}
</style>
