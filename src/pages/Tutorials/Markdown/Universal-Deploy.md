# Universal Deploy

This tutorial guides you through writing a simple flow and deploying it using [Universal Deploy](https://docs.prefect.io/core/PINs/PIN-13-Universal-Deploy.html#pin-13-universal-cloud-deploys), which allows you to register a flow with Prefect Cloud and run it without configuring external storage.

# Set up your local environment

First, let's make sure that your local environment is set up to run Prefect.

Make sure you have a working Python 3.6+ environment with the latest version of Prefect installed. If Prefect is not installed, you can install the latest version from the command line using the package manager of your choice, such as `pip` or `conda`:

```python
pip install prefect -U
conda install prefect -c conda-forge
```
