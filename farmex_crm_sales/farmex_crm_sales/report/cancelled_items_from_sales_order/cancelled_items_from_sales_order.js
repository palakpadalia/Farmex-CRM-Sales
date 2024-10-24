// Copyright (c) 2024, Palak P and contributors
// For license information, please see license.txt

frappe.query_reports["Cancelled Items From Sales Order"] = {
	"filters": [
		{
			"fieldname": "company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"default": frappe.defaults.get_default("company"),
			"reqd": 0
		},
		{
			"fieldname": "transaction_date",
			"label": __("Date"),
			"fieldtype": "Date",
			"reqd": 0
		},
		{
			"fieldname": "customer",
			"label": __("Customer Name"),
			"fieldtype": "Link",
			"options": "Customer",
			"reqd": 0
		},
			
		{
			"fieldname": "item_code",
			"label": __("Item Code"),
			"fieldtype": "Link",
			"options": "Item",
			"reqd": 0
		},
	],
	onload: function (report) {
		report.get_filter("transaction_date").$input.on("change", function () {
			report.refresh();
		});
	},
};
