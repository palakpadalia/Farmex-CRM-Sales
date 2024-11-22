from datetime import datetime
import frappe


from datetime import datetime
import frappe


@frappe.whitelist()
def naming_series(doc, event):
    if doc.is_new():
        doc_type = doc.doctype
        doctype_abbr = "".join([word[0] for word in doc_type.split() if word])

        branch = doc.branch

        if branch:
            year = datetime.now().strftime("%y")

            branch_code = "".join([word[0] for word in branch.split() if word])

            last_doc = frappe.get_all(
                doc_type,
                filters={"name": ["like", f"{doctype_abbr}-{branch_code}-{year}-%"]},
                fields=["name"],
                order_by="name desc",
                limit_page_length=1,
            )

            if last_doc:
                last_number = int(last_doc[0]["name"].split("-")[-1])
                new_number = last_number + 1
            else:
                new_number = 1

            number = str(new_number).zfill(4)

            name = f"{doctype_abbr}-{branch_code}-{year}-{number}"

            doc.name = name

            for item in doc.items:
                item.parent = doc.name

            for tax in doc.taxes:
                tax.parent = doc.name
