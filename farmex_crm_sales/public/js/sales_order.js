frappe.ui.form.on('Sales Order Cancelled Item', {
    remarks: function (frm, cdt, cdn) {
        const child = locals[cdt][cdn];
        frappe.call({
            method: "farmex_crm_sales.py.sales_order.send_notification",
            args: {
                doc: frm.doc.name,
            }
        });
    }
});

let uom_lists = {};
frappe.ui.form.on('Sales Order', {
    onload: function(frm) {
        if (frm.is_new()) {  // Check if the document is new
            let today = new Date();
            today.setDate(today.getDate() + 2); // Add 2 days to the current date
    
            // Check if the new date falls on a Sunday (getDay() returns 0 for Sunday)
            if (today.getDay() === 0) {
                today.setDate(today.getDate() + 1);  // If it's Sunday, add 1 more day (Monday)
            }
    
            let formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            frm.set_value('delivery_date', formattedDate);  // Set the 'delivery_date' field
        }


        // if(frappe.user.has_role("Operations"))
        // {
        //     alert("Yes Operation User=====")
        // }

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
    
   
    customer: function (frm) {
        frappe.call({
            method: "farmex_crm_sales.py.party.new_get_dashboard_info",
            args: {
                party: frm.doc.customer,
                party_type: "Customer",
            },
            callback: function (response) {
                if (response.message && response.message[0]) {
                    let total_unpaid = response.message[0].total_unpaid;
                    console.log(total_unpaid);

                    frm.set_value('custom_total_unpaid_amount', total_unpaid);
                    frm.refresh_field('custom_total_unpaid_amount');
                }
            }
        });

        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Customer",
                name: frm.doc.customer
            },
            callback: function (response) {
                console.log(response);
                if (response.message) {
                    let customer = response.message;
                    let credit_limit = 0;

                    customer.credit_limits.forEach(row => {
                        if (row.company === frm.doc.company) {
                            credit_limit = row.credit_limit;
                        }
                    });

                    console.log(credit_limit);
                    frm.set_value('custom_total_credit_limit', credit_limit);
                    frm.refresh_field('custom_total_credit_limit');
                }
            }
        });
    },
   
    refresh: function (frm) {
        // for the item group wise item visible in item_code field
        frm.fields_dict['items'].grid.get_field('item_code').get_query = function (doc, cdt, cdn) {
          var item_row = locals[cdt][cdn];
          console.log(locals[cdt][cdn]);
          if (item_row && item_row.item_group) {
              return {
                  filters: {
                      item_group: item_row.item_group
                  }
              };
          }
          
        }

        // Add bulk item button for adding in sales order item table
        if (frm.doc.docstatus < 1) {
            frm.add_custom_button(__('Add Items'), function () {
                show_grouped_item_dialog(frm);
            });
        }

        
        frm.add_custom_button(__('View Account Receivable'), function () {

            const company = frm.doc.company;
            const customer = frm.doc.customer;

            const url = `/app/query-report/Account%20Receivable%20Report?company=${company}&customer=${customer}`;
            window.open(url, "_blank");
        });

        if (!frm.is_new()) {
            frm.set_df_property('custom_sales_person', 'reqd', 1);
        } else {
            frm.set_df_property('custom_sales_person', 'reqd', 0);
        }
        if (frm.doc.docstatus === 1 && flt(frm.doc.per_delivered) < 100) {
            frm.add_custom_button(__("Delivery Note"), function () {
                // Fetch existing Delivery Notes linked to this Sales Order
                frappe.call({
                    method: "frappe.desk.form.linked_with.get",
                    args: {
                        doctype: "Sales Order",
                        docname: frm.doc.name
                    },
                    callback: function(r) {
                        console.log("Linked Documents:", r.message);
                        console.log(r.message["Delivery Note"])
                
                        if (r.message && r.message["Delivery Note"]) {
                            let delivery_notes = r.message["Delivery Note"].map(dn => dn.name).join(", ");
                
                            frappe.confirm(
                                __(`The following Delivery Notes are already linked to this Sales Order: <br><b>${delivery_notes}</b><br><br> Do you still want to proceed?`),
                                function () {
                                    frm.events.make_delivery_note(frm);
                                }
                            );
                        } else {
                            console.log("No linked Delivery Notes found.");
                            frm.events.make_delivery_note(frm);
                        }
                    }
                });
            }, __("Create"));
        }
    },
    make_delivery_note: function (frm) {
        frappe.model.open_mapped_doc({
            method: "erpnext.selling.doctype.sales_order.sales_order.make_delivery_note",
            frm: frm
        });
    },
});




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


frappe.ui.form.on('Sales Order Item', {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        // fetch_uom_list(frm, row);
        // frappe.db.get_doc('Item', row.item_code).then(docs => {
        //     frappe.model.set_value(row.doctype, row.name, 'uom', docs.sales_uom || docs.stock_uom);
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