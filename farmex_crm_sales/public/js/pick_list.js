let uom_lists = {};
frappe.ui.form.on('Pick List', {
    onload: function(frm) {        
        if (frm.doc.docstatus == 0) {
            // Loop through existing locations and regenerate UOM filters
            frm.doc.locations.forEach(row => {
                if (row.item_code) {
                    fetch_uom_list(frm, row);
                }
            });
        }
        // Set the get_query function for the 'uom' field on form load
        frm.fields_dict.locations.grid.get_field('uom').get_query = function(doc, cdt, cdn) {
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

    validate: async function(frm) {
        await update_total_net_weight(frm);
    },
});

frappe.ui.form.on('Pick List Item', {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        frappe.db.get_value('Item', row.item_code, 'custom_default_stock_unit_of_measure')
        .then(response => {
            let stock_unit_of_measure = response.message.custom_default_stock_unit_of_measure;
            if (stock_unit_of_measure) frappe.model.set_value(cdt, cdn, 'uom', stock_unit_of_measure);
        });    
        // fetch_uom_list(frm, row);
        frappe.db.get_doc('Item', row.item_code)
        .then(docs => {
            let uom_list = [];
            docs.uoms.forEach(uom => {
                uom_list.push(uom.uom);
            });
            uom_lists[cdn] = uom_list;
            frappe.model.set_value(cdt, cdn, 'uom', docs.custom_default_stock_unit_of_measure);
            // Trigger a refresh of the 'uom' field to apply the updated get_query function
            frm.fields_dict.locations.grid.get_field('uom').refresh();
        });
        update_total_net_weight(frm);
    },
    stock_qty: function(frm, cdt, cdn) {
        update_total_net_weight(frm);
    },
    locations_remove: function(frm) { // Triggered when a row is deleted
        update_total_net_weight(frm);
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
        frm.fields_dict.locations.grid.get_field('uom').refresh();
    });
}


// Function to update total net weight
async function update_total_net_weight(frm) {
    let total_net_weight = 0;

    for (let row of frm.doc.locations || []) {
        if (!row.item_code) continue; // Skip if no item_code

        let response = await frappe.db.get_value('Item', row.item_code, 'weight_per_unit');
        let weight_per_unit = response.message.weight_per_unit || 0;
        let weight_per_row = weight_per_unit * row.stock_qty;
        total_net_weight += weight_per_row;
    }

    await frappe.model.set_value(frm.doctype, frm.docname, 'custom_total_net_weight', total_net_weight);

    // Prevent saving if total weight is 0
    if (total_net_weight === 0 && frm.doc.docstatus === 0) {
        frappe.msgprint(__('Total Net Weight cannot be 0.'));
        frappe.validated = false;
    }
}