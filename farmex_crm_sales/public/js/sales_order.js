frappe.ui.form.on('Sales Order Cancelled Item', {
    remarks: function (frm, cdt, cdn) {
        const child = locals[cdt][cdn];
        frappe.call({
            method: "farmex_crm_sales.py.sales_order.send_notification",
            args: { doc: frm.doc.name }
        });
    }
});

let uom_lists = {};

frappe.ui.form.on('Sales Order', {
    onload: function (frm) {
        if (frm.is_new()) {
            let delivery_date = get_next_business_day(2);
            frm.set_value('delivery_date', delivery_date);
        }

        if (frm.doc.docstatus === 0) {
            frm.doc.items.forEach(row => row.item_code && fetch_uom_list(frm, row));
            fetch_available_stock_items(frm);
        }

        // Set UOM filter dynamically
        frm.fields_dict.items.grid.get_field('uom').get_query = function (doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            return { filters: { 'name': ['in', uom_lists[cdn] || []] } };
        };
    },

    customer: function (frm) {
        get_outstanding_amount(frm);
        fetch_available_stock_items(frm);
    },

    refresh: function (frm) {
        apply_item_filters(frm);
        add_custom_buttons(frm);

        frm.set_df_property('custom_sales_person', 'reqd', !frm.is_new());

        if (frm.doc.docstatus === 1 && flt(frm.doc.per_delivered) < 100) {
            add_delivery_note_button(frm);
        }
    },

    make_delivery_note: function (frm) {
        frappe.model.open_mapped_doc({
            method: "erpnext.selling.doctype.sales_order.sales_order.make_delivery_note",
            frm: frm
        });
    }
});

function get_next_business_day(daysToAdd) {
    let date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
}

function fetch_available_stock_items(frm) {
    frappe.call({
        method: "farmex_crm_sales.py.item.get_available_stock_items",
        args: { user: frappe.session.user },
        callback: function (response) {
            if (response.message) {
                let item_code_lists = response.message;
                frm.fields_dict.items.grid.get_field('item_code').get_query = () => ({
                    filters: {
                        'name': ['in', item_code_lists],
                        'is_sales_item': 1,
                        'has_variants': 0
                    }
                });
            }
        }
    });
    frm.fields_dict.items.grid.get_field('item_code').refresh();
}

function get_outstanding_amount(frm) {
    frappe.call({
        method: "farmex_crm_sales.py.party.new_get_dashboard_info",
        args: { party: frm.doc.customer, party_type: "Customer" },
        callback: function (response) {
            if (response.message && response.message[0]) {
                frm.set_value('custom_total_unpaid_amount', response.message[0].total_unpaid);
                frm.refresh_field('custom_total_unpaid_amount');
            }
        }
    });

    frappe.call({
        method: "frappe.client.get",
        args: { doctype: "Customer", name: frm.doc.customer },
        callback: function (response) {
            if (response.message) {
                let credit_limit = response.message.credit_limits.find(row => row.company === frm.doc.company)?.credit_limit || 0;
                frm.set_value('custom_total_credit_limit', credit_limit);
                frm.refresh_field('custom_total_credit_limit');
            }
        }
    });
}

function apply_item_filters(frm) {
    frm.fields_dict['items'].grid.get_field('item_code').get_query = function (doc, cdt, cdn) {
        let row = locals[cdt][cdn];
        return row && row.item_group ? { filters: { item_group: row.item_group } } : {};
    };
}

function add_custom_buttons(frm) {
    if (frm.doc.docstatus < 1) {
        frm.add_custom_button(__('Add Items'), () => show_grouped_item_dialog(frm));
    }

    frm.add_custom_button(__('View Account Receivable'), function () {
        let url = `/app/query-report/Account%20Receivable%20Report?company=${frm.doc.company}&customer=${frm.doc.customer}`;
        window.open(url, "_blank");
    });
}

function add_delivery_note_button(frm) {
    frm.add_custom_button(__("Delivery Note"), function () {
        frappe.call({
            method: "frappe.desk.form.linked_with.get",
            args: { doctype: "Sales Order", docname: frm.doc.name },
            callback: function (response) {
                let delivery_notes = response.message?.["Delivery Note"]?.map(dn => dn.name).join(", ");
                if (delivery_notes) {
                    frappe.confirm(
                        `The following Delivery Notes are already linked: <br><b>${delivery_notes}</b><br><br> Proceed?`,
                        () => frm.events.make_delivery_note(frm)
                    );
                } else {
                    frm.events.make_delivery_note(frm);
                }
            }
        });
    }, __("Create"));
}

// Add bulk item functionality
function show_grouped_item_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: 'Add Grouped Items',
        fields: [
            {
                fieldname: 'item_group', label: 'Item Group', fieldtype: 'Link', options: 'Item Group', reqd: 1, onchange: function () {
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
            }
        ],
        primary_action_label: 'Add Items',
        primary_action: function () {
            let selected_items = dialog.fields_dict.items.df.data;
            remove_blank_rows(frm);
            selected_items.forEach(item => {
                let existing_item = frm.doc.items.find(row => row.item_code === item.item_code);
                if (existing_item) {
                    existing_item.qty += item.qty;
                } else {
                    let child_row = frm.add_child('items');
                    frappe.model.set_value(child_row.doctype, child_row.name, 'item_code', item.item_code);
                    frappe.model.set_value(child_row.doctype, child_row.name, 'item_name', item.item_name);
                    frappe.model.set_value(child_row.doctype, child_row.name, 'qty', item.qty);
                }
            });
            frm.refresh_field('items');
            dialog.hide();
        }
    });
    dialog.show();
}

function fetch_and_populate_items(dialog, item_group) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: { doctype: 'Item', fields: ['item_code', 'item_name'], filters: { item_group } },
        callback: function (response) {
            dialog.fields_dict.items.df.data = response.message || [];
            dialog.fields_dict.items.grid.refresh();
        }
    });
}

function remove_blank_rows(frm) {
    frm.doc.items = frm.doc.items.filter(row => row.item_code);
    frm.refresh_field('items');
}

frappe.ui.form.on('Sales Order Item', {
    item_code: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        fetch_uom_list(frm, row);

        // Apply the filter dynamically for the current row
        frm.fields_dict.items.grid.get_field('uom').get_query = function (doc, cdt, cdn) {
            let child = locals[cdt][cdn];
            return { filters: { 'name': ['in', uom_lists[child.name] || []] } };
        };
    }
});

function fetch_uom_list(frm, row) {
    if (!row.item_code) return;

    frappe.db.get_doc('Item', row.item_code).then(doc => {
        if (doc && doc.uoms) {
            uom_lists[row.name] = doc.uoms.map(uom => uom.uom);
        } else {
            uom_lists[row.name] = [];  // Ensure it doesn't break
        }
        frm.fields_dict.items.grid.get_field('uom').refresh();
        frm.refresh_field('items');  // Ensure UI update
    });
}

