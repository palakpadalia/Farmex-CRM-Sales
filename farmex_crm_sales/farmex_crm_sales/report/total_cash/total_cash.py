# Copyright (c) 2024, Palak P and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    # Initialize columns for the report with numeric field
    columns = [
        {
            "label": "Total Cash",
            "fieldname": "total_cash",
            "fieldtype": "Float",
            "width": 150,
            "options": "currency",
        }
    ]

    # Initialize the data list
    data = []

    # Fetch all employees (or filter as needed)
    employees = frappe.get_list("Employee", fields=["name"])

    if not employees:
        return columns, [{"Salesperson": "N/A", "Total Cash": 0}]

    # Iterate through the employees to find salespersons
    for employee in employees:
        employee_name = employee.name

        # Find the salesperson linked to the employee
        salesperson = frappe.get_value(
            "Sales Person", {"employee": employee_name}, "name"
        )
        
        if not salesperson:
            continue

        # Fetch all Payment Entries where the salesperson is linked and mode_of_payment is "Cash"
        payment_entries = frappe.get_all(
            "Payment Entry",
            filters={"docstatus": 0, "custom_created_by": salesperson, "mode_of_payment": "Cash"},
            fields=["paid_amount"],
        )

        # Calculate the Total Cash
        total_cash = sum(entry["paid_amount"] for entry in payment_entries)

        # If no paid amount found, default to 0
        total_cash = total_cash or 0

        # Add the result to the data list
        data.append({"total_cash": total_cash})

    # If no data is found for any salesperson, provide default result
    if not data:
        data.append({"total_cash": 0})

    # Return the columns and data
    return columns, data
