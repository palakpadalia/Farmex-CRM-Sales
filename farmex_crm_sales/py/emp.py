import frappe

@frappe.whitelist()
def create_branch_user_permission(doc, event):
    user_id = doc.user_id
    existing_permission = frappe.db.exists(
        "User Permission",
        {
            "user": user_id,
            "allow": "Branch",
        },
    )
    
    if not existing_permission:
        # If no permission exists, create a new one
        user_permission = frappe.new_doc("User Permission")
        user_permission.user = user_id
        user_permission.allow = "Branch"
        user_permission.for_value = doc.branch
        user_permission.save()
        frappe.db.commit()
    else:
        # If permission exists, update the existing one with the latest branch
        existing_permission_doc = frappe.get_doc(
            "User Permission", existing_permission
        )
        if existing_permission_doc.for_value != doc.branch:
            existing_permission_doc.for_value = doc.branch
            existing_permission_doc.save()
            frappe.db.commit()
