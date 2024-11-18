import frappe
from frappe import _


def execute(filters=None):
    columns = [
        {
            "label": _("Invoice Date"),
            "fieldname": "posting_date",
            "fieldtype": "Date",
            "width": 110,
        },
        {
            "label": _("Invoice No"),
            "fieldname": "name",
            "fieldtype": "Link",
            "options": "Sales Invoice",
            "width": 150,
        },
        {
            "label": _("Invoice Status"),
            "fieldname": "status",
            "fieldtype": "Data",
            "width": 100,
        },
        {
            "label": _("Due Date"),
            "fieldname": "due_date",
            "fieldtype": "Date",
            "width": 110,
        },
        {
            "label": _("Invoiced Amount"),
            "fieldname": "grand_total",
            "fieldtype": "Currency",
            "width": 125,
        },
        {
            "label": _("Paid Amount"),
            "fieldname": "total_paid_amount",
            "fieldtype": "Currency",
            "width": 125,
        },
        {
            "label": _("PDC Amount"),
            "fieldname": "total_pdc_amount",
            "fieldtype": "Currency",
            "width": 125,
        },
        {
            "label": _("Credit Note"),
            "fieldname": "credit_note",
            "fieldtype": "Currency",
            "width": 125,
        },
        {
            "label": _("Outstanding Amount"),
            "fieldname": "outstanding_amount",
            "fieldtype": "Currency",
            "width": 125,
        },
        {
            "label": _("Remarks"),
            "fieldname": "remarks",
            "fieldtype": "Data",
            "width": 180,
        },
    ]

    tax_invoice_filters = {
        "status": [
            "in",
            [
                "Partly Paid",
                "Unpaid",
                "Partly Paid and Discounted",
                "Unpaid and Discounted",
                "Overdue",
            ],
        ],
        "docstatus": 1,
    }

    if filters and filters.get("company"):
        tax_invoice_filters["company"] = filters["company"]

    if filters and filters.get("customer"):
        tax_invoice_filters["customer"] = filters["customer"]

    tax_invoice = frappe.get_list(
        "Sales Invoice",
        fields=[
            "posting_date",
            "name",
            "due_date",
            "grand_total",
            "outstanding_amount",
            "status",
        ],
        filters=tax_invoice_filters,
    )

    credit_notes = frappe.get_list(
        "Sales Invoice",
        fields=["return_against", "grand_total"],
        filters={
            "is_return": 1,
            "return_against": ["in", [inv["name"] for inv in tax_invoice]],
        },
    )

    credit_note = {}
    for cn in credit_notes:
        if cn["return_against"] not in credit_note:
            credit_note[cn["return_against"]] = 0
        credit_note[cn["return_against"]] += cn["grand_total"]

    payment_entry = frappe.get_all(
        "Payment Entry",
        fields=["name", "mode_of_payment"],
        filters={"mode_of_payment": ["!=", "Received PDC"]},
    )

    valid_payment_entry = [pe["name"] for pe in payment_entry]

    payment_references = frappe.get_all(
        "Payment Entry Reference",
        fields=["parent", "allocated_amount", "reference_name"],
        filters={
            "reference_doctype": "Sales Invoice",
            "reference_name": ["in", [inv["name"] for inv in tax_invoice]],
            "parent": ["in", valid_payment_entry],
        },
    )

    pdc_payment_entry = frappe.get_all(
        "Payment Entry",
        fields=["name", "mode_of_payment"],
        filters={"mode_of_payment": ["=", "Received PDC"]},
    )

    valid_pdc_payment_entry = [pe["name"] for pe in pdc_payment_entry]

    pdc_payment_references = frappe.get_all(
        "PDC Payment Reference",
        fields=["parent", "grand_total", "tax_invoice"],
        filters={
            "tax_invoice": ["in", [inv["name"] for inv in tax_invoice]],
            "parent": ["in", valid_pdc_payment_entry],
        },
    )

    paid_amount = {}
    for pr in payment_references:
        if pr["reference_name"] not in paid_amount:
            paid_amount[pr["reference_name"]] = 0
        paid_amount[pr["reference_name"]] += pr["allocated_amount"]

    pdc_paid_amount = {}
    for pdc_pr in pdc_payment_references:
        if pdc_pr["tax_invoice"] not in pdc_paid_amount:
            pdc_paid_amount[pdc_pr["tax_invoice"]] = 0
        pdc_paid_amount[pdc_pr["tax_invoice"]] += pdc_pr["grand_total"]

    filtered_invoices = []

    for invoice in tax_invoice:
        invoice["credit_note"] = credit_note.get(invoice["name"], 0)

        invoice["total_paid_amount"] = paid_amount.get(invoice["name"], 0)

        invoice["total_pdc_amount"] = pdc_paid_amount.get(invoice["name"], 0)

        invoice["outstanding_amount"] = (
            invoice["grand_total"]
            - invoice["total_paid_amount"]
            - invoice["total_pdc_amount"]
            + invoice["credit_note"]
        )

        if invoice["total_pdc_amount"] > 0:
            invoice["remarks"] = "PDC Payment"
        else:
            invoice["remarks"] = ""

        if not (
            invoice["outstanding_amount"] == 0 and invoice["total_pdc_amount"] == 0
        ):
            filtered_invoices.append(invoice)

    return columns, filtered_invoices
