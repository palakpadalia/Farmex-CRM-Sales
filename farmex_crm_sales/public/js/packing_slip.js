frappe.ui.form.on('Packing Slip', {
    onload: function(frm) {
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
frappe.ui.form.on('Packing Slip Item', {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        frappe.db.get_doc('Item', row.item_code)
            .then(docs => {
                let uom_list = [];
                docs.uoms.forEach(uom => {
                    uom_list.push(uom.uom);
                });
                uom_lists[cdn] = uom_list;
                // Trigger a refresh of the 'uom' field to apply the updated get_query function
                frm.fields_dict.items.grid.get_field('uom').refresh();
            });
    },
});