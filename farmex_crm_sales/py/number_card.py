
import frappe

@frappe.whitelist()
def set_number_card_van_sales_grand_total():
    user = frappe.session.user
    totals = frappe.db.get_all(
        doctype="Sales Invoice",
        fields=["grand_total", "owner", "currency"],
        filters={"owner": user},
    )
    currency = ""
    if totals:
        currency = totals[0].currency
        currency_symbol = frappe.get_value("Currency", currency, "symbol")
    else:
        currency_symbol = "د.إ"  # Default to AED symbol if no results are found

    grand_total = 0
    for total in totals:
        grand_total += total.grand_total

    total_with_currency = f"{grand_total} {currency_symbol}"

    return total_with_currency


@frappe.whitelist()
def set_number_card_van_sales_total_outstanding_amount():
    user = frappe.session.user

    # Get all outstanding amounts for the user
    totals = frappe.db.get_all(
        doctype="Sales Invoice",
        fields=["outstanding_amount", "owner", "currency"],
        filters={"owner": user},
    )

    # Calculate the total outstanding amount
    total_outstanding_amount = 0
    for total in totals:
        total_outstanding_amount += total.outstanding_amount

    # Get the currency symbol
    if totals:
        currency = totals[0].currency
        # Fetch the currency symbol from the Currency doctype
        currency_symbol = frappe.get_value("Currency", currency, "symbol")
    else:
        currency_symbol = "د.إ"  # Default to AED symbol if no results are found

    # Format the result with the currency symbol
    total_with_currency = f"{total_outstanding_amount} {currency_symbol}"

    return total_with_currency
