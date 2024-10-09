import frappe
from erpnext.accounts.party import get_dashboard_info


@frappe.whitelist()
def new_get_dashboard_info(party_type, party, loyalty_program=None):
    return get_dashboard_info(party_type, party, loyalty_program)
