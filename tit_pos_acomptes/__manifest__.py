# -*- encoding: utf-8 -*-
# Copyright 2021
{
    'name': "Tit pos acomptes",
    "version": "1.0.1",
    "author": "Sogesi",
    "website": "https://www.sogesi-dz.com",
    "sequence": 0,
    "depends": [
            "point_of_sale", "tit_pos_order", "ks_pos_low_stock_alert", "sale", "tit_pos_cmd_facture"
    ],
    "category": "Point of Sale",
    'license': 'LGPL-3',
    "description": """
    Ce module permet de transférer les sales order vers le pos  et permet de rembourser les acomptes payés par la suite
    """,
    "data": [    
        'data/product.xml',
        'views/sale_order_view.xml',
        'views/pos_order_view.xml',
        'views/pos_payment_method_view_form.xml',
        'templates/point_of_sale_assets.xml',
    ],
    'qweb': [
            'static/src/xml/Screens/SaleOrderManagementScreen.xml',
            'static/src/xml/Screens/devis_cmd_list.xml',       
        ],
    'images': ['static/description/images/icon.png'],
    "auto_install": False,
    "installable": True,
    "application": False, 
}