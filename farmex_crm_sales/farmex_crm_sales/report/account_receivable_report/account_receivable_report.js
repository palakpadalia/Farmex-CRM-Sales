// Copyright (c) 2024, Palak P and contributors
// For license information, please see license.txt

frappe.provide("erpnext.utils");

frappe.query_reports["Account Receivable Report"] = {
	filters: [
		{
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			options: "Company",
			reqd: 1,
			default: frappe.defaults.get_user_default("Company"),
		},
		{
			fieldname: "customer",
			label: __("Party"),
			fieldtype: "Link",
			options: "Customer",
		},
		{
			fieldname: "report_date",
			label: __("Posting Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
			read_only: 1,
		},
	],


}; u