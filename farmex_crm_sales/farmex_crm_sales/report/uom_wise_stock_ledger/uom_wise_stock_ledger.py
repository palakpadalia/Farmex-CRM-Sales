import frappe
import math


def execute(filters=None):
    # Initialize filters (handle None case)
    filters = filters or {}
    company = filters.get("company")
    warehouse_filter = filters.get("warehouse")
    item_code_filter = filters.get("item_code")

    # Determine warehouses based on company and warehouse filters
    warehouses = []
    if company:
        warehouses = frappe.get_list(
            "Warehouse", filters={"company": company}, pluck="name"
        )
        if warehouse_filter and warehouse_filter in warehouses:
            warehouses = [warehouse_filter]
        elif warehouse_filter and warehouse_filter not in warehouses:
            warehouses = []  # Invalid warehouse for company
    elif warehouse_filter:
        warehouses = [warehouse_filter]

    # Fetch items with UOM and item filters
    item_filters = {}
    if item_code_filter:
        item_filters["name"] = item_code_filter
    items = frappe.get_all(
        "Item", fields=["name", "item_name", "stock_uom"], filters=item_filters
    )

    # Collect all unique UOMs dynamically
    uom_set = set()
    for item in items:
        conversion_data = frappe.get_all(
            "UOM Conversion Detail", filters={"parent": item.name}, fields=["uom"]
        )
        for entry in conversion_data:
            uom_set.add(entry.uom)
    uom_list = sorted(list(uom_set))

    # Define columns
    columns = [
        {
            "label": "Item Name",
            "fieldname": "item_name",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": "Default UOM",
            "fieldname": "stock_uom",
            "fieldtype": "Data",
            "width": 70,
        },
        {
            "label": "Warehouse",
            "fieldname": "warehouse",
            "fieldtype": "Data",
            "width": 100,
        },
        {
            "label": "Total Quantity",
            "fieldname": "total_qty",
            "fieldtype": "Data",
            "width": 200,
        },
    ]
    for uom in uom_list:
        columns.append(
            {
                "label": uom,
                "fieldname": frappe.scrub(uom),
                "fieldtype": "Int",
                "width": 70,
            }
        )

    data = []
    for item in items:
        # Fetch bins with warehouse filter
        bin_filters = {"item_code": item.name}
        if warehouses:
            bin_filters["warehouse"] = ["in", warehouses]
        bins = frappe.get_list(
            "Bin", filters=bin_filters, fields=["warehouse", "actual_qty"]
        )

        for bin_entry in bins:
            warehouse = bin_entry.warehouse
            bin_qty = bin_entry.actual_qty or 0

            conversion_data = frappe.get_all(
                "UOM Conversion Detail",
                filters={"parent": item.name},
                fields=["uom", "conversion_factor"],
                order_by="conversion_factor DESC",
            )

            item_data = {
                "item_name": item.item_name,
                "stock_uom": item.stock_uom,
                "warehouse": warehouse,
                "total_qty": "",
            }

            remaining_qty = bin_qty
            total_qty_parts = []

            # Initialize all UOM columns to 0
            for uom in uom_list:
                item_data[frappe.scrub(uom)] = 0

            # Break down quantity into UOMs
            for entry in conversion_data:
                if entry.conversion_factor and entry.conversion_factor > 0:
                    units = math.floor(remaining_qty / entry.conversion_factor)
                    remaining_qty -= units * entry.conversion_factor
                    item_data[frappe.scrub(entry.uom)] = units
                    if units > 0:
                        total_qty_parts.append(f"{units} {entry.uom}")

            # Add remaining quantity in stock UOM
            if remaining_qty > 0:
                item_data[frappe.scrub(item.stock_uom)] += remaining_qty
                total_qty_parts.append(f"{remaining_qty:.2f} {item.stock_uom}")

            item_data["total_qty"] = ", ".join(total_qty_parts)
            data.append(item_data)

    return columns, data
