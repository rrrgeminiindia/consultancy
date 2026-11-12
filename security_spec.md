# CandidateFlow Security Specification

## 1. Data Invariants
1. **Candidate Access Isolation**: Teammates can only view and update records assigned directly to their `teammateId`. Unassigned candidates or candidates assigned to other recruiters are inaccessible to non-admin teammates.
2. **Admin Supremacy**: Only administrators can add or delete candidate profiles, assign/reassign teammates, alter email templates, modify form configurations, and view company-wide recruitment funnel reports.
3. **Sensitive Document Safeguard**: No passport, national ID, or biometric files are ever accepted or stored. Identity verification is tracked solely as an audit status enum (`Pending`, `Verified`, `Not Required`).
4. **Call State & Timestamp Integrity**: Transitioning into `Call Pending` starts an immutable timestamp (`callPendingStartedAt`) used to calculate the 24h warning and 48h overdue alerts.
5. **Duplicate Prevention**: Unique constraints enforced across normalized email (`normalizeEmail(email)`) and job opening identifier.

## 2. Roles & Permissions Matrix
| Action | Admin | Assigned Teammate | Other Teammate | Unauthenticated |
| :--- | :---: | :---: | :---: | :---: |
| View All Candidates | Yes | No | No | No |
| View Assigned Candidate | Yes | Yes | No | No |
| Create Candidate | Yes | No | No | No |
| Update Call Notes / Status | Yes | Yes (Limited) | No | No |
| Delete Candidate | Yes | No | No | No |
| Bulk CSV Import | Yes | No | No | No |
| Manage Job Openings & Forms | Yes | No | No | No |
| Edit Email Templates | Yes | No | No | No |

## 3. Teammate Update Field Restriction
When a teammate updates an assigned candidate record, they are cryptographically locked to modify only:
`['stage', 'callLogs', 'lastContactDate', 'notes', 'updatedAt']`. They cannot modify salary, job assignments, or delete the record.
