frappe.query_reports["Daily Delivery Report"] = {
    "filters": [
        {
            fieldname: "company",
            label: __("Company"),
            fieldtype: "Link",
            options: "Company",
            default: frappe.defaults.get_default("company"),
        },
        {
            fieldname: "departure_time",
            label: __("Date"),
            fieldtype: "Date",
            default: frappe.datetime.nowdate(),
            reqd: 1
        },
        {
            fieldname: "custom_sales_person",
            label: __("Sales Person"),
            fieldtype: "Link",
            options: "Sales Person",
        },
        {
            fieldname: "driver",
            label: __("Driver"),
            fieldtype: "Link",
            options: "Driver",
        },

    ],

};
