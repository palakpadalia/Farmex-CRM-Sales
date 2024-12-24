# Copyright (c) 2024, Palak P and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    # Initialize columns for the report with numeric field
    columns = [
        {
            "label": "Total PDC Cheque Count",
            "fieldname": "total_pdc_cheque_count",
            "fieldtype": "Int",
            "width": 150,
        }
    ]

    # Initialize the data list
    data = []

    # Fetch all employees (or filter as needed)
    employees = frappe.get_list("Employee", fields=["name"])

    if not employees:
        return columns, [{"total_pdc_cheque_count": 0}]

    # Iterate through the employees to find salespersons
    for employee in employees:
        employee_name = employee.name

        # Find the salesperson linked to the employee
        salesperson = frappe.get_value(
            "Sales Person", {"employee": employee_name}, "name"
        )
        
        if not salesperson:
            continue

        # Fetch the count of Payment Entries where the salesperson is linked and mode_of_payment is "Received PDC"
        pdc_cheque_count = frappe.db.count(
            "Payment Entry",
            filters={"docstatus": 0, "custom_created_by": salesperson, "mode_of_payment": "Received PDC"}
        )
        print(pdc_cheque_count)
        print("\n\n\n\n\n\n\n\n\n\n\n\n")

        # Add the result to the data list
        data.append({"total_pdc_cheque_count": pdc_cheque_count})

    # If no data is found for any salesperson, provide default result
    if not data:
        data.append({"total_pdc_cheque_count": 0})

    # Return the columns and data
    return columns, data
