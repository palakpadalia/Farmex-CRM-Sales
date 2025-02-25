import frappe


@frappe.whitelist()
def send_notification(doc, event):
    users = frappe.get_all(
        "Has Role",
        filters={"role": "Stock User", "parenttype": "User"},
        fields=["parent"],
    )

    user_emails = [frappe.get_value("User", user["parent"], "email") for user in users]

    for item in doc.items:
        if not (item.sales_order or item.delivery_note):
            message = (
                f"A new tax invoice {doc.name} has been created for {doc.customer_name} "
                f"on {doc.posting_date}. Please review it and schedule a delivery for it!"
            )

            for email in user_emails:
                if email:
                    notification = frappe.new_doc("Notification Log")
                    notification.subject = f"🧾 New Tax Invoice Created - {doc.name}"
                    notification.document_type = "Sales Invoice"
                    notification.document_name = doc.name
                    notification.for_user = email
                    notification.email_content = message

                    notification.insert(ignore_permissions=True)


@frappe.whitelist()
def get_last_sale_rate(item_code, customer):
    # Step 1: Find the latest Sales Invoice where this item was sold
    last_invoice = frappe.get_all(
        "Sales Invoice Item",
        filters={"item_code": item_code},
        fields=["parent"],
        order_by="creation DESC",
        limit=1,
    )

    if last_invoice:
        invoice_name = last_invoice[0]["parent"]
        
        # Step 2: Check if the invoice belongs to the given customer
        invoice_exists = frappe.db.exists("Sales Invoice", {"name": invoice_name, "customer": customer, "docstatus": 1})
        
        if invoice_exists:
            # Step 3: Fetch the last sale rate for the item from that invoice
            sale_item = frappe.get_all(
                "Sales Invoice Item",
                filters={"parent": invoice_name, "item_code": item_code},
                fields=["rate"]
            )

            if sale_item:
                return sale_item[0]["rate"]

    return 0  # Return 0 if no previous rate is found

    # return invoice
