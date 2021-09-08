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

# Authenticating with Prefect Cloud

To authenticate, you'll need to create an [API Key](/user/keys) and save it.

- In the user menu in the top right corner go to **Account Settings -> API Keys -> Create An API Key**.
- Copy the created key
- Login with the Prefect CLI:

```bash
prefect auth login --key <YOUR-KEY>
```

# Creating a project

Projects are used to organize flows that have been deployed to Prefect Cloud.

Every time you deploy a flow, you will need to specify a project to deploy into. There are no limits on the number of projects you can have, and you can always delete projects later. You can read more about interacting with projects [here](https://docs.prefect.io/cloud/concepts/projects.html).

You can create a project using the CLI:

```bash
prefect create project tester
```

You can also create a project using the project selector on the dashboard page of the UI or using the API.

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

flow.register(project_name="tester")
```

And that's it! Your flow is now registered with Prefect Cloud.

# Start your agent

Start your agent using the CLI:

```bash
prefect agent local start
```

# Run Your Flow In Prefect Cloud

To run your flow in Prefect Cloud, navigate to it from the `Flows` tab of the Dashboard and use the `Quick Run` button at the top of the page. This will run your flow with no additional settings.

You can use the `Run` tab on your flow page to pass parameters or context to your flow or to schedule a run for some point in the future. You can update default parameters and add or modify schedules by selecting the `Settings` tab on the flow page.

**Universal Deploy and Labels**

You may have noticed that both your registered flow and your local agent have labels associated with them. Specifically, your may have noticed that your flow had a single label set to the hostname of your local machine (e.g. "Janes-MacBook.local") and your agent had many labels, one of which was also the hostname of your machine.

This hostname label ensures that only local agents started on this machine can execute your registered flow. Without labels, your flow might get picked up by other agents running in your infrastructure, or your locally running agent would attempt to execute other flows - potentially even flows that it can't access!

Labels are a powerful feature of Prefect Cloud, providing fine control over exactly what flows your agents can execute. Keep an eye out for an upcoming tutorial that will cover running a flow with custom labels.
