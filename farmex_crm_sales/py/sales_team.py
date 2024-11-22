import frappe


@frappe.whitelist()
def set_sales_person(doc, event):
    if doc.custom_sales_person:

        doc.sales_team = []

        sales_team = doc.append("sales_team", {})
        sales_team.sales_person = doc.custom_sales_person
        sales_team.allocated_percentage = 100
        sales_team.allocated_amount = doc.total


