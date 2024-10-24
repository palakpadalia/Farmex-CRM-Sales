import frappe
from frappe import _
from datetime import datetime
from frappe.utils import getdate


def execute(filters=None):
    columns = [
        {
            "label": _("Name"),
            "fieldname": "name",
            "fieldtype": "Link",
            "options": "Delivery Trip",
            "width": 120,
        },
        {
            "label": _("Date"),
            "fieldname": "departure_time",
            "fieldtype": "Date",
            "width": 120,
        },
        {
            "label": _("Tax Invoice"),
            "fieldname": "custom_tax_invoice",
            "fieldtype": "Link",
            "options": "Sales Invoice",
            "width": 120,
        },
        {
            "label": _("Driver"),
            "fieldname": "driver_name",
            "fieldtype": "Data",
            "width": 120,
        },
        {
            "label": _("Driver Number"),
            "fieldname": "cell_number",
            "fieldtype": "Data",
            "width": 120,
        },
        {
            "label": _("Party Name"),
            "fieldname": "customer",
            "fieldtype": "Link",
            "options": "Customer",
            "width": 120,
        },
        {
            "label": _("Area"),
            "fieldname": "address_line2",
            "fieldtype": "Data",
            "width": 120,
        },
        {"label": _("City"), "fieldname": "city", "fieldtype": "Data", "width": 120},
        {
            "label": _("Sales Person"),
            "fieldname": "custom_sales_person",
            "fieldtype": "Link",
            "options": "Sales Person",
            "width": 120,
        },
        {
            "label": _("Amount"),
            "fieldname": "grand_total",
            "fieldtype": "Currency",
            "width": 120,
        },
        {
            "label": _("Mode Of Payment"),
            "fieldname": "mode_of_payment",
            "fieldtype": "Data",
            "width": 120,
        },
    ]

    data = []
    trip_filters = {}
    si_filters = {}

    if filters.get("company"):
        trip_filters["company"] = filters["company"]
    if filters.get("driver"):
        trip_filters["driver"] = filters["driver"]

    if filters.get("departure_time"):
        start_of_day = getdate(filters.get("departure_time"))
        trip_filters["departure_time"] = ["Between", [start_of_day, start_of_day]]

    delivery_trips = frappe.get_list(
        "Delivery Trip",
        fields=["name", "departure_time", "driver_name", "driver"],
        filters=trip_filters,
    )

    if filters.get("custom_sales_person"):
        si_filters["custom_sales_person"] = filters["custom_sales_person"]

    for trip in delivery_trips:
        delivery_stops = frappe.get_all(
            "Delivery Stop",
            fields=["customer", "custom_tax_invoice", "grand_total", "address"],
            filters={"parent": trip.name},
        )

        for stop in delivery_stops:
            address = (
                frappe.get_value("Address", stop.address, ["address_line2", "city"])
                if stop.address
                else ("", "")
            )

            sales_invoice = frappe.get_all(
                "Sales Invoice",
                fields=["custom_sales_person", "name"],
                filters={**si_filters, "name": stop.custom_tax_invoice},
            )

            driver = frappe.get_all(
                "Driver",
                fields=["cell_number"],
                filters={"name": trip.driver},
            )

            sales_person = sales_invoice[0].custom_sales_person if sales_invoice else ""
            driver_cell_number = driver[0].cell_number if driver else ""

            datas = {
                "name": trip.name,
                "departure_time": trip.departure_time,
                "driver_name": trip.driver_name,
                "cell_number": driver_cell_number,
                "custom_tax_invoice": stop.custom_tax_invoice,
                "customer": stop.customer,
                "address_line2": address[0],
                "city": address[1],
                "custom_sales_person": sales_person,
                "grand_total": stop.grand_total,
            }

            if (
                (
                    not filters.get("custom_sales_person")
                    or datas["custom_sales_person"] == filters["custom_sales_person"]
                )
                and (
                    not filters.get("company")
                    or trip_filters.get("company") == filters["company"]
                )
                and (
                    not filters.get("driver")
                    or trip_filters.get("driver") == filters["driver"]
                )
                and (
                    not filters.get("customer")
                    or datas["customer"] == filters["customer"]
                )
            ):
                data.append(datas)

    return columns, data
