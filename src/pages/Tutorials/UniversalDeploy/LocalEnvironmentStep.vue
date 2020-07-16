<template>
  <div>
    <p>
      First, let's make sure that your local environment is set up to run
      Prefect.
    </p>

    <p>
      Make sure you have a working Python 3.6+ environment with the latest
      version of Prefect installed. If Prefect is not installed, you can install
      the latest version from the command line using the package manager of your
      choice, such as
      <code>pip</code> or <code>conda</code>:
    </p>

    <p>
      <kbd>pip install prefect -U</kbd>
      <br />
      <kbd>conda install prefect -c conda-forge</kbd>
    </p>

    <p>
      You can check that your version of Prefect is <b>0.8.0 or above</b> by
      running the following:
    </p>

    <p>
      <kbd>prefect version</kbd>
    </p>

    <v-btn class="mt-6" color="primary" @click="$emit('next')">
      Continue
    </v-btn>
  </div>
</template>
