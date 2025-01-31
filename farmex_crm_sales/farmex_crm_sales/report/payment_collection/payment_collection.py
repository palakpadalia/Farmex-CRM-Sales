# Copyright (c) 2024, Palak P and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
    columns = [
        {
            "label": "Payment Entry",
            "fieldname": "name",
            "fieldtype": "Link",
            "width": 150,
            "options": "Payment Entry",
        },
        {
            "label": "Posting Date",
            "fieldname": "posting_date",
            "fieldtype": "Date",
            "width": 100,
        },
        {
            "label": "Party",
            "fieldname": "party",
            "fieldtype": "Data",
            "width": 150,
        },
        {
            "label": "Status",
            "fieldname": "status",
            "fieldtype": "Data",
            "width": 150,
        },
        {
            "label": "Paid Amount",
            "fieldname": "paid_amount",
            "fieldtype": "Currency",
            "width": 150,
        },
        {
            "label": "Mode of Payment",
            "fieldname": "mode_of_payment",
            "fieldtype": "Data",
            "width": 150,
        },
        {
            "label": "Sales Person/Driver",
            "fieldname": "custom_sales_person__driver",
            "fieldtype": "Data",
            "width": 150,
        },
        {
            "label": "Created By",
            "fieldname": "custom_created_by",
            "fieldtype": "Data",
            "width": 150,
        },
        {
            "label": "Company",
            "fieldname": "company",
            "fieldtype": "Data",
            "width": 150,
        },
    ]

    filters = filters or {}
    pe_filters = {}

    if filters.get("company"):
        pe_filters["company"] = filters.get("company")

    if filters.get("from_date") and filters.get("to_date"):
        pe_filters["posting_date"] = [
            "between",
            [filters.get("from_date"), filters.get("to_date")],
        ]

    data = frappe.get_list(
        "Payment Entry",
        fields=[
            "name",
            "posting_date",
            "company",
            "mode_of_payment",
            "custom_sales_person__driver",
            "custom_created_by",
            "party",
            "paid_amount",
            "status"
        ],
        filters=pe_filters,
    )

    return columns, data
