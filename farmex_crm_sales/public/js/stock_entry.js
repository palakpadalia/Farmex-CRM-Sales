let uom_lists = {};

frappe.ui.form.on('Stock Entry', {
    refresh(frm) {
        // Add bulk item button for adding in item table
        if (frm.doc.docstatus < 1) {
            frm.add_custom_button(__('Add Items'), () => show_grouped_item_dialog(frm));
        }
    },
    onload(frm) {
        if (frm.doc.docstatus === 0) {
            frm.doc.items.forEach(row => {
                if (row.item_code) fetch_uom_list(frm, row);
            });
        }
        
        // Set query for UOM field in items table
        frm.fields_dict.items.grid.get_field('uom').get_query = (doc, cdt, cdn) => {
            let row = locals[cdt][cdn];
            return { filters: { 'name': ['in', uom_lists[cdn] || []] } };
        };
    }
});

frappe.ui.form.on('Stock Entry Detail', {
    item_code(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        frappe.db.get_value('Item', row.item_code, 'custom_default_stock_unit_of_measure')
            .then(response => {
                if (response.message.custom_default_stock_unit_of_measure) {
                    frappe.model.set_value(cdt, cdn, 'uom', response.message.custom_default_stock_unit_of_measure);
                }
            });
        
        fetch_uom_list(frm, row);
    }
});

function fetch_uom_list(frm, row) {
    frappe.db.get_doc('Item', row.item_code).then(doc => {
        uom_lists[row.name] = (doc.uoms || []).map(uom => uom.uom);
        frappe.model.set_value(row.doctype, row.name, 'uom', doc.custom_default_stock_unit_of_measure);
        frm.fields_dict.items.grid.get_field('uom').refresh();
    });
}

function show_grouped_item_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: 'Add Grouped Items',
        fields: [
            {
                fieldname: 'item_group',
                label: 'Item Group',
                fieldtype: 'Link',
                options: 'Item Group',
                reqd: 1,
                onchange() {
                    let selected_group = dialog.get_value('item_group');
                    if (selected_group) fetch_and_populate_items(dialog, selected_group);
                }
            },
            {
                fieldname: 'items',
                label: 'Items',
                fieldtype: 'Table',
                fields: [
                    { fieldname: 'item_code', label: 'Item Code', fieldtype: 'Link', options: 'Item', in_list_view: 1 },
                    { fieldname: 'item_name', label: 'Item Name', fieldtype: 'Data', in_list_view: 1 },
                    { fieldname: 'qty', label: 'Qty', fieldtype: 'Float', in_list_view: 1, default: 1 }
                ],
                data: [],
                cannot_add_rows : true,
                get_data: () => dialog.fields_dict.items.df.data
            }
        ],
        primary_action_label: 'Add Items',
        primary_action() {
            let selected_items = dialog.fields_dict.items.df.data.filter(item => dialog.fields_dict.items.grid.get_selected().includes(item.name));
            
            if (selected_items.length) {
                selected_items.forEach(item => add_or_update_item(frm, item));
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
    frappe.call({
        method: 'frappe.client.get_list',
        args: { doctype: 'Item', fields: ['item_code', 'item_name'], filters: { item_group } },
        callback(r) {
            dialog.fields_dict.items.df.data = (r.message || []).map(item => ({
                item_code: item.item_code, item_name: item.item_name, qty: 1
            }));
            dialog.fields_dict.items.grid.refresh();
        }
    });
}

function add_or_update_item(frm, item) {
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
