frappe.ui.form.on('Payment Entry', {

    party: function (frm) {
        frm.clear_table('custom_invoices');
        frm.trigger("custom_invoices_filter");
    },

    refresh: function (frm) {
        frm.trigger("custom_invoices_filter");
    },

    validate: function (frm) {
        if (frm.doc.mode_of_payment == "Received PDC") {
            grandTotal(frm);
        }
    },

    custom_invoices_filter(frm) {
        const party = frm.doc.party;
        const company = frm.doc.company;
        frm.fields_dict['custom_invoices'].grid.get_field('tax_invoice').get_query = function (frm, cdt, cdn) {
            return {
                filters: {
                    customer: party,
                    status: ["in", ["Overdue", "Partly Paid", "Unpaid", "Partly Paid and Discounted", "Unpaid and Discounted"]],
                    company: company,
                }
            };
        };
        frm.refresh_field('custom_invoices')
    }
});


frappe.ui.form.on('PDC Payment Reference', {
    tax_invoice: function (frm) {
        grandTotal(frm)
    },

    custom_invoices_remove: function (frm, cdt, cdn) {
        grandTotal(frm);
    },
});


function grandTotal(frm) {
    let totalAmount = 0;
    frm.doc.custom_invoices.forEach(function (item) {
        totalAmount += item.grand_total;
    });
    frm.set_value('paid_amount', totalAmount);
}


