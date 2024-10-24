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
