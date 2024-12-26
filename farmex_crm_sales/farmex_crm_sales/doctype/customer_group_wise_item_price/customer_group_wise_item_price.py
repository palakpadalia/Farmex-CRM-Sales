# Copyright (c) 2024, Palak P and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import today
from frappe.model.document import Document


class CustomerGroupWiseItemPrice(Document):


	def on_update(self):
		item_price_list(self)

	def on_trash(self):
		delete_item_prices(self)
		



def item_price_list(self):
	# get all customer with linked with current form customer group.
		customer_list = frappe.db.get_all(
			"Customer", filters={"customer_group": self.customer_group}, pluck="name"
		)

		# get existing item prices linked with given customer list
		existing_prices = frappe.db.get_all(
			"Item Price",
			fields=["name", "item_code", "customer", "price_list_rate"],
			filters={"customer": ["in", customer_list], "selling": 1},
		)
		existing_prices_map = {
			(price["item_code"], price["customer"]): price for price in existing_prices
		}
		
		  # Create a set of (item_code, customer) keys from self.item_price
		current_item_price_keys = {
			(item.item, customer) for item in self.item_price for customer in customer_list
		}
		
		# Update and create item price base on the exist to update and not exist to create new
		for item in self.item_price:
			for customer in customer_list:
				key = (item.item, customer)
				if key in existing_prices_map:
					if existing_prices_map[key]["price_list_rate"] != item.price:
						frappe.db.set_value(
							"Item Price",
							existing_prices_map[key]["name"],
							{"price_list_rate": item.price, "valid_from": today()},
						)
				else:
					frappe.get_doc({
						"doctype": "Item Price",
						"item_code": item.item,
						"price_list": "Standard Selling",
						"customer": customer,
						"price_list_rate": item.price,
						"valid_from": today(),
						"selling": 1,
					}).insert()

		 # Find and remove item prices that are no longer in self.item_price
		for key, price in existing_prices_map.items():
			if key not in current_item_price_keys:
				frappe.delete_doc("Item Price", price["name"])
		frappe.db.commit()





def delete_item_prices(self):
    # get all customers linked with the current form customer group
    customer_list = frappe.db.get_all(
        "Customer", filters={"customer_group": self.customer_group}, pluck="name"
    )

    # delete item price on trash
    frappe.db.delete(
        "Item Price", 
        {"customer": ["in", customer_list], "selling": 1}
    )
    frappe.db.commit()