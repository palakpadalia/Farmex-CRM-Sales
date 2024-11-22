frappe.ui.form.on('Delivery Trip', {
    refresh: function (frm) {
        frm.fields_dict['delivery_stops'].grid.get_field('custom_tax_invoice').get_query = function (doc, cdt, cdn) {
            let child = locals[cdt][cdn];
            return {
                filters: {
                    customer: child.customer,
                    // status: ['not in', 'Draft', 'Paid','Return','Credit Note Issued','Cancelled']
                }
            };
        };

        frm.fields_dict['delivery_stops'].grid.get_field('customer').get_query = function (doc, cdt, cdn) {
            let child = locals[cdt][cdn];
            return {
                filters: {
                    territory: doc.custom_territory,
                }
            };
        };

        if (!frm.is_new()) {
            frm.set_df_property('custom_sales_person', 'reqd', 1);
        } else {
            frm.set_df_property('custom_sales_person', 'reqd', 0);
        }
    },

    before_save: function (frm) {
        totalNetWeight(frm);
    }

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
                        const delivery_note_list = response.message['Delivery Note'];

                        if (delivery_note_list && delivery_note_list.length > 0) {
                            const delivery_note_names = delivery_note_list.map(dn => dn.name);

                            frappe.call({
                                method: 'frappe.client.get_list',
                                args: {
                                    doctype: 'Delivery Note',
                                    filters: [
                                        ['name', 'in', delivery_note_names],
                                        ['status', '!=', 'Cancelled']
                                    ],
                                    fields: [
                                        'name', 'grand_total', 'total_net_weight',
                                        'customer',
                                    ]
                                },
                                callback: function (res) {

                                    if (res && res.message && res.message.length > 0) {

                                        if (frm.fields_dict.delivery_stops) {

                                            frm.clear_table('delivery_stops');

                                            res.message.forEach(function (delivery_note) {

                                                const new_row = frm.add_child('delivery_stops', {
                                                    delivery_note: delivery_note.name,
                                                    grand_total: delivery_note.grand_total,
                                                    custom_total_weight: delivery_note.total_net_weight,
                                                    customer: delivery_note.customer,

                                                    custom_tax_invoice: tax_invoice
                                                });
                                            });

                                            frm.refresh_field('delivery_stops');

                                            totalNetWeight(frm);
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            });
        }
    },

    custom_tax_invoice_remove: function (frm, cdt, cdn) {
        totalNetWeight(frm);
    },
});


function totalNetWeight(frm) {
    let totalNetWeightInKg = 0;

    frm.doc.delivery_stops.forEach(function (item) {

        if (item.custom_total_weight) {
            totalNetWeightInKg += item.custom_total_weight;
        }
    });

    const totalNetWeightInTonne = totalNetWeightInKg / 1000;

    frm.set_value('custom_total_net_weight', totalNetWeightInTonne);
}
