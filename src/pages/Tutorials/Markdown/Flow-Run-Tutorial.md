# Running a flow

This tutorial guides you through the process of creating a project, authenticating with Prefect Cloud, and running a flow through a [Docker agent.](https://docs.prefect.io/cloud/agent/docker.html) For more details, please see our [documentation.](https://docs.prefect.io/cloud/)

# Creating a project

Projects are used to organize flows that have been deployed to Prefect Cloud.

Every time you deploy a flow, you will need to specify a project to deploy into. There are no limits on the number of projects you can have, and you can always delete projects later. You can read more about interacting with projects [here](https://docs.prefect.io/cloud/concepts/projects.html).

**UI**
Projects can be created from the project filter on the [dashboard](https://docs.prefect.io/orchestration/ui/dashboard) or the [project settings page](https://docs.prefect.io/orchestration/ui/team-settings.html#projects).

![team-projects](https://user-images.githubusercontent.com/40726391/98752193-8803de00-2376-11eb-9a46-12d69870e9bf.png)

**Core Client**
To create a new project with the Core client:

```py
from prefect import Client

client = Client()
client.create_project(project_name="Hello, World!")
```

**GraphQL**
To create a new project with GraphQL, issue the following mutation:

```gql
mutation {
  create_project(input: { name: "Hello, World!" }) {
    project {
      id
      name
    }
  }
}
```
