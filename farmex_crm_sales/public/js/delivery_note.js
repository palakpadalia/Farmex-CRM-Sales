let uom_lists = {};

frappe.ui.form.on('Delivery Note', {
    refresh: function (frm) {
        frm.set_df_property('custom_sales_person', 'reqd', !frm.is_new());

        if (frm.doc.docstatus < 1) {
            frm.add_custom_button(__('Add Items'), function () {
                show_grouped_item_dialog(frm);
            });
        }
    },

    onload: function (frm) {
        if (frm.doc.docstatus === 0) {
            frm.doc.items.forEach(row => {
                if (row.item_code) {
                    fetch_uom_list(frm, row);
                }
            });
            
            // fetch_available_stock_items(frm);
        }

        frm.fields_dict.items.grid.get_field('uom').get_query = function (doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            return { filters: { 'name': ['in', uom_lists[row.name] || []] } };
        };
    },

    customer(frm) {
        // fetch_available_stock_items(frm);
        frm.refresh_field('items');
    },
});

frappe.ui.form.on('Delivery Note Item', {
    item_code: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        frappe.db.get_doc('Item', row.item_code).then(doc => {
            frappe.model.set_value(cdt, cdn, 'uom', doc.sales_uom || doc.stock_uom);
            update_uom_list(frm, row, doc.uoms);
        });
    },
});

function fetch_available_stock_items(frm) {
    frappe.call({
        method: "farmex_crm_sales.py.item.get_available_stock_items",
        args: { user: frappe.session.user },
        callback: function (response) {
            if (response.message) {
                let item_code_lists = response.message;
                frm.fields_dict.items.grid.get_field('item_code').get_query = function () {
                    return {
                        filters: {
                            'name': ['in', item_code_lists],
                            'is_sales_item': 1,
                            'has_variants': 0
                        }
                    };
                };
            }
        }
    });
}

function fetch_uom_list(frm, row) {
    frappe.db.get_doc('Item', row.item_code).then(doc => {
        update_uom_list(frm, row, doc.uoms);
    });
}

function update_uom_list(frm, row, uoms) {
    uom_lists[row.name] = uoms.map(u => u.uom);
    frm.fields_dict.items.grid.get_field('uom').refresh();
}

function show_grouped_item_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: 'Add Grouped Items',
        fields: [
            {
                fieldname: 'item_group', label: 'Item Group', fieldtype: 'Link', options: 'Item Group', reqd: 1,
                onchange() { fetch_and_populate_items(dialog, dialog.get_value('item_group')); }
            },
            {
                fieldname: 'items', label: 'Items', fieldtype: 'Table', cannot_add_rows: true,
                fields: [
                    { fieldname: 'item_code', label: 'Item Code', fieldtype: 'Link', options: 'Item', in_list_view: 1 },
                    { fieldname: 'item_name', label: 'Item Name', fieldtype: 'Data', in_list_view: 1 },
                    { fieldname: 'qty', label: 'Qty', fieldtype: 'Float', in_list_view: 1, default: 1 }
                ],
                data: [], get_data: () => dialog.fields_dict.items.df.data
            }
        ],
        primary_action_label: 'Add Items',
        primary_action() {
            let selected_items = dialog.fields_dict.items.df.data.filter(item => dialog.fields_dict.items.grid.get_selected().includes(item.name));
            remove_blank_rows(frm);

            if (selected_items.length > 0) {
                selected_items.forEach(item => {
                    if (item.item_code && item.qty > 0) {
                        let existing_item = frm.doc.items.find(row => row.item_code === item.item_code);
                        if (existing_item) {
                            existing_item.qty += item.qty;
                        } else {
                            let child_row = frm.add_child('items');
                            frappe.model.set_value(child_row.doctype, child_row.name, 'item_code', item.item_code);
                            frappe.model.set_value(child_row.doctype, child_row.name, 'item_name', item.item_name);
                            frappe.model.set_value(child_row.doctype, child_row.name, 'qty', item.qty);
                        }
                    }
                });
                frm.refresh_field('items');
                dialog.hide();
            } else {
                frappe.msgprint(__('Please select items to add.'));
            }
        }
    });
    dialog.show();
}

function fetch_and_populate_items(dialog, item_group) {
    dialog.fields_dict.items.df.data = [];
    dialog.fields_dict.items.grid.refresh();

    frappe.call({
        method: 'frappe.client.get_list',
        args: { doctype: 'Item', fields: ['item_code', 'item_name'], filters: { item_group } },
        callback(r) {
            dialog.fields_dict.items.df.data = r.message.map(item => ({
                item_code: item.item_code,
                item_name: item.item_name,
                qty: 1
            }));
            dialog.fields_dict.items.grid.refresh();
        }
    });
}

function remove_blank_rows(frm) {
    frm.doc.items = frm.doc.items.filter(row => row.item_code);
    frm.refresh_field('items');
}
