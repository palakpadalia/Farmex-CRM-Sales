import frappe


def create_user_permission_for_sales_person(doc, event):
    if doc.employee:
        employee = frappe.get_doc("Employee", doc.employee)
        user_id = employee.user_id

        existing_permission = frappe.db.exists(
            "User Permission",
            {
                "user": user_id,
                "allow": "Sales Person",
                "for_value": doc.name,
            },
        )

        if not existing_permission:
            user_permission = frappe.new_doc("User Permission")
            user_permission.user = user_id
            user_permission.allow = "Sales Person"
            user_permission.for_value = doc.name

            user_permission.save()
            frappe.db.commit()


@frappe.whitelist()
def set_sales_person(doc, event):
    user = frappe.session.user

    employee = frappe.get_list(
        "Employee",
        filters={"user_id": user},
        limit=1,
        fields=["name"],
    )

    if employee:
        sales_person = frappe.get_list(
            "Sales Person",
            filters={"employee": employee[0].name},
            limit=1,
            fields=["name"],
        )

        if sales_person:
            user_permission = frappe.get_list(
                "User Permission",
                filters={
                    "user": user,
                    "allow": "Sales Person",
                    "for_value": sales_person,
                },
                limit=1,
                fields=["name"],
            )

            if user_permission:
                if doc.is_new():
                    doc.custom_sales_person = sales_person
