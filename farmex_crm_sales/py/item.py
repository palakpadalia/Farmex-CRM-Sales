import frappe


from erpnext.stock.doctype.item.item import Item as Document


class Item(Document):
    def validate_uom_conversion_factor(self):
        if self.uoms:
            for d in self.uoms:
                value = get_uom_conv_factor(d.uom, self.stock_uom, self.item_code)
                if value:
                    d.conversion_factor = value


@frappe.whitelist()
def get_uom_conv_factor(uom, stock_uom, item_code=None):
    """Get UOM conversion factor from uom to stock_uom
    e.g. uom = "Kg", stock_uom = "Gram" then returns 1000.0
    """
    if uom == stock_uom:
        return 1.0

    from_uom, to_uom = uom, stock_uom  # renaming for readability

    exact_match = frappe.db.get_value(
        "UOM Conversion Factor",
        {"to_uom": to_uom, "from_uom": from_uom, "custom_item_code": item_code},
        ["value"],
        as_dict=1,
    )
    if exact_match:
        return exact_match.value

    inverse_match = frappe.db.get_value(
        "UOM Conversion Factor",
        {"to_uom": from_uom, "from_uom": to_uom, "custom_item_code": item_code},
        ["value"],
        as_dict=1,
    )
    if inverse_match:
        return 1 / inverse_match.value

    # This attempts to try and get conversion from intermediate UOM.
    # case:
    #            g -> mg = 1000
    #            g -> kg = 0.001
    # therefore  kg -> mg = 1000  / 0.001 = 1,000,000
    intermediate_match = frappe.db.sql(
        """
           select (first.value / second.value) as value
           from `tabUOM Conversion Factor` first
           join `tabUOM Conversion Factor` second
               on first.from_uom = second.from_uom
           where
               first.to_uom = %(to_uom)s
               and second.to_uom = %(from_uom)s
           limit 1
           """,
        {"to_uom": to_uom, "from_uom": from_uom},
        as_dict=1,
    )

    if intermediate_match:
        return intermediate_match[0].value


@frappe.whitelist()
def get_available_stock_items(user):
    # Get warehouses accessible to the logged-in user
    accessible_warehouses = frappe.get_all(
        "User Permission", 
        filters={"user": user, "allow": "Warehouse"}, 
        pluck="for_value"
    )

    if not accessible_warehouses:
        accessible_warehouses = frappe.get_all("Warehouse", pluck="name")  # No accessible warehouses, return empty list

    # Get item codes where stock > 0 in these warehouses
    available_items = frappe.db.sql("""
        SELECT DISTINCT item_code
        FROM `tabBin`
        WHERE warehouse IN (%s) AND actual_qty > 0
    """ % ", ".join(["%s"] * len(accessible_warehouses)), tuple(accessible_warehouses), as_dict=True)

    return [d.item_code for d in available_items]  # Return list of item codes

