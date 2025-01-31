// Copyright (c) 2025, Palak P and contributors
// For license information, please see license.txt

frappe.query_reports["UOM Wise Stock Ledger"] = {
	"filters": [
		{
			"fieldname": "company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"default": frappe.defaults.get_default("company")
		},
		{
			"fieldname": "warehouse",
			"label": __("Warehouse"),
			"fieldtype": "Link",
			"options": "Warehouse",
			"default": frappe.defaults.get_default("warehouse")
		},
		{
			"fieldname": "item_code",
			"label": __("Item"),
			"fieldtype": "Link",
			"options": "Item"
		},
	]
};
