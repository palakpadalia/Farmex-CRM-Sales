# import frappe

# @frappe.whitelist()  # Allow this function to be called via JS
# def get_sales_order_list_filters():
#     # Fetch the role profile of the current user
#     role_profile = frappe.db.get_value("User", frappe.session.user, "role_profile_name")

#     # If the user has the 'Operations' role profile, return a filter for docstatus = 1
#     if role_profile == "Operations":
#         return [["Sales Order", "docstatus", "=", 1]]  # Include DocType explicitly
#     else:
#         return []  # No filters for other users
