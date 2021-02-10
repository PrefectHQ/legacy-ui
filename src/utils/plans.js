export const PLANS_2021 = {
  free: {
    name: 'Developer',
    price: 0,
    taskRuns: 10000,
    additionalCost: 0,
    users: 1,
    value: 'FREE_2021',
    history: 'week',
    title: 'developer'
  },
  starter: {
    name: 'Starter',
    price: 0,
    taskRuns: 10000,
    additionalCost: '0.0025',
    users: 3,
    value: 'STARTER_2021',
    history: 'week',
    title: 'starter'
  },
  standard: {
    name: 'Standard',
    price: 500,
    taskRuns: 0,
    additionalCost: '0.0050',
    value: 'STANDARD_2021',
    users: 10,
    history: 'month',
    title: 'standard'
  },
  enterprise: {
    name: 'Enterprise',
    price: 'contact',
    value: 'ENTERPRISE_2021',
    taskRuns: 0,
    additionalCost: 0.0025,
    users: 'unlimited',
    history: 'year',
    title: 'enterprise'
  }
}
