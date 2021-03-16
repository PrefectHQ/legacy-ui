<p align="center" >
   <img src="https://images.ctfassets.net/gm98wzqotmnx/3Ufcb7yYqcXBDlAhJ30gce/c237bb3254190795b30bf734f3cbc1d4/prefect-logo-full-gradient.svg" width="500" style="max-width: 500px;" alt="Prefect Logo">
</p>

<p align="center">
   <a href="https://app.netlify.com/sites/prefect-ui/deploys">
      <img src="https://api.netlify.com/api/v1/badges/effeac10-a905-46ee-8e93-b59454ecc8bb/deploy-status" alt="Netlify Build Status" alt="Netlify status badge">
   </a>

   <a href="https://join.slack.com/t/prefect-community/shared_invite/enQtODQ3MTA2MjI4OTgyLTliYjEyYzljNTc2OThlMDE4YmViYzk3NDU4Y2EzMWZiODM0NmU3NjM0NjIyNWY0MGIxOGQzODMxNDMxYWYyOTE">
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

Prefect UI requires [Node.js](https://nodejs.org/) v10+ and [npm](https://www.npmjs.com/) v6+ to run.

Before starting the Prefect UI development server, you'll need to install project dependencies:

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

Coming soon...

### Development

We welcome contributions!

Prefect UI is built on [Vue.js](https://vuejs.org/), a modern front-end JavaScript framework. We generally depend on Google's Material Design guidelines, drawing on and extending the [Vuetify](https://vuetifyjs.com/en/) component library.

#### Building for production

For production builds:

```sh
$ npm run build
```

Compiled and minified code and assets are placed in the `dist/` folder; `dist/index.html` is the built application's entrypoint.

### Building a Prefect UI Docker image

Coming soon...

#### Serving the built application

Coming soon...

## License

Prefect UI is lovingly made by the team at [Prefect](https://www.prefect.io) and licensed under the [Prefect Community License](https://www.prefect.io/legal/prefect-community-license/). For information on how you can use, extend, and depend on Prefect UI to automate your data, take a look at our [license](https://github.com/PrefectHQ/ui/blob/master/LICENSE) or [contact us](https://www.prefect.io/pricing#contact).
