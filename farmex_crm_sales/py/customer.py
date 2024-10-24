import frappe
from frappe.utils import today, date_diff


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
