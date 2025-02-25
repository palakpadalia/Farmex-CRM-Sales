import json
import frappe


def save_items_in_sales_order_item_tracking(doc, event):

    sales_order_item_tracking = frappe.new_doc("Sales Order Item Tracking")

    items_list = []

    for item in doc.items:
        items_list.append(
            {
                "item_code": item.item_code,
                "item_name": item.item_name,
                "quantity": item.qty,
                "rate": item.rate,
                "name": item.name,
            }
        )

    sales_order_item_tracking.sales_order = doc.name
    sales_order_item_tracking.old_items = json.dumps(items_list, indent=4)

    sales_order_item_tracking.insert()


def save_updated_items_in_sales_order_item_tracking(doc, event):
    sales_order_item_tracking = frappe.get_doc(
        "Sales Order Item Tracking", {"sales_order": doc.name}, fields=["*"]
    )

    if sales_order_item_tracking:
        updated_items_list = []

        for item in doc.items:
            updated_items_list.append(
                {
                    "item_code": item.item_code,
                    "item_name": item.item_name,
                    "quantity": item.qty,
                    "rate": item.rate,
                    "name": item.name,
                    "custom_is_new": item.custom_is_new,
                }
            )

        sales_order_item_tracking.updated_items = json.dumps(
            updated_items_list, indent=4
        )

        sales_order_item_tracking.save()

        frappe.db.commit()


def add_flag_of_new(doc, event):
    if getattr(doc, "is_updating_flags", False):
        return

    doc.is_updating_flags = True

    try:
        sales_order_item_tracking = frappe.get_all(
            "Sales Order Item Tracking",
            filters={"sales_order": doc.name},
            limit=1,
            fields=["name", "old_items"],
        )

        if sales_order_item_tracking:
            sales_order_item_tracking_doc = frappe.get_doc(
                "Sales Order Item Tracking", sales_order_item_tracking[0].name
            )

            old_items = (
                json.loads(sales_order_item_tracking_doc.old_items)
                if sales_order_item_tracking_doc.old_items
                else []
            )
            old_item_codes = {item.get("name") for item in old_items}

            for item in doc.items:
                if item.name not in old_item_codes:
                    item.custom_is_new = 1

            doc.save()
            frappe.db.commit()

    except Exception as e:
        frappe.log_error(f"Error in add_flag_of_new: {str(e)}", "Add Flag of New")

    finally:
        doc.is_updating_flags = False


def update_new_items(doc, event):
    sales_order_item_tracking_list = frappe.get_all(
        "Sales Order Item Tracking", filters={"sales_order": doc.name}, limit=1
    )

    if sales_order_item_tracking_list:
        sales_order_item_tracking = frappe.get_doc(
            "Sales Order Item Tracking", sales_order_item_tracking_list[0].name
        )

        existing_new_items = (
            json.loads(sales_order_item_tracking.new_items)
            if sales_order_item_tracking.new_items
            else []
        )

        existing_item_codes = {item["item_code"] for item in existing_new_items}

        for item in doc.items:
            if item.custom_is_new == 1 and item.item_code not in existing_item_codes:
                existing_new_items.append(
                    {
                        "item_code": item.item_code,
                        "item_name": item.item_name,
                        "quantity": item.qty,
                        "rate": item.rate,
                        "name": item.name,
                        "custom_is_new": item.custom_is_new,
                    }
                )

        sales_order_item_tracking.new_items = json.dumps(existing_new_items, indent=4)

        sales_order_item_tracking.save()


def set_the_removed_items(doc, event):
    if doc.get("is_updated_by_set_the_removed_items"):
        return

    doc.is_updated_by_set_the_removed_items = True

    sales_order_item_tracking_list = frappe.get_all(
        "Sales Order Item Tracking", filters={"sales_order": doc.name}, limit=1
    )

    if sales_order_item_tracking_list:
        sales_order_item_tracking = frappe.get_doc(
            "Sales Order Item Tracking", sales_order_item_tracking_list[0].name
        )

        old_items = sales_order_item_tracking.old_items
        new_items = sales_order_item_tracking.new_items

        old_items = json.loads(old_items) if old_items else []
        new_items = json.loads(new_items) if new_items else []

        updated_items = doc.items

        updated_item_names = {item.name for item in updated_items}
        removed_items = []

        for item in old_items + new_items:
            if item["name"] not in updated_item_names:
                remarks = ""

                if doc.custom_cancelled_item:
                    for cancelled_item in doc.custom_cancelled_item:
                        if cancelled_item.item_code == item.get("item_code"):
                            remarks = cancelled_item.remarks
                            break

                removed_items.append(
                    {
                        "item_code": item.get("item_code"),
                        "qty": item.get("quantity"),
                        "rate": item.get("rate"),
                        "amount": item.get("quantity") * item.get("rate"),
                        "remarks": remarks,
                    }
                )

        doc.custom_cancelled_item = []

        for item in removed_items:
            doc.append("custom_cancelled_item", item)

        doc.save()


@frappe.whitelist()
def send_notification(doc):

    sales_order = frappe.get_doc("Sales Order", {"name": doc}, fields=["*"])

    for item in sales_order.custom_cancelled_item:
        if item.remarks:
            message = f"{item.item_code} is cancelled from {doc} due to {item.remarks}."

            notification = frappe.new_doc("Notification Log")
            notification.subject = "Item Cancellation Notice"
            notification.document_type = "Sales Order"
            notification.document_name = doc
            notification.for_user = frappe.session.user
            notification.email_content = message

            notification.save()

    frappe.db.commit()


@frappe.whitelist()
def get_value(doctype, filters, fieldname):
    return frappe.db.get_value(doctype=doctype, filters=filters, fieldname=fieldname)


@frappe.whitelist()
def get_last_sale_rate(item_code, customer):
    # Step 1: Find the latest Sales Order where this item was sold
    last_order = frappe.get_all(
        "Sales Order Item",
        filters={"item_code": item_code},
        fields=["parent"],
        order_by="creation DESC",
        limit=1,
    )

    if last_order:
        order_name = last_order[0]["parent"]

        # Step 2: Check if the order belongs to the given customer
        order_exists = frappe.db.exists(
            "Sales Order", {"name": order_name, "customer": customer, "docstatus": 1}
        )

        if order_exists:
            # Step 3: Fetch the last sale rate for the item from that order
            sale_item = frappe.get_all(
                "Sales Order Item",
                filters={"parent": order_name, "item_code": item_code},
                fields=["rate"],
            )

            if sale_item:
                return sale_item[0]["rate"]

    return 0  # Return 0 if no previous rate is found

    # return order
