// Copyright (c) 2024, Palak P and contributors
// For license information, please see license.txt

frappe.query_reports["Payment Collection"] = {
	"filters": [
		{
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			options: "Company",
			default: frappe.defaults.get_default("company"),
		},
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.add_days(frappe.datetime.nowdate(), -31),
			reqd: 1
		},

		{
			fieldname: "to_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.nowdate(),
			reqd: 1
		},
	]
};
