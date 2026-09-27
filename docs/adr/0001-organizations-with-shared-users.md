# Multi-tenant organizations, one user in many

Calibre is multi-tenant: every organization's data is scoped by its organization id, and a single user account can hold memberships in several organizations (a consultant serving many clients, an HR lead with a sandbox). We chose this over one-account-per-organization so people keep one login and one consent history; the cost is that every query and action must scope by the active organization, which is taken from the URL slug.
