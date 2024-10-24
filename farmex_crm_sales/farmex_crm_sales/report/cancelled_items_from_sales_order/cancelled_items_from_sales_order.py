import frappe
from frappe import _


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_columns():
    return [
        {
            "fieldname": "name",
            "label": _("Sales Order"),
            "fieldtype": "Link",
            "options": "Sales Order",
            "width": 150,
        },
        {
            "fieldname": "transaction_date",
            "label": _("Date"),
            "fieldtype": "Date",
            "width": 100,
        },
        {
            "fieldname": "customer",
            "label": _("Customer"),
            "fieldtype": "Link",
            "options": "Customer",
            "width": 150,
        },
        {
            "fieldname": "item_code",
            "label": _("Item Code"),
            "fieldtype": "Link",
            "options": "Item",
            "width": 150,
        },
        {
            "fieldname": "rate",
            "label": _("Rate"),
            "fieldtype": "Float",
            "width": 100,
        },
        {
            "fieldname": "qty",
            "label": _("Quantity"),
            "fieldtype": "Float",
            "width": 100,
        },
        {
            "fieldname": "amount",
            "label": _("Amount"),
            "fieldtype": "Currency",
            "width": 100,
        },
        {
            "fieldname": "remarks",
            "label": _("Remarks"),
            "fieldtype": "Text",
            "width": 200,
        },
        {
            "fieldname": "company",
            "label": _("Company"),
            "fieldtype": "Link",
            "options": "Company",
            "width": 150,
        },
    ]


def get_data(filters):
    data = []

    sales_order_filters = {
        "docstatus": 1,
    }

    if filters.get("customer"):
        sales_order_filters["customer"] = filters["customer"]
    if filters.get("company"):
        sales_order_filters["company"] = filters["company"]
    if filters.get("transaction_date"):
        sales_order_filters["transaction_date"] = filters["transaction_date"]

    sales_orders = frappe.get_list(
        "Sales Order",
        fields=["name", "transaction_date", "customer", "company"],
        filters=sales_order_filters,
    )

    for so in sales_orders:
        cancelled_item_filters = {"parent": so.name}

        if filters.get("item_code"):
            cancelled_item_filters["item_code"] = filters["item_code"]

        cancelled_items = frappe.get_all(
            "Sales Order Cancelled Item",
            filters=cancelled_item_filters,
            fields=["item_code", "rate", "qty", "amount", "remarks"],
        )

        for item in cancelled_items:
            item_data = {
                "name": so.name,
                "transaction_date": so.transaction_date,
                "customer": so.customer,
                "company": so.company,
                "item_code": item.item_code,
                "rate": item.rate,
                "qty": item.qty,
                "amount": item.amount,
                "remarks": item.remarks,
            }
            data.append(item_data)

    return data
