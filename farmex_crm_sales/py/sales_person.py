import frappe
import frappe.utils


@frappe.whitelist()
def create_user_permission_for_sales_person(doc, event):
    if doc.employee:

        employee = frappe.get_doc("Employee", doc.employee)

        user_id = employee.user_id
        if user_id and doc.name:
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
                user_permission.insert()
                frappe.db.commit()



@frappe.whitelist()
def remove_warehouse_perm(doc, event):
    if doc.employee and doc.custom_warehouse:

        employee = frappe.get_doc("Employee", doc.employee)

        user_id = employee.user_id
        if user_id and doc.name:
            existing_permission = frappe.db.exists(
                "User Permission",
                {
                    "user": user_id,
                    "allow": "Warehouse",
                    "for_value": doc.custom_warehouse,
                },
            )
          
     
        #delete existiong permission on trash
        if existing_permission:
            frappe.delete_doc("User Permission", existing_permission, ignore_permissions=True)
            frappe.db.commit() 



@frappe.whitelist()
def set_user_permission_van_sales(doc, event):
    if doc.custom_is_van_sales == 1 and doc.custom_warehouse and doc.employee:
        employee = frappe.get_doc("Employee", doc.employee)

        user = employee.user_id
        if user and doc.custom_warehouse:
            check_permission = frappe.db.exists(
                "User Permission",
                {"user": user, "allow": "Warehouse"},
            )

            if not check_permission:
                new_user_permission = frappe.new_doc("User Permission")
                new_user_permission.user = user
                new_user_permission.allow = "Warehouse"
                new_user_permission.for_value = doc.custom_warehouse
                new_user_permission.save()
                frappe.db.commit()
            else:
                existing_user_permission = frappe.get_doc("User Permission", {"user": user, "allow": "Warehouse"})
                print(existing_user_permission)
                existing_user_permission.for_value = doc.custom_warehouse
                existing_user_permission.save()
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


from frappe.desk.doctype.bulk_update.bulk_update import submit_cancel_or_update_docs

# path: /api/method/farmex_crm_sales.py.sales_person.set_incentives
# Set Sales Person's Commission to zero
@frappe.whitelist()
def set_incentives():

    invoices = frappe.db.get_all(
        doctype="Sales Invoice", pluck="name", filters={"status": "Overdue"}
    )

    child_names = frappe.db.get_all(
        doctype='Sales Team', pluck = 'name', filters = {'parent':['in',invoices]}
    )

    res = submit_cancel_or_update_docs(
        doctype="Sales Team",
        action="update",
        docnames =  child_names,
        data={"incentives": "0"},
    )
    return "Incentives Updated Successfully!"
