import frappe


@frappe.whitelist()
def custom_login_redirect():

    user = frappe.session.user

    roles = frappe.get_roles(user)

    if "Van Sales" in roles:
        frappe.local.response["home_page"] = "/app/dashboard-view/Selling"

    if "Pre Sales" in roles:
        frappe.local.response["home_page"] = "/app/dashboard-view/Selling"
