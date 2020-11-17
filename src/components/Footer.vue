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

export default {
  computed: {
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
  <v-footer color="transparent" padless app absolute>
    <v-card flat tile width="100%" class="text-center transparent">
      <v-divider class="mx-auto" style="max-width: 1440px;"></v-divider>

      <v-card-text class="d-flex align-center justify-center">
        <div class="d-flex flex-column align-end justify-start">
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

          <div class="mr-1 mt-4">
            <a
              v-for="(link, i) in linksLeft"
              :key="i"
              class="link ml-16"
              :href="link.link"
            >
              {{ link.text }}
            </a>
          </div>
        </div>

        <div class="mx-16">
          <div class="overline">Made with ♡ in DC</div>

          <a href="https://prefect.io" target="_blank">
            <img
              class="logo mt-2"
              src="@/assets/logos/logomark-cerulean.svg"
              alt="The Prefect Logo"
            />
          </a>
        </div>

        <div class="d-flex flex-column align-start justify-start">
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

          <div class="ml-1 mt-4 align-self-end">
            <a
              v-for="(link, i) in linksRight"
              :key="i"
              class="link mr-16"
              :href="link.link"
            >
              {{ link.text }}
            </a>
          </div>
        </div>

        <!-- <v-btn depressed icon class="mx-4">
          <v-icon>fab fa-twitter</v-icon>
        </v-btn>
        <v-btn depressed icon class="mx-4">
          <v-icon>fab fa-slack</v-icon>
        </v-btn>

        <v-btn depressed icon class="mx-4">
          <v-icon>fab fa-instagram</v-icon>
        </v-btn>
        <v-btn depressed icon class="mx-4">
          <v-icon>fab fa-github</v-icon>
        </v-btn> -->
      </v-card-text>

      <v-card-text> </v-card-text>
    </v-card>
  </v-footer>
</template>

<style lang="scss" scoped>
.logo {
  filter: grayscale(1);
  height: 50px;
  width: auto;
}
</style>
