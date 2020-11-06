# Universal Deploy

This tutorial guides you through writing a simple flow and deploying it using Universal Deploy, which allows you to register a flow with Prefect Cloud and run it without configuring external storage.

# Setting up your environment

First, let's make sure that your local environment is set up to run Prefect.

Make sure you have a working Python 3.6+ environment with the latest version of Prefect installed. If Prefect is not installed, you can install the latest version from the command line using the package manager of your choice, such as pip or conda:

```bash
pip install prefect -U
conda install prefect -c conda-forge
```

You can check that your version of Prefect is 0.8.0 or above by running the following:

```bash
prefect version
```

# Running a flow with Core

Now let's write a flow that logs the string "Hello world!":

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
