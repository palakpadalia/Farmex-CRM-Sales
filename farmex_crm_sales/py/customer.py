    
import frappe
from frappe.utils import today, date_diff

def update_pricelist_insert(doc,method):
    if doc.customer_group:
        if frappe.db.exists("Customer Group Wise Item Price",{"customer_group":doc.customer_group}):
            # get custome group wise item price doctype existing record
            id_of_group = frappe.db.exists("Customer Group Wise Item Price",{"customer_group":doc.customer_group})
            # get whole document record 
            price_list_doc = frappe.get_doc("Customer Group Wise Item Price",id_of_group)
            item_price_list(price_list_doc,doc.name)

            
def before_save(doc, method):
    if not doc.is_new():
        
        previous_doc = doc.get_doc_before_save()
        old_customer_group = previous_doc.customer_group if previous_doc else None
        
        if old_customer_group != doc.customer_group:
            
            if doc.customer_group:
                if frappe.db.exists("Customer Group Wise Item Price",{"customer_group":doc.customer_group}):
                    # get custome group wise item price doctype existing record
                    
                    id_of_group = frappe.db.exists("Customer Group Wise Item Price",{"customer_group":doc.customer_group})
                    # get whole document record 
                    if id_of_group:
                        price_list_doc = frappe.get_doc("Customer Group Wise Item Price",{"customer_group":id_of_group})
                        item_price_list(price_list_doc,doc.name)
                else:
                    # if group is not exists in customer group wise price list then delete old price list
                    item_price_list_data = frappe.db.get_all("Item Price",{"customer":doc.name})
                    for item_price in item_price_list_data:
                        frappe.delete_doc("Item Price",item_price.name)


def on_trash(doc, method):
    item_price_list_data = frappe.db.get_all("Item Price",{"customer":doc.name})
    for item_price in item_price_list_data:
        frappe.delete_doc("Item Price",item_price.name)




# Create and update item price for existinf custome and newly created customer
def item_price_list(self,customer):

    # Fetch existing item prices for this customer
    existing_prices = frappe.db.get_all(
        "Item Price",
        fields=["name", "item_code", "price_list_rate"],
        filters={"customer": customer, "selling": 1},
    )
    existing_prices_map = {price["item_code"]: price for price in existing_prices}

    # Keep track of current item prices to identify stale entries
    current_item_codes = {item.item for item in self.item_price}

    # Update or create item prices
    for item in self.item_price:
        if item.item in existing_prices_map:
            # Update the price if it has changed
            existing_price = existing_prices_map[item.item]
            if existing_price["price_list_rate"] != item.price:
                frappe.db.set_value(
                    "Item Price",
                    existing_price["name"],
                    {"price_list_rate": item.price, "valid_from": today()},
                )
        else:
            # Create a new item price
            frappe.get_doc({
                "doctype": "Item Price",
                "item_code": item.item,
                "price_list": "Standard Selling",
                "customer": customer,
                "price_list_rate": item.price,
                "valid_from": today(),
                "selling": 1,
            }).insert()

    # Remove stale item prices (those not in the current list)
    for item_code, price in existing_prices_map.items():
        if item_code not in current_item_codes:
            frappe.delete_doc("Item Price", price["name"])

    # Commit the changes to the database
    frappe.db.commit()




@frappe.whitelist()
def disable_customers():

    customers = frappe.get_all(
        "Customer",
        filters={"disabled": 0},
        fields=[
            "name",
            "custom_expiry_date_of_company_trade_license",
            "custom_expiry_date_of_owners__authorised_person_passport",
            "custom_expiry_date_of_owners__authorised_person_emirates_id",
        ],
    )

    for customer in customers:
        expiry_dates = [
            customer.custom_expiry_date_of_company_trade_license,
            customer.custom_expiry_date_of_owners__authorised_person_passport,
            customer.custom_expiry_date_of_owners__authorised_person_emirates_id,
        ]

        for expiry_date in expiry_dates:

            if expiry_date and 30 <= date_diff(today(), expiry_date):
                print(customer.name)
                frappe.db.set_value("Customer", customer.name, "disabled", 1)

                break


def enable_customer(doc, event):
    if (
        (
            doc.custom_expiry_date_of_company_trade_license
            and doc.custom_expiry_date_of_company_trade_license >= today()
        )
        or (
            doc.custom_expiry_date_of_owners__authorised_person_passport
            and doc.custom_expiry_date_of_owners__authorised_person_passport >= today()
        )
        or (
            doc.custom_expiry_date_of_owners__authorised_person_emirates_id
            and doc.custom_expiry_date_of_owners__authorised_person_emirates_id
            >= today()
        )
    ):

        doc.disabled = 0
