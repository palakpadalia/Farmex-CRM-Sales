let uom_lists = {};

frappe.ui.form.on('Sales Invoice', {
    refresh(frm) {
        frm.add_custom_button(__('View Account Receivable'), function () {
            const url = `/app/query-report/Account%20Receivable%20Report?company=${frm.doc.company}&customer=${frm.doc.customer}`;
            window.open(url, "_blank");
        });

        frm.set_df_property('custom_sales_person', 'reqd', frm.is_new() ? 0 : 1);

        // Add bulk item button
        if (frm.doc.docstatus < 1) {
            frm.add_custom_button(__('Add Items'), function () {
                show_grouped_item_dialog(frm);
            });
        }
    },

    onload(frm) {
        if (frm.doc.docstatus === 0) {
            // Fetch UOM lists for existing items
            frm.doc.items.forEach(row => row.item_code && fetch_uom_list(frm, row));

            // Fetch available stock items and set filters
            if (frm.doc.is_return === 0) {
                fetch_available_stock_items(frm);
            }
        }

        // Set the get_query function for 'uom' field dynamically
        frm.fields_dict.items.grid.get_field('uom').get_query = function (doc, cdt, cdn) {
            return { filters: { 'name': ['in', uom_lists[cdn] || []] } };
        };
    },

    customer(frm) {
        if (frm.doc.is_return === 0) {
            fetch_available_stock_items(frm);
        }
        frm.refresh_field('items');
    },

    is_return(frm) {
        if (frm.doc.is_return === 0) {
            fetch_available_stock_items(frm);
        }
    }
});

frappe.ui.form.on('Sales Invoice Item', {
    item_code(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        // Fetch item details and set UOM
        frappe.db.get_doc('Item', row.item_code).then(docs => {
            frappe.model.set_value(cdt, cdn, 'uom', docs.sales_uom || docs.stock_uom);
            update_uom_list(frm, row, docs.uoms);
        });
    },
});

// Fetch and update UOM list
function fetch_uom_list(frm, row) {
    frappe.db.get_doc('Item', row.item_code).then(docs => {
        update_uom_list(frm, row, docs.uoms);
    });
}

function update_uom_list(frm, row, uoms) {
    uom_lists[row.name] = uoms.map(u => u.uom);
    frm.fields_dict.items.grid.get_field('uom').refresh();
}

// Fetch available stock items and apply filters dynamically
function fetch_available_stock_items(frm) {
    frappe.call({
        method: "farmex_crm_sales.py.item.get_available_stock_items",
        args: { user: frappe.session.user },
        callback(response) {
            let item_codes = response.message || [];

            frm.fields_dict.items.grid.get_field('item_code').get_query = function (doc, cdt, cdn) {
                if (frm.doc.is_return) {
                    // When it's a return, allow all items
                    return { filters: { 'is_sales_item': 1, 'has_variants': 0 } };
                } else {
                    // Otherwise, restrict to available stock
                    return { filters: { 'name': ['in', item_codes], 'is_sales_item': 1, 'has_variants': 0 } };
                }
            };

            frm.fields_dict.items.grid.get_field('item_code').refresh();
        }
    });
}


// Bulk Item Addition Dialog
function show_grouped_item_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: 'Add Grouped Items',
        fields: [
            {
                fieldname: 'item_group', label: 'Item Group', fieldtype: 'Link', options: 'Item Group', reqd: 1, onchange() {
                    fetch_and_populate_items(dialog, dialog.get_value('item_group'));
                }
            },
            {
                fieldname: 'items', label: 'Items', fieldtype: 'Table', fields: [
                    { fieldname: 'item_code', label: 'Item Code', fieldtype: 'Link', options: 'Item', in_list_view: 1 },
                    { fieldname: 'item_name', label: 'Item Name', fieldtype: 'Data', in_list_view: 1 },
                    { fieldname: 'qty', label: 'Qty', fieldtype: 'Float', in_list_view: 1, default: 1 }
                ], data: [],
                cannot_add_rows: true,
                get_data: () => dialog.fields_dict.items.df.data
            }
        ],
        primary_action_label: 'Add to Sales Order',
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

// Fetch and populate items based on item group
function fetch_and_populate_items(dialog, item_group) {
    dialog.fields_dict.items.df.data = [];
    dialog.fields_dict.items.grid.refresh();

    frappe.call({
        method: 'frappe.client.get_list',
        args: { doctype: 'Item', fields: ['item_code', 'item_name'], filters: { item_group } },
        callback(r) {
            if (r.message) {
                dialog.fields_dict.items.df.data = r.message.map(item => ({
                    item_code: item.item_code,
                    item_name: item.item_name,
                    qty: 1
                }));
                dialog.fields_dict.items.grid.refresh();
            } else {
                frappe.msgprint(__('No items found for the selected group.'));
            }
        }
    });
}

// Remove blank rows from child table
function remove_blank_rows(frm) {
    frm.doc.items = frm.doc.items.filter(row => row.item_code);
    frm.refresh_field('items');
}
