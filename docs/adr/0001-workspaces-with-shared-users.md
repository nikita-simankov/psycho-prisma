# Multi-tenant workspaces, one user in many

Calibre is multi-tenant: every workspace's data is scoped by its organization id, and a single user account can hold memberships in several workspaces (a consultant serving many clients, an HR lead with a sandbox). We chose this over one-account-per-workspace so people keep one login and one consent history; the cost is that every query and action must scope by the active workspace, which is taken from the URL slug.
