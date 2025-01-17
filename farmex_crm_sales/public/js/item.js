frappe.ui.form.on("UOM Conversion Detail", {
    uom: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (row.uom) {
            frappe.call({
                method: "erpnext.stock.doctype.item.item.get_uom_conv_factor",
                args: {
                    uom: row.uom,
                    stock_uom: frm.doc.stock_uom,
                    item_code: frm.doc.item_code,
                },
                callback: function (r) {
                    if (!r.exc && r.message) {
                        frappe.model.set_value(cdt, cdn, "conversion_factor", r.message);
                    }
                },
            });
        }
    },
    custom_selling: function (frm, cdt, cdn) {
        handle_single_selection(frm, cdt, cdn, 'custom_selling', 'uoms');
    },
    custom_buying: function (frm, cdt, cdn) {
        handle_single_selection(frm, cdt, cdn, 'custom_buying', 'uoms');
    }
});
    
// Reusable function to handle single selection logic
function handle_single_selection(frm, cdt, cdn, field_name, table_name) {
    const row = locals[cdt][cdn];
    // If the current row's field is checked, uncheck all other rows
    if (row[field_name]) {
        (frm.doc[table_name] || []).forEach(function (child_row) {
            if (child_row.name !== row.name) {
                child_row[field_name] = 0; // Uncheck other rows
            }
        });
    }
    // Refresh the child table to reflect changes
    frm.refresh_field(table_name);
}