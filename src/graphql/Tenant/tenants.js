import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
    query Tenants {
      tenant {
        id
        created
        name
        info
        settings
        
        ${
          isCloud
            ? `
              prefectAdminSettings: prefect_admin_settings
              stripe_customer
              license_id
            `
            : ''
        }
        slug
      }
    }
`
}
