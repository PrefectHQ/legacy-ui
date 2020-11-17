<script>
const socialIcons = [
  {
    alt: 'GitHub',
    link: 'https://github.com/PrefectHQ',
    icon: 'fab fa-github'
  },
  {
    alt: 'Slack',
    link: 'https://prefect-community.slack.com',
    icon: 'fab fa-slack'
  },
  {
    alt: 'Twitter',
    link: 'https://twitter.com/PrefectIO',
    icon: 'fab fa-twitter'
  },
  {
    alt: 'Instagram',
    link: 'https://www.instagram.com/prefect.io',
    icon: 'fab fa-instagram'
  }
]
const links = [
  {
    text: 'Docs',
    link: 'https://docs.prefect.io/'
  },
  {
    text: 'Community',
    link: 'https://www.prefect.io/community/updates'
  },
  {
    text: 'Changelog',
    link: 'https://www.prefect.io/public-changelog/'
  },
  {
    text: 'Legal',
    link: 'https://www.prefect.io/legal/cloud-saas-license'
  },
  {
    text: 'Blog',
    link: 'https://medium.com/the-prefect-blog'
  },
  {
    text: 'Careers',
    link: 'https://www.prefect.io/about/company#careers'
  }
]

const insetRoutes = ['team', 'user', 'tutorials']

export default {
  computed: {
    inset() {
      return insetRoutes.includes(this.$route.path.split('/')[1])
    },
    linksLeft() {
      return links.slice(0, Math.ceil(links.length / 2))
    },
    linksRight() {
      return links.slice(Math.ceil(links.length / 2))
    },
    socialIconsLeft() {
      return socialIcons.slice(0, Math.ceil(socialIcons.length / 2))
    },
    socialIconsRight() {
      return socialIcons.slice(Math.ceil(socialIcons.length / 2))
    }
  }
}
</script>

<template>
  <v-footer
    color="transparent"
    padless
    :inset="inset"
    :class="{
      'sm-and-down-left-padding': inset && $vuetify.breakpoint.smAndDown,
      'sm-and-up-left-padding': inset && $vuetify.breakpoint.smAndUp
    }"
  >
    <v-card flat tile width="100%" class="transparent">
      <v-divider class="mx-auto" style="max-width: 1440px;"></v-divider>

      <v-card-text class="d-flex align-center justify-center">
        <div class="block d-flex flex-column align-end justify-start">
          <div>
            <v-btn
              v-for="(icon, i) in socialIconsLeft"
              :key="i"
              :href="icon.link"
              target="_blank"
              depressed
              icon
              class="ml-4"
            >
              <v-icon>{{ icon.icon }}</v-icon>
            </v-btn>
          </div>

          <div class="mr-1 mt-4 d-flex justify-space-between w-100">
            <div v-for="(link, i) in linksLeft" :key="i">
              <a class="link" :href="link.link">
                {{ link.text }}
              </a>
            </div>
          </div>
        </div>

        <div class="mx-16 text-center">
          <div class="overline">Made with ♡ in DC</div>

          <a href="https://prefect.io" target="_blank">
            <img
              class="logo mt-2"
              src="@/assets/logos/logomark-cerulean.svg"
              alt="The Prefect Logo"
            />
          </a>
        </div>

        <div class="block d-flex flex-column align-start justify-start">
          <div>
            <v-btn
              v-for="(icon, i) in socialIconsRight"
              :key="i"
              :href="icon.link"
              target="_blank"
              depressed
              icon
              class="mr-4"
            >
              <v-icon>{{ icon.icon }}</v-icon>
            </v-btn>
          </div>

          <div class="ml-1 mt-4 d-flex justify-space-between w-100">
            <div v-for="(link, i) in linksRight" :key="i">
              <a class="link" :href="link.link">
                {{ link.text }}
              </a>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-footer>
</template>

<style lang="scss" scoped>
.logo {
  filter: grayscale(1);
  height: 50px;
  width: auto;
}

.block {
  //   max-width: 500px;
  width: 200px;
}

.w-100 {
  width: 100%;
}

.sm-and-up-left-padding {
  // Match left padding with sidebar widths
  padding-left: 256px;
}

.sm-and-down-left-padding {
  // Match left padding with collapsed sidebar widths
  padding-left: 56px;
}
</style>
