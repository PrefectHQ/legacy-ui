export const componentMap = {
  CLOUD_HOOK: 'FlowRunNotification',
  MEMBERSHIP_INVITATION: 'MembershipNotification',
  REQUIRES_APPROVAL: 'ApprovalNotification',
  MESSAGE: 'MessageNotification',
  WHATS_NEW: 'WhatsNewNotification'
}

export const iconMap = {
  CLOUD_HOOK: 'pi-flow-run',
  MEMBERSHIP_INVITATION: 'group_add',
  REQUIRES_APPROVAL: 'pause_circle_outline',
  MESSAGE: 'chat',
  WHATS_NEW: '🎉'
}

export const iconColorMap = {
  CLOUD_HOOK: n => {
    return n.content.event.state
  },
  MEMBERSHIP_INVITATION: () => 'primary',
  WHATS_NEW: () => 'primary',
  MESSAGE: () => 'primary',
  REQUIRES_APPROVAL: () => 'accentOrange'
}

export const navigationMap = {
  CLOUD_HOOK: (n, tenant) => {
    return {
      name: 'flow-run',
      params: { id: n.content.event.id, tenant: tenant.slug },
      query: { notification_id: n.id }
    }
  },
  MEMBERSHIP_INVITATION: () => null,
  WHATS_NEW: () => null,
  MESSAGE: () => null,
  REQUIRES_APPROVAL: (n, tenant) => {
    return {
      name: 'task-run',
      params: { id: n.content.task_run.id, tenant: tenant.slug },
      query: { notification_id: n.id }
    }
  }
}
