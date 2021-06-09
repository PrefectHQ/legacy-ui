<script>
import { adjectives } from '@/components/RunConfig/adjectives'
import { animals } from '@/components/RunConfig/animals'

const adjectivesLength = adjectives.length
const animalsLength = animals.length

export default {
  data() {
    return {
      teamName: this.generateRandomName(),
      teamSlug: null
    }
  },
  watch: {
    teamName(val) {
      try {
        this.teamSlug = this.slugifyTeamName(val)
      } catch {
        /* */
      }
    }
  },
  mounted() {
    this.teamSlug = this.slugifyString(this.teamName)
  },
  methods: {
    generateRandomName() {
      const adjective = adjectives[Math.floor(Math.random() * adjectivesLength)]
      const animal = animals[Math.floor(Math.random() * animalsLength)]
      return (
        adjective.charAt(0).toUpperCase() +
        adjective.slice(1) +
        ' ' +
        animal.charAt(0).toUpperCase() +
        animal.slice(1) +
        's'
      )
    },
    slugifyString(str) {
      return encodeURI(
        str
          .replace(' ', '-')
          .replace(/[^a-zA-Z0-9-_]/g, '')
          .toLowerCase()
      )
    }
  }
}
</script>

<template>
  <v-container fluid>
    <v-row class="my-2 pb-8" no-gutters>
      <v-col cols="12" md="3">
        <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
          <div class="text-h5">
            Name
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="9">
        <div class=" mt-4 mt-md-0 d-flex align-center">
          <v-btn
            color="primary"
            fab
            depressed
            x-small
            title="Randomize team name"
            @click="teamName = generateRandomName()"
          >
            <v-icon>fad fa-random</v-icon>
          </v-btn>

          <v-text-field
            v-model="teamName"
            placeholder="Team name"
            class="ml-2 text-h5"
            hide-details
            outlined
            dense
          />
        </div>
      </v-col>
    </v-row>

    <v-row class="my-2 pb-8" no-gutters>
      <v-col cols="12" md="3">
        <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
          <div class="text-h5">
            Slug
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="9">
        <div class=" mt-4 mt-md-0 d-flex align-center">
          <v-text-field
            v-model="teamSlug"
            placeholder="URL slug"
            class="ml-2 text-h5"
            hide-details
            outlined
            dense
          />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
/* */
</style>
