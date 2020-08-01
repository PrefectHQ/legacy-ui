import prefect
from prefect import Flow, Task, Parameter, task, unmapped
from prefect.client.secrets import Secret
from prefect.tasks.secrets import PrefectSecret as SecretTask
from prefect.environments.storage import Docker
from prefect.tasks.shell import ShellTask
import json
import pprint


@task
def getRef(ref):
    return ref.replace("refs/heads/", "")


@task
def getAppEnvironmentVariables():
    env_list = [
        "AUTH0_DOMAIN",
        "AUTH0_PUBLIC_CLIENT_ID",
        "BASE_URL",
        "SERVER_URL",
        "CLOUD_URL",
        "STRIPE_PUBLIC_TOKEN",
        "ENVIRONMENT",
        "BACKEND",
        "LOG_ROCKET_PUBLIC_ID",
    ]

    return env_list


class LogBuild(Task):
    def run(self, ref, env, env_vars):
        secret_name = f"PREFECT_UI_CONFIG_{env.upper()}"
        config = Secret(secret_name).get()

        self.logger.info(f"Branch/Tag: {ref}")
        self.logger.info(f"Environment: {env}")
        self.logger.info(
            f"""
          Environment variables: 
          {pprint.pformat(config)}
            """
        )

        super(LogBuild, self).run()


class Clone(ShellTask):
    def run(self, ref):
        token = Secret("GITHUB_AUTH_TOKEN").get()
        # Set the command arg here so we can dynamically build the string
        self.command = f"git clone -b {ref} https://{token}:x-oauth-basic@github.com/PrefectHQ/ui.git"
        super(Clone, self).run()


class Install(ShellTask):
    def run(self):
        self.log_stdout = True
        # Set the command arg here so we can dynamically build the string
        self.command = f"cd ui && pnpm install"
        super(Install, self).run()


class GetEnvironment(Task):
    def run(self, ref):
        if ref == "master":
            return "dev"
        if ref == "prod":
            return "dev"  # right now we're only returning dev so we can test builds
        if ref == "ci-flow":
            return "dev"
        raise ValueError(f"No environment associated with branch { ref }.")


class SetAppEnvironmentVariable(ShellTask):
    def run(self, var, env):
        self.logger.info(env)
        secret_name = f"PREFECT_UI_CONFIG_{env.upper()}"
        config = Secret(secret_name).get()
        self.command = f"cd ui && echo VUE_APP_{var}={config[var]} >> .env"
        super(SetAppEnvironmentVariable, self).run()


class Build(ShellTask):
    def run(self):
        self.log_stdout = True
        # Set the command arg here so we can dynamically build the string
        self.command = f"cd ui && pnpm run build:local"
        super(Build, self).run()


class Authorize_GCR(ShellTask):
    def run(self, env):
        secret_name = f"GCR_SERVICE_ACCOUNT_JSON_{env.upper()}"
        key = Secret(secret_name).get()  # valid
        with open("key.json", "w") as file:
            json.dump(key, file)
        # Set the command arg here so we can dynamically build the string
        # Creates an auth json in the home directory that downstream
        # gsutil commands can reference (under the hood)
        self.command = f"gcloud auth activate-service-account --key-file=key.json"
        super(Authorize_GCR, self).run()


class Transfer(ShellTask):
    def run(self, env):
        # Set the command arg here so we can dynamically build the strings
        self.command = f"cd ui && pnpm run deploy:{env}"
        super(Transfer, self).run()


with Flow("Prefect UI Deployment") as flow:
    parameter_ref = Parameter("ref", default="master")

    # trims the branch reference
    # or returns the tag
    ref = getRef(ref=parameter_ref)

    # determines the environment based on the branch/tag
    env = GetEnvironment()(ref=ref)

    # logs the build that'll be used in the rest of the flow
    LogBuild()(ref=ref, env=env, env_vars=getAppEnvironmentVariables)

    # clones the branchpef
    clone = Clone()(ref=ref)

    # gets/sets VUE_APP_* environment variables based on the
    set_env_vars = SetAppEnvironmentVariable().map(
        getAppEnvironmentVariables, env=unmapped(env)
    )

    # authorizes with GCR by retrieving
    # GCR service account credentials
    authorize = Authorize_GCR()(env=env)

    # if any of the above tasks fail, we skip these more expensive steps and throw an alert
    install = Install()(upstream_tasks=[clone, set_env_vars])
    build = Build()(upstream_tasks=[install, set_env_vars])
    transfer = Transfer()(env=env, upstream_tasks=[authorize, build])


flow.storage = Docker(
    base_image=f"gcr.io/tenant-prod-db384e/python-node",
    registry_url="gcr.io/tenant-prod-db384e",
    image_name="prefect-ui-deployment",
)

flow.register(project_name="UI Deployment")
# flow.run()
