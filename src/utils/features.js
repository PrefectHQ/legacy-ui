export const featureTypes = [
  {
    color: 'accentOrange',
    type: 'version-locking',
    title: 'Version Locking',
    icon: 'lock',
    text:
      'Ensure your flows and tasks never run unexpectedly with opt-in version-locking.',
    link:
      'https://docs.prefect.io/orchestration/concepts/flows.html#flow-settings'
  },
  {
    color: 'accentCyan',
    type: 'concurrency-limit',
    title: 'Task Concurrency',
    icon: 'pi-task-run',
    text:
      'Create team-wide task concurrency limits for fine-grained control of your running tasks - without ever leaving the UI.',
    link:
      'https://docs.prefect.io/orchestration/concepts/task-concurrency-limiting.html'
  },
  {
    color: 'accentPink',
    type: 'audit-trail',
    title: 'Audit Trail',
    icon: 'verified',
    text:
      "Keep a record of all actions in your tenant to better understand your team's workflow and ensure security compliance.",
    link: ''
  }
]
