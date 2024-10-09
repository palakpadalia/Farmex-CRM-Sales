frappe.ui.form.on('Sales Order', {
    customer: function (frm) {
        frappe.call({
            method: "farmex_crm_sales.py.party.new_get_dashboard_info",
            args: {
                party: frm.doc.customer,
                party_type: "Customer",
            },
            callback: function (response) {
                if (response.message && response.message[0]) {
                    let total_unpaid = response.message[0].total_unpaid;
                    console.log(total_unpaid);

                    frm.set_value('custom_total_unpaid_amount', total_unpaid);
                    frm.refresh_field('custom_total_unpaid_amount');
                }
            }
        });

        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Customer",
                name: frm.doc.customer
            },
            callback: function (response) {
                console.log(response);
                if (response.message) {
                    let customer = response.message;
                    let credit_limit = 0;

                    customer.credit_limits.forEach(row => {
                        if (row.company === frm.doc.company) {
                            credit_limit = row.credit_limit;
                        }
                    });

                    console.log(credit_limit);
                    frm.set_value('custom_total_credit_limit', credit_limit);
                    frm.refresh_field('custom_total_credit_limit');
                }
            }
        });

    }
});
