frappe.ui.form.on('Delivery Trip', {
    refresh: function (frm) {
        frm.fields_dict['delivery_stops'].grid.get_field('custom_tax_invoice').get_query = function (doc, cdt, cdn) {
            let child = locals[cdt][cdn];
            return {
                filters: {
                    customer: child.customer,
                    status: ['not in', 'Draft']
                }
            };
        };
    },

});


frappe.ui.form.on('Delivery Stop', {

    custom_tax_invoice: function (frm, cdt, cdn) {
        const child_row = locals[cdt][cdn];
        const tax_invoice = child_row.custom_tax_invoice;

        if (tax_invoice) {
            frappe.call({
                method: 'frappe.desk.form.linked_with.get',
                args: {
                    doctype: 'Sales Invoice',
                    docname: tax_invoice
                },
                callback: function (response) {
                    if (response && response.message) {
                        const delivery_note = response.message['Delivery Note'];
                        if (delivery_note && delivery_note.length > 0) {

                            const delivery_note = delivery_note[0];

                            frappe.model.set_value(cdt, cdn, 'delivery_note', delivery_note.name);
                            frappe.model.set_value(cdt, cdn, 'grand_total', delivery_note.grand_total);
                        }
                    }
                },

            });
        }
    }

});
