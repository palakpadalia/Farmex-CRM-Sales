app_name = "farmex_crm_sales"
app_title = "Farmex CRM Sales"
app_publisher = "Palak P"
app_description = "CRM & Sales Customizations"
app_email = "palak@sanskartechnolab.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "farmex_crm_sales",
# 		"logo": "/assets/farmex_crm_sales/logo.png",
# 		"title": "Farmex CRM Sales",
# 		"route": "/farmex_crm_sales",
# 		"has_permission": "farmex_crm_sales.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/farmex_crm_sales/css/farmex_crm_sales.css"
# app_include_js = "/assets/farmex_crm_sales/js/payment_entry.js"

# include js, css files in header of web template
# web_include_css = "/assets/farmex_crm_sales/css/farmex_crm_sales.css"
# web_include_js = "/assets/farmex_crm_sales/js/farmex_crm_sales.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "farmex_crm_sales/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
    "Sales Order": "public/js/sales_order.js",
    "Delivery Trip": "public/js/delivery_trip.js",
    "Payment Entry": "public/js/payment_entry.js",
    "Sales Invoice": "public/js/sales_invoice.js",
    "Delivery Note": "public/js/delivery_note.js",
    "Item": "public/js/item.js",
    "Purchase Invoice": "public/js/purchase_invoice.js",
    "Purchase Order": "public/js/purchase_order.js",
    "Purchase Receipt": "public/js/purchase_receipt.js",
    "Stock Entry": "public/js/stock_entry.js",
    "Quotation": "public/js/quotation.js",
    "Material Request": "public/js/material_request.js",
    "Stock Reconciliation": "public/js/stock_reconciliation.js",
    "Pick List": "public/js/pick_list.js",
    "Packing Slip": "public/js/packing_slip.js",
}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}

doctype_list_js = {"Sales Order": "public/js/sales_order_list.js"}


# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "farmex_crm_sales/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "farmex_crm_sales.utils.jinja_methods",
# 	"filters": "farmex_crm_sales.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "farmex_crm_sales.install.before_install"
# after_install = "farmex_crm_sales.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "farmex_crm_sales.uninstall.before_uninstall"
# after_uninstall = "farmex_crm_sales.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "farmex_crm_sales.utils.before_app_install"
# after_app_install = "farmex_crm_sales.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "farmex_crm_sales.utils.before_app_uninstall"
# after_app_uninstall = "farmex_crm_sales.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "farmex_crm_sales.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

override_doctype_class = {
    "Item": "farmex_crm_sales.py.item.Item",
    "Pick List": "farmex_crm_sales.py.picklist.PickList",
}

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
    "Sales Order": {
        "on_submit": "farmex_crm_sales.py.sales_order.save_items_in_sales_order_item_tracking",
        "on_update_after_submit": [
            "farmex_crm_sales.py.sales_order.add_flag_of_new",
            "farmex_crm_sales.py.sales_order.save_updated_items_in_sales_order_item_tracking",
            "farmex_crm_sales.py.sales_order.update_new_items",
            "farmex_crm_sales.py.sales_order.set_the_removed_items",
        ],
        "validate": [
            "farmex_crm_sales.py.sales_team.set_sales_person",
        ],
        "before_validate": [
            "farmex_crm_sales.py.sales_team.set_sales_person",
        ],
    },
    "Sales Invoice": {
        # DONT REMOVE BELOW LINE
        # "on_submit": "farmex_crm_sales.py.sales_invoice.send_notification",
        # THAT IS FOR NOTFICATION
        "validate": [
            "farmex_crm_sales.py.sales_team.set_sales_person",
        ],
        "before_validate": [
            "farmex_crm_sales.py.sales_team.set_sales_person",
        ],
    },
    "Customer": {
        "validate": "farmex_crm_sales.py.customer.enable_customer",
        "after_insert": "farmex_crm_sales.py.customer.update_pricelist_insert",
        "before_save": "farmex_crm_sales.py.customer.before_save",
        "on_trash": "farmex_crm_sales.py.customer.on_trash",
    },
    "Delivery Note": {
        "validate": [
            "farmex_crm_sales.py.sales_team.set_sales_person",
        ],
        "before_validate": [
            "farmex_crm_sales.py.sales_team.set_sales_person",
        ],
    },
    "Sales Person": {
        "on_update": [
            "farmex_crm_sales.py.sales_person.create_user_permission_for_sales_person",
            "farmex_crm_sales.py.sales_person.set_user_permission_van_sales",
        ],
        "on_trash": [
            "farmex_crm_sales.py.sales_person.remove_warehouse_perm",
        ],
    },
    "Payment Entry": {
        "before_validate": [
            "farmex_crm_sales.py.payment_entry.set_sales_person_or_driver",
        ],
    },
    "Employee": {
        "before_save": "farmex_crm_sales.py.emp.create_branch_user_permission",
        "on_trash": "farmex_crm_sales.py.emp.remove_branch_perm",
    },
    # "Pick List": {
    #     "before_save": "farmex_crm_sales.py.picklist.before_save"
    # }
}

# Scheduled Tasks
# ---------------

scheduler_events = {
    # 	"all": [
    # 		"farmex_crm_sales.tasks.all"
    # 	],
    "daily": ["farmex_crm_sales.py.customer.disable_customers"],
    # 	"hourly": [
    # 		"farmex_crm_sales.tasks.hourly"
    # 	],
    # 	"weekly": [
    # 		"farmex_crm_sales.tasks.weekly"
    # 	],
    # 	"monthly": [
    # 		"farmex_crm_sales.tasks.monthly"
    # 	],
}

# Testing
# -------

# before_tests = "farmex_crm_sales.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
#     "erpnext.stock.doctype.item.item.get_uom_conv_factor": "farmex_crm_sales.py.item.get_uom_conv_factor"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "farmex_crm_sales.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["farmex_crm_sales.utils.before_request"]
# after_request = ["farmex_crm_sales.utils.after_request"]

# Job Events
# ----------
# before_job = ["farmex_crm_sales.utils.before_job"]
# after_job = ["farmex_crm_sales.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"farmex_crm_sales.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

fixtures = [
   
    {
        "dt": "Role Profile",
        "filters": [
            [
                "name",
                "in",
                [
                    "Van Sales",
                    "Pre Sales",
                ],
            ]
        ],
    },
    {
        "dt": "Module Profile",
        "filters": [
            [
                "name",
                "in",
                [
                    "Van Sales",
                    "Pre Sales",
                ],
            ]
        ],
    },
    {
        "dt": "Workflow",
        "filters": [
            [
                "name",
                "in",
                [
                    "Customer-Approval-Flow",
                ],
            ]
        ],
    },
]


on_session_creation = "farmex_crm_sales.py.default_route.custom_login_redirect"
