frappe.ui.form.on('Material Request', {
	refresh(frm) {
		 // Add bulk item button for adding in item table
         if (frm.doc.docstatus < 1) {
            frm.add_custom_button(__('Add Items'), function () {
                show_grouped_item_dialog(frm);
            });
        }
	},
    onload: function(frm) {        
        if (frm.doc.docstatus == 0) {
            // Loop through existing items and regenerate UOM filters
            frm.doc.items.forEach(row => {
                if (row.item_code) {
                    fetch_uom_list(frm, row);
                }
            });
        }
        // Set the get_query function for the 'uom' field on form load
        frm.fields_dict.items.grid.get_field('uom').get_query = function(doc, cdt, cdn) {
            // Get the current row
            let row = locals[cdt][cdn];

            // Check if the row has uom_list data
            if (uom_lists[cdn]) {
                return { filters: { 'name': ['in', uom_lists[cdn]] } };
            } else {
                // If uom_list data is not available, show all UOMs
                return { filters: { 'name': ['!=', ''] } };
            }
        };
    },
});

let uom_lists = {};
frappe.ui.form.on('Material Request Item', {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        fetch_uom_list(frm, row);
    },
});


// Function to fetch UOM list
function fetch_uom_list(frm, row) {
    frappe.db.get_doc('Item', row.item_code).then(docs => {
        let uom_list = [];
        docs.uoms.forEach(uom => {
            uom_list.push(uom.uom);
        });
        uom_lists[row.name] = uom_list;
        // Refresh the UOM field
        frm.fields_dict.items.grid.get_field('uom').refresh();
    });
}

      
 
// add bulk item add in child table
function show_grouped_item_dialog(frm) {
    // dialog for select group wise item
    let dialog = new frappe.ui.Dialog({
        title: 'Add Grouped Items',
        fields: [
            {
                fieldname: 'item_group',
                label: 'Item Group',
                fieldtype: 'Link',
                options: 'Item Group',
                reqd: 1,
                onchange: function () {
                    const selected_group = dialog.get_value('item_group');
                    if (selected_group) {
                        fetch_and_populate_items(dialog, selected_group);
                    }
                    cur_dialog.refresh();
                }
            },
            {
                fieldname: 'items',
                label: 'Items',
                fieldtype: 'Table',
                fields: [
                    {
                        fieldname: 'item_code',
                        label: 'Item Code',
                        fieldtype: 'Link',
                        options: 'Item',
                        in_list_view: 1
                    },
                    {
                        fieldname: 'item_name',
                        label: 'Item Name',
                        fieldtype: 'Data',
                        in_list_view: 1
                    },
                    {
                        fieldname: 'qty',
                        label: 'Qty',
                        fieldtype: 'Float',
                        in_list_view: 1,
                        default: 1 
                    }
                ],
                data: [],
                get_data: () => dialog.fields_dict.items.df.data
            }
        ],
        primary_action_label: 'Add Items',
        primary_action: function () {
            let selected_items = cur_dialog.fields_dict.items.df.data.filter(item => cur_dialog.fields_dict.items.grid.get_selected().includes(item.name));
            remove_blank_rows(frm); // Remove blank rows from sales order item table

            if (selected_items.length > 0) {
                selected_items.forEach(item => {
                    if (item.item_code && item.qty > 0) {
                        // check item already exists in sales order item table or not
                        let existing_item = frm.doc.items.find(row => row.item_code === item.item_code);

                        if (existing_item) {
                            // if item already exists then quantity add in existing item
                            existing_item.qty += item.qty;
                            frm.dirty();
                        } else {
                            // add rows from selected item 
                            let child_row = frm.add_child('items');
                            frappe.model.set_value(child_row.doctype, child_row.name, 'item_code', item.item_code);
                            frappe.model.set_value(child_row.doctype, child_row.name, 'item_name', item.item_name);
                            frappe.model.set_value(child_row.doctype, child_row.name, 'qty', item.qty);
                        }
                    }
                });
                frm.refresh_field('items'); // refresh child table field
                dialog.hide();
            } else {
                frappe.msgprint(__('Please select items to add.'));
            }
        }
    });

    dialog.show();
}

function fetch_and_populate_items(dialog, item_group) {
    // clear existing table data when chamge item group
    dialog.fields_dict.items.df.data = [];
    dialog.fields_dict.items.grid.refresh();

    // fetch item base on the item group selection
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Item',
            fields: ['item_code', 'item_name'],
            filters: { item_group: item_group }
        },
        callback: function (r) {
            if (r.message) {
                // add items in dialogue child table
                const items_data = r.message.map(item => ({
                    item_code: item.item_code,
                    item_name: item.item_name,
                    qty: 1 // Default quantity
                }));
                dialog.fields_dict.items.df.data = items_data;
                dialog.fields_dict.items.grid.refresh();
            } else {
                frappe.msgprint(__('No items found for the selected group.'));
                dialog.fields_dict.items.df.data = [];
                dialog.fields_dict.items.grid.refresh();
            }
        }
    });
}

// Remove blank rows
function remove_blank_rows(frm) {
    
    frm.doc.items.forEach((row, index) => {
        if (!row.item_group && !row.item_code) {
            frm.doc.items.splice(index, 1);
        }
    });
    frm.refresh_field('items');
}
