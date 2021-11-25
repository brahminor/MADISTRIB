# -*- encoding: utf-8 -*-
# Copyright 2021
{
    'name': "Tit pos paiement",

    "version": "1.0.1",
    "author": "Sogesi",
    "website": "https://www.sogesi-dz.com",
    "sequence": 0,
    "depends": [
            "point_of_sale",
    ],
    "category": "Point of Sale",
    'license': 'LGPL-3',
    "description": """
    """,
    "data": [
        'templates/point_of_sale_assets.xml',
        'views/pos_payment_method.xml',
        'views/account_journal.xml',
        'views/pos_payment.xml',
        'views/pos_order.xml',


    ],
    'qweb': [
            "static/src/xml/PaymentScreen/PaymentScreenPaymentLines.xml",
            "static/src/xml/PaymentScreen/ChequeDifPopup.xml",
            "static/src/xml/PaymentScreen/ChequeNormPopup.xml",
            "static/src/xml/PaymentScreen/ChequeKdoPopup.xml",
            "static/src/xml/Screens/retour_button.xml"
        ],
    'images': ['static/description/images/icon.png'],
    "auto_install": False,
    "installable": True,
    "application": False,
    
}