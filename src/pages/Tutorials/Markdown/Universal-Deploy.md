# Universal Deploy

This tutorial guides you through writing a simple flow and deploying it using [Universal Deploy](https://docs.prefect.io/core/PINs/PIN-13-Universal-Deploy.html#pin-13-universal-cloud-deploys), which allows you to register a flow with Prefect Cloud and run it without configuring external storage.

# Set up your local environment

First, let's make sure that your local environment is set up to run Prefect.

Make sure you have a working `Python 3.6+` environment with the latest version of Prefect installed. If Prefect is not installed, you can install the latest version from the command line using the package manager of your choice, such as `pip` or `conda`:

```python
pip install prefect -U
conda install prefect -c conda-forge
```

# Run a Flow Using Prefect Core

```python
import prefect
from prefect import task, Flow

@task
def hello_task():
logger = prefect.context.get("logger")
logger.info("Hello world!")

flow = Flow("hello-flow", tasks=[hello_task])

flow.run()
```

Paste the code above into an interactive Python REPL session. You should see the following logs after running `flow.run()` :

```
[2020-01-08 23:49:00,239] INFO - prefect.FlowRunner | Beginning Flow run for 'hello-flow'
[2020-01-08 23:49:00,242] INFO - prefect.FlowRunner | Starting flow run.
[2020-01-08 23:49:00,249] INFO - prefect.TaskRunner | Task 'hello_task': Starting task run...
[2020-01-08 23:49:00,249] INFO - prefect.Task: hello_task | Hello world!
[2020-01-08 23:49:00,251] INFO - prefect.TaskRunner | Task 'hello_task': finished task run for task with final state: 'Success'
[2020-01-08 23:49:00,252] INFO - prefect.FlowRunner | Flow run SUCCESS: all reference tasks succeeded
```

If you're running into issues, check that your Python environment is properly set up to run Prefect. Refer to the [Prefect Core Installation](https://docs.prefect.io/core/getting_started/installation.html) documentation for further details.

# Log into Prefect Cloud from the CLI

To authenticate, you'll need to create a [Personal Access Token](/user/tokens) and configure it with the [Prefect Command Line Interface](https://docs.prefect.io/orchestration/concepts/cli.html#cli).

- In the hamburger menu in the top left corner go to **User -> Personal Access Tokens -> Create A Token**.
- Copy the created token
- Configure the CLI to use the access token by running

```bash
prefect auth login -t <COPIED_TOKEN>
```

# Create an agent token

Our next goal is to generate an agent token.

[Agents](https://docs.prefect.io/orchestration/agents/overview.html) are responsible for communicating with Prefect Cloud and submitting your flows for execution. Your agents will need tokens called RUNNER tokens to authenticate with Prefect Cloud. There is no limit to the number of agent tokens you can create. You can create one using the CLI:

```bash
prefect auth create-token -n my-runner-token -s RUNNER
```

You'll need this token later in the tutorial. You can save it in your local configuration either as an environment variable or by storing it in `~/.prefect/config.toml`:

```bash
export PREFECT__CLOUD__AGENT__AUTH_TOKEN=<COPIED_RUNNER_TOKEN>
```

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

# Deploy your flow with Universal Deploy

We're almost there! With a very slight modification to our flow code, we will be able to register our flow with Prefect Cloud and get a local agent running:

```python
import prefect
from prefect import task, Flow

@task
def hello_task():
    logger = prefect.context.get("logger")
    logger.info("Hello world!")

flow = Flow("hello-flow", tasks=[hello_task])

flow.run()

flow.register(project_name="tester")
flow.run_agent()
```

Click `"Copy"` above to copy the updated flow code. Paste the code into your interactive Python REPL session. If all goes well, you should see the local agent process start to run. If you're seeing the error message `"No agent API token provided"`, try passing in the agent token explicitly to the `run_agent()` method:

```python
flow.run_agent(token="<YOUR_RUNNER_TOKEN>")
```

And that's it! Your flow is now registered with Prefect Cloud, and an agent process is running on your local machine waiting to execute your flow runs. For now, your flow is stored on your local machine in your `~/.prefect directory`. You can configure this later through the use of Storage.

We call this pattern `"Universal Deploy"` because all it requires is a working Python environment to create a Prefect Deployment!

# Run Your Flow In Prefect Cloud

You can now run your flow from Prefect Cloud!

**Universal Deploy and Labels**

You may have noticed that both your registered flow and your local agent have labels associated with them. Specifically, your may have noticed that your flow had a single label set to the hostname of your local machine (e.g. "Janes-MacBook.local") and your agent had many labels, one of which was also the hostname of your machine.

This hostname label ensures that only local agents started on this machine can execute your registered flow. Without labels, your flow might get picked up by other agents running in your infrastructure, or your locally running agent would attempt to execute other flows - potentially even flows that it can't access!

Labels are a powerful feature of Prefect Cloud, providing fine control over exactly what flows your agents can execute. Keep an eye out for an upcoming tutorial that will cover running a flow with custom labels.
