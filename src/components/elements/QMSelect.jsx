import React from 'react';
import MemberSelect from './MemberSelect';

/**
 * "Checked by" picker.
 *
 * Takes an already-filtered list rather than filtering by role name itself.
 * Who may sign off is decided by the `manages_inventory` flag on the roles
 * table — the same flag can_manage_inventory() reads in Postgres — so the
 * dropdown cannot offer someone the database would then refuse.
 */
export default function QMSelect({ value, onChange, checkers = [], label = "Checked by (QM on duty)" }) {
  return (<MemberSelect value={value} onChange={onChange} members={checkers} label={label} />)
}
