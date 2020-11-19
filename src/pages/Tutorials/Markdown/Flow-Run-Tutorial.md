# Running a flow

This tutorial guides you through the process of creating a project, authenticating with Prefect Cloud, and running a flow through a [Docker agent.](https://docs.prefect.io/cloud/agent/docker.html) For more details, please see our [documentation.](https://docs.prefect.io/cloud/)

# Creating a project

Projects are used to organize flows that have been deployed to Prefect Cloud.

Every time you deploy a flow, you will need to specify a project to deploy into. There are no limits on the number of projects you can have, and you can always delete projects later. You can read more about interacting with projects [here](https://docs.prefect.io/cloud/concepts/projects.html).

###### UI

Projects can be created from the project filter on the [dashboard](/) or the [project settings page](/team/projects).

![team-projects](https://docs.prefect.io/orchestration/ui/dashboard-overview.png)

###### Core Client

To create a new project with the Core client:

```py
from prefect import Client

client = Client()
client.create_project(project_name="Hello, World!")
```

###### GraphQL

To create a new project with GraphQL, issue the following mutation:

```json
mutation {
  create_project(input: { name: "Hello, World!" }) {
    project {
      id
      name
    }
  }
}
```

# Select an Orchestration Backend

```bash
prefect backend cloud
```

# Authenticating with Prefect Cloud

To authenticate, you'll need to create a [Personal Access Token](/user/tokens) and configure it with the [Prefect Command Line Interface](https://docs.prefect.io/orchestration/concepts/cli.html#cli).

- In the hamburger menu in the top left corner go to **User -> Personal Access Tokens -> Create A Token**.
- Copy the created token
- Configure the CLI to use the access token by running

```bash
prefect auth login -t <COPIED_TOKEN>
```

# Create a Runner Token

Running deployed Flows with an [Agent](https://docs.prefect.io/orchestration/agents/overview.html) also requires a `RUNNER`-scoped API token for the Agent. You can create one using the CLI:

```bash
prefect auth create-token -n my-runner-token -s RUNNER
```

You'll need this token later in the tutorial. You can save it in your local configuration either as an environment variable or by storing it in `~/.prefect/config.toml`:

```bash
export PREFECT__CLOUD__AGENT__AUTH_TOKEN=<COPIED_RUNNER_TOKEN>
```

# Flow with Docker

Now we will use a Docker agent to execute flow runs within Docker containers on the current host.

> Docker Daemon
> In order to use the Docker features make sure you have Docker currently running on your machine.

```python
import prefect
from prefect import task, Flow
from prefect.environments.storage import Docker


@task(name="Welcome", slug="welcome-task")
def welcome_logger():
    logger = prefect.context["logger"]
    with open("/ascii-welcome.txt", "r") as f:
        lines = "\n\n" + "".join(f.readlines()) + "\n\n"

    logger.info(lines)

storage = Docker(
    registry_url="prefecthq",
    image_name="flows",
    image_tag="welcome-flow",
    files={"welcome.txt": "/ascii-welcome.txt"},
)
f = Flow("Welcome Flow", tasks=[welcome_logger], storage=storage)
```

# Register Flow with the Prefect API

In order to take advantage of the Prefect API for your flow, that flow must first be registered. Registration of a flow sends a flow's metadata to the Prefect API in order to support its orchestration.
Add the following line to the bottom of the example flow to register the flow with the Prefect API:

```python
flow.register(project_name="Hello, World!")
```

# Running a Docker Agent

Start the Docker Agent to executing Flow Runs scheduled by the Prefect API:

```bash
prefect agent docker start
```

# Run Flow with the Prefect API

Lastly, we need to indicate to the API to schedule a flow run; there are a few options at your disposal to do this:

```python
prefect run flow --name Welcome Flow --project 'Hello, World!'
```
