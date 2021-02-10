export const PLANS_2021 = {
  good: {
    name: 'Starter',
    price: 0,
    taskRuns: 10000,
    additionalCost: '0.0025',
    users: 3,
    value: 'FREE_2021',
    history: 'week',
    title: 'good'
  },
  //Same details for STARTER_2021 and FREE_2021 but we'll check in the change plan dialog if we should call FREE or STARTER depending on whether they have a card on file
  better: {
    name: 'Standard',
    price: 500,
    taskRuns: 0,
    additionalCost: '0.0050',
    value: 'STANDARD_2021',
    users: 10,
    history: 'month',
    title: 'better'
  },
  best: {
    name: 'Enterprise',
    price: 'contact',
    value: 'BEST_2021',
    taskRuns: 0,
    additionalCost: 0.0025,
    users: 'unlimited',
    history: 'year',
    title: 'best'
  }
}
