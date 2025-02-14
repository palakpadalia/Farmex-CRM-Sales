__version__ = "0.0.1"


import frappe
import frappe.utils
from frappe.utils.pdf import (
    get_cookie_options,
    inline_private_images,
    read_options_from_html,
)

from frappe.utils import pdf


def custom_prepare_options(html, options):
    if not options:
        options = {}

    options.update(
        {
            "print-media-type": None,
            "background": None,
            "images": None,
            "quiet": None,
            # 'no-outline': None,
            "encoding": "UTF-8",
            # 'load-error-handling': 'ignore'
        }
    )

    if not options.get("margin-right"):
        options["margin-right"] = "7.5mm"

    if not options.get("margin-left"):
        options["margin-left"] = "7.5mm"

    html, html_options = read_options_from_html(html)
    options.update(html_options or {})

    # cookies
    options.update(get_cookie_options())
    html = inline_private_images(html)

    # page size
    pdf_page_size = (
        options.get("page-size")
        or frappe.db.get_single_value("Print Settings", "pdf_page_size")
        or "A4"
    )

    if pdf_page_size == "Custom":
        options["page-height"] = options.get(
            "page-height"
        ) or frappe.db.get_single_value("Print Settings", "pdf_page_height")
        options["page-width"] = options.get("page-width") or frappe.db.get_single_value(
            "Print Settings", "pdf_page_width"
        )
    else:
        options["page-size"] = pdf_page_size

    return html, options


pdf.prepare_options = custom_prepare_options
