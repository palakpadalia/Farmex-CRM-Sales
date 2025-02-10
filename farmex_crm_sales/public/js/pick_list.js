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