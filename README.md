<p align="center" >
   <img src="https://images.ctfassets.net/gm98wzqotmnx/3Ufcb7yYqcXBDlAhJ30gce/c237bb3254190795b30bf734f3cbc1d4/prefect-logo-full-gradient.svg" width="500" style="max-width: 500px;" alt="Prefect Logo">
</p>

<p align="center">
   <a href="https://app.netlify.com/sites/prefect-ui/deploys">
      <img src="https://api.netlify.com/api/v1/badges/effeac10-a905-46ee-8e93-b59454ecc8bb/deploy-status" alt="Netlify Build Status" alt="Netlify status badge">
   </a>

   <a href="https://prefect.io/slack">
      <img src="https://prefect-slackin.herokuapp.com/badge.svg" alt="Slack members status badge">
   </a>
</p>
<p align="center">
   <a href="https://prefect.io">
    <img src="https://images.ctfassets.net/gm98wzqotmnx/3mwImS57DEydMQXU1FCGG/6e36e2d49faf78cf4a166f123c2c43ca/image__5_.png" height="27" alt="Powered By Prefect">
    </a>
</p>

# Prefect UI

Note: This repo is for Prefect UI development. To run the Prefect UI as part of [Prefect Server](https://github.com/PrefectHQ/server/), install [Prefect](https://github.com/prefecthq/prefect) and run `prefect server start`.

### Installation

Prefect UI requires [Node.js](https://nodejs.org/) v14 and [npm](https://www.npmjs.com/) v6 to run.

You'll also need an API token from a professional Font Awesome account to build the project locally; this token should be placed in a git-ignored `.env` file (e.g. `.env.development.local`) as it's referenced by `.npmrc` for accessing the private FA npm registry.

Before starting the development server, you'll need to install project dependencies:

```sh
$ git clone https://github.com/PrefectHQ/ui.git
$ cd ui
$ npm install
```

Then, you can start the Prefect UI development server:

```sh
$ npm run serve
```

The Prefect UI should be available at [http://localhost:8080](http://localhost:8080); changes to the code in the `src/` directory will result in a hot reload of the application. For more information on hot-reloading or the development server, take a look at the [Webpack](https://webpack.js.org/) and [Vue CLI](https://cli.vuejs.org/) documentation.

### Testing

Prefect UI contains various unit tests for things like the Vuex store and Vue Router middleware; running theses tests locally requires [Jest](https://jestjs.io/). We recommend using a node package executor like [npx](https://www.npmjs.com/package/npx) for this dependency.

Running all unit tests:

```
$ npx jest
```

Running specific tests:

```
$ npx jest auth
# This will run tests found in middleware/authNavGuard.spec.js, store/auth.spec.js, and store/auth0.spec.js
```

### Development

We welcome contributions!

Prefect UI is built on [Vue.js](https://vuejs.org/), a modern front-end JavaScript framework. We generally depend on Google's Material Design guidelines, drawing on and extending the [Vuetify](https://vuetifyjs.com/en/) component library.

#### Building for production

For production builds:

```sh
$ npm run build
```

Compiled and minified code and assets are placed in the `dist/` folder; `dist/index.html` is the built application's entry point.

### The Prefect UI Docker image

This repo comes with a Dockerfile for building a UI image; it's generally not recommended to build this yourself but to instead use one of the versioned images found in the [PrefectHQ Dockerhub registry](https://hub.docker.com/r/prefecthq/ui).

#### Serving the built application

The Prefect UI requires a functional Prefect API to operate. For details on starting Prefect Server, visit the [docs](https://docs.prefect.io/api/latest/#ui-and-server).

#### Submitting a PR
PR Titles should include a prefix that sets out the purpose of the PR.  Most PRs will begin with the prefix Bugfix or Feature.  The title should describe the work and purpose of the PR clearly and succinctly and should be appropriate and safe for the Prefect community. 

###### Example
Feature: Add create flow run method to automations

## License

Prefect UI is lovingly made by the team at [Prefect](https://www.prefect.io) and licensed under the [Prefect Community License](https://www.prefect.io/legal/prefect-community-license/). For information on how you can use, extend, and depend on Prefect UI to automate your data, take a look at our [license](https://github.com/PrefectHQ/ui/blob/master/LICENSE) or [contact us](https://www.prefect.io/pricing#contact).
