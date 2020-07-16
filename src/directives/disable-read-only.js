import store from '@/store'

export const insertedActions = (el, binding) => {
  //checks again after all data loads (for component level disabling)
  const readOnly = store.getters['tenant/role'] === 'READ_ONLY_USER'
  if (readOnly || binding.value) {
    if (el.classList.contains('blue')) {
      el.classList.remove('blue')
      el.classList.remove('white--text')
      el.classList.add('needBlue')
    }
    if (el.classList.contains('primary')) {
      el.classList.remove('primary')
      el.classList.add('needPrimary')
    }
    if (el.style.color === 'primary') {
      el.classList.add('needPrimary')
    }
    el.disabled = true
    el.style.color = 'grey'
    el.style.backgroundColor = 'lightgrey'
    el.style.boxShadow = 'none'
  }
}

export const updatedActions = (el, binding) => {
  //checks again after all data loads (for component level disabling)
  const readOnly = store.getters['tenant/role'] === 'READ_ONLY_USER'
  if (readOnly || binding.value) {
    if (el.classList.contains('blue')) {
      el.classList.remove('blue')
      el.classList.remove('white--text')
      el.classList.add('needBlue')
    }
    if (el.classList.contains('primary')) {
      el.classList.remove('primary')
      el.classList.add('needPrimary')
    }
    if (el.style.color === 'primary') {
      el.classList.add('needPrimary')
    }
    el.disabled = true
    el.style.color = 'grey'
  } else {
    //set back if new data (in component) means button should not be disabled
    el.disabled = false
    if (el.classList.contains('needBlue')) {
      el.classList.remove('needBlue')
      el.classList.add('blue')
      el.classList.add('white--text')
    } else if (el.classList.contains('needPrimary' || 'primary')) {
      el.classList.remove('needPrimary')
      el.classList.add('primary')
      el.classList.add('white--text')
    } else {
      el.style.color = 'black'
    }
  }
}
