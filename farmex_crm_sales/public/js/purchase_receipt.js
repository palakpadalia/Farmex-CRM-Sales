frappe.ui.form.on('Purchase Receipt', {
    onload: function(frm) {
        // if (frm.doc.docstatus == 0) {
        //     // Loop through existing items and regenerate UOM filters
        //     frm.doc.items.forEach(row => {
        //         if (row.item_code) {
        //             fetch_uom_list(frm, row);
        //         }
        //     });
        // }
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
frappe.ui.form.on('Purchase Receipt Item', {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        // fetch_uom_list(frm, row);
        // frappe.db.get_doc('Item', row.item_code).then(docs => {
        //     frappe.model.set_value(row.doctype, row.name, 'uom', docs.purchase_uom || docs.stock_uom);
        // });
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