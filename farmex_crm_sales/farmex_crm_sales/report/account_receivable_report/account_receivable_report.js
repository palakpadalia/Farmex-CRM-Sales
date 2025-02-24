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
            fieldname: "from_date",
            label: __("From Posting Date"),
            fieldtype: "Date",
            default: frappe.datetime.add_days(frappe.datetime.get_today(), -30), // Default to last 30 days
        },
        {
            fieldname: "to_date",
            label: __("To Posting Date"),
            fieldtype: "Date",
            default: frappe.datetime.get_today(),
        },
    ],
};
