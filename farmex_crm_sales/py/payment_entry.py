import frappe


@frappe.whitelist()
def set_sales_person_or_driver(doc, event):
    user = frappe.session.user

    employee = frappe.get_all(
        "Employee",
        filters={"user_id": user},
        limit=1,
        fields=["name"],
    )

    if not employee:
        return

    employee_name = employee[0].name

    def get_user_permission(role, for_value):
        return frappe.get_all(
            "User Permission",
            filters={
                "user": user,
                "allow": role,
                "for_value": for_value,
            },
            limit=1,
            fields=["name"],
        )

    sales_person = frappe.get_all(
        "Sales Person",
        filters={"employee": employee_name},
        limit=1,
        fields=["name", "custom_cash_collection_account", "custom_is_van_sales"],
    )

    if sales_person:
        sales_person_data = sales_person[0]
        user_permission = get_user_permission(
            "Sales Person",
            sales_person_data["name"],
        )
        if user_permission and doc.is_new():
            doc.custom_sales_person__driver = "Sales Person"
            doc.custom_created_by = sales_person_data["name"]

        if (
            sales_person_data.get("custom_is_van_sales") == 1
            and sales_person_data.get("custom_cash_collection_account")
            and doc.payment_type == "Receive"
        ):
            doc.paid_to = sales_person_data["custom_cash_collection_account"]

    driver = frappe.get_all(
        "Driver",
        filters={"employee": employee_name},
        limit=1,
        fields=["name"],
    )

    if driver:
        user_permission = get_user_permission("Driver", driver[0].name)
        if user_permission and doc.is_new():
            doc.custom_sales_person__driver = "Driver"
            doc.custom_created_by = driver[0].name
